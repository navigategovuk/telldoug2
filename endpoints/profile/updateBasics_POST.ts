/**
 * Profile Update Basics POST Endpoint
 */

import { schema, OutputType } from "./updateBasics_POST.schema";
import { getAuthenticatedWorkspace } from "../../helpers/workspaceUtils";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";
import { nanoid } from "nanoid";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const workspace = await getAuthenticatedWorkspace(request);
    const body = await request.text();
    const input = schema.parse(superjson.parse(body));

    let profileId = input.profileId;
    
    if (!profileId) {
      const existingProfile = await db
        .selectFrom("profiles")
        .select("id")
        .where("workspaceId", "=", workspace.id)
        .orderBy("createdAt", "asc")
        .limit(1)
        .executeTakeFirst();

      if (existingProfile) {
        profileId = existingProfile.id;
      } else {
        profileId = nanoid();
        await db.insertInto("profiles").values({
          id: profileId,
          workspaceId: workspace.id,
          fullName: input.fullName || "New Profile",
          email: input.email,
        }).execute();
      }
    }

    const updateFields: Record<string, unknown> = { updatedAt: new Date() };
    if (input.fullName !== undefined) {updateFields.fullName = input.fullName;}
    if (input.firstName !== undefined) {updateFields.firstName = input.firstName;}
    if (input.lastName !== undefined) {updateFields.lastName = input.lastName;}
    if (input.label !== undefined) {updateFields.label = input.label;}
    if (input.email !== undefined) {updateFields.email = input.email;}
    if (input.phone !== undefined) {updateFields.phone = input.phone;}
    if (input.url !== undefined) {updateFields.url = input.url;}
    if (input.summary !== undefined) {updateFields.summary = input.summary;}
    if (input.location !== undefined) {updateFields.location = input.location;}
    if (input.socialProfiles !== undefined) {updateFields.socialProfiles = input.socialProfiles;}

    await db.updateTable("profiles").set(updateFields)
      .where("id", "=", profileId).where("workspaceId", "=", workspace.id).execute();

    const profile = await db.selectFrom("profiles").selectAll()
      .where("id", "=", profileId).executeTakeFirstOrThrow();

    return new Response(superjson.stringify({ profile, updated: true } satisfies OutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
