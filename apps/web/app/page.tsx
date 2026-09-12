type Health = {
  status: string;
  database: string;
};

const deployments = [
  { service: "web-app", branch: "main", status: "Deployed", time: "8 min ago" },
  { service: "checkout-api", branch: "release/2.4", status: "Deployed", time: "42 min ago" },
  { service: "worker", branch: "main", status: "Pending", time: "1 hr ago" }
];

async function getHealth(): Promise<Health> {
  try {
    const response = await fetch(`${process.env.API_URL ?? "http://localhost:4000"}/health`, {
      cache: "no-store"
    });
    if (!response.ok) return { status: "degraded", database: "unavailable" };
    return response.json();
  } catch {
    return { status: "offline", database: "unavailable" };
  }
}

export default async function Dashboard() {
  const health = await getHealth();
  const isHealthy = health.status === "ok";

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">D</span> DeployGuard</div>
        <div className="workspace"><span className="workspace-dot" /> production <span className="chevron">⌄</span></div>
      </header>

      <section className="hero">
        <p className="eyebrow">Operations overview</p>
        <h1>Good morning, team.</h1>
        <p className="intro">A calm, current view of what is moving through production.</p>
      </section>

      <section className="metrics" aria-label="System metrics">
        <article className="metric-card primary-card">
          <div className="metric-label"><span className={`status-dot ${isHealthy ? "healthy" : "warning"}`} /> System status</div>
          <strong>{isHealthy ? "All systems operational" : "Needs attention"}</strong>
          <span className="metric-detail">API {health.status} · Database {health.database}</span>
        </article>
        <article className="metric-card">
          <span className="metric-label">Deployments today</span>
          <strong>24</strong>
          <span className="metric-detail trend">+12% from yesterday</span>
        </article>
        <article className="metric-card">
          <span className="metric-label">Average deploy time</span>
          <strong>3m 18s</strong>
          <span className="metric-detail">-26s from last week</span>
        </article>
      </section>

      <section className="activity-section">
        <div className="section-heading"><div><p className="eyebrow">Live feed</p><h2>Recent deployments</h2></div><button type="button">View all <span>↗</span></button></div>
        <div className="deployment-list">
          {deployments.map((deployment) => (
            <div className="deployment-row" key={`${deployment.service}-${deployment.branch}`}>
              <span className={`deployment-icon ${deployment.status === "Pending" ? "pending" : "complete"}`}>{deployment.status === "Pending" ? "↗" : "✓"}</span>
              <div className="deployment-name"><strong>{deployment.service}</strong><span>{deployment.branch}</span></div>
              <span className={`pill ${deployment.status === "Pending" ? "pending-pill" : "complete-pill"}`}>{deployment.status}</span>
              <time>{deployment.time}</time>
              <span className="row-arrow">→</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}