import { Pool } from "pg";

export const severities = ["low", "medium", "high", "critical"] as const;
export const statuses = ["open", "investigating", "resolved"] as const;

export type Severity = (typeof severities)[number];
export type IncidentStatus = (typeof statuses)[number];

export type Incident = {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: IncidentStatus;
  created_at: string;
  resolved_at: string | null;
};

export type IncidentAuditAction = "created" | "updated" | "deleted";

export type IncidentAuditEvent = {
  id: string;
  incident_id: string;
  action: IncidentAuditAction;
  details: Record<string, unknown>;
  created_at: string;
};

export type CreateIncidentInput = {
  title: string;
  description: string;
  severity: Severity;
  status?: IncidentStatus;
};

export type UpdateIncidentInput = Partial<CreateIncidentInput> & {
  resolved_at?: string | null;
};

export type IncidentRepository = {
  initialize(): Promise<void>;
  create(input: CreateIncidentInput): Promise<Incident>;
  list(): Promise<Incident[]>;
  get(id: string): Promise<Incident | null>;
  update(id: string, input: UpdateIncidentInput): Promise<Incident | null>;
  delete(id: string): Promise<boolean>;
  listAuditEvents(incidentId: string): Promise<IncidentAuditEvent[]>;
};

const columns = "id, title, description, severity, status, created_at, resolved_at";
const auditColumns = "id, incident_id, action, details, created_at";

export class PostgresIncidentRepository implements IncidentRepository {
  constructor(private readonly pool: Pool) {}

  async initialize() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        resolved_at TIMESTAMPTZ
      )
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS incident_audit_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        incident_id UUID NOT NULL,
        action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
        details JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS incident_audit_events_incident_id_created_at_idx
      ON incident_audit_events (incident_id, created_at DESC)
    `);
  }

  async create(input: CreateIncidentInput) {
    const result = await this.pool.query<Incident>(
      `INSERT INTO incidents (title, description, severity, status, resolved_at)
       VALUES ($1, $2, $3, $4, CASE WHEN $4 = 'resolved' THEN NOW() ELSE NULL END)
       RETURNING ${columns}`,
      [input.title, input.description, input.severity, input.status ?? "open"]
    );
    const incident = result.rows[0];
    await this.recordAuditEvent(incident.id, "created", {
      severity: incident.severity,
      status: incident.status
    });
    return incident;
  }

  async list() {
    const result = await this.pool.query<Incident>(`SELECT ${columns} FROM incidents ORDER BY created_at DESC`);
    return result.rows;
  }

  async get(id: string) {
    const result = await this.pool.query<Incident>(`SELECT ${columns} FROM incidents WHERE id = $1`, [id]);
    return result.rows[0] ?? null;
  }

  async update(id: string, input: UpdateIncidentInput) {
    const fields = Object.entries(input).filter(([key, value]) => value !== undefined && key !== "resolved_at");
    const values = fields.map(([, value]) => value);
    if (input.status === "resolved" && input.resolved_at === undefined) {
      const resolvedAt = new Date().toISOString();
      fields.push(["resolved_at", resolvedAt]);
      values.push(resolvedAt);
    } else if (input.resolved_at !== undefined) {
      fields.push(["resolved_at", input.resolved_at]);
      values.push(input.resolved_at);
    }
    if (fields.length === 0) return this.get(id);

    const assignments = fields.map(([key], index) => `${key} = $${index + 1}`).join(", ");
    const result = await this.pool.query<Incident>(
      `UPDATE incidents SET ${assignments} WHERE id = $${values.length + 1} RETURNING ${columns}`,
      [...values, id]
    );
    const incident = result.rows[0] ?? null;
    if (incident) {
      await this.recordAuditEvent(incident.id, "updated", Object.fromEntries(fields));
    }
    return incident;
  }

  async delete(id: string) {
    const result = await this.pool.query("DELETE FROM incidents WHERE id = $1", [id]);
    const deleted = (result.rowCount ?? 0) > 0;
    if (deleted) await this.recordAuditEvent(id, "deleted", {});
    return deleted;
  }

  async listAuditEvents(incidentId: string) {
    const result = await this.pool.query<IncidentAuditEvent>(
      `SELECT ${auditColumns} FROM incident_audit_events WHERE incident_id = $1 ORDER BY created_at DESC`,
      [incidentId]
    );
    return result.rows;
  }

  private async recordAuditEvent(incidentId: string, action: IncidentAuditAction, details: Record<string, unknown>) {
    await this.pool.query(
      `INSERT INTO incident_audit_events (incident_id, action, details) VALUES ($1, $2, $3::jsonb)`,
      [incidentId, action, JSON.stringify(details)]
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateIncidentInput(body: unknown, partial = false): string | null {
  if (!isRecord(body)) return "Request body must be an object";
  if (!partial && ["title", "description", "severity"].some((field) => !isNonEmptyString(body[field]))) {
    return "title, description and severity are required";
  }
  if (partial && Object.keys(body).length === 0) return "At least one field is required";
  if (body.title !== undefined && !isNonEmptyString(body.title)) return "title must be a non-empty string";
  if (body.description !== undefined && !isNonEmptyString(body.description)) return "description must be a non-empty string";
  if (body.severity !== undefined && !severities.includes(body.severity as Severity)) return "severity is invalid";
  if (body.status !== undefined && !statuses.includes(body.status as IncidentStatus)) return "status is invalid";
  if (body.resolved_at !== undefined && body.resolved_at !== null && (typeof body.resolved_at !== "string" || Number.isNaN(Date.parse(body.resolved_at)))) {
    return "resolved_at must be a valid ISO date or null";
  }
  return null;
}
