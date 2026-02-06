import fs from "node:fs";
import path from "node:path";

const outDir = path.resolve("autonomy-artifacts");
fs.mkdirSync(outDir, { recursive: true });

const args = process.argv.slice(2);
const inputFlag = args.indexOf("--input");
const inputPath =
  inputFlag >= 0 && args[inputFlag + 1]
    ? path.resolve(args[inputFlag + 1])
    : path.resolve("reports/moderation-queue.json");

function normalizeItems(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => ({
      id: Number(item.id),
      targetType: String(item.targetType ?? "unknown"),
      targetId: String(item.targetId ?? ""),
      riskScore: Number(item.riskScore ?? 0),
      createdAt: item.createdAt ? String(item.createdAt) : null,
    }))
    .filter((item) => Number.isFinite(item.id) && Number.isFinite(item.riskScore));
}

function recommendationForRisk(riskScore) {
  if (riskScore >= 0.85) {
    return {
      riskBand: "high",
      suggestedDecision: "blocked",
      requiresHumanFinal: true,
      reason: "High-risk content should be manually adjudicated.",
    };
  }
  if (riskScore >= 0.6) {
    return {
      riskBand: "medium",
      suggestedDecision: "pending_review",
      requiresHumanFinal: true,
      reason: "Manual review required before publication.",
    };
  }
  return {
    riskBand: "low",
    suggestedDecision: "approved",
    requiresHumanFinal: false,
    reason: "Low-risk score within auto-triage recommendation threshold.",
  };
}

let items = [];
if (fs.existsSync(inputPath)) {
  const raw = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  items = normalizeItems(raw.items ?? raw);
}

const ranked = items
  .slice()
  .sort((a, b) => b.riskScore - a.riskScore)
  .map((item) => ({
    ...item,
    ...recommendationForRisk(item.riskScore),
  }));

const result = {
  generatedAt: new Date().toISOString(),
  mode: "guardrailed_recommendation",
  source: fs.existsSync(inputPath) ? path.relative(process.cwd(), inputPath) : null,
  itemCount: ranked.length,
  recommendations: ranked.slice(0, 200),
  summary: {
    highRisk: ranked.filter((item) => item.riskBand === "high").length,
    mediumRisk: ranked.filter((item) => item.riskBand === "medium").length,
    lowRisk: ranked.filter((item) => item.riskBand === "low").length,
  },
  notes: ["This job outputs triage recommendations only.", "High-risk outcomes are never auto-finalized."],
};

fs.writeFileSync(path.join(outDir, "moderation-triage.json"), `${JSON.stringify(result, null, 2)}\n`);
console.log("Wrote autonomy-artifacts/moderation-triage.json");
