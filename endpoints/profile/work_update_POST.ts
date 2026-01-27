/**
 * Work Experience Update Endpoint
 */

import { updateSchema, UpdateOutputType } from "./work.schema";
import { getAuthenticatedWorkspace } from "../../helpers/workspaceUtils";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const workspace = await getAuthenticatedWorkspace(request);
    const body = await request.text();
    const input = updateSchema.parse(superjson.parse(body));

    const existing = await db.selectFrom("workExperiences")
      .innerJoin("profiles", "profiles.id", "workExperiences.profileId")
      .select(["workExperiences.id"])
      .where("workExperiences.id", "=", input.id)
      .where("profiles.workspaceId", "=", workspace.id)
      .executeTakeFirst();

    if (!existing) {
      return new Response(superjson.stringify({ error: "Work entry not found" }), { status: 404 });
    }

    const updateFields: Record<string, unknown> = { updatedAt: new Date() };
    if (input.company !== undefined) {updateFields.company = input.company;}
    if (input.position !== undefined) {updateFields.position = input.position;}
    if (input.url !== undefined) {updateFields.url = input.url;}
    if (input.startDate !== undefined) {updateFields.startDate = input.startDate;}
    if (input.endDate !== undefined) {updateFields.endDate = input.endDate;}
    if (input.summary !== undefined) {updateFields.summary = input.summary;}
    if (input.highlights !== undefined) {updateFields.highlights = input.highlights;}
    if (input.department !== undefined) {updateFields.department = input.department;}
    if (input.employmentType !== undefined) {updateFields.employmentType = input.employmentType;}
    if (input.sortOrder !== undefined) {updateFields.sortOrder = input.sortOrder;}

    await db.updateTable("workExperiences").set(updateFields).where("id", "=", input.id).execute();
    const work = await db.selectFrom("workExperiences").selectAll().where("id", "=", input.id).executeTakeFirstOrThrow();
    return new Response(superjson.stringify({ work, updated: true } satisfies UpdateOutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
