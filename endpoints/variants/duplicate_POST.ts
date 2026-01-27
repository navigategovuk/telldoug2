/**
 * Variant Duplicate Endpoint
 */

import { duplicateSchema, DuplicateOutputType } from "./variants.schema";
import { getAuthenticatedWorkspace } from "../../helpers/workspaceUtils";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";
import { nanoid } from "nanoid";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const workspace = await getAuthenticatedWorkspace(request);
    const body = await request.text();
    const input = duplicateSchema.parse(superjson.parse(body));

    const existing = await db.selectFrom("resumeVariants").selectAll()
      .where("id", "=", input.id)
      .where("workspaceId", "=", workspace.id)
      .executeTakeFirst();

    if (!existing) {
      return new Response(superjson.stringify({ error: "Variant not found" }), { status: 404 });
    }

    const newId = nanoid();
    await db.insertInto("resumeVariants").values({
      id: newId,
      profileId: existing.profileId,
      workspaceId: workspace.id,
      name: input.newName,
      description: existing.description,
      targetRole: existing.targetRole,
      viewDefinitionId: existing.viewDefinitionId,
      isPrimary: false, // Duplicates are never primary
    }).execute();

    const variant = await db.selectFrom("resumeVariants").selectAll().where("id", "=", newId).executeTakeFirstOrThrow();
    return new Response(superjson.stringify({ variant, duplicated: true } satisfies DuplicateOutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
