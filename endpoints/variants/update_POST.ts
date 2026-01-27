/**
 * Variant Update Endpoint
 */

import { updateSchema, UpdateOutputType } from "./variants.schema";
import { getAuthenticatedWorkspace } from "../../helpers/workspaceUtils";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const workspace = await getAuthenticatedWorkspace(request);
    const body = await request.text();
    const input = updateSchema.parse(superjson.parse(body));

    const existing = await db.selectFrom("resumeVariants").selectAll()
      .where("id", "=", input.id)
      .where("workspaceId", "=", workspace.id)
      .executeTakeFirst();

    if (!existing) {
      return new Response(superjson.stringify({ error: "Variant not found" }), { status: 404 });
    }

    // If setting as primary, unset existing primaries first
    if (input.isPrimary) {
      await db.updateTable("resumeVariants").set({ isPrimary: false })
        .where("profileId", "=", existing.profileId)
        .where("id", "!=", input.id).execute();
    }

    const updateFields: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name !== undefined) {updateFields.name = input.name;}
    if (input.description !== undefined) {updateFields.description = input.description;}
    if (input.targetRole !== undefined) {updateFields.targetRole = input.targetRole;}
    if (input.viewDefinitionId !== undefined) {updateFields.viewDefinitionId = input.viewDefinitionId;}
    if (input.isPrimary !== undefined) {updateFields.isPrimary = input.isPrimary;}

    await db.updateTable("resumeVariants").set(updateFields).where("id", "=", input.id).execute();
    const variant = await db.selectFrom("resumeVariants").selectAll().where("id", "=", input.id).executeTakeFirstOrThrow();
    return new Response(superjson.stringify({ variant, updated: true } satisfies UpdateOutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
