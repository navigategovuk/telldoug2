/**
 * Share Link Create Endpoint
 */

import { createSchema, CreateOutputType } from "./share.schema";
import { getAuthenticatedWorkspace } from "../../helpers/workspaceUtils";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";
import { customAlphabet } from "nanoid";
import superjson from "superjson";

// Generate URL-friendly tokens
const generateToken = customAlphabet("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 16);

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
    const input = createSchema.parse(superjson.parse(body));

    // Verify variant belongs to workspace
    const variant = await db.selectFrom("resumeVariants").selectAll()
      .where("id", "=", input.resumeVariantId)
      .where("workspaceId", "=", workspace.id)
      .executeTakeFirst();

    if (!variant) {
      return new Response(superjson.stringify({ error: "Variant not found" }), { status: 404 });
    }

    // Generate unique token
    const token = generateToken();

    // Hash password if provided
    const passwordHash = input.password ? simpleHash(input.password) : null;

    await db.insertInto("publicShareLinks").values({
      resumeVariantId: input.resumeVariantId,
      snapshotId: input.snapshotId,
      token,
      label: input.label,
      expiresAt: input.expiresAt,
      passwordHash,
    }).execute();

    const shareLink = await db.selectFrom("publicShareLinks").selectAll()
      .where("token", "=", token)
      .executeTakeFirstOrThrow();

    // Construct share URL
    const shareUrl = `/r/${token}`;

    return new Response(superjson.stringify({ shareLink, created: true, shareUrl } satisfies CreateOutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
