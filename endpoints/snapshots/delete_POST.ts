/**
 * Snapshot Delete Endpoint
 */

import { deleteSchema, DeleteOutputType } from "./snapshots.schema";
import { getAuthenticatedWorkspace } from "../../helpers/workspaceUtils";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const workspace = await getAuthenticatedWorkspace(request);
    const body = await request.text();
    const input = deleteSchema.parse(superjson.parse(body));

    // Get snapshot and verify variant belongs to workspace
    const snapshot = await db.selectFrom("versionSnapshots").selectAll()
      .where("id", "=", input.id)
      .executeTakeFirst();

    if (!snapshot) {
      return new Response(superjson.stringify({ error: "Snapshot not found" }), { status: 404 });
    }

    // Verify workspace ownership through variant
    const variant = await db.selectFrom("resumeVariants").select("id")
      .where("id", "=", snapshot.resumeVariantId)
      .where("workspaceId", "=", workspace.id)
      .executeTakeFirst();

    if (!variant) {
      return new Response(superjson.stringify({ error: "Snapshot not found" }), { status: 404 });
    }

    await db.deleteFrom("versionSnapshots").where("id", "=", input.id).execute();
    return new Response(superjson.stringify({ deleted: true, id: input.id } satisfies DeleteOutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
