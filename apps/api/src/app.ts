import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { IncidentRepository, validateIncidentInput } from "./incidents";

export type AppOptions = {
  apiKey?: string;
};

function readApiKey(request: Request): string | null {
  const headerKey = request.header("x-api-key");
  if (headerKey) return headerKey;

  const authorization = request.header("authorization");
  const bearer = authorization?.match(/^Bearer\s+(.+)$/i);
  return bearer?.[1] ?? null;
}

function routeParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] : value ?? "";
}

function requireApiKey(configuredApiKey?: string) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!configuredApiKey) {
      return response.status(503).json({ error: "Incident write API key is not configured" });
    }

    if (readApiKey(request) !== configuredApiKey) {
      return response.status(401).json({ error: "Valid API key required" });
    }

    return next();
  };
}

export function createApp(repository: IncidentRepository, options: AppOptions = {}): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());
  const protectIncidentWrite = requireApiKey(options.apiKey);

  app.get("/health", async (_request, response) => {
    try {
      await repository.initialize();
      response.json({ status: "ok", database: "connected" });
    } catch {
      response.status(503).json({ status: "degraded", database: "unavailable" });
    }
  });

  app.get("/", (_request, response) => response.json({ name: "DeployGuard API", version: "0.1.0" }));

  app.post("/incidents", protectIncidentWrite, async (request, response) => {
    const error = validateIncidentInput(request.body);
    if (error) return response.status(400).json({ error });
    return response.status(201).json(await repository.create(request.body));
  });

  app.get("/incidents", async (_request, response) => response.json(await repository.list()));

  app.get("/incidents/:id", async (request, response) => {
    const incident = await repository.get(routeParam(request.params.id));
    return incident ? response.json(incident) : response.status(404).json({ error: "Incident not found" });
  });

  app.get("/incidents/:id/audit", async (request, response) => {
    const id = routeParam(request.params.id);
    const incident = await repository.get(id);
    if (!incident) return response.status(404).json({ error: "Incident not found" });
    return response.json(await repository.listAuditEvents(id));
  });

  app.patch("/incidents/:id", protectIncidentWrite, async (request, response) => {
    const error = validateIncidentInput(request.body, true);
    if (error) return response.status(400).json({ error });
    const incident = await repository.update(routeParam(request.params.id), request.body);
    return incident ? response.json(incident) : response.status(404).json({ error: "Incident not found" });
  });

  app.delete("/incidents/:id", protectIncidentWrite, async (request, response) => {
    const deleted = await repository.delete(routeParam(request.params.id));
    return deleted ? response.status(204).send() : response.status(404).json({ error: "Incident not found" });
  });

  return app;
}
