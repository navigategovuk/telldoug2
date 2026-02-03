/**
 * Workspace Utilities
 * 
 * Server-side utilities for getting the authenticated user's workspace.
 */

import { db } from "./db";
import { getServerUserSession } from "./getServerUserSession";
import { NotAuthenticatedError } from "./getSetServerSession";
import type { Selectable } from "kysely";
import type { Workspaces } from "./schema";

/**
 * Get the authenticated user's workspace.
 * Throws NotAuthenticatedError if not authenticated or no workspace exists.
 */
export async function getAuthenticatedWorkspace(
  request: Request
): Promise<Selectable<Workspaces>> {
  // Get the authenticated user session
  const { user } = await getServerUserSession(request);

  // Find the workspace where this user is a member
  const membership = await db
    .selectFrom("workspaceMembers")
    .innerJoin("workspaces", "workspaces.id", "workspaceMembers.workspaceId")
    .selectAll("workspaces")
    .where("workspaceMembers.userId", "=", user.id)
    .orderBy("workspaces.createdAt", "asc") // Get the oldest (primary) workspace
    .limit(1)
    .executeTakeFirst();

  if (!membership) {
    throw new NotAuthenticatedError("No workspace found for user");
  }

  return membership;
}

/**
 * Get or create a workspace for the authenticated user.
 * Creates a default workspace if the user doesn't have one.
 */
export async function getOrCreateAuthenticatedWorkspace(
  request: Request
): Promise<Selectable<Workspaces>> {
  const { user } = await getServerUserSession(request);

  // Try to find existing workspace
  const existing = await db
    .selectFrom("workspaceMembers")
    .innerJoin("workspaces", "workspaces.id", "workspaceMembers.workspaceId")
    .selectAll("workspaces")
    .where("workspaceMembers.userId", "=", user.id)
    .orderBy("workspaces.createdAt", "asc")
    .limit(1)
    .executeTakeFirst();

  if (existing) {
    return existing;
  }

  // Create a new workspace for the user
  const { nanoid } = await import("nanoid");
  const workspaceId = nanoid();
  const now = new Date();

  await db
    .insertInto("workspaces")
    .values({
      id: workspaceId,
      name: `${user.displayName || user.email}'s Workspace`,
      createdAt: now,
      updatedAt: now,
    })
    .execute();

  await db
    .insertInto("workspaceMembers")
    .values({
      workspaceId,
      userId: user.id,
      role: "owner",
      createdAt: now,
    })
    .execute();

  const workspace = await db
    .selectFrom("workspaces")
    .selectAll()
    .where("id", "=", workspaceId)
    .executeTakeFirstOrThrow();

  return workspace;
}
