import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const getArg = (name, fallback = null) => {
  const idx = args.indexOf(name);
  if (idx === -1) return fallback;
  return args[idx + 1] ?? fallback;
};

const outputDir = path.resolve(getArg("--output", "autonomy-artifacts"));
const backlogId = getArg("--backlog", "unknown");
const risk = getArg("--risk", "low");
const attempts = Number(getArg("--attempts", "1"));
const success = String(getArg("--success", "true")) === "true";

fs.mkdirSync(outputDir, { recursive: true });

const timestamp = new Date().toISOString();
const runSummary = {
  backlogId,
  risk,
  attemptCount: attempts,
  success,
  generatedAt: timestamp,
};

const acceptanceResults = {
  backlogId,
  checks: [],
  generatedAt: timestamp,
};

fs.writeFileSync(path.join(outputDir, "run-summary.json"), `${JSON.stringify(runSummary, null, 2)}\n`);
fs.writeFileSync(
  path.join(outputDir, "acceptance-results.json"),
  `${JSON.stringify(acceptanceResults, null, 2)}\n`
);
