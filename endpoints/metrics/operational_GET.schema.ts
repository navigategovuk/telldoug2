import superjson from "superjson";

export type OutputType = {
  applicationsByStatus: Array<{ status: string; count: number }>;
  pendingModeration: number;
  openCases: number;
  avgCaseAgeHours: number;
};

export async function getOperationalMetrics(init?: RequestInit): Promise<OutputType> {
  const result = await fetch(`/_api/metrics/operational`, {
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
    throw new Error((typeof parsed?.error === "string" ? parsed.error : parsed?.error?.message) ?? "Failed to fetch operational metrics");
  }
  const parsedBody = superjson.parse<any>(text);
  return (parsedBody && typeof parsedBody === "object" && "data" in parsedBody ? parsedBody.data : parsedBody) as OutputType;
}
