/**
 * Share Link Update Endpoint
 */

import { updateSchema, UpdateOutputType } from "./share.schema";
import { getAuthenticatedWorkspace } from "../../helpers/workspaceUtils";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";
import superjson from "superjson";

// Simple hash function for password (use bcrypt in production)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `hash_${Math.abs(hash).toString(36)}`;
}

export async function handle(request: Request) {
  try {
    const workspace = await getAuthenticatedWorkspace(request);
    const body = await request.text();
    const input = updateSchema.parse(superjson.parse(body));

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

    // Build update object
    const updates: Record<string, unknown> = {};
    if (input.label !== undefined) {updates.label = input.label;}
    if (input.expiresAt !== undefined) {updates.expiresAt = input.expiresAt;}
    if (input.isLive !== undefined) {updates.isLive = input.isLive;}
    if (input.password !== undefined) {
      updates.passwordHash = input.password ? simpleHash(input.password) : null;
    }

    if (Object.keys(updates).length > 0) {
      await db.updateTable("publicShareLinks")
        .set(updates)
        .where("id", "=", input.id)
        .execute();
    }

    const updated = await db.selectFrom("publicShareLinks").selectAll()
      .where("id", "=", input.id)
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify({ shareLink: updated, updated: true } satisfies UpdateOutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
