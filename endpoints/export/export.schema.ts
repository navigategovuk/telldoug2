/**
 * Export Endpoints Schema - PDF, DOCX, JSON, Markdown exports
 */

import { z } from "zod";
import superjson from "superjson";

export const exportSchema = z.object({
  variantId: z.string(),
  format: z.enum(["pdf", "docx", "json", "markdown", "html", "txt"]),
  snapshotId: z.string().optional(), // If not provided, uses current state
  templateId: z.string().optional(), // Override variant template
  options: z.object({
    includePhotos: z.boolean().optional().default(true),
    includeLinks: z.boolean().optional().default(true),
    paperSize: z.enum(["letter", "a4"]).optional().default("letter"),
    colorScheme: z.enum(["full", "minimal", "bw"]).optional().default("full"),
  }).optional().default({}),
});

export const previewSchema = z.object({
  variantId: z.string(),
  format: z.enum(["html"]),
  snapshotId: z.string().optional(),
});

export type ExportInputType = z.infer<typeof exportSchema>;
export type PreviewInputType = z.infer<typeof previewSchema>;

export type ExportOutputType = {
  success: boolean;
  format: string;
  filename: string;
  contentType: string;
  downloadUrl?: string; // For async generation
  content?: string; // For inline content (JSON, Markdown, TXT)
  base64?: string; // For binary content (PDF, DOCX)
};

export type PreviewOutputType = {
  success: boolean;
  html: string;
};

export const exportResume = async (input: ExportInputType, init?: RequestInit): Promise<ExportOutputType> => {
  const result = await fetch("/_api/export/generate", {
    method: "POST", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: superjson.stringify(input),
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<ExportOutputType>(await result.text());
};

export const previewResume = async (input: PreviewInputType, init?: RequestInit): Promise<PreviewOutputType> => {
  const result = await fetch("/_api/export/preview", {
    method: "POST", ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: superjson.stringify(input),
  });
  if (!result.ok) {throw new Error((superjson.parse<{ error: string }>(await result.text())).error);}
  return superjson.parse<PreviewOutputType>(await result.text());
};
