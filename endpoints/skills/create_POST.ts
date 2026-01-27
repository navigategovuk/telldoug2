import { schema, OutputType } from "./create_POST.schema";
import superjson from 'superjson';
import { db } from "../../helpers/db";
import { nanoid } from "nanoid";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const newSkill = await db
      .insertInto('skills')
      .values({
        id: nanoid(),
        name: input.name,
        category: input.category,
        proficiency: input.proficiency,
        notes: input.notes,
        updatedAt: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify({ skill: newSkill } satisfies OutputType));
  } catch (error) {
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}