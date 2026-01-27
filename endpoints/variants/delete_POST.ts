/**
 * Variant Delete Endpoint
 */

import { deleteSchema, DeleteOutputType } from "./variants.schema";
import { getAuthenticatedWorkspace } from "../../helpers/workspaceUtils";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const workspace = await getAuthenticatedWorkspace(request);
    const body = await request.text();
    const input = deleteSchema.parse(superjson.parse(body));

    const existing = await db.selectFrom("resumeVariants").selectAll()
      .where("id", "=", input.id)
      .where("workspaceId", "=", workspace.id)
      .executeTakeFirst();

    if (!existing) {
      return new Response(superjson.stringify({ error: "Variant not found" }), { status: 404 });
    }

    // Delete related snapshots first
    await db.deleteFrom("versionSnapshots").where("resumeVariantId", "=", input.id).execute();
    await db.deleteFrom("resumeVariants").where("id", "=", input.id).execute();

    return new Response(superjson.stringify({ deleted: true, id: input.id } satisfies DeleteOutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
