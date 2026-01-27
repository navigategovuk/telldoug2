/**
 * Projects CRUD Endpoints Schema
 */

import { z } from "zod";
import superjson from "superjson";
import type { Selectable } from "kysely";
import type { Projects } from "../../helpers/schema";

const projectEntrySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  highlights: z.array(z.string()).optional().default([]),
  keywords: z.array(z.string()).optional().default([]),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  url: z.string().url().optional().nullable(),
  sortOrder: z.number().optional().nullable(),
  status: z.enum(["cancelled", "completed", "in_progress", "on_hold", "planning"]).optional().default("planning"),
});

export const createSchema = z.object({ profileId: z.string().optional(), ...projectEntrySchema.shape });
export const updateSchema = z.object({ id: z.string(), ...projectEntrySchema.partial().shape });
export const deleteSchema = z.object({ id: z.string() });
export const listSchema = z.object({ profileId: z.string().optional(), status: z.enum(["cancelled", "completed", "in_progress", "on_hold", "planning"]).optional() });

export type CreateInputType = z.infer<typeof createSchema>;
export type UpdateInputType = z.infer<typeof updateSchema>;
export type DeleteInputType = z.infer<typeof deleteSchema>;
export type ListInputType = z.infer<typeof listSchema>;

export type ProjectOutput = Selectable<Projects>;
export type CreateOutputType = { project: ProjectOutput; created: boolean };
export type UpdateOutputType = { project: ProjectOutput; updated: boolean };
export type DeleteOutputType = { deleted: boolean; id: string };
export type ListOutputType = { projects: ProjectOutput[] };

export const createProject = async (input: CreateInputType, init?: RequestInit): Promise<CreateOutputType> => {
  const result = await fetch("/_api/profile/projects/create", {
    method: "POST", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: superjson.stringify(input),
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<CreateOutputType>(await result.text());
};

export const updateProject = async (input: UpdateInputType, init?: RequestInit): Promise<UpdateOutputType> => {
  const result = await fetch("/_api/profile/projects/update", {
    method: "POST", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: superjson.stringify(input),
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<UpdateOutputType>(await result.text());
};

export const deleteProject = async (input: DeleteInputType, init?: RequestInit): Promise<DeleteOutputType> => {
  const result = await fetch("/_api/profile/projects/delete", {
    method: "POST", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: superjson.stringify(input),
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<DeleteOutputType>(await result.text());
};

export const listProjects = async (input: ListInputType = {}, init?: RequestInit): Promise<ListOutputType> => {
  const params = new URLSearchParams();
  if (input.profileId) {params.append("profileId", input.profileId);}
  if (input.status) {params.append("status", input.status);}
  const url = params.toString() ? `/_api/profile/projects/list?${params.toString()}` : "/_api/profile/projects/list";
  const result = await fetch(url, {
    method: "GET", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<ListOutputType>(await result.text());
};
