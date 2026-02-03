# TellDoug

Career management operating system - track your professional journey in one place.

## Features

- **Profile Management** - Multiple resume variants with JSON Resume export
- **Work History** - Jobs, projects, achievements with timeline view
- **Network** - People, interactions, relationships tracking
- **Skills** - Skill inventory with endorsements and growth tracking
- **LinkedIn Import** - Parse and import your LinkedIn data with duplicate detection
- **AI Assistant** - Query your career data, generate content drafts

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your database URL and secrets

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm run test` | Run tests (watch mode) |
| `npm run test:run` | Run tests once |
| `npm run lint` | Check code style |
| `npm run typecheck` | TypeScript validation |
| `npm run quality` | Run all checks (typecheck + lint + test) |

## Architecture

- **Frontend:** React 18 + Vite + TanStack Query
- **Backend:** Hono API endpoints with Zod validation
- **Database:** PostgreSQL via Kysely ORM
- **Auth:** JWT sessions + OAuth (Google, GitHub, LinkedIn)
- **Export:** JSON Resume, DOCX, PDF formats

## Environment Variables

See `.env.example` for required configuration:

- `FLOOT_DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Session encryption key
- `OPENAI_API_KEY` - For AI features (optional)
- OAuth credentials for social login (optional)

Generate secrets with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Test Coverage

- **97 tests passing** (2 skipped)
- Core helpers: duplicate detection, LinkedIn parser, import pipeline
- Smoke tests: auth flows, profile CRUD, import/export

## Version

**v1.0.0-beta** - Initial beta release

---

Made with [Floot](https://floot.dev)

## Deployment (Vercel)

The `vercel.yml` workflow deploys previews on pull requests and production on pushes/tags to `main`.

Required repository secrets:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Set the Vercel project build output to `dist` (or keep `vercel.json` as the source of truth).

