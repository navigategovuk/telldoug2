/**
 * Profile GET Endpoint Schema
 * 
 * Fetches the complete profile for the authenticated workspace.
 * Returns profile basics plus all related work, education, skills, and projects.
 */

import { z } from "zod";
import superjson from "superjson";
import type { Selectable } from "kysely";
import type {
  Profiles,
  WorkExperiences,
  EducationEntries,
  Skills,
  Projects,
} from "../../helpers/schema";

// ============================================================================
// INPUT SCHEMA
// ============================================================================

export const schema = z.object({
  profileId: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

// ============================================================================
// OUTPUT TYPE
// ============================================================================

export type OutputType = {
  profile: Selectable<Profiles> | null;
  work: Selectable<WorkExperiences>[];
  education: Selectable<EducationEntries>[];
  skills: Selectable<Skills>[];
  projects: Selectable<Projects>[];
};

// ============================================================================
// CLIENT FETCH FUNCTION
// ============================================================================

export const getProfile = async (
  input: InputType = {},
  init?: RequestInit
): Promise<OutputType> => {
  const params = new URLSearchParams();
  if (input.profileId) {params.append("profileId", input.profileId);}

  const url = params.toString()
    ? `/_api/profile/get?${params.toString()}`
    : "/_api/profile/get";

  const result = await fetch(url, {
    method: "GET",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });

  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error);
  }

  return superjson.parse<OutputType>(await result.text());
};
