import superjson from "superjson";

export type OutputType = {
  items: Array<{
    id: number;
    targetType: string;
    targetId: string;
    decision: string;
    riskScore: number;
    createdAt: string;
  }>;
};

export async function getModerationQueue(init?: RequestInit): Promise<OutputType> {
  const result = await fetch(`/_api/moderation/queue`, {
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
    throw new Error((typeof parsed?.error === "string" ? parsed.error : parsed?.error?.message) ?? "Failed to fetch moderation queue");
  }

  const parsedBody = superjson.parse<any>(text);
  return (parsedBody && typeof parsedBody === "object" && "data" in parsedBody ? parsedBody.data : parsedBody) as OutputType;
}
