import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  applicationId: z.number().int().positive(),
  body: z.string().min(1),
  recipientUserId: z.number().int().positive().optional(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = {
  messageId: number;
  moderationDecision: "approved" | "pending_review" | "blocked";
  visibility: "hidden" | "visible";
};

export async function postSendMessage(
  body: InputType,
  init?: RequestInit
): Promise<OutputType> {
  const result = await fetch(`/_api/messages/send`, {
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
    throw new Error((typeof parsed?.error === "string" ? parsed.error : parsed?.error?.message) ?? "Failed to send message");
  }

  const parsedBody = superjson.parse<any>(text);
  return (parsedBody && typeof parsedBody === "object" && "data" in parsedBody ? parsedBody.data : parsedBody) as OutputType;
}
