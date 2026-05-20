import { CheckCircle2, Clock3, Database, ListChecks, Loader2, Server, XCircle } from "lucide-react";

const cardConfig = {
  api: { label: "API health", icon: Server },
  redis: { label: "Redis health", icon: Database },
  total: { label: "Total jobs", icon: ListChecks },
  queued: { label: "Queued", icon: Clock3 },
  running: { label: "Running", icon: Loader2 },
  completed: { label: "Completed", icon: CheckCircle2 },
  failed: { label: "Failed", icon: XCircle },
};

export function HealthCards({ health, stats, loading }) {
  const cards = [
    {
      key: "api",
      value: health?.status === "ok" ? "Healthy" : "Unknown",
      tone: health?.status === "ok" ? "good" : "muted",
    },
    {
      key: "redis",
      value: health?.redis === "ok" ? "Healthy" : "Unknown",
      tone: health?.redis === "ok" ? "good" : "muted",
    },
    { key: "total", value: stats.total },
    { key: "queued", value: stats.queued },
    { key: "running", value: stats.running },
    { key: "completed", value: stats.completed, tone: "good" },
    { key: "failed", value: stats.failed, tone: stats.failed > 0 ? "bad" : "muted" },
  ];

  return (
    <section className="metrics-grid" aria-label="System health">
      {cards.map((card) => {
        const Icon = cardConfig[card.key].icon;
        return (
          <div className="metric-card" key={card.key}>
            <div className="metric-label">
              <Icon size={15} />
              <span>{cardConfig[card.key].label}</span>
            </div>
            <div className={`metric-value ${card.tone ?? ""}`}>{loading ? "..." : card.value}</div>
          </div>
        );
      })}
    </section>
  );
}
