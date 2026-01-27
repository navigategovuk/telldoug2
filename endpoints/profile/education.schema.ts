/**
 * Education CRUD Endpoints Schema
 */

import { z } from "zod";
import superjson from "superjson";
import type { Selectable } from "kysely";
import type { EducationEntries } from "../../helpers/schema";

const educationEntrySchema = z.object({
  institution: z.string().min(1).max(200),
  area: z.string().max(200).optional().nullable(),
  studyType: z.string().max(100).optional().nullable(),
  degreeType: z.string().max(100).optional().nullable(),
  minor: z.string().max(200).optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  score: z.string().max(50).optional().nullable(),
  courses: z.array(z.string()).optional().default([]),
  url: z.string().url().optional().nullable(),
  sortOrder: z.number().optional().nullable(),
});

export const createSchema = z.object({ profileId: z.string().optional(), ...educationEntrySchema.shape });
export const updateSchema = z.object({ id: z.string(), ...educationEntrySchema.partial().shape });
export const deleteSchema = z.object({ id: z.string() });
export const listSchema = z.object({ profileId: z.string().optional() });

export type CreateInputType = z.infer<typeof createSchema>;
export type UpdateInputType = z.infer<typeof updateSchema>;
export type DeleteInputType = z.infer<typeof deleteSchema>;
export type ListInputType = z.infer<typeof listSchema>;

export type EducationOutput = Selectable<EducationEntries>;
export type CreateOutputType = { education: EducationOutput; created: boolean };
export type UpdateOutputType = { education: EducationOutput; updated: boolean };
export type DeleteOutputType = { deleted: boolean; id: string };
export type ListOutputType = { education: EducationOutput[] };

export const createEducation = async (input: CreateInputType, init?: RequestInit): Promise<CreateOutputType> => {
  const result = await fetch("/_api/profile/education/create", {
    method: "POST", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: superjson.stringify(input),
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<CreateOutputType>(await result.text());
};

export const updateEducation = async (input: UpdateInputType, init?: RequestInit): Promise<UpdateOutputType> => {
  const result = await fetch("/_api/profile/education/update", {
    method: "POST", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: superjson.stringify(input),
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<UpdateOutputType>(await result.text());
};

export const deleteEducation = async (input: DeleteInputType, init?: RequestInit): Promise<DeleteOutputType> => {
  const result = await fetch("/_api/profile/education/delete", {
    method: "POST", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: superjson.stringify(input),
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<DeleteOutputType>(await result.text());
};

export const listEducation = async (input: ListInputType = {}, init?: RequestInit): Promise<ListOutputType> => {
  const params = new URLSearchParams();
  if (input.profileId) {params.append("profileId", input.profileId);}
  const url = params.toString() ? `/_api/profile/education/list?${params.toString()}` : "/_api/profile/education/list";
  const result = await fetch(url, {
    method: "GET", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<ListOutputType>(await result.text());
};
