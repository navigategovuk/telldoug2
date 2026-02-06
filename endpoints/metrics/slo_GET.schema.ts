import superjson from "superjson";
import { SloWindow } from "../../contracts/platformTypes";

export type OutputType = {
  status: "healthy" | "breach";
  slo: SloWindow;
  thresholds: {
    p95LatencyMsMax: number;
    errorRateMax: number;
    queueDelayMinutesMax: number;
  };
  breaches: {
    p95Latency: boolean;
    errorRate: boolean;
    queueDelay: boolean;
  };
  timestamp: string;
};

export async function getSloMetrics(
  input: { windowMinutes?: number } = {},
  init?: RequestInit
): Promise<OutputType> {
  const params = new URLSearchParams();
  if (input.windowMinutes) {
    params.set("windowMinutes", String(input.windowMinutes));
  }

  const result = await fetch(`/_api/metrics/slo?${params.toString()}`, {
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
        "Failed to load SLO metrics"
    );
  }

  const parsedBody = superjson.parse<any>(text);
  return (parsedBody && typeof parsedBody === "object" && "data" in parsedBody
    ? parsedBody.data
    : parsedBody) as OutputType;
}
