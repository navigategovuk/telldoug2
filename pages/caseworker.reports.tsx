import React from "react";
import { useAuditEvents, useOperationalMetrics, useSloMetrics } from "../helpers/useReporting";

export default function CaseworkerReportsPage() {
  const { data: metrics } = useOperationalMetrics();
  const { data: audit } = useAuditEvents();
  const { data: slo } = useSloMetrics(15);

  return (
    <div>
      <h1>Operational Reports</h1>

      <h3>Metrics</h3>
      <p>Pending moderation: {metrics?.pendingModeration ?? 0}</p>
      <p>Open cases: {metrics?.openCases ?? 0}</p>
      <p>Average case age (hours): {metrics?.avgCaseAgeHours ?? 0}</p>

      <h4>Applications by Status</h4>
      <ul>
        {metrics?.applicationsByStatus.map((item) => (
          <li key={item.status}>{item.status}: {item.count}</li>
        ))}
      </ul>

      <h3>SLO Window (15 min)</h3>
      <p>Status: {slo?.status ?? "unknown"}</p>
      <p>p95 latency (ms): {slo?.slo.p95LatencyMs ?? 0}</p>
      <p>Error rate: {slo ? `${(slo.slo.errorRate * 100).toFixed(2)}%` : "0%"}</p>
      <p>Pending moderation avg age (minutes): {slo?.slo.pendingModerationAvgAgeMinutes ?? 0}</p>

      <h3>Recent Audit Events</h3>
      <ul>
        {audit?.events.slice(0, 25).map((event) => (
          <li key={event.id}>
            {event.createdAt} - {event.eventType} ({event.entityType ?? "-"} {event.entityId ?? "-"})
          </li>
        ))}
      </ul>
    </div>
  );
}
