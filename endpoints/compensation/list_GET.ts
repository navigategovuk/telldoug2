import { schema, OutputType } from "./list_GET.schema";
import superjson from 'superjson';
import { db } from "../../helpers/db";

export async function handle(request: Request) {
  try {
    // No input params for now, but we parse to ensure empty object if needed
    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    schema.parse(searchParams);

    const compensation = await db.selectFrom('compensation')
      .innerJoin('jobs', 'compensation.jobId', 'jobs.id')
      .select([
        'compensation.id',
        'compensation.jobId',
        'compensation.effectiveDate',
        'compensation.baseSalary',
        'compensation.currency',
        'compensation.bonus',
        'compensation.equityValue',
        'compensation.benefitsNote',
        'compensation.createdAt',
        'compensation.updatedAt',
        'jobs.title as jobTitle',
        'jobs.company as jobCompany'
      ])
      .orderBy('compensation.effectiveDate', 'desc')
      .execute() as unknown as import('./list_GET.schema').CompensationWithJob[];

    return new Response(superjson.stringify({ compensation } satisfies OutputType));
  } catch (error) {
    return new Response(superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400 });
  }
}
