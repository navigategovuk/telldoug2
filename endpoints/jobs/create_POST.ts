import { schema, OutputType } from "./create_POST.schema";
import superjson from 'superjson';
import { db } from "../../helpers/db";
import { nanoid } from "nanoid";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const newJob = await db
      .insertInto('jobs')
      .values({
        id: nanoid(),
        title: input.title,
        company: input.company,
        description: input.description,
        startDate: input.startDate,
        endDate: input.endDate,
        isCurrent: input.isCurrent,
        location: input.location,
        notes: input.notes,
        updatedAt: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify({ job: newJob } satisfies OutputType));
  } catch (error) {
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}