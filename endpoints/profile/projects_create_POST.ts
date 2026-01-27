/**
 * Project Create Endpoint
 */

import { createSchema, CreateOutputType } from "./projects.schema";
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
    await db.insertInto("projects").values({
      id, profileId, workspaceId: workspace.id,
      name: input.name, description: input.description ?? null, highlights: input.highlights ?? null,
      keywords: input.keywords ?? null, startDate: input.startDate ?? null, endDate: input.endDate ?? null,
      url: input.url ?? null, sortOrder: input.sortOrder, status: input.status,
    }).execute();

    const project = await db.selectFrom("projects").selectAll().where("id", "=", id).executeTakeFirstOrThrow();
    return new Response(superjson.stringify({ project, created: true } satisfies CreateOutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
