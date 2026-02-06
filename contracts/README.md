# API Contracts

This folder is the contract boundary for the active housing runtime.

- `apiEnvelope.ts` is the source of truth for the shared response envelope types.
- `platformTypes.ts` defines shared internal types for dependency health, release markers, SLO windows, and autonomy run summaries.
- `housing-api.contract.snapshot.json` is a generated route + handler + client-schema snapshot.
- `openapi.housing.v1.json` is the generated OpenAPI-compatible contract artifact.

When routes change in `endpoints/` or `server.ts`, regenerate snapshots so CI keeps contracts frozen and auditable.
