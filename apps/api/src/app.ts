import cors from "cors";
import express, { type Express } from "express";
import { IncidentRepository, validateIncidentInput } from "./incidents";

export function createApp(repository: IncidentRepository): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", async (_request, response) => {
    try {
      await repository.initialize();
      response.json({ status: "ok", database: "connected" });
    } catch {
      response.status(503).json({ status: "degraded", database: "unavailable" });
    }
  });

  app.get("/", (_request, response) => response.json({ name: "DeployGuard API", version: "0.1.0" }));

  app.post("/incidents", async (request, response) => {
    const error = validateIncidentInput(request.body);
    if (error) return response.status(400).json({ error });
    return response.status(201).json(await repository.create(request.body));
  });

  app.get("/incidents", async (_request, response) => response.json(await repository.list()));

  app.get("/incidents/:id", async (request, response) => {
    const incident = await repository.get(request.params.id);
    return incident ? response.json(incident) : response.status(404).json({ error: "Incident not found" });
  });

  app.patch("/incidents/:id", async (request, response) => {
    const error = validateIncidentInput(request.body, true);
    if (error) return response.status(400).json({ error });
    const incident = await repository.update(request.params.id, request.body);
    return incident ? response.json(incident) : response.status(404).json({ error: "Incident not found" });
  });

  app.delete("/incidents/:id", async (request, response) => {
    const deleted = await repository.delete(request.params.id);
    return deleted ? response.status(204).send() : response.status(404).json({ error: "Incident not found" });
  });

  return app;
}