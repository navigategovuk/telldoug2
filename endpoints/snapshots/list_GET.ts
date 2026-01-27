/**
 * Snapshots List Endpoint
 */

import { listSchema, ListOutputType } from "./snapshots.schema";
import { getAuthenticatedWorkspace } from "../../helpers/workspaceUtils";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const workspace = await getAuthenticatedWorkspace(request);
    const url = new URL(request.url);
    const input = listSchema.parse(Object.fromEntries(url.searchParams.entries()));

    // Verify variant belongs to workspace
    const variant = await db.selectFrom("resumeVariants").select("id")
      .where("id", "=", input.resumeVariantId)
      .where("workspaceId", "=", workspace.id)
      .executeTakeFirst();

    if (!variant) {
      return new Response(superjson.stringify({ error: "Variant not found" }), { status: 404 });
    }

    const snapshots = await db.selectFrom("versionSnapshots").selectAll()
      .where("resumeVariantId", "=", input.resumeVariantId)
      .orderBy("versionNumber", "desc")
      .execute();

    return new Response(superjson.stringify({ snapshots } satisfies ListOutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
