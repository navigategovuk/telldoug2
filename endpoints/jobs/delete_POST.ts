import { schema, OutputType } from "./delete_POST.schema";
import superjson from 'superjson';
import { db } from "../../helpers/db";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    await db
      .deleteFrom('jobs')
      .where('id', '=', input.id)
      .execute();

    return new Response(superjson.stringify({ success: true } satisfies OutputType));
  } catch (error) {
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}