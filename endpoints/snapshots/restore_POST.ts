/**
 * Snapshot Restore Endpoint - Creates a new snapshot from an old one
 */

import { restoreSchema, RestoreOutputType } from "./snapshots.schema";
import { getAuthenticatedWorkspace } from "../../helpers/workspaceUtils";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";
import { nanoid } from "nanoid";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const workspace = await getAuthenticatedWorkspace(request);
    const body = await request.text();
    const input = restoreSchema.parse(superjson.parse(body));

    // Get snapshot and verify variant belongs to workspace
    const oldSnapshot = await db.selectFrom("versionSnapshots").selectAll()
      .where("id", "=", input.id)
      .executeTakeFirst();

    if (!oldSnapshot) {
      return new Response(superjson.stringify({ error: "Snapshot not found" }), { status: 404 });
    }

    // Verify workspace ownership through variant
    const variant = await db.selectFrom("resumeVariants").select("id")
      .where("id", "=", oldSnapshot.resumeVariantId)
      .where("workspaceId", "=", workspace.id)
      .executeTakeFirst();

    if (!variant) {
      return new Response(superjson.stringify({ error: "Snapshot not found" }), { status: 404 });
    }

    // Get next version number
    const lastSnapshot = await db.selectFrom("versionSnapshots")
      .select("versionNumber")
      .where("resumeVariantId", "=", oldSnapshot.resumeVariantId)
      .orderBy("versionNumber", "desc")
      .limit(1)
      .executeTakeFirst();

    const versionNumber = (lastSnapshot?.versionNumber ?? 0) + 1;

    // Create new snapshot from old data
    const id = nanoid();
    await db.insertInto("versionSnapshots").values({
      id,
      resumeVariantId: oldSnapshot.resumeVariantId,
      versionNumber,
      label: `Restored from v${oldSnapshot.versionNumber}`,
      notes: `Restored from version ${oldSnapshot.versionNumber}${oldSnapshot.label ? ` (${oldSnapshot.label})` : ""}`,
      snapshotData: oldSnapshot.snapshotData,
    }).execute();

    const newSnapshot = await db.selectFrom("versionSnapshots").selectAll().where("id", "=", id).executeTakeFirstOrThrow();
    return new Response(superjson.stringify({ restored: true, newSnapshot } satisfies RestoreOutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
