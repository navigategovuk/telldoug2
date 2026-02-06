# Control Plane Unblock Runbook (Phase 0)

This runbook covers the external setup that cannot be completed purely from repository automation.

## 1. GitHub setup (`navigategovuk/telldoug2`)
1. Set `navigategovuk` as repository admin owner and keep contributor access for `ccoxuk`.
2. Create repository environments:
   - `dev`
   - `staging`
   - `production`
   - `high-risk-review`
3. Configure environment secrets:
   - `AWS_DEPLOY_ROLE_ARN`
   - `RELEASE_MANIFEST_SIGNING_KEY`
   - `RELEASE_MARKER_TOKEN`
   - `SEMGREP_APP_TOKEN`
   - `SENTRY_AUTH_TOKEN`
4. Configure environment variables:
   - `ECS_CLUSTER`
   - `ECS_SERVICE`
   - `SLO_ERROR_ALARM`
   - `SLO_P95_ALARM`
   - `RELEASE_VERSION`
   - `RELEASE_MARKER_ENDPOINT` (for deployment marker callback)
   - `RELEASE_MARKER_ORG_ID`
   - `RELEASE_MIGRATION_VERSION`
5. Branch protection:
   - Require `quality-gates` and `security-scans`.
   - Require status checks:
     - `contract_snapshot_up_to_date`
     - `build`
     - `test_unit`
     - `test_integration`
     - `test_accessibility`
     - `test_e2e`
     - `test_security`

## 2. AWS setup (`eu-west-2`)
1. Provision IAM OIDC role trusted by GitHub Actions.
2. Provision runtime components:
   - ECS Fargate cluster + services
   - RDS PostgreSQL
   - S3 document bucket
   - SQS queues
   - Secrets Manager entries
3. Provision CloudWatch alarms used by `deploy-prod.yml`:
   - Error rate alarm (`SLO_ERROR_ALARM`)
   - p95 latency alarm (`SLO_P95_ALARM`)
4. Configure billing budgets and threshold alerts.

## 3. Terraform Cloud
1. Create workspace and connect VCS repository.
2. Set `TF_API_TOKEN`.
3. Confirm remote state backend and plan/apply permissions.

## 4. Observability and incident tooling
1. Datadog:
   - Create service dashboards and SLOs.
2. Sentry:
   - Configure DSN and release integration token.
3. PagerDuty:
   - Configure service and routing key.

## 5. Release marker endpoint wiring
1. Set `RELEASE_MARKER_ENDPOINT` to the deployed API base URL plus:
   - `/_api/audit/release-marker`
2. Set `RELEASE_MARKER_TOKEN` in each environment.
3. Set `RELEASE_MARKER_ORG_ID` to the tenant organization id used for release audit markers.

## 6. Verification checklist
1. Run `release-candidate` workflow.
2. Run `deploy-dev` with a candidate image tag and verify marker write.
3. Run `deploy-staging` and verify marker write.
4. Run `deploy-prod` and confirm:
   - canary monitor runs
   - rollback path can execute
   - release marker is written on successful promotion.
