import superjson from "superjson";

export type OutputType = {
  cases: Array<{
    id: number;
    applicationId: number;
    status: string;
    priority: string;
    slaDueAt: string | null;
    applicantName: string;
    assignedCaseworkerUserId: number | null;
  }>;
};

export async function getCaseQueue(init?: RequestInit): Promise<OutputType> {
  const result = await fetch(`/_api/cases/queue`, {
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
    throw new Error((typeof parsed?.error === "string" ? parsed.error : parsed?.error?.message) ?? "Failed to fetch case queue");
  }

  const parsedBody = superjson.parse<any>(text);
  return (parsedBody && typeof parsedBody === "object" && "data" in parsedBody ? parsedBody.data : parsedBody) as OutputType;
}
