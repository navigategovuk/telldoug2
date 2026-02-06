import superjson from "superjson";

export type OutputType = {
  policy: {
    id: number;
    versionNumber: number;
    title: string;
    rules: unknown;
    isActive: boolean;
    createdAt: string;
  } | null;
};

export async function getCurrentPolicy(init?: RequestInit): Promise<OutputType> {
  const result = await fetch(`/_api/moderation/policy/current`, {
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
    throw new Error((typeof parsed?.error === "string" ? parsed.error : parsed?.error?.message) ?? "Failed to fetch current policy");
  }
  const parsedBody = superjson.parse<any>(text);
  return (parsedBody && typeof parsedBody === "object" && "data" in parsedBody ? parsedBody.data : parsedBody) as OutputType;
}
