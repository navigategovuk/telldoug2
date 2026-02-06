# API Deprecation Policy

1. Legacy creator-era endpoints are removed from source during stabilization phases.
2. Endpoints not listed in `server.ts` and not present in `contracts/housing-api.contract.snapshot.json` are not supported.
3. Contract changes require:
   - updated endpoint handler + schema wrapper
   - regenerated `contracts/housing-api.contract.snapshot.json`
   - regenerated `contracts/openapi.housing.v1.json`
   - `npm run contracts:generate` output committed in the same PR
4. Breaking path/method changes require explicit migration notes in the PR summary.
