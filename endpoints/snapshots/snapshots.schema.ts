/**
 * Snapshot CRUD Endpoints Schema
 */

import { z } from "zod";
import superjson from "superjson";
import type { Selectable } from "kysely";
import type { VersionSnapshots } from "../../helpers/schema";

const snapshotSchema = z.object({
  resumeVariantId: z.string(),
  label: z.string().max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
  snapshotData: z.record(z.unknown()).default({}),
  versionNumber: z.number().optional(), // Auto-generated if not provided
});

export const createSchema = snapshotSchema;
export const listSchema = z.object({ resumeVariantId: z.string() });
export const getSchema = z.object({ id: z.string() });
export const deleteSchema = z.object({ id: z.string() });
export const restoreSchema = z.object({ id: z.string() });

export type CreateInputType = z.infer<typeof createSchema>;
export type ListInputType = z.infer<typeof listSchema>;
export type GetInputType = z.infer<typeof getSchema>;
export type DeleteInputType = z.infer<typeof deleteSchema>;
export type RestoreInputType = z.infer<typeof restoreSchema>;

export type SnapshotOutput = Selectable<VersionSnapshots>;
export type CreateOutputType = { snapshot: SnapshotOutput; created: boolean };
export type ListOutputType = { snapshots: SnapshotOutput[] };
export type GetOutputType = { snapshot: SnapshotOutput };
export type DeleteOutputType = { deleted: boolean; id: string };
export type RestoreOutputType = { restored: boolean; newSnapshot: SnapshotOutput };

export const createSnapshot = async (input: CreateInputType, init?: RequestInit): Promise<CreateOutputType> => {
  const result = await fetch("/_api/snapshots/create", {
    method: "POST", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: superjson.stringify(input),
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<CreateOutputType>(await result.text());
};

export const listSnapshots = async (input: ListInputType, init?: RequestInit): Promise<ListOutputType> => {
  const result = await fetch(`/_api/snapshots/list?resumeVariantId=${input.resumeVariantId}`, {
    method: "GET", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<ListOutputType>(await result.text());
};

export const getSnapshot = async (input: GetInputType, init?: RequestInit): Promise<GetOutputType> => {
  const result = await fetch(`/_api/snapshots/get?id=${input.id}`, {
    method: "GET", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<GetOutputType>(await result.text());
};

export const deleteSnapshot = async (input: DeleteInputType, init?: RequestInit): Promise<DeleteOutputType> => {
  const result = await fetch("/_api/snapshots/delete", {
    method: "POST", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: superjson.stringify(input),
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<DeleteOutputType>(await result.text());
};

export const restoreSnapshot = async (input: RestoreInputType, init?: RequestInit): Promise<RestoreOutputType> => {
  const result = await fetch("/_api/snapshots/restore", {
    method: "POST", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: superjson.stringify(input),
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<RestoreOutputType>(await result.text());
};
