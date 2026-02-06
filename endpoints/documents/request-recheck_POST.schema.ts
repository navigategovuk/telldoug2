import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  documentId: z.number().int().positive(),
  reason: z.string().min(2),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = { ok: true };

export async function postRequestDocumentRecheck(
  body: InputType,
  init?: RequestInit
): Promise<OutputType> {
  const result = await fetch(`/_api/documents/request-recheck`, {
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
    throw new Error((typeof parsed?.error === "string" ? parsed.error : parsed?.error?.message) ?? "Failed to request recheck");
  }
  const parsedBody = superjson.parse<any>(text);
  return (parsedBody && typeof parsedBody === "object" && "data" in parsedBody ? parsedBody.data : parsedBody) as OutputType;
}
