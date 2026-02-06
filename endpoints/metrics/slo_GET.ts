import { requireAnyRole } from "../../helpers/authorize";
import { db } from "../../helpers/db";
import { handleEndpointError } from "../../helpers/endpointError";
import { jsonResponse } from "../../helpers/http";
import { SloWindow } from "../../contracts/platformTypes";

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) {
    return 0;
  }
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

export async function handle(request: Request) {
  try {
    const ctx = await requireAnyRole(request, ["caseworker", "platform_admin"]);
    const url = new URL(request.url);
    const windowMinutes = Math.min(
      1440,
      Math.max(5, Number(url.searchParams.get("windowMinutes") ?? 15))
    );
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

    const [runs, pendingModerationItems] = await Promise.all([
      db
        .selectFrom("aiRuns")
        .select(["latencyMs", "outcome", "createdAt"])
        .where("organizationId", "=", ctx.activeOrganizationId)
        .where("createdAt", ">=", windowStart)
        .execute(),
      db
        .selectFrom("moderationItems")
        .select(["createdAt"])
        .where("organizationId", "=", ctx.activeOrganizationId)
        .where("decision", "=", "pending_review")
        .execute(),
    ]);

    const latencies = runs
      .map((row) => Number(row.latencyMs ?? 0))
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((a, b) => a - b);

    const errorRuns = runs.filter((row) => {
      const outcome = String(row.outcome ?? "").toLowerCase();
      return outcome.includes("error") || outcome.includes("fail");
    });

    const pendingModerationAvgAgeMinutes =
      pendingModerationItems.length === 0
        ? 0
        : pendingModerationItems.reduce((sum, row) => {
            const createdAt = new Date(row.createdAt as any).getTime();
            return sum + (Date.now() - createdAt) / 60000;
          }, 0) / pendingModerationItems.length;

    const slo: SloWindow = {
      windowMinutes,
      sampleCount: runs.length,
      p95LatencyMs: Math.round(percentile(latencies, 95)),
      errorRate: runs.length === 0 ? 0 : errorRuns.length / runs.length,
      pendingModerationAvgAgeMinutes: Number(pendingModerationAvgAgeMinutes.toFixed(2)),
    };

    const thresholds = {
      p95LatencyMsMax: Number(process.env.SLO_P95_LATENCY_MS_MAX ?? 2000),
      errorRateMax: Number(process.env.SLO_ERROR_RATE_MAX ?? 0.02),
      queueDelayMinutesMax: Number(process.env.SLO_QUEUE_DELAY_MINUTES_MAX ?? 60),
    };

    const breaches = {
      p95Latency: slo.p95LatencyMs > thresholds.p95LatencyMsMax,
      errorRate: slo.errorRate > thresholds.errorRateMax,
      queueDelay: slo.pendingModerationAvgAgeMinutes > thresholds.queueDelayMinutesMax,
    };

    const status = Object.values(breaches).some(Boolean) ? "breach" : "healthy";

    return jsonResponse({
      status,
      slo,
      thresholds,
      breaches,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleEndpointError(error);
  }
}
