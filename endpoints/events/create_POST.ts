import { schema, OutputType } from "./create_POST.schema";
import superjson from 'superjson';
import { db } from "../../helpers/db";
import { nanoid } from "nanoid";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const newEvent = await db
      .insertInto('events')
      .values({
        id: nanoid(),
        title: input.title,
        description: input.description,
        eventDate: input.eventDate,
        eventEndDate: input.eventEndDate,
        eventType: input.eventType,
        location: input.location,
        notes: input.notes,
        updatedAt: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify({ event: newEvent } satisfies OutputType));
  } catch (error) {
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}