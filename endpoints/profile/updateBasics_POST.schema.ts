/**
 * Profile Update Basics POST Endpoint Schema
 */

import { z } from "zod";
import superjson from "superjson";
import type { Selectable } from "kysely";
import type { Profiles } from "../../helpers/schema";

export const schema = z.object({
  profileId: z.string().optional(),
  fullName: z.string().min(1).max(200).optional(),
  firstName: z.string().max(100).optional().nullable(),
  lastName: z.string().max(100).optional().nullable(),
  label: z.string().max(200).optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  url: z.string().url().optional().nullable(),
  summary: z.string().max(5000).optional().nullable(),
  location: z.object({
    city: z.string().optional().nullable(),
    region: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
  }).optional().nullable(),
  socialProfiles: z.array(z.object({
    network: z.string(),
    url: z.string().url(),
  })).optional().nullable(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = { profile: Selectable<Profiles>; updated: boolean };

export const updateProfileBasics = async (
  input: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch("/_api/profile/update-basics", {
    method: "POST", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: superjson.stringify(input),
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<OutputType>(await result.text());
};
