import { schema, OutputType } from "./create_POST.schema";
import superjson from 'superjson';
import { db } from "../../helpers/db";
import { nanoid } from "nanoid";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    const newCompensation = await db
      .insertInto('compensation')
      .values({
        id: nanoid(),
        jobId: input.jobId,
        effectiveDate: input.effectiveDate,
        baseSalary: input.baseSalary,
        currency: input.currency,
        bonus: input.bonus,
        equityValue: input.equityValue,
        benefitsNote: input.benefitsNote,
        updatedAt: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify({ compensation: newCompensation } satisfies OutputType));
  } catch (error) {
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}