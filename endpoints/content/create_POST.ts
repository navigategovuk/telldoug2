import { schema, OutputType } from "./create_POST.schema";
import superjson from 'superjson';
import { db } from "../../helpers/db";
import { nanoid } from "nanoid";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const newContent = await db
      .insertInto('content')
      .values({
        id: nanoid(),
        title: input.title,
        contentType: input.contentType,
        publicationDate: input.publicationDate,
        platform: input.platform,
        url: input.url,
        description: input.description,
        engagementMetrics: input.engagementMetrics,
        updatedAt: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify({ content: newContent } satisfies OutputType));
  } catch (error) {
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}