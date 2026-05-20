const statusClass = {
  QUEUED: "queued",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
};

export function StatusBadge({ status }) {
  return (
    <span className={`status-chip ${statusClass[status] ?? "unknown"}`}>
      <span className="status-dot" aria-hidden="true" />
      {status ?? "UNKNOWN"}
    </span>
  );
}
