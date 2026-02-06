import superjson from "superjson";
import { Selectable } from "kysely";
import { Messages } from "../../helpers/schema";

export type OutputType = { messages: Selectable<Messages>[] };

export async function getMessageThread(
  applicationId?: number,
  init?: RequestInit
): Promise<OutputType> {
  const url = applicationId
    ? `/_api/messages/thread?applicationId=${applicationId}`
    : `/_api/messages/thread`;

  const result = await fetch(url, {
    method: "GET",
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
    throw new Error((typeof parsed?.error === "string" ? parsed.error : parsed?.error?.message) ?? "Failed to fetch messages");
  }

  const parsedBody = superjson.parse<any>(text);
  return (parsedBody && typeof parsedBody === "object" && "data" in parsedBody ? parsedBody.data : parsedBody) as OutputType;
}
