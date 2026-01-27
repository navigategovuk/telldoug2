import { schema, OutputType } from "./list_GET.schema";
import superjson from 'superjson';
import { db } from "../../helpers/db";

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    
    const input = schema.parse(searchParams);

    let query = db.selectFrom('skills').selectAll();

    if (input.search) {
      const searchTerm = `%${input.search.toLowerCase()}%`;
      query = query.where('name', 'ilike', searchTerm);
    }

    if (input.category) {
      query = query.where('category', '=', input.category);
    }

    // Default sort by name
    query = query.orderBy('name', 'asc');

    const skills = await query.execute();

    return new Response(superjson.stringify({ skills } satisfies OutputType));
  } catch (error) {
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}