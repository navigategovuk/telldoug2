/**
 * Work Experience CRUD Endpoints Schema
 */

import { z } from "zod";
import superjson from "superjson";
import type { Selectable } from "kysely";
import type { WorkExperiences } from "../../helpers/schema";

const workEntrySchema = z.object({
  company: z.string().min(1).max(200),
  position: z.string().min(1).max(200),
  url: z.string().url().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  summary: z.string().max(5000).optional().nullable(),
  highlights: z.array(z.string()).optional().default([]),
  department: z.string().max(200).optional().nullable(),
  employmentType: z.string().max(50).optional().nullable(),
  sortOrder: z.number().optional().nullable(),
});

export const createSchema = z.object({ profileId: z.string().optional(), ...workEntrySchema.shape });
export const updateSchema = z.object({ id: z.string(), ...workEntrySchema.partial().shape });
export const deleteSchema = z.object({ id: z.string() });
export const listSchema = z.object({ profileId: z.string().optional() });

export type CreateInputType = z.infer<typeof createSchema>;
export type UpdateInputType = z.infer<typeof updateSchema>;
export type DeleteInputType = z.infer<typeof deleteSchema>;
export type ListInputType = z.infer<typeof listSchema>;

export type WorkOutput = Selectable<WorkExperiences>;
export type CreateOutputType = { work: WorkOutput; created: boolean };
export type UpdateOutputType = { work: WorkOutput; updated: boolean };
export type DeleteOutputType = { deleted: boolean; id: string };
export type ListOutputType = { work: WorkOutput[] };

export const createWork = async (input: CreateInputType, init?: RequestInit): Promise<CreateOutputType> => {
  const result = await fetch("/_api/profile/work/create", {
    method: "POST", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: superjson.stringify(input),
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<CreateOutputType>(await result.text());
};

export const updateWork = async (input: UpdateInputType, init?: RequestInit): Promise<UpdateOutputType> => {
  const result = await fetch("/_api/profile/work/update", {
    method: "POST", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: superjson.stringify(input),
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<UpdateOutputType>(await result.text());
};

export const deleteWork = async (input: DeleteInputType, init?: RequestInit): Promise<DeleteOutputType> => {
  const result = await fetch("/_api/profile/work/delete", {
    method: "POST", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: superjson.stringify(input),
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<DeleteOutputType>(await result.text());
};

export const listWork = async (input: ListInputType = {}, init?: RequestInit): Promise<ListOutputType> => {
  const params = new URLSearchParams();
  if (input.profileId) {params.append("profileId", input.profileId);}
  const url = params.toString() ? `/_api/profile/work/list?${params.toString()}` : "/_api/profile/work/list";
  const result = await fetch(url, {
    method: "GET", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<ListOutputType>(await result.text());
};
