import { schema, OutputType } from "./list_GET.schema";
import superjson from 'superjson';
import { db } from "../../helpers/db";

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    
    const input = schema.parse(searchParams);

    let query = db.selectFrom('content').selectAll();

    if (input.search) {
      const searchTerm = `%${input.search.toLowerCase()}%`;
      query = query.where('title', 'ilike', searchTerm);
    }

    if (input.contentType) {
      query = query.where('contentType', '=', input.contentType);
    }

    // Default sort by publicationDate DESC (newest first)
    query = query.orderBy('publicationDate', 'desc').orderBy('createdAt', 'desc');

    const content = await query.execute();

    return new Response(superjson.stringify({ content } satisfies OutputType));
  } catch (error) {
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}