/**
 * Skill Update Endpoint
 */

import { updateSchema, UpdateOutputType } from "./skills.schema";
import { getAuthenticatedWorkspace } from "../../helpers/workspaceUtils";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const workspace = await getAuthenticatedWorkspace(request);
    const body = await request.text();
    const input = updateSchema.parse(superjson.parse(body));

    const existing = await db.selectFrom("skills").selectAll()
      .where("id", "=", input.id)
      .where("workspaceId", "=", workspace.id)
      .executeTakeFirst();

    if (!existing) {
      return new Response(superjson.stringify({ error: "Skill not found" }), { status: 404 });
    }

    const updateFields: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name !== undefined) {updateFields.name = input.name;}
    if (input.level !== undefined) {updateFields.level = input.level;}
    if (input.keywords !== undefined) {updateFields.keywords = input.keywords;}
    if (input.proficiency !== undefined) {updateFields.proficiency = input.proficiency;}
    if (input.category !== undefined) {updateFields.category = input.category;}
    if (input.notes !== undefined) {updateFields.notes = input.notes;}
    if (input.sortOrder !== undefined) {updateFields.sortOrder = input.sortOrder;}

    await db.updateTable("skills").set(updateFields).where("id", "=", input.id).execute();
    const skill = await db.selectFrom("skills").selectAll().where("id", "=", input.id).executeTakeFirstOrThrow();
    return new Response(superjson.stringify({ skill, updated: true } satisfies UpdateOutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
