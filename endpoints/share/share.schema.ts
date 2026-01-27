/**
 * Share Endpoints Schema - PublicShareLinks
 * 
 * Actual schema fields from publicShareLinks:
 * - id (generated)
 * - resumeVariantId (required)
 * - snapshotId (optional)
 * - token (required - unique access token)
 * - label (optional)
 * - expiresAt (optional)
 * - passwordHash (optional - for password protection)
 * - isLive (generated default true)
 * - isRevoked (generated default false)
 * - viewCount (generated default 0)
 * - lastViewedAt (optional)
 * - createdAt (generated)
 */

import { z } from "zod";
import superjson from "superjson";
import type { Selectable } from "kysely";
import type { PublicShareLinks } from "../../helpers/schema";

const shareLinkSchema = z.object({
  resumeVariantId: z.string(),
  snapshotId: z.string().optional().nullable(),
  label: z.string().max(100).optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  password: z.string().min(4).max(50).optional().nullable(), // Will be hashed before storage
});

export const createSchema = shareLinkSchema;
export const updateSchema = z.object({
  id: z.string(),
  label: z.string().max(100).optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  password: z.string().min(4).max(50).optional().nullable(),
  isLive: z.boolean().optional(),
});
export const deleteSchema = z.object({ id: z.string() });
export const revokeSchema = z.object({ id: z.string() });
export const listSchema = z.object({ resumeVariantId: z.string().optional() });
export const viewSchema = z.object({ token: z.string(), password: z.string().optional() });

export type CreateInputType = z.infer<typeof createSchema>;
export type UpdateInputType = z.infer<typeof updateSchema>;
export type DeleteInputType = z.infer<typeof deleteSchema>;
export type RevokeInputType = z.infer<typeof revokeSchema>;
export type ListInputType = z.infer<typeof listSchema>;
export type ViewInputType = z.infer<typeof viewSchema>;

export type ShareLinkOutput = Selectable<PublicShareLinks>;

export type CreateOutputType = { shareLink: ShareLinkOutput; created: boolean; shareUrl: string };
export type UpdateOutputType = { shareLink: ShareLinkOutput; updated: boolean };
export type DeleteOutputType = { deleted: boolean; id: string };
export type RevokeOutputType = { revoked: boolean; id: string };
export type ListOutputType = { shareLinks: ShareLinkOutput[] };
export type ViewOutputType = { shareLink: ShareLinkOutput; resumeHtml: string };

export const createShareLink = async (input: CreateInputType, init?: RequestInit): Promise<CreateOutputType> => {
  const result = await fetch("/_api/share/create", {
    method: "POST", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: superjson.stringify(input),
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<CreateOutputType>(await result.text());
};

export const updateShareLink = async (input: UpdateInputType, init?: RequestInit): Promise<UpdateOutputType> => {
  const result = await fetch("/_api/share/update", {
    method: "POST", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: superjson.stringify(input),
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<UpdateOutputType>(await result.text());
};

export const deleteShareLink = async (input: DeleteInputType, init?: RequestInit): Promise<DeleteOutputType> => {
  const result = await fetch("/_api/share/delete", {
    method: "POST", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: superjson.stringify(input),
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<DeleteOutputType>(await result.text());
};

export const revokeShareLink = async (input: RevokeInputType, init?: RequestInit): Promise<RevokeOutputType> => {
  const result = await fetch("/_api/share/revoke", {
    method: "POST", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: superjson.stringify(input),
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<RevokeOutputType>(await result.text());
};

export const listShareLinks = async (input: ListInputType = {}, init?: RequestInit): Promise<ListOutputType> => {
  const params = new URLSearchParams();
  if (input.resumeVariantId) {params.append("resumeVariantId", input.resumeVariantId);}
  const url = params.toString() ? `/_api/share/list?${params.toString()}` : "/_api/share/list";
  const result = await fetch(url, {
    method: "GET", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<ListOutputType>(await result.text());
};

export const viewShareLink = async (input: ViewInputType, init?: RequestInit): Promise<ViewOutputType> => {
  const params = new URLSearchParams({ token: input.token });
  if (input.password) {params.append("password", input.password);}
  const result = await fetch(`/_api/share/view?${params.toString()}`, {
    method: "GET", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<ViewOutputType>(await result.text());
};
