# Housing Portal (AI-Moderated)

This project is a refactored Backroom scaffold for a UK-first affordable housing portal with:

- Multi-organization tenancy and role-based access (`applicant`, `caseworker`, `platform_admin`)
- Strict pre-publish moderation for application fields, messages, documents, and assistant prompts
- AI services for eligibility precheck, document extraction, and assistant guidance
- Case queue, moderation queue, policy versioning, and operational reporting

## Environment

Edit `env.json`:

- `FLOOT_DATABASE_URL`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `MFA_BYPASS_CODE` (dev helper)
- `OBJECT_STORAGE_BUCKET` (optional dependency health signal)
- `SQS_QUEUE_URL` (optional dependency health signal)
- `SLO_P95_LATENCY_MS_MAX`
- `SLO_ERROR_RATE_MAX`
- `SLO_QUEUE_DELAY_MINUTES_MAX`
- `RELEASE_MARKER_TOKEN` (required for workflow-driven release markers)
- `RELEASE_MARKER_ORG_ID` (fallback org id for service-token release markers)

## Run

```bash
npm install --legacy-peer-deps
npm run contracts:generate
npm run build
npm run start
```

App: `http://localhost:3333`

## API Surface

Implemented `_api` groups:

- `auth`, `orgs`
- `applicant`, `applications`
- `documents`, `messages`
- `cases`, `moderation`
- `ai`, `audit`, `metrics`
- `system` (`health/readiness`, `health/liveness`, `release/version`)

Additional internal endpoints:

- `GET /_api/system/health/dependencies`
- `POST /_api/audit/release-marker`
- `GET /_api/metrics/slo`

All JSON API routes use the same envelope shape:

- Success: `{ data, correlationId }`
- Error: `{ error: { code, message }, correlationId }`

## Contracts and Autonomy

- Frozen API artifacts are under `contracts/`:
  - `housing-api.contract.snapshot.json`
  - `openapi.housing.v1.json`
  - `deprecation-policy.md`
- Regenerate them with `npm run contracts:generate`.
- Autonomous delivery scaffolding lives in `autonomy/` and CI workflows under `.github/workflows/`.

## Test Suites

```bash
npm run test:unit
npm run test:integration
npm run test:accessibility
npm run test:e2e
npm run test:security
npm run test:all
```

## Infra and Deploy

- Terraform modules are under `infra/` (AWS `eu-west-2`).
- Release artifact and deployment workflows:
  - `.github/workflows/release-candidate.yml`
  - `.github/workflows/deploy-dev.yml`
  - `.github/workflows/deploy-staging.yml`
  - `.github/workflows/deploy-prod.yml`
  - `.github/workflows/control-plane-readiness.yml`
- Operational phase playbook: `docs/autonomous-delivery-playbook.md`
- External setup runbook: `docs/control-plane-unblock.md`
