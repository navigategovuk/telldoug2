import { schema, OutputType, SearchResult } from "./global_GET.schema";
import superjson from 'superjson';
import { db } from "../../helpers/db";
import { sql } from "kysely";

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const queryParam = url.searchParams.get("query");
    
    // Validate input manually since it's a GET request query param
    const result = schema.safeParse({ query: queryParam });
    
    if (!result.success) {
      return new Response(superjson.stringify({ error: "Invalid query" }), { status: 400 });
    }

    const { query } = result.data;
    const searchPattern = `%${query}%`;

    // Helper to calculate relevance score for sorting
    // 1: Exact match
    // 2: Starts with
    // 3: Contains
    const relevanceScore = (column: string) => sql<number>`
      CASE 
        WHEN ${sql.ref(column)} ILIKE ${query} THEN 1 
        WHEN ${sql.ref(column)} ILIKE ${query + '%'} THEN 2 
        ELSE 3 
      END
    `;

    // Parallel queries for each entity type
    const [people, jobs, projects, skills, events, content] = await Promise.all([
      // People
      db.selectFrom('people')
        .select(['id', 'name', 'role', 'company'])
        .where((eb) => eb.or([
          eb('name', 'ilike', searchPattern),
          eb('company', 'ilike', searchPattern),
          eb('role', 'ilike', searchPattern),
          eb('notes', 'ilike', searchPattern)
        ]))
        .orderBy(relevanceScore('name'))
        .limit(5)
        .execute(),

      // Jobs
      db.selectFrom('jobs')
        .select(['id', 'title', 'company', 'description'])
        .where((eb) => eb.or([
          eb('title', 'ilike', searchPattern),
          eb('company', 'ilike', searchPattern),
          eb('description', 'ilike', searchPattern)
        ]))
        .orderBy(relevanceScore('title'))
        .limit(5)
        .execute(),

      // Projects
      db.selectFrom('projects')
        .select(['id', 'name', 'description', 'status'])
        .where((eb) => eb.or([
          eb('name', 'ilike', searchPattern),
          eb('description', 'ilike', searchPattern)
        ]))
        .orderBy(relevanceScore('name'))
        .limit(5)
        .execute(),

      // Skills
      db.selectFrom('skills')
        .select(['id', 'name', 'category', 'notes'])
        .where((eb) => eb.or([
          eb('name', 'ilike', searchPattern),
          eb('category', 'ilike', searchPattern),
          eb('notes', 'ilike', searchPattern)
        ]))
        .orderBy(relevanceScore('name'))
        .limit(5)
        .execute(),

      // Events
      db.selectFrom('events')
        .select(['id', 'title', 'description', 'location', 'eventDate'])
        .where((eb) => eb.or([
          eb('title', 'ilike', searchPattern),
          eb('description', 'ilike', searchPattern),
          eb('location', 'ilike', searchPattern)
        ]))
        .orderBy(relevanceScore('title'))
        .limit(5)
        .execute(),

      // Content
      db.selectFrom('content')
        .select(['id', 'title', 'description', 'platform', 'publicationDate'])
        .where((eb) => eb.or([
          eb('title', 'ilike', searchPattern),
          eb('description', 'ilike', searchPattern),
          eb('platform', 'ilike', searchPattern)
        ]))
        .orderBy(relevanceScore('title'))
        .limit(5)
        .execute(),
    ]);

    const results: SearchResult[] = [];

    // Map results to unified format
    people.forEach(p => {
      const subtitleParts = [p.role, p.company].filter(Boolean);
      results.push({
        entityType: 'person',
        id: p.id,
        title: p.name,
        subtitle: subtitleParts.length > 0 ? subtitleParts.join(' @ ') : 'Person',
        url: `/people?id=${p.id}` // Assuming we might want to link to detail or just list
      });
    });

    jobs.forEach(j => {
      results.push({
        entityType: 'job',
        id: j.id,
        title: j.title,
        subtitle: j.company,
        url: `/jobs?id=${j.id}`
      });
    });

    projects.forEach(p => {
      results.push({
        entityType: 'project',
        id: p.id,
        title: p.name,
        subtitle: p.status ? p.status.replace('_', ' ') : 'Project',
        url: `/projects?id=${p.id}`
      });
    });

    skills.forEach(s => {
      results.push({
        entityType: 'skill',
        id: s.id,
        title: s.name,
        subtitle: s.category || 'Skill',
        url: `/skills?id=${s.id}`
      });
    });

    events.forEach(e => {
      const dateStr = e.eventDate ? new Date(e.eventDate).toLocaleDateString() : '';
      const subtitleParts = [dateStr, e.location].filter(Boolean);
      results.push({
        entityType: 'event',
        id: e.id,
        title: e.title,
        subtitle: subtitleParts.length > 0 ? subtitleParts.join(' • ') : 'Event',
        url: `/events?id=${e.id}`
      });
    });

    content.forEach(c => {
      const dateStr = c.publicationDate ? new Date(c.publicationDate).toLocaleDateString() : '';
      const subtitleParts = [c.platform, dateStr].filter(Boolean);
      results.push({
        entityType: 'content',
        id: c.id,
        title: c.title,
        subtitle: subtitleParts.length > 0 ? subtitleParts.join(' • ') : 'Content',
        url: `/content?id=${c.id}`
      });
    });

    return new Response(superjson.stringify({ 
      results, 
      totalCount: results.length 
    } satisfies OutputType));

  } catch (error) {
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}