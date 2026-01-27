import { schema, OutputType } from "./list_GET.schema";
import superjson from 'superjson';
import { db } from "../../helpers/db";

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    
    const input = schema.parse(searchParams);

    let query = db.selectFrom('learning').selectAll();

    if (input.search) {
      const searchTerm = `%${input.search.toLowerCase()}%`;
      query = query.where('title', 'ilike', searchTerm);
    }

    if (input.learningType) {
      query = query.where('learningType', '=', input.learningType);
    }

    if (input.status) {
      query = query.where('status', '=', input.status);
    }

    // Default sort by startDate DESC (newest first)
    query = query.orderBy('startDate', 'desc').orderBy('createdAt', 'desc');

    const learning = await query.execute();

    return new Response(superjson.stringify({ learning } satisfies OutputType));
  } catch (error) {
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}