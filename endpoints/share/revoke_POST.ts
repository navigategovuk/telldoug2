/**
 * Share Link Revoke Endpoint - Soft disable without delete
 */

import { revokeSchema, RevokeOutputType } from "./share.schema";
import { getAuthenticatedWorkspace } from "../../helpers/workspaceUtils";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const workspace = await getAuthenticatedWorkspace(request);
    const body = await request.text();
    const input = revokeSchema.parse(superjson.parse(body));

    // Get share link and verify ownership through variant
    const shareLink = await db.selectFrom("publicShareLinks").selectAll()
      .where("id", "=", input.id)
      .executeTakeFirst();

    if (!shareLink) {
      return new Response(superjson.stringify({ error: "Share link not found" }), { status: 404 });
    }

    // Verify variant belongs to workspace
    const variant = await db.selectFrom("resumeVariants").select("id")
      .where("id", "=", shareLink.resumeVariantId)
      .where("workspaceId", "=", workspace.id)
      .executeTakeFirst();

    if (!variant) {
      return new Response(superjson.stringify({ error: "Share link not found" }), { status: 404 });
    }

    await db.updateTable("publicShareLinks")
      .set({ isRevoked: true })
      .where("id", "=", input.id)
      .execute();

    return new Response(superjson.stringify({ revoked: true, id: input.id } satisfies RevokeOutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
