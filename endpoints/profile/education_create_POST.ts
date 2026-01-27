/**
 * Education Create Endpoint
 */

import { createSchema, CreateOutputType } from "./education.schema";
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

    const id = nanoid();
    await db.insertInto("educationEntries").values({
      id, profileId,
      institution: input.institution, area: input.area, studyType: input.studyType,
      degreeType: input.degreeType, minor: input.minor,
      startDate: input.startDate, endDate: input.endDate,
      score: input.score, courses: input.courses, url: input.url, sortOrder: input.sortOrder,
    }).execute();

    const education = await db.selectFrom("educationEntries").selectAll().where("id", "=", id).executeTakeFirstOrThrow();
    return new Response(superjson.stringify({ education, created: true } satisfies CreateOutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
