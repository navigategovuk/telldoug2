/**
 * Share Links List Endpoint
 */

import { listSchema, ListOutputType } from "./share.schema";
import { getAuthenticatedWorkspace } from "../../helpers/workspaceUtils";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const workspace = await getAuthenticatedWorkspace(request);
    const url = new URL(request.url);
    const input = listSchema.parse(Object.fromEntries(url.searchParams.entries()));

    // Get all variants for this workspace
    const variants = await db.selectFrom("resumeVariants").select("id")
      .where("workspaceId", "=", workspace.id)
      .execute();

    const variantIds = variants.map(v => v.id);

    if (variantIds.length === 0) {
      return new Response(superjson.stringify({ shareLinks: [] } satisfies ListOutputType));
    }

    let query = db.selectFrom("publicShareLinks").selectAll()
      .where("resumeVariantId", "in", variantIds);

    if (input.resumeVariantId) {
      // Filter to specific variant (must still belong to workspace)
      if (!variantIds.includes(input.resumeVariantId)) {
        return new Response(superjson.stringify({ error: "Variant not found" }), { status: 404 });
      }
      query = query.where("resumeVariantId", "=", input.resumeVariantId);
    }

    const shareLinks = await query.orderBy("createdAt", "desc").execute();
    return new Response(superjson.stringify({ shareLinks } satisfies ListOutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
