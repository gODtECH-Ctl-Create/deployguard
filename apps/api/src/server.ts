import cors from "cors";
import express from "express";
import { Pool } from "pg";

const port = Number(process.env.PORT ?? 4000);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgresql://deployguard:deployguard@localhost:5432/deployguard"
});

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", async (_request, response) => {
  try {
    await pool.query("SELECT 1");
    response.json({ status: "ok", database: "connected" });
  } catch {
    response.status(503).json({ status: "degraded", database: "unavailable" });
  }
});

app.get("/", (_request, response) => {
  response.json({ name: "DeployGuard API", version: "0.1.0" });
});

const server = app.listen(port, () => {
  console.log(`DeployGuard API listening on port ${port}`);
});

const shutdown = async () => {
  server.close();
  await pool.end();
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);