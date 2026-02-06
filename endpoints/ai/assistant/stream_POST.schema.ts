import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  prompt: z.string().min(2),
  applicationId: z.number().int().positive().optional(),
});

export type InputType = z.infer<typeof schema>;

export async function postAssistantStream(
  body: InputType,
  init?: RequestInit
): Promise<Response> {
  const result = await fetch(`/_api/ai/assistant/stream`, {
    method: "POST",
    body: superjson.stringify(schema.parse(body)),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });

  if (!result.ok) {
    const text = await result.text();
    const parsed = text ? superjson.parse<any>(text) : null;
    throw new Error((typeof parsed?.error === "string" ? parsed.error : parsed?.error?.message) ?? "Assistant request failed");
  }

  return result;
}
