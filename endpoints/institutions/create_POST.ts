import { schema, OutputType } from "./create_POST.schema";
import superjson from 'superjson';
import { db } from "../../helpers/db";
import { nanoid } from "nanoid";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const newInstitution = await db
      .insertInto('institutions')
      .values({
        id: nanoid(),
        name: input.name,
        type: input.type,
        location: input.location,
        startDate: input.startDate,
        endDate: input.endDate,
        degree: input.degree,
        fieldOfStudy: input.fieldOfStudy,
        notes: input.notes,
        updatedAt: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify({ institution: newInstitution } satisfies OutputType));
  } catch (error) {
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}