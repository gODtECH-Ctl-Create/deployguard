# DeployGuard

A small starter stack for deployment visibility: a Next.js dashboard, a TypeScript Node API, and PostgreSQL.

## Run locally with Docker Compose

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000) for the dashboard. The API is available at [http://localhost:4000](http://localhost:4000), with health information at [http://localhost:4000/health](http://localhost:4000/health).

To run the applications directly, install Node.js 22+, start PostgreSQL, and run:

```bash
npm install
npm run dev
```