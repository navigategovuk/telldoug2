/**
 * Variants List Endpoint
 */

import { listSchema, ListOutputType } from "./variants.schema";
import { getAuthenticatedWorkspace } from "../../helpers/workspaceUtils";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const workspace = await getAuthenticatedWorkspace(request);
    const url = new URL(request.url);
    const input = listSchema.parse(Object.fromEntries(url.searchParams.entries()));

    let query = db.selectFrom("resumeVariants").selectAll().where("workspaceId", "=", workspace.id);

    if (input.profileId) {
      query = query.where("profileId", "=", input.profileId);
    }
    if (input.isPrimary !== undefined) {
      query = query.where("isPrimary", "=", input.isPrimary);
    }

    const variants = await query.orderBy("isPrimary", "desc").orderBy("createdAt", "desc").execute();
    return new Response(superjson.stringify({ variants } satisfies ListOutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
