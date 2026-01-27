/**
 * Work Experience Create Endpoint
 */

import { createSchema, CreateOutputType } from "./work.schema";
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
    await db.insertInto("workExperiences").values({
      id, profileId,
      company: input.company, position: input.position, url: input.url,
      startDate: input.startDate, endDate: input.endDate, summary: input.summary,
      highlights: input.highlights, department: input.department,
      employmentType: input.employmentType, sortOrder: input.sortOrder,
    }).execute();

    const work = await db.selectFrom("workExperiences").selectAll().where("id", "=", id).executeTakeFirstOrThrow();
    return new Response(superjson.stringify({ work, created: true } satisfies CreateOutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
