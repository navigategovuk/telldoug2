/**
 * Variant Create Endpoint
 */

import { createSchema, CreateOutputType } from "./variants.schema";
import { getAuthenticatedWorkspace } from "../../helpers/workspaceUtils";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";
import { nanoid } from "nanoid";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const workspace = await getAuthenticatedWorkspace(request);
    const body = await request.text();
    const input = createSchema.parse(superjson.parse(body));

    let profileId = input.profileId;
    if (!profileId) {
      const profile = await db.selectFrom("profiles").select("id")
        .where("workspaceId", "=", workspace.id).orderBy("createdAt", "asc").limit(1).executeTakeFirst();
      if (!profile) {
        return new Response(superjson.stringify({ error: "No profile found" }), { status: 400 });
      }
      profileId = profile.id;
    }

    // If this is set as primary, unset any existing primaries
    if (input.isPrimary) {
      await db.updateTable("resumeVariants").set({ isPrimary: false })
        .where("profileId", "=", profileId).execute();
    }

    const id = nanoid();
    await db.insertInto("resumeVariants").values({
      id, profileId, workspaceId: workspace.id,
      name: input.name, description: input.description,
      targetRole: input.targetRole, viewDefinitionId: input.viewDefinitionId,
      isPrimary: input.isPrimary,
    }).execute();

    const variant = await db.selectFrom("resumeVariants").selectAll().where("id", "=", id).executeTakeFirstOrThrow();
    return new Response(superjson.stringify({ variant, created: true } satisfies CreateOutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
