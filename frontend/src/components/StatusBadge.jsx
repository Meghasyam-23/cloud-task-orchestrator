const statusClass = {
  QUEUED: "queued",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
};

export function StatusBadge({ status }) {
  return <span className={`status-badge ${statusClass[status] ?? "unknown"}`}>{status ?? "UNKNOWN"}</span>;
}
