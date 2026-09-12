# DeployGuard

A small starter stack for deployment visibility: a Next.js dashboard, a TypeScript Node API, and PostgreSQL.

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