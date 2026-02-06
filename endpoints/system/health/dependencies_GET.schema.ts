import superjson from "superjson";
import { DependencyHealth } from "../../../contracts/platformTypes";

export type OutputType = {
  status: "ready" | "degraded" | "down";
  dependencies: {
    db: DependencyHealth;
    storage: DependencyHealth;
    queue: DependencyHealth;
    aiProvider: DependencyHealth;
  };
  timestamp: string;
};

export async function getDependenciesHealth(init?: RequestInit): Promise<OutputType> {
  const result = await fetch(`/_api/system/health/dependencies`, {
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
    throw new Error(
      (typeof parsed?.error === "string" ? parsed.error : parsed?.error?.message) ??
        "Dependencies health check failed"
    );
  }

  const parsedBody = superjson.parse<any>(text);
  return (parsedBody && typeof parsedBody === "object" && "data" in parsedBody
    ? parsedBody.data
    : parsedBody) as OutputType;
}
