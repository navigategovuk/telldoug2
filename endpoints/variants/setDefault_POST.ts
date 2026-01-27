/**
 * Variant Set Primary Endpoint
 */

import { setPrimarySchema, SetPrimaryOutputType } from "./variants.schema";
import { getAuthenticatedWorkspace } from "../../helpers/workspaceUtils";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const workspace = await getAuthenticatedWorkspace(request);
    const body = await request.text();
    const input = setPrimarySchema.parse(superjson.parse(body));

    const existing = await db.selectFrom("resumeVariants").selectAll()
      .where("id", "=", input.id)
      .where("workspaceId", "=", workspace.id)
      .executeTakeFirst();

    if (!existing) {
      return new Response(superjson.stringify({ error: "Variant not found" }), { status: 404 });
    }

    // Find current primary
    const currentPrimary = await db.selectFrom("resumeVariants").select("id")
      .where("profileId", "=", existing.profileId)
      .where("isPrimary", "=", true)
      .executeTakeFirst();

    // Unset all primaries for this profile
    await db.updateTable("resumeVariants").set({ isPrimary: false })
      .where("profileId", "=", existing.profileId).execute();

    // Set new primary
    await db.updateTable("resumeVariants").set({ isPrimary: true, updatedAt: new Date() })
      .where("id", "=", input.id).execute();

    const variant = await db.selectFrom("resumeVariants").selectAll().where("id", "=", input.id).executeTakeFirstOrThrow();
    return new Response(superjson.stringify({
      variant,
      previousPrimary: currentPrimary?.id ?? null
    } satisfies SetPrimaryOutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
