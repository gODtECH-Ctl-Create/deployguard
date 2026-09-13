import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { type CreateIncidentInput, type Incident, type IncidentRepository, type UpdateIncidentInput } from "../src/incidents";

class MemoryIncidentRepository implements IncidentRepository {
  incidents: Incident[] = [];
  async initialize() {}
  async create(input: CreateIncidentInput) {
    const incident: Incident = { ...input, status: input.status ?? "open", id: crypto.randomUUID(), created_at: new Date().toISOString(), resolved_at: null };
    this.incidents.push(incident);
    return incident;
  }
  async list() { return this.incidents; }
  async get(id: string) { return this.incidents.find((incident) => incident.id === id) ?? null; }
  async update(id: string, input: UpdateIncidentInput) {
    const incident = await this.get(id);
    if (!incident) return null;
    Object.assign(incident, input);
    if (input.status === "resolved" && input.resolved_at === undefined) incident.resolved_at = new Date().toISOString();
    return incident;
  }
  async delete(id: string) {
    const before = this.incidents.length;
    this.incidents = this.incidents.filter((incident) => incident.id !== id);
    return this.incidents.length < before;
  }
}

describe("incident API", () => {
  let repository: MemoryIncidentRepository;
  let app: ReturnType<typeof createApp>;
  const apiKey = "test-api-key";
  const auth = { "x-api-key": apiKey };

  beforeEach(() => {
    repository = new MemoryIncidentRepository();
    app = createApp(repository, { apiKey });
  });

  it("preserves the health endpoint", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", database: "connected" });
  });

  it("keeps incident reads public and requires an API key for writes", async () => {
    expect((await request(app).get("/incidents")).status).toBe(200);
    expect((await request(app).post("/incidents").send({ title: "Blocked", description: "Missing key", severity: "low" })).status).toBe(401);
    expect((await request(app).post("/incidents").set("x-api-key", "wrong").send({ title: "Blocked", description: "Wrong key", severity: "low" })).status).toBe(401);

    const unconfiguredApp = createApp(repository);
    const unavailable = await request(unconfiguredApp).post("/incidents").set(auth).send({ title: "Blocked", description: "No configured key", severity: "low" });
    expect(unavailable.status).toBe(503);
  });

  it("validates create input and creates incidents", async () => {
    const invalid = await request(app).post("/incidents").set(auth).send({ title: "Broken" });
    expect(invalid.status).toBe(400);
    const created = await request(app).post("/incidents").set(auth).send({ title: "Checkout outage", description: "Payments are failing", severity: "high" });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe("open");
  });

  it("lists, gets, updates and deletes incidents", async () => {
    const created = await request(app).post("/incidents").set(auth).send({ title: "Queue delay", description: "Workers are behind", severity: "medium" });
    const id = created.body.id;
    expect((await request(app).get("/incidents")).body).toHaveLength(1);
    expect((await request(app).get(`/incidents/${id}`)).status).toBe(200);
    const updated = await request(app).patch(`/incidents/${id}`).set(auth).send({ status: "resolved" });
    expect(updated.status).toBe(200);
    expect(updated.body.resolved_at).toBeTruthy();
    expect((await request(app).delete(`/incidents/${id}`).set(auth)).status).toBe(204);
    expect((await request(app).get(`/incidents/${id}`)).status).toBe(404);
  });
});
