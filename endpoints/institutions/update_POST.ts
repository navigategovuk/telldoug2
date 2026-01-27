import { schema, OutputType } from "./update_POST.schema";
import superjson from 'superjson';
import { db } from "../../helpers/db";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const updatedInstitution = await db
      .updateTable('institutions')
      .set({
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
      .where('id', '=', input.id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify({ institution: updatedInstitution } satisfies OutputType));
  } catch (error) {
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}