# Autonomous Delivery Runbook

## Goal
Execute low-risk development work end-to-end with deterministic artifacts, while enforcing a human final gate for high-risk moderation, policy, and security outcomes.

## Execution Order
1. Load `autonomy/policy.yaml`.
2. Validate backlog files via `npm run autonomy:validate-backlog`.
3. Select backlog file(s) from `autonomy/backlog/*.yaml`.
4. Run risk classification with `npm run autonomy:risk -- --backlog <file> --output autonomy-artifacts/risk-report.json`.
5. If classified as high risk, pause for human gate approval.
6. Create branch `codex/<backlog-id>-<timestamp>`.
7. Implement tasks in listed order.
8. Run verification suite:
   - `npm run contracts:generate`
   - `npm run build`
   - `npm run test:all`
9. Generate run artifacts:
   - `autonomy-artifacts/run-summary.json`
   - `autonomy-artifacts/risk-report.json`
   - `autonomy-artifacts/acceptance-results.json`
10. Open PR with:
   - summary
   - acceptance criteria results
   - unresolved escalations

## Rollback Rules
1. If build fails after retries, stop and mark task as blocked.
2. If a high-risk rule triggers (`autonomy/policy.yaml`), stop and require human review.
3. If contract snapshot diverges unexpectedly, stop and attach diff in PR report.
4. If release canary SLOs breach, trigger rollback to prior manifest.

## Guardrails
- Do not modify files outside `allowed_paths`.
- Do not execute forbidden operations.
- Do not auto-approve high-risk moderation outcomes.
- Do not publish policy changes without version snapshot + audit event.
