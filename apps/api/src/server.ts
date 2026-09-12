import { Pool } from "pg";
import { createApp } from "./app";
import { PostgresIncidentRepository } from "./incidents";

const port = Number(process.env.PORT ?? 4000);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgresql://deployguard:deployguard@localhost:5432/deployguard"
});

const repository = new PostgresIncidentRepository(pool);
const app = createApp(repository);

const server = app.listen(port, () => {
  console.log(`DeployGuard API listening on port ${port}`);
});

const initialize = async () => {
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    try {
      await repository.initialize();
      return;
    } catch (error) {
      if (attempt === 10) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};

initialize().catch((error) => {
  console.error("Unable to initialize database", error);
  server.close();
  void pool.end();
  process.exitCode = 1;
});

const shutdown = async () => {
  server.close();
  await pool.end();
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);