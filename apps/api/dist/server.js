"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const pg_1 = require("pg");
const port = Number(process.env.PORT ?? 4000);
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL ?? "postgresql://deployguard:deployguard@localhost:5432/deployguard"
});
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/health", async (_request, response) => {
    try {
        await pool.query("SELECT 1");
        response.json({ status: "ok", database: "connected" });
    }
    catch {
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
