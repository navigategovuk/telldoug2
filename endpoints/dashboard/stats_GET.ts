import { schema, OutputType } from "./stats_GET.schema";
import superjson from 'superjson';
import { db } from "../../helpers/db";
import { sql } from "kysely";
import { subDays, subMonths, startOfYear, differenceInDays } from "date-fns";
import { getAuthenticatedWorkspace } from "../../helpers/workspaceUtils";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";

export async function handle(request: Request) {
  try {
    // Get authenticated workspace
    const workspace = await getAuthenticatedWorkspace(request);
    const workspaceId = workspace.id;

    // 1. Stale Contacts
    // People with 90+ days since their last interaction OR no interactions
    const ninetyDaysAgo = subDays(new Date(), 90);
    
    const staleContactsQuery = db.selectFrom('people')
      .leftJoin('interactions', 'people.id', 'interactions.personId')
      .select([
        'people.id',
        'people.name',
        'people.company',
        'people.role',
        db.fn.max('interactions.interactionDate').as('lastInteractionDate')
      ])
      .where('people.workspaceId', '=', workspaceId)
      .groupBy(['people.id', 'people.name', 'people.company', 'people.role'])
      .having((eb) => eb.or([
        eb(db.fn.max('interactions.interactionDate'), '<', ninetyDaysAgo),
        eb(db.fn.max('interactions.interactionDate'), 'is', null)
      ]))
      .orderBy('lastInteractionDate', 'asc') // Most stale first (nulls first usually, or very old dates)
      .limit(20); // Limit to reasonable number

    // 2. Productive Interaction Types
    // Count interactions by type that have a project_id linked
    const productiveInteractionTypesQuery = db.selectFrom('interactions')
      .select([
        'interactionType as type',
        db.fn.count('id').as('count')
      ])
      .where('projectId', 'is not', null)
      .where('workspaceId', '=', workspaceId)
      .groupBy('interactionType')
      .orderBy('count', 'desc');

    // 3. Top Connectors
    // People linked to most projects/events via interactions + relationships
    // We'll do this by aggregating counts from interactions and relationships
    
    // Count distinct projects from interactions
    const interactionCounts = db.selectFrom('interactions')
      .select(['personId', db.fn.count<number>('projectId').distinct().as('projectCount')])
      .where('projectId', 'is not', null)
      .where('workspaceId', '=', workspaceId)
      .groupBy('personId');

    // Count connections from relationships (where person is source or target, and other side is project/event)
    // This is complex to do in one efficient query with Kysely without raw SQL or complex unions.
    // We will simplify: Top connectors are primarily driven by interactions in this OS context.
    // However, let's try to include relationships if possible.
    // Let's stick to the prompt's "interactions + relationships" requirement by fetching relationship counts separately and merging in memory or using a CTE if we were writing raw SQL.
    // Given Kysely limitations with complex UNION/CTE in type-safe way without boilerplate, 
    // we will fetch interaction counts and relationship counts separately and merge in JS.
    
    const relationshipCountsQuery = db.selectFrom('relationships')
      .select(['sourceId', 'targetId', 'sourceType', 'targetType'])
      .where('workspaceId', '=', workspaceId)
      .where((eb) => eb.or([
        eb.and([
          eb('sourceType', '=', 'person'),
          eb('targetType', 'in', ['project', 'event'])
        ]),
        eb.and([
          eb('targetType', '=', 'person'),
          eb('sourceType', 'in', ['project', 'event'])
        ])
      ]));

    // 4. Recent Activity
    const recentInteractionsQuery = db.selectFrom('interactions')
      .leftJoin('people', 'interactions.personId', 'people.id')
      .leftJoin('projects', 'interactions.projectId', 'projects.id')
      .select([
        'interactions.id',
        'interactions.interactionDate',
        'interactions.interactionType',
        'interactions.notes',
        'people.name as personName',
        'projects.name as projectName'
      ])
      .where('interactions.workspaceId', '=', workspaceId)
      .orderBy('interactions.interactionDate', 'desc')
      .limit(10);

    const upcomingEventsQuery = db.selectFrom('events')
      .selectAll()
      .where('workspaceId', '=', workspaceId)
      .where('eventDate', '>=', new Date())
      .orderBy('eventDate', 'asc')
      .limit(5);

    // 5. Goals Progress
    const goalsQuery = db.selectFrom('goals')
      .select(['id', 'title', 'goalType', 'status', 'targetDate'])
      .where('workspaceId', '=', workspaceId)
      .execute();

    // 6. Skills Growth
    const twelveMonthsAgo = subMonths(new Date(), 12);
    
    const totalSkillsQuery = db.selectFrom('skills')
      .select(db.fn.count('id').as('count'))
      .where('workspaceId', '=', workspaceId)
      .executeTakeFirst();

    const skillsAddedLast12MonthsQuery = db.selectFrom('skills')
      .select(db.fn.count('id').as('count'))
      .where('workspaceId', '=', workspaceId)
      .where('createdAt', '>=', twelveMonthsAgo)
      .executeTakeFirst();

    const skillsByProficiencyQuery = db.selectFrom('skills')
      .select(['proficiency', db.fn.count('id').as('count')])
      .where('workspaceId', '=', workspaceId)
      .groupBy('proficiency')
      .execute();

    const recentSkillsQuery = db.selectFrom('skills')
      .select(['id', 'name', 'createdAt', 'proficiency'])
      .where('workspaceId', '=', workspaceId)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .execute();

    // 7. Feedback Themes
    const ninetyDaysAgoForFeedback = subDays(new Date(), 90);
    
    const feedbackLast90DaysQuery = db.selectFrom('feedback')
      .leftJoin('people', 'feedback.personId', 'people.id')
      .select([
        'feedback.id',
        'feedback.feedbackType',
        'feedback.feedbackDate',
        'feedback.notes',
        'people.name as personName'
      ])
      .where('feedback.workspaceId', '=', workspaceId)
      .where('feedback.feedbackDate', '>=', ninetyDaysAgoForFeedback)
      .orderBy('feedback.feedbackDate', 'desc')
      .execute();

    const feedbackByTypeQuery = db.selectFrom('feedback')
      .select(['feedbackType', db.fn.count('id').as('count')])
      .where('workspaceId', '=', workspaceId)
      .where('feedbackDate', '>=', ninetyDaysAgoForFeedback)
      .groupBy('feedbackType')
      .execute();

    // 8. Content Activity
    const thisYearStart = startOfYear(new Date());
    
    const totalContentQuery = db.selectFrom('content')
      .select(db.fn.count('id').as('count'))
      .where('workspaceId', '=', workspaceId)
      .executeTakeFirst();

    const contentByTypeQuery = db.selectFrom('content')
      .select(['contentType', db.fn.count('id').as('count')])
      .where('workspaceId', '=', workspaceId)
      .groupBy('contentType')
      .execute();

    const contentThisYearQuery = db.selectFrom('content')
      .select(db.fn.count('id').as('count'))
      .where('workspaceId', '=', workspaceId)
      .where('publicationDate', '>=', thisYearStart)
      .executeTakeFirst();

    const recentContentQuery = db.selectFrom('content')
      .select(['id', 'title', 'contentType', 'publicationDate', 'platform'])
      .where('workspaceId', '=', workspaceId)
      .orderBy('publicationDate', 'desc')
      .limit(5)
      .execute();

    // Execute all queries
    const [
      staleContacts,
      productiveTypes,
      interactionStats,
      relationships,
      recentInteractions,
      upcomingEvents,
      goals,
      totalSkillsResult,
      skillsAddedLast12MonthsResult,
      skillsByProficiency,
      recentSkills,
      feedbackLast90Days,
      feedbackByType,
      totalContentResult,
      contentByType,
      contentThisYearResult,
      recentContent
    ] = await Promise.all([
      staleContactsQuery.execute(),
      productiveInteractionTypesQuery.execute(),
      interactionCounts.execute(),
      relationshipCountsQuery.execute(),
      recentInteractionsQuery.execute(),
      upcomingEventsQuery.execute(),
      goalsQuery,
      totalSkillsQuery,
      skillsAddedLast12MonthsQuery,
      skillsByProficiencyQuery,
      recentSkillsQuery,
      feedbackLast90DaysQuery,
      feedbackByTypeQuery,
      totalContentQuery,
      contentByTypeQuery,
      contentThisYearQuery,
      recentContentQuery
    ]);

    // Process Stale Contacts
    const processedStaleContacts = staleContacts.map(c => {
      const lastDate = c.lastInteractionDate ? new Date(c.lastInteractionDate) : null;
      const daysSince = lastDate 
        ? Math.floor((new Date().getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      
      return {
        id: c.id,
        name: c.name,
        company: c.company,
        role: c.role,
        lastInteractionDate: lastDate,
        daysSinceLastInteraction: daysSince
      };
    });

    // Process Top Connectors
    // Map personId -> { projectCount, eventCount, total }
    const connectorMap = new Map<string, { projectCount: number, eventCount: number }>();
    
    // Add from interactions
    interactionStats.forEach(stat => {
      const current = connectorMap.get(stat.personId) || { projectCount: 0, eventCount: 0 };
      current.projectCount += Number(stat.projectCount);
      connectorMap.set(stat.personId, current);
    });

    // Add from relationships
    relationships.forEach(rel => {
      let personId: string | null = null;
      let type: 'project' | 'event' | null = null;

      if (rel.sourceType === 'person') {
        personId = rel.sourceId;
        type = rel.targetType as 'project' | 'event';
      } else if (rel.targetType === 'person') {
        personId = rel.targetId;
        type = rel.sourceType as 'project' | 'event';
      }

      if (personId && type) {
        const current = connectorMap.get(personId) || { projectCount: 0, eventCount: 0 };
        if (type === 'project') {current.projectCount++;}
        if (type === 'event') {current.eventCount++;}
        connectorMap.set(personId, current);
      }
    });

    // Fetch names for top connectors
    const topConnectorIds = Array.from(connectorMap.keys());
    let topConnectorsDetails: any[] = [];
    
    if (topConnectorIds.length > 0) {
      const peopleDetails = await db.selectFrom('people')
        .select(['id', 'name', 'company'])
        .where('id', 'in', topConnectorIds)
        .execute();
        
      topConnectorsDetails = peopleDetails.map(p => {
        const stats = connectorMap.get(p.id)!;
        return {
          id: p.id,
          name: p.name,
          company: p.company,
          projectCount: stats.projectCount,
          eventCount: stats.eventCount,
          totalConnections: stats.projectCount + stats.eventCount
        };
      }).sort((a, b) => b.totalConnections - a.totalConnections).slice(0, 10);
    }

    // Process Goals Progress
    const now = new Date();
    const goalsProgress = goals.map(goal => {
      const targetDate = new Date(goal.targetDate);
      const daysUntil = differenceInDays(targetDate, now);
      const isOverdue = daysUntil < 0;
      
      return {
        id: goal.id,
        title: goal.title,
        goalType: goal.goalType,
        status: goal.status,
        targetDate: targetDate,
        daysUntilTarget: isOverdue ? null : daysUntil,
        isOverdue
      };
    }).sort((a, b) => {
      // Sort by status (in_progress first), then by targetDate
      const statusOrder = { 'in_progress': 0, 'not_started': 1, 'completed': 2, 'abandoned': 3 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) {return statusDiff;}
      return a.targetDate.getTime() - b.targetDate.getTime();
    });

    // Process Skills Growth
    const skillsGrowth = {
      totalSkills: Number(totalSkillsResult?.count || 0),
      skillsAddedLast12Months: Number(skillsAddedLast12MonthsResult?.count || 0),
      byProficiency: skillsByProficiency.map(s => ({
        proficiency: s.proficiency,
        count: Number(s.count)
      })),
      recentSkills: recentSkills.map(s => ({
        id: s.id,
        name: s.name,
        createdAt: new Date(s.createdAt),
        proficiency: s.proficiency
      }))
    };

    // Process Feedback Themes
    const feedbackThemes = {
      totalFeedbackLast90Days: feedbackLast90Days.length,
      byType: feedbackByType.map(f => ({
        type: f.feedbackType,
        count: Number(f.count)
      })),
      recentFeedback: feedbackLast90Days.slice(0, 5).map(f => ({
        id: f.id,
        feedbackType: f.feedbackType,
        feedbackDate: new Date(f.feedbackDate),
        personName: f.personName,
        notesPreview: f.notes.substring(0, 100)
      }))
    };

    // Process Content Activity
    const contentActivity = {
      totalContent: Number(totalContentResult?.count || 0),
      byType: contentByType.map(c => ({
        type: c.contentType,
        count: Number(c.count)
      })),
      recentContent: recentContent.map(c => ({
        id: c.id,
        title: c.title,
        contentType: c.contentType,
        publicationDate: new Date(c.publicationDate),
        platform: c.platform
      })),
      thisYearCount: Number(contentThisYearResult?.count || 0)
    };

    const result: OutputType = {
      staleContacts: processedStaleContacts,
      productiveInteractionTypes: productiveTypes.map(t => ({
        type: t.type,
        count: Number(t.count)
      })),
      topConnectors: topConnectorsDetails,
      recentActivity: {
        recentInteractions,
        upcomingEvents
      },
      goalsProgress,
      skillsGrowth,
      feedbackThemes,
      contentActivity
    };

    return new Response(superjson.stringify(result), { 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    console.error("Dashboard stats error:", error);
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}
