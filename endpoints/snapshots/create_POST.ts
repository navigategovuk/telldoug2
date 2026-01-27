/**
 * Snapshot Create Endpoint
 */

import { createSchema, CreateOutputType } from "./snapshots.schema";
import { getAuthenticatedWorkspace } from "../../helpers/workspaceUtils";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";
import superjson from "superjson";
import type { Json } from "../../helpers/schema";

export async function handle(request: Request) {
  try {
    const workspace = await getAuthenticatedWorkspace(request);
    const body = await request.text();
    const input = createSchema.parse(superjson.parse(body));

    // Verify variant belongs to workspace
    const variant = await db.selectFrom("resumeVariants").selectAll()
      .where("id", "=", input.resumeVariantId)
      .where("workspaceId", "=", workspace.id)
      .executeTakeFirst();

    if (!variant) {
      return new Response(superjson.stringify({ error: "Variant not found" }), { status: 404 });
    }

    // Get next version number
    const lastSnapshot = await db.selectFrom("versionSnapshots")
      .select("versionNumber")
      .where("resumeVariantId", "=", input.resumeVariantId)
      .orderBy("versionNumber", "desc")
      .limit(1)
      .executeTakeFirst();

    const versionNumber = input.versionNumber ?? ((lastSnapshot?.versionNumber ?? 0) + 1);

    // Cast snapshotData to Json type for Kysely
    const snapshotDataJson = (input.snapshotData ?? {}) as Json;

    const result = await db.insertInto("versionSnapshots").values({
      resumeVariantId: input.resumeVariantId,
      versionNumber,
      label: input.label,
      notes: input.notes,
      snapshotData: snapshotDataJson,
    }).returning("id").executeTakeFirstOrThrow();

    const snapshot = await db.selectFrom("versionSnapshots").selectAll().where("id", "=", result.id).executeTakeFirstOrThrow();
    return new Response(superjson.stringify({ snapshot, created: true } satisfies CreateOutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
