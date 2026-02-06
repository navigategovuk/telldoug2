import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  applicationId: z.number().int().positive().optional(),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().int().positive(),
  storageKey: z.string().min(1),
  extractedText: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = { documentId: number; moderationDecision: "approved" | "pending_review" | "blocked" };

export async function postAttachDocument(
  body: InputType,
  init?: RequestInit
): Promise<OutputType> {
  const result = await fetch(`/_api/documents/attach`, {
    method: "POST",
    body: superjson.stringify(schema.parse(body)),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });
  const text = await result.text();
  if (!result.ok) {
    const parsed = text ? superjson.parse<any>(text) : null;
    throw new Error((typeof parsed?.error === "string" ? parsed.error : parsed?.error?.message) ?? "Failed to attach document");
  }
  const parsedBody = superjson.parse<any>(text);
  return (parsedBody && typeof parsedBody === "object" && "data" in parsedBody ? parsedBody.data : parsedBody) as OutputType;
}
