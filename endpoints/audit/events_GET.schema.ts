import superjson from "superjson";

export type OutputType = {
  events: Array<{
    id: number;
    eventType: string;
    entityType: string | null;
    entityId: string | null;
    actorUserId: number | null;
    createdAt: string;
    metadata: unknown;
  }>;
};

export async function getAuditEvents(init?: RequestInit): Promise<OutputType> {
  const result = await fetch(`/_api/audit/events`, {
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
    throw new Error((typeof parsed?.error === "string" ? parsed.error : parsed?.error?.message) ?? "Failed to fetch audit events");
  }
  const parsedBody = superjson.parse<any>(text);
  return (parsedBody && typeof parsedBody === "object" && "data" in parsedBody ? parsedBody.data : parsedBody) as OutputType;
}
