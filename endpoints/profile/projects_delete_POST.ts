/**
 * Project Delete Endpoint
 */

import { deleteSchema, DeleteOutputType } from "./projects.schema";
import { getAuthenticatedWorkspace } from "../../helpers/workspaceUtils";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const workspace = await getAuthenticatedWorkspace(request);
    const body = await request.text();
    const input = deleteSchema.parse(superjson.parse(body));

    const existing = await db.selectFrom("projects").selectAll()
      .where("id", "=", input.id)
      .where("workspaceId", "=", workspace.id)
      .executeTakeFirst();

    if (!existing) {
      return new Response(superjson.stringify({ error: "Project not found" }), { status: 404 });
    }

    await db.deleteFrom("projects").where("id", "=", input.id).execute();
    return new Response(superjson.stringify({ deleted: true, id: input.id } satisfies DeleteOutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
