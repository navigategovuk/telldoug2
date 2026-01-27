/**
 * Project Update Endpoint
 */

import { updateSchema, UpdateOutputType } from "./projects.schema";
import { getAuthenticatedWorkspace } from "../../helpers/workspaceUtils";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const workspace = await getAuthenticatedWorkspace(request);
    const body = await request.text();
    const input = updateSchema.parse(superjson.parse(body));

    const existing = await db.selectFrom("projects").selectAll()
      .where("id", "=", input.id)
      .where("workspaceId", "=", workspace.id)
      .executeTakeFirst();

    if (!existing) {
      return new Response(superjson.stringify({ error: "Project not found" }), { status: 404 });
    }

    const updateFields: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name !== undefined) {updateFields.name = input.name;}
    if (input.description !== undefined) {updateFields.description = input.description;}
    if (input.highlights !== undefined) {updateFields.highlights = input.highlights;}
    if (input.keywords !== undefined) {updateFields.keywords = input.keywords;}
    if (input.startDate !== undefined) {updateFields.startDate = input.startDate;}
    if (input.endDate !== undefined) {updateFields.endDate = input.endDate;}
    if (input.url !== undefined) {updateFields.url = input.url;}
    if (input.sortOrder !== undefined) {updateFields.sortOrder = input.sortOrder;}
    if (input.status !== undefined) {updateFields.status = input.status;}

    await db.updateTable("projects").set(updateFields).where("id", "=", input.id).execute();
    const project = await db.selectFrom("projects").selectAll().where("id", "=", input.id).executeTakeFirstOrThrow();
    return new Response(superjson.stringify({ project, updated: true } satisfies UpdateOutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
