import superjson from "superjson";

export type OutputType = {
  status: "ready";
  checks: {
    database: "ok";
  };
  timestamp: string;
};

export async function getReadiness(init?: RequestInit): Promise<OutputType> {
  const result = await fetch(`/_api/system/health/readiness`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await result.text();
  if (!result.ok) {
    const parsed = text ? superjson.parse<any>(text) : null;
    throw new Error(
      (typeof parsed?.error === "string" ? parsed.error : parsed?.error?.message) ??
        "Readiness check failed"
    );
  }

  const parsedBody = superjson.parse<any>(text);
  return (parsedBody && typeof parsedBody === "object" && "data" in parsedBody
    ? parsedBody.data
    : parsedBody) as OutputType;
}
