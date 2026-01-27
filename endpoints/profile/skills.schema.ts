/**
 * Skills CRUD Endpoints Schema
 */

import { z } from "zod";
import superjson from "superjson";
import type { Selectable } from "kysely";
import type { Skills } from "../../helpers/schema";

const skillEntrySchema = z.object({
  name: z.string().min(1).max(100),
  level: z.string().max(50).optional().nullable(),
  keywords: z.array(z.string()).optional().default([]),
  proficiency: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional().default("beginner"),
  category: z.string().max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
  sortOrder: z.number().optional().nullable(),
});

export const createSchema = z.object({ profileId: z.string().optional(), ...skillEntrySchema.shape });
export const updateSchema = z.object({ id: z.string(), ...skillEntrySchema.partial().shape });
export const deleteSchema = z.object({ id: z.string() });
export const listSchema = z.object({ profileId: z.string().optional(), category: z.string().optional() });

export type CreateInputType = z.infer<typeof createSchema>;
export type UpdateInputType = z.infer<typeof updateSchema>;
export type DeleteInputType = z.infer<typeof deleteSchema>;
export type ListInputType = z.infer<typeof listSchema>;

export type SkillOutput = Selectable<Skills>;
export type CreateOutputType = { skill: SkillOutput; created: boolean };
export type UpdateOutputType = { skill: SkillOutput; updated: boolean };
export type DeleteOutputType = { deleted: boolean; id: string };
export type ListOutputType = { skills: SkillOutput[] };

export const createSkill = async (input: CreateInputType, init?: RequestInit): Promise<CreateOutputType> => {
  const result = await fetch("/_api/profile/skills/create", {
    method: "POST", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: superjson.stringify(input),
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<CreateOutputType>(await result.text());
};

export const updateSkill = async (input: UpdateInputType, init?: RequestInit): Promise<UpdateOutputType> => {
  const result = await fetch("/_api/profile/skills/update", {
    method: "POST", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: superjson.stringify(input),
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<UpdateOutputType>(await result.text());
};

export const deleteSkill = async (input: DeleteInputType, init?: RequestInit): Promise<DeleteOutputType> => {
  const result = await fetch("/_api/profile/skills/delete", {
    method: "POST", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: superjson.stringify(input),
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<DeleteOutputType>(await result.text());
};

export const listSkills = async (input: ListInputType = {}, init?: RequestInit): Promise<ListOutputType> => {
  const params = new URLSearchParams();
  if (input.profileId) {params.append("profileId", input.profileId);}
  if (input.category) {params.append("category", input.category);}
  const url = params.toString() ? `/_api/profile/skills/list?${params.toString()}` : "/_api/profile/skills/list";
  const result = await fetch(url, {
    method: "GET", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<ListOutputType>(await result.text());
};
