import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  moderationItemId: z.number().int().positive(),
  decision: z.enum(["approved", "pending_review", "blocked"]),
  reason: z.string().min(2),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = { ok: true };

export async function postModerationDecision(body: InputType, init?: RequestInit): Promise<OutputType> {
  const result = await fetch(`/_api/moderation/decision`, {
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
    throw new Error((typeof parsed?.error === "string" ? parsed.error : parsed?.error?.message) ?? "Failed to submit moderation decision");
  }
  const parsedBody = superjson.parse<any>(text);
  return (parsedBody && typeof parsedBody === "object" && "data" in parsedBody ? parsedBody.data : parsedBody) as OutputType;
}
