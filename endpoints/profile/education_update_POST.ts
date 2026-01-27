/**
 * Education Update Endpoint
 */

import { updateSchema, UpdateOutputType } from "./education.schema";
import { getAuthenticatedWorkspace } from "../../helpers/workspaceUtils";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const workspace = await getAuthenticatedWorkspace(request);
    const body = await request.text();
    const input = updateSchema.parse(superjson.parse(body));

    const existing = await db.selectFrom("educationEntries")
      .innerJoin("profiles", "profiles.id", "educationEntries.profileId")
      .select(["educationEntries.id"])
      .where("educationEntries.id", "=", input.id)
      .where("profiles.workspaceId", "=", workspace.id)
      .executeTakeFirst();

    if (!existing) {
      return new Response(superjson.stringify({ error: "Education entry not found" }), { status: 404 });
    }

    const updateFields: Record<string, unknown> = { updatedAt: new Date() };
    if (input.institution !== undefined) {updateFields.institution = input.institution;}
    if (input.area !== undefined) {updateFields.area = input.area;}
    if (input.studyType !== undefined) {updateFields.studyType = input.studyType;}
    if (input.degreeType !== undefined) {updateFields.degreeType = input.degreeType;}
    if (input.minor !== undefined) {updateFields.minor = input.minor;}
    if (input.startDate !== undefined) {updateFields.startDate = input.startDate;}
    if (input.endDate !== undefined) {updateFields.endDate = input.endDate;}
    if (input.score !== undefined) {updateFields.score = input.score;}
    if (input.courses !== undefined) {updateFields.courses = input.courses;}
    if (input.url !== undefined) {updateFields.url = input.url;}
    if (input.sortOrder !== undefined) {updateFields.sortOrder = input.sortOrder;}

    await db.updateTable("educationEntries").set(updateFields).where("id", "=", input.id).execute();
    const education = await db.selectFrom("educationEntries").selectAll().where("id", "=", input.id).executeTakeFirstOrThrow();
    return new Response(superjson.stringify({ education, updated: true } satisfies UpdateOutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
