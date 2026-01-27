/**
 * Work Experience List Endpoint
 */

import { listSchema, ListOutputType } from "./work.schema";
import { getAuthenticatedWorkspace } from "../../helpers/workspaceUtils";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const workspace = await getAuthenticatedWorkspace(request);
    const url = new URL(request.url);
    const input = listSchema.parse(Object.fromEntries(url.searchParams.entries()));

    let profileId = input.profileId;
    if (!profileId) {
      const profile = await db.selectFrom("profiles").select("id")
        .where("workspaceId", "=", workspace.id).orderBy("createdAt", "asc").limit(1).executeTakeFirst();
      if (!profile) {
        return new Response(superjson.stringify({ work: [] } satisfies ListOutputType));
      }
      profileId = profile.id;
    }

    const work = await db.selectFrom("workExperiences").selectAll()
      .where("profileId", "=", profileId).orderBy("startDate", "desc").execute();
    return new Response(superjson.stringify({ work } satisfies ListOutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
