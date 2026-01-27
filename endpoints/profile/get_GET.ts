/**
 * Profile GET Endpoint Implementation
 */

import { schema, OutputType } from "./get_GET.schema";
import { getAuthenticatedWorkspace } from "../../helpers/workspaceUtils";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const workspace = await getAuthenticatedWorkspace(request);

    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    const input = schema.parse(searchParams);

    // Get the profile
    let profile;
    if (input.profileId) {
      profile = await db
        .selectFrom("profiles")
        .selectAll()
        .where("id", "=", input.profileId)
        .where("workspaceId", "=", workspace.id)
        .executeTakeFirst();
    } else {
      profile = await db
        .selectFrom("profiles")
        .selectAll()
        .where("workspaceId", "=", workspace.id)
        .orderBy("createdAt", "asc")
        .limit(1)
        .executeTakeFirst();
    }

    if (!profile) {
      return new Response(
        superjson.stringify({
          profile: null, work: [], education: [], skills: [], projects: [],
        } satisfies OutputType)
      );
    }

    const [work, education, skills, projects] = await Promise.all([
      db.selectFrom("workExperiences").selectAll()
        .where("profileId", "=", profile.id).orderBy("startDate", "desc").execute(),
      db.selectFrom("educationEntries").selectAll()
        .where("profileId", "=", profile.id).orderBy("startDate", "desc").execute(),
      db.selectFrom("skills").selectAll()
        .where("profileId", "=", profile.id).orderBy("name", "asc").execute(),
      db.selectFrom("projects").selectAll()
        .where("profileId", "=", profile.id).orderBy("startDate", "desc").execute(),
    ]);

    return new Response(
      superjson.stringify({ profile, work, education, skills, projects } satisfies OutputType)
    );
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
