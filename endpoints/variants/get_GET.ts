/**
 * Variant Get Endpoint - Returns variant with snapshots and view definition
 */

import { getSchema, GetOutputType } from "./variants.schema";
import { getAuthenticatedWorkspace } from "../../helpers/workspaceUtils";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const workspace = await getAuthenticatedWorkspace(request);
    const url = new URL(request.url);
    const input = getSchema.parse(Object.fromEntries(url.searchParams.entries()));

    const variant = await db.selectFrom("resumeVariants").selectAll()
      .where("id", "=", input.id)
      .where("workspaceId", "=", workspace.id)
      .executeTakeFirst();

    if (!variant) {
      return new Response(superjson.stringify({ error: "Variant not found" }), { status: 404 });
    }

    const snapshots = await db.selectFrom("versionSnapshots").selectAll()
      .where("resumeVariantId", "=", input.id)
      .orderBy("versionNumber", "desc")
      .execute();

    let viewDefinition = null;
    if (variant.viewDefinitionId) {
      viewDefinition = await db.selectFrom("viewDefinitions").selectAll()
        .where("id", "=", variant.viewDefinitionId)
        .executeTakeFirst() ?? null;
    }

    return new Response(superjson.stringify({ variant, snapshots, viewDefinition } satisfies GetOutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
