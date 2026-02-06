import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";

const args = process.argv.slice(2);
const getArg = (name, fallback = null) => {
  const idx = args.indexOf(name);
  if (idx === -1) return fallback;
  return args[idx + 1] ?? fallback;
};

const policyPath = path.resolve(getArg("--policy", "autonomy/policy.yaml"));
const backlogPath = path.resolve(getArg("--backlog", "autonomy/backlog/phase2-quality-safety.yaml"));
const outputPath = getArg("--output");

const policy = parse(fs.readFileSync(policyPath, "utf8"));
const backlog = parse(fs.readFileSync(backlogPath, "utf8"));

const rank = { low: 1, medium: 2, high: 3 };
const unrank = { 1: "low", 2: "medium", 3: "high" };

let maxRank = rank[backlog.risk] ?? 1;
for (const task of backlog.tasks ?? []) {
  const taskRank = rank[task.risk] ?? 1;
  if (taskRank > maxRank) {
    maxRank = taskRank;
  }
}

const risk = unrank[maxRank];
const retryPolicy = policy.autonomous_retry ?? {};
const retryMap = {
  low: Number(retryPolicy.low_risk_failures?.max_attempts ?? 0),
  medium: Number(retryPolicy.medium_risk_failures?.max_attempts ?? 0),
  high: Number(retryPolicy.high_risk_failures?.max_attempts ?? 0),
};

const escalationRules = policy.escalation_rules ?? [];
const matchedEscalations = escalationRules.filter((rule) => {
  const expected = String(rule?.when?.risk ?? "").toLowerCase();
  return expected.includes(risk);
});

const result = {
  generatedAt: new Date().toISOString(),
  backlogId: backlog.id,
  backlogTitle: backlog.title,
  risk,
  maxRetries: retryMap[risk],
  requireHumanGate: risk === "high",
  escalationActions: matchedEscalations.map((rule) => ({
    id: rule.id,
    action: rule.action,
  })),
  acceptanceChecks: (backlog.tasks ?? []).flatMap((task) =>
    (task.acceptance_checks ?? []).map((check) => ({ taskId: task.id, check }))
  ),
};

if (outputPath) {
  const outFile = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`Wrote ${path.relative(process.cwd(), outFile)}`);
} else {
  console.log(JSON.stringify(result, null, 2));
}
