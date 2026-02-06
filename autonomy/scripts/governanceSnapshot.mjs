import fs from "node:fs";
import path from "node:path";

const outDir = path.resolve("autonomy-artifacts");
fs.mkdirSync(outDir, { recursive: true });

function readJsonIfPresent(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

const triage = readJsonIfPresent(path.resolve("autonomy-artifacts/moderation-triage.json"));
const assistantQuality = readJsonIfPresent(path.resolve("autonomy-artifacts/assistant-quality.json"));
const runSummary = readJsonIfPresent(path.resolve("autonomy-artifacts/run-summary.json"));
const riskReport = readJsonIfPresent(path.resolve("autonomy-artifacts/risk-report.json"));

const pendingModerationVolume = triage?.itemCount ?? "unknown";
const highRiskQueue = triage?.summary?.highRisk ?? "unknown";
const citationRate =
  assistantQuality?.citationCompletenessRate === null ||
  assistantQuality?.citationCompletenessRate === undefined
    ? "unknown"
    : `${(assistantQuality.citationCompletenessRate * 100).toFixed(2)}%`;
const refusalRate =
  assistantQuality?.refusalPolicyComplianceRate === null ||
  assistantQuality?.refusalPolicyComplianceRate === undefined
    ? "unknown"
    : `${(assistantQuality.refusalPolicyComplianceRate * 100).toFixed(2)}%`;

const markdown = `# Governance Snapshot

Generated: ${new Date().toISOString()}

## Moderation
- Pending moderation volume: ${pendingModerationVolume}
- High-risk items requiring human gate: ${highRiskQueue}

## Assistant quality
- Citation completeness: ${citationRate}
- Refusal policy compliance: ${refusalRate}

## Autonomous run state
- Last run backlog: ${runSummary?.backlogId ?? "unknown"}
- Last run risk: ${runSummary?.risk ?? riskReport?.risk ?? "unknown"}
- Last run success: ${String(runSummary?.success ?? "unknown")}

## Notes
- High-risk moderation decisions remain human-gated.
- Missing telemetry fields indicate data sources are not yet connected in this environment.
`;

fs.writeFileSync(path.join(outDir, "governance-snapshot.md"), markdown);
console.log("Wrote autonomy-artifacts/governance-snapshot.md");
