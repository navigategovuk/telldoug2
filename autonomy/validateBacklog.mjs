import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";

const root = process.cwd();
const backlogDir = path.join(root, "autonomy", "backlog");

const files = fs
  .readdirSync(backlogDir)
  .filter((name) => name.endsWith(".yaml") || name.endsWith(".yml"))
  .map((name) => path.join(backlogDir, name));

const errors = [];

for (const filePath of files) {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = parse(raw);
  const rel = path.relative(root, filePath);

  const requiredRoot = ["id", "title", "priority", "risk", "owner", "tasks"];
  for (const key of requiredRoot) {
    if (!(key in parsed)) {
      errors.push(`${rel}: missing root field '${key}'`);
    }
  }

  if (!Array.isArray(parsed.tasks) || parsed.tasks.length === 0) {
    errors.push(`${rel}: tasks must be a non-empty array`);
    continue;
  }

  parsed.tasks.forEach((task, index) => {
    const requiredTask = ["id", "title", "risk", "acceptance_checks", "rollback"];
    for (const key of requiredTask) {
      if (!(key in task)) {
        errors.push(`${rel}: task[${index}] missing field '${key}'`);
      }
    }

    if (!Array.isArray(task.acceptance_checks) || task.acceptance_checks.length === 0) {
      errors.push(`${rel}: task[${index}] acceptance_checks must be non-empty`);
    }

    if (!Array.isArray(task.rollback) || task.rollback.length === 0) {
      errors.push(`${rel}: task[${index}] rollback must be non-empty`);
    }

    if (!["low", "medium", "high"].includes(task.risk)) {
      errors.push(`${rel}: task[${index}] risk must be one of low|medium|high`);
    }
  });
}

if (errors.length > 0) {
  console.error("Backlog validation failed:");
  for (const err of errors) {
    console.error(` - ${err}`);
  }
  process.exit(1);
}

console.log(`Validated ${files.length} backlog file(s).`);
