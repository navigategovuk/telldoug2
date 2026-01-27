import { schema, OutputType } from "./list_GET.schema";
import superjson from 'superjson';
import { db } from "../../helpers/db";

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    
    const input = schema.parse(searchParams);

    let query = db.selectFrom('institutions').selectAll();

    if (input.type) {
      query = query.where('type', '=', input.type);
    }

    // Default sort by startDate desc
    query = query.orderBy('startDate', 'desc');

    const institutions = await query.execute();

    return new Response(superjson.stringify({ institutions } satisfies OutputType));
  } catch (error) {
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}