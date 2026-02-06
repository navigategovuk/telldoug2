export type HealthState = "ok" | "degraded" | "down";

export interface DependencyHealth {
  status: HealthState;
  detail?: string;
}

export interface ReleaseMarker {
  id: number;
  version: string;
  environment: string;
  commitSha: string;
  imageDigest: string;
  migrationVersion: string;
  metadata?: Record<string, unknown> | null;
}

export interface SloWindow {
  windowMinutes: number;
  sampleCount: number;
  p95LatencyMs: number;
  errorRate: number;
  pendingModerationAvgAgeMinutes: number;
}

export interface AutonomyRunSummary {
  backlogId: string;
  risk: "low" | "medium" | "high";
  attemptCount: number;
  success: boolean;
  generatedAt: string;
}
