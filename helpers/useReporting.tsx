import { useQuery } from "@tanstack/react-query";
import { getAuditEvents } from "../endpoints/audit/events_GET.schema";
import { getOperationalMetrics } from "../endpoints/metrics/operational_GET.schema";
import { getSloMetrics } from "../endpoints/metrics/slo_GET.schema";

export const AUDIT_EVENTS_QUERY_KEY = ["audit", "events"] as const;
export const METRICS_QUERY_KEY = ["metrics", "operational"] as const;
export const SLO_METRICS_QUERY_KEY = ["metrics", "slo"] as const;

export function useAuditEvents() {
  return useQuery({
    queryKey: AUDIT_EVENTS_QUERY_KEY,
    queryFn: () => getAuditEvents(),
  });
}

export function useOperationalMetrics() {
  return useQuery({
    queryKey: METRICS_QUERY_KEY,
    queryFn: () => getOperationalMetrics(),
  });
}

export function useSloMetrics(windowMinutes = 15) {
  return useQuery({
    queryKey: [...SLO_METRICS_QUERY_KEY, windowMinutes],
    queryFn: () => getSloMetrics({ windowMinutes }),
  });
}
