/**
 * Profile Populate Endpoint
 * POST /_api/profile/populate
 * 
 * Populates canonical profile from Career OS entities (jobs, learning, skills)
 */

import superjson from "superjson";
import { z } from "zod";
import { db } from "../../helpers/db";
import { populateFromCareer, type PopulateResult } from "../../helpers/populateFromCareer";
import { getServerUserSession } from "../../helpers/getServerUserSession";

const schema = z.object({
  profileId: z.string(),
  workspaceId: z.string().optional(),
  dryRun: z.boolean().default(false),
  mode: z.enum(["merge", "replace"]).default("merge"),
  includeJobs: z.boolean().default(true),
  includeLearning: z.boolean().default(true),
  includeSkills: z.boolean().default(true),
});

export async function handle(request: Request): Promise<Response> {
  try {
    // Auth check
    const session = await getServerUserSession(request);
    if (!session) {
      return new Response(
        superjson.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse body
    const body = await request.text();
    const input = schema.parse(superjson.parse(body));

    // Use workspace from session if not provided
    const workspaceId = input.workspaceId || (session as { workspaceId?: string })?.workspaceId;
    if (!workspaceId) {
      return new Response(
        superjson.stringify({ error: "Workspace ID required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify profile belongs to workspace
    const profile = await db
      .selectFrom("profiles")
      .select(["id", "workspaceId"])
      .where("id", "=", input.profileId)
      .executeTakeFirst();

    if (!profile) {
      return new Response(
        superjson.stringify({ error: "Profile not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (profile.workspaceId !== workspaceId) {
      return new Response(
        superjson.stringify({ error: "Profile does not belong to this workspace" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Execute populate
    const result = await populateFromCareer(db, {
      workspaceId,
      profileId: input.profileId,
      dryRun: input.dryRun,
      mode: input.mode,
      includeJobs: input.includeJobs,
      includeLearning: input.includeLearning,
      includeSkills: input.includeSkills,
    });

    return new Response(
      superjson.stringify(result),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Populate endpoint error:", error);
    
    if (error instanceof z.ZodError) {
      return new Response(
        superjson.stringify({ error: "Invalid input", details: error.errors }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      superjson.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
