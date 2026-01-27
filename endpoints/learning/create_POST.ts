import { schema, OutputType } from "./create_POST.schema";
import superjson from 'superjson';
import { db } from "../../helpers/db";
import { nanoid } from "nanoid";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const newLearning = await db
      .insertInto('learning')
      .values({
        id: nanoid(),
        title: input.title,
        provider: input.provider,
        learningType: input.learningType,
        status: input.status,
        startDate: input.startDate,
        completionDate: input.completionDate,
        cost: input.cost,
        skillsGained: input.skillsGained,
        notes: input.notes,
        updatedAt: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify({ learning: newLearning } satisfies OutputType));
  } catch (error) {
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}