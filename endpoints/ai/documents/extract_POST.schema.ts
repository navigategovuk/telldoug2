import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  documentId: z.number().int().positive().optional(),
  documentText: z.string().optional(),
  documentType: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = {
  summary: string;
  extractedFields: Record<string, string>;
  confidence: number;
  moderationDecision: "approved" | "pending_review" | "blocked";
  providerFallback?: boolean;
};

export async function postExtractDocument(
  body: InputType,
  init?: RequestInit
): Promise<OutputType> {
  const result = await fetch(`/_api/ai/documents/extract`, {
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
    throw new Error((typeof parsed?.error === "string" ? parsed.error : parsed?.error?.message) ?? "Document extraction failed");
  }

  const parsedBody = superjson.parse<any>(text);
  return (parsedBody && typeof parsedBody === "object" && "data" in parsedBody ? parsedBody.data : parsedBody) as OutputType;
}
