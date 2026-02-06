import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve("autonomy-artifacts");
fs.mkdirSync(outputDir, { recursive: true });

function readJsonIfPresent(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

const assistantQuality = readJsonIfPresent(path.resolve("autonomy-artifacts/assistant-quality.json"));
const triage = readJsonIfPresent(path.resolve("autonomy-artifacts/moderation-triage.json"));
const runSummary = readJsonIfPresent(path.resolve("autonomy-artifacts/run-summary.json"));

const recommendations = [];

if (runSummary?.success === false) {
  recommendations.push(
    "Prioritize backlog tasks linked to the most recent failed autonomy run and add deterministic acceptance checks."
  );
}

if ((assistantQuality?.breaches?.citationCompleteness ?? false) === true) {
  recommendations.push(
    "Add a medium-risk task to enforce citation presence in assistant responses before publish."
  );
}

if ((assistantQuality?.breaches?.refusalCompliance ?? false) === true) {
  recommendations.push(
    "Add a high-risk policy task to tighten refusal templates for legal/eligibility decision requests."
  );
}

if ((triage?.summary?.highRisk ?? 0) > 0) {
  recommendations.push(
    "Add queue-capacity tasks to reduce high-risk moderation backlog and improve caseworker SLA coverage."
  );
}

if (recommendations.length === 0) {
  recommendations.push("No critical telemetry breaches detected. Continue low-risk automation throughput improvements.");
}

const report = `# Weekly Autonomy Backlog Recommendations\n\nGenerated: ${new Date().toISOString()}\n\n${recommendations
  .map((item, idx) => `${idx + 1}. ${item}`)
  .join("\n")}\n`;

fs.writeFileSync(path.join(outputDir, "backlog-recommendations.md"), report);
console.log("Wrote autonomy-artifacts/backlog-recommendations.md");
