import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { type CreateIncidentInput, type Incident, type IncidentAuditAction, type IncidentAuditEvent, type IncidentRepository, type UpdateIncidentInput } from "../src/incidents";

class MemoryIncidentRepository implements IncidentRepository {
  incidents: Incident[] = [];
  auditEvents: IncidentAuditEvent[] = [];
  async initialize() {}
  async create(input: CreateIncidentInput) {
    const incident: Incident = { ...input, status: input.status ?? "open", id: crypto.randomUUID(), created_at: new Date().toISOString(), resolved_at: null };
    this.incidents.push(incident);
    this.recordAuditEvent(incident.id, "created", { severity: incident.severity, status: incident.status });
    return incident;
  }
  async list() { return this.incidents; }
  async get(id: string) { return this.incidents.find((incident) => incident.id === id) ?? null; }
  async update(id: string, input: UpdateIncidentInput) {
    const incident = await this.get(id);
    if (!incident) return null;
    Object.assign(incident, input);
    if (input.status === "resolved" && input.resolved_at === undefined) incident.resolved_at = new Date().toISOString();
    this.recordAuditEvent(id, "updated", input as Record<string, unknown>);
    return incident;
  }
  async delete(id: string) {
    const before = this.incidents.length;
    this.incidents = this.incidents.filter((incident) => incident.id !== id);
    const deleted = this.incidents.length < before;
    if (deleted) this.recordAuditEvent(id, "deleted", {});
    return deleted;
  }
  async listAuditEvents(incidentId: string) {
    return this.auditEvents.filter((event) => event.incident_id === incidentId);
  }
  private recordAuditEvent(incidentId: string, action: IncidentAuditAction, details: Record<string, unknown>) {
    this.auditEvents.unshift({
      id: crypto.randomUUID(),
      incident_id: incidentId,
      action,
      details,
      created_at: new Date().toISOString()
    });
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

  it("records incident audit events for create, update and delete", async () => {
    const created = await request(app).post("/incidents").set(auth).send({ title: "Database lag", description: "Replica is behind", severity: "critical" });
    const id = created.body.id;

    await request(app).patch(`/incidents/${id}`).set(auth).send({ status: "investigating" });

    const audit = await request(app).get(`/incidents/${id}/audit`);
    expect(audit.status).toBe(200);
    expect(audit.body.map((event: IncidentAuditEvent) => event.action)).toEqual(["updated", "created"]);
    expect(audit.body[0].details).toEqual({ status: "investigating" });

    await request(app).delete(`/incidents/${id}`).set(auth);
    expect(repository.auditEvents.map((event) => event.action)).toEqual(["deleted", "updated", "created"]);
    expect((await request(app).get(`/incidents/${id}/audit`)).status).toBe(404);
  });
});
