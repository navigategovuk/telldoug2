import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  title: z.string().min(3),
  rules: z.record(z.any()),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = { ok: true; versionNumber: number };

export async function postPublishPolicy(body: InputType, init?: RequestInit): Promise<OutputType> {
  const result = await fetch(`/_api/moderation/policy/publish`, {
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
    throw new Error((typeof parsed?.error === "string" ? parsed.error : parsed?.error?.message) ?? "Failed to publish policy");
  }
  const parsedBody = superjson.parse<any>(text);
  return (parsedBody && typeof parsedBody === "object" && "data" in parsedBody ? parsedBody.data : parsedBody) as OutputType;
}
