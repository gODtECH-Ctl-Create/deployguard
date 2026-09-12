# DeployGuard

DeployGuard is a Forge test product for deployment visibility: a small operational dashboard backed by a TypeScript API and PostgreSQL incident storage.

> Built with **gODtECH FORGE** - Framework for Orchestrated Reasoning, Governance & Engineering.

## Why this project exists

DeployGuard is the working proof point for applying FORGE to a real product workflow. It gives the framework a concrete surface on which to prove that structured context, staged delivery, provenance, and verification can improve an AI-assisted build without hiding the product's unfinished edges.

The product is intentionally small. Its current job is to make deployment incidents visible and manageable while making the development process inspectable. It is not yet a production incident-management platform, and this repository does not claim production adoption, uptime, or user research results.

## Forge integration

FORGE was initialized on September 10, 2026, with version 0.6.0 and remains recorded in `.forge/manifest.yaml`. The integration adds a project operating layer around the application code:

1. Human intent is captured as a scoped task.
2. The agent loads relevant project context, workflow rules, policies, and verification guidance.
3. Decisions and work packets are recorded under `.forge/`.
4. Implementation stays on a dedicated delivery branch and is checked against the affected surface.
5. The README and project state are refreshed as the product changes.

The result is a traceable path from framework bootstrap to a working product slice. The full process, impact assessment, metric definitions, and evidence sources are documented in [Forge integration and impact](docs/FORGE-INTEGRATION.md).

## Milestones and impact

| Milestone | Evidence | Impact |
| --- | --- | --- |
| Forge initialized | `5b863c4`, `.forge/manifest.yaml` | Added governed context, provenance, workflow, policy, and verification surfaces. |
| DeployGuard baseline established | `ab59830` | Created the Next.js, TypeScript API, PostgreSQL, and Docker Compose product foundation. |
| Incident lifecycle delivered | `b307391` | Added persisted incident CRUD, boundary validation, resolution timestamps, and isolated API tests. |

The measurable result so far is a verified backend slice rather than a production performance claim: five incident endpoints, four severity values, three status values, one PostgreSQL-backed repository, and three focused API tests covering health, validation and the incident lifecycle.

## Run locally with Docker Compose

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000) for the dashboard. The API is available at [http://localhost:4000](http://localhost:4000), with health information at [http://localhost:4000/health](http://localhost:4000/health).

## Incident API

The API now provides a PostgreSQL-backed incident lifecycle under `/incidents`:

- `POST /incidents` creates an incident.
- `GET /incidents` lists incidents, and `GET /incidents/:id` returns one incident.
- `PATCH /incidents/:id` updates an incident.
- `DELETE /incidents/:id` removes an incident.

Incident input is validated at the HTTP boundary. Severity accepts `low`, `medium`, `high`, or `critical`; status accepts `open`, `investigating`, or `resolved`. Resolving an incident records `resolved_at`, and the API creates the `incidents` table during startup when it does not already exist.

The route layer is separated from the repository so it can be tested without a live database. API tests cover creation, retrieval, updates, deletion, validation errors, missing records, and resolution timestamps:

```bash
npm run test --workspace=@deployguard/api
```

To run the applications directly, install Node.js 22+, start PostgreSQL, and run:

```bash
npm install
npm run dev
```

## Current status

**Working benchmark slice.** The API build, typecheck, and focused tests are available locally. The web dashboard and Docker Compose path are present, while authentication, authorization, migrations, production observability, and deployment automation remain outside the current scope.

## Project map

```text
apps/api/       Express API, PostgreSQL repository, and Vitest tests
apps/web/       Next.js dashboard
.forge/         FORGE context, workflows, policies, provenance, and run records
docs/           Product and Forge integration documentation
docker-compose.yml
```