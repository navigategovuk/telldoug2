import { schema, OutputType } from "./list_GET.schema";
import superjson from 'superjson';
import { db } from "../../helpers/db";

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    
    const input = schema.parse(searchParams);

    let query = db.selectFrom('relationships').selectAll();

    if (input.sourceType && input.sourceId) {
      query = query.where((eb) => eb.and([
        eb('sourceType', '=', input.sourceType!),
        eb('sourceId', '=', input.sourceId!)
      ]));
    } else if (input.targetType && input.targetId) {
      query = query.where((eb) => eb.and([
        eb('targetType', '=', input.targetType!),
        eb('targetId', '=', input.targetId!)
      ]));
    }

    // Default sort by createdAt desc
    query = query.orderBy('createdAt', 'desc');

    const relationships = await query.execute();

    return new Response(superjson.stringify({ relationships } satisfies OutputType));
  } catch (error) {
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}