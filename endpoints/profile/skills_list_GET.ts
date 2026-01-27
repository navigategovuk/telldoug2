/**
 * Skills List Endpoint
 */

import { listSchema, ListOutputType } from "./skills.schema";
import { getAuthenticatedWorkspace } from "../../helpers/workspaceUtils";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const workspace = await getAuthenticatedWorkspace(request);
    const url = new URL(request.url);
    const input = listSchema.parse(Object.fromEntries(url.searchParams.entries()));

    let query = db.selectFrom("skills").selectAll().where("workspaceId", "=", workspace.id);

    if (input.profileId) {
      query = query.where("profileId", "=", input.profileId);
    }
    if (input.category) {
      query = query.where("category", "=", input.category);
    }

    const skills = await query.orderBy("category", "asc").orderBy("sortOrder", "asc").execute();
    return new Response(superjson.stringify({ skills } satisfies ListOutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
