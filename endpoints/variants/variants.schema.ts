/**
 * Variant CRUD Endpoints Schema
 */

import { z } from "zod";
import superjson from "superjson";
import type { Selectable } from "kysely";
import type { ResumeVariants, VersionSnapshots, ViewDefinitions } from "../../helpers/schema";

const variantSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  targetRole: z.string().max(200).optional().nullable(),
  viewDefinitionId: z.string().optional().nullable(),
  isPrimary: z.boolean().optional().default(false),
});

export const createSchema = z.object({ profileId: z.string().optional(), ...variantSchema.shape });
export const updateSchema = z.object({ id: z.string(), ...variantSchema.partial().shape });
export const deleteSchema = z.object({ id: z.string() });
export const listSchema = z.object({ profileId: z.string().optional(), isPrimary: z.boolean().optional() });
export const getSchema = z.object({ id: z.string() });
export const duplicateSchema = z.object({ id: z.string(), newName: z.string().min(1).max(200) });
export const setPrimarySchema = z.object({ id: z.string() });

export type CreateInputType = z.infer<typeof createSchema>;
export type UpdateInputType = z.infer<typeof updateSchema>;
export type DeleteInputType = z.infer<typeof deleteSchema>;
export type ListInputType = z.infer<typeof listSchema>;
export type GetInputType = z.infer<typeof getSchema>;
export type DuplicateInputType = z.infer<typeof duplicateSchema>;
export type SetPrimaryInputType = z.infer<typeof setPrimarySchema>;

export type VariantOutput = Selectable<ResumeVariants>;
export type SnapshotOutput = Selectable<VersionSnapshots>;
export type ViewDefinitionOutput = Selectable<ViewDefinitions>;

export type CreateOutputType = { variant: VariantOutput; created: boolean };
export type UpdateOutputType = { variant: VariantOutput; updated: boolean };
export type DeleteOutputType = { deleted: boolean; id: string };
export type ListOutputType = { variants: VariantOutput[] };
export type GetOutputType = { variant: VariantOutput; snapshots: SnapshotOutput[]; viewDefinition: ViewDefinitionOutput | null };
export type DuplicateOutputType = { variant: VariantOutput; duplicated: boolean };
export type SetPrimaryOutputType = { variant: VariantOutput; previousPrimary: string | null };

// Client functions
export const createVariant = async (input: CreateInputType, init?: RequestInit): Promise<CreateOutputType> => {
  const result = await fetch("/_api/variants/create", {
    method: "POST", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: superjson.stringify(input),
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<CreateOutputType>(await result.text());
};

export const updateVariant = async (input: UpdateInputType, init?: RequestInit): Promise<UpdateOutputType> => {
  const result = await fetch("/_api/variants/update", {
    method: "POST", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: superjson.stringify(input),
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<UpdateOutputType>(await result.text());
};

export const deleteVariant = async (input: DeleteInputType, init?: RequestInit): Promise<DeleteOutputType> => {
  const result = await fetch("/_api/variants/delete", {
    method: "POST", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: superjson.stringify(input),
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<DeleteOutputType>(await result.text());
};

export const listVariants = async (input: ListInputType = {}, init?: RequestInit): Promise<ListOutputType> => {
  const params = new URLSearchParams();
  if (input.profileId) {params.append("profileId", input.profileId);}
  if (input.isPrimary !== undefined) {params.append("isPrimary", String(input.isPrimary));}
  const url = params.toString() ? `/_api/variants/list?${params.toString()}` : "/_api/variants/list";
  const result = await fetch(url, {
    method: "GET", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<ListOutputType>(await result.text());
};

export const getVariant = async (input: GetInputType, init?: RequestInit): Promise<GetOutputType> => {
  const result = await fetch(`/_api/variants/get?id=${input.id}`, {
    method: "GET", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<GetOutputType>(await result.text());
};

export const duplicateVariant = async (input: DuplicateInputType, init?: RequestInit): Promise<DuplicateOutputType> => {
  const result = await fetch("/_api/variants/duplicate", {
    method: "POST", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: superjson.stringify(input),
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<DuplicateOutputType>(await result.text());
};

export const setDefaultVariant = async (input: SetPrimaryInputType, init?: RequestInit): Promise<SetPrimaryOutputType> => {
  const result = await fetch("/_api/variants/setPrimary", {
    method: "POST", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: superjson.stringify(input),
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<SetPrimaryOutputType>(await result.text());
};
