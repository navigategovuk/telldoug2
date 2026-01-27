/**
 * Snapshot Get Endpoint
 */

import { getSchema, GetOutputType } from "./snapshots.schema";
import { getAuthenticatedWorkspace } from "../../helpers/workspaceUtils";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const workspace = await getAuthenticatedWorkspace(request);
    const url = new URL(request.url);
    const input = getSchema.parse(Object.fromEntries(url.searchParams.entries()));

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

    return new Response(superjson.stringify({ snapshot } satisfies GetOutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
