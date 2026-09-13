"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const app_1 = require("./app");
const incidents_1 = require("./incidents");
const port = Number(process.env.PORT ?? 4000);
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL ?? "postgresql://deployguard:deployguard@localhost:5432/deployguard"
});
const repository = new incidents_1.PostgresIncidentRepository(pool);
const app = (0, app_1.createApp)(repository);
const server = app.listen(port, () => {
    console.log(`DeployGuard API listening on port ${port}`);
});
const initialize = async () => {
    for (let attempt = 1; attempt <= 10; attempt += 1) {
        try {
            await repository.initialize();
            return;
        }
        catch (error) {
            if (attempt === 10)
                throw error;
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
