# Autonomous Delivery Playbook (Phases 2-5)

## Platform Baseline
- Source control and planning: GitHub Repos + Issues + Projects
- CI/CD and autonomous runs: GitHub Actions
- Container registry: GHCR
- Cloud runtime: AWS eu-west-2
- Runtime services: ECS Fargate, RDS PostgreSQL, S3, SQS, Secrets Manager
- Observability: Datadog + Sentry
- Security scans: CodeQL + Trivy + Semgrep
- Incident management: PagerDuty

## Phase 2 Checklist (Quality + Safety)
1. Run `npm run test:all` in CI.
2. Keep unit coverage threshold at 80%+ for core moderation/policy/permission helpers.
3. Maintain integration tests for tenant-isolation and RBAC guard markers.
4. Maintain accessibility trust checks for all applicant journeys.
4. Maintain e2e flow tests for applicant/caseworker/moderation override.
5. Maintain security tests for lockout and malicious upload rejection.

## Phase 3 Checklist (Autonomous Dev Control Loop)
1. Validate backlog schema with `npm run autonomy:validate-backlog`.
2. Classify risk using `npm run autonomy:risk`.
3. Use `.github/workflows/autonomy-runner.yml` for plan->implement->verify runs.
4. Require human gate approval for high-risk runs.
5. Persist deterministic artifacts in `autonomy-artifacts/`.

## Phase 4 Checklist (Release + Rollback)
1. Use `release-candidate` workflow to build image and signed manifest.
2. Promote via `deploy-dev`, `deploy-staging`, then `deploy-prod`.
3. Monitor canary alarm signals in production.
4. Auto-rollback when latency/error alarms breach.
5. Validate Terraform modules under `infra/` before rollout.

## Phase 5 Checklist (Guardrailed Operations)
1. Run scheduled moderation triage recommendation job.
2. Run assistant quality monitor job.
3. Run weekly self-improvement recommendation job.
4. Run governance snapshot workflow.
5. Keep high-risk decisions human-approved only.

## Operator Actions
1. Configure GitHub environment secrets and variables for dev/staging/production.
2. Configure AWS OIDC deploy role and repository trust.
3. Configure Datadog, Sentry, PagerDuty service credentials.
4. Define SLO thresholds:
   - p95 latency max
   - error rate max
   - moderation queue delay max
5. Define production approvers for high-risk autonomy and deploy gates.
6. Follow `docs/control-plane-unblock.md` for full external control-plane setup.
7. Run `.github/workflows/control-plane-readiness.yml` for each environment before deployment.
