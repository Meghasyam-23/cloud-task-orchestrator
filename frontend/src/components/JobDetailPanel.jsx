import { Activity, GitBranch, X } from "lucide-react";

import { StatusBadge } from "./StatusBadge.jsx";

export function JobDetailPanel({ job, metrics, onClose }) {
  return (
    <aside className={`detail-panel ${job ? "open" : ""}`} aria-label="Job detail">
      {job ? (
        <>
          <div className="detail-header">
            <div>
              <p className="eyebrow">Job detail</p>
              <h2>{job.task_type}</h2>
            </div>
            <button className="icon-only-button" type="button" onClick={onClose} aria-label="Close job detail">
              <X size={17} />
            </button>
          </div>

          <div className="detail-meta">
            <div>
              <span>Status</span>
              <StatusBadge status={job.status} />
            </div>
            <div>
              <span>Retry count</span>
              <strong>{job.retry_count ?? 0}</strong>
            </div>
            <div>
              <span>Created</span>
              <strong>{formatDateTime(job.created_at)}</strong>
            </div>
            <div>
              <span>Updated</span>
              <strong>{formatDateTime(job.updated_at)}</strong>
            </div>
          </div>

          <DetailBlock title="Job ID" value={job.job_id} mono />
          <DetailBlock title="Payload" value={job.payload} />
          <DetailBlock title="Result" value={job.result} emptyValue="No result written yet." />
          <DetailBlock title="Error" value={job.error} emptyValue="No error recorded." />
        </>
      ) : (
        <SystemSnapshot metrics={metrics} />
      )}
    </aside>
  );
}

function SystemSnapshot({ metrics }) {
  const snapshotItems = [
    { label: "Total", value: metrics.stats.total },
    { label: "Completed", value: metrics.stats.completed },
    { label: "Failed", value: metrics.stats.failed },
    { label: "Queue depth", value: metrics.insights.queueDepth },
    { label: "Active jobs", value: metrics.insights.activeJobs },
  ];

  return (
    <div className="snapshot-panel">
      <div className="snapshot-header">
        <div className="snapshot-icon" aria-hidden="true">
          <Activity size={17} />
        </div>
        <div>
          <p className="eyebrow">System snapshot</p>
          <h2>No job selected</h2>
          <p>Select a job to inspect payload, result, error, retries, and timestamps.</p>
        </div>
      </div>
      <div className="snapshot-metrics">
        {snapshotItems.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
      <div className="lifecycle-hint" aria-label="Job lifecycle hint">
        <GitBranch size={15} />
        <span>Submitted</span>
        <span>Queued</span>
        <span>Running</span>
        <span>Completed</span>
      </div>
    </div>
  );
}

function DetailBlock({ title, value, emptyValue = "Empty", mono = false }) {
  const isEmpty = value === null || value === undefined || value === "";
  const displayValue = typeof value === "string" ? value : JSON.stringify(value, null, 2);

  return (
    <section className="detail-block">
      <h3>{title}</h3>
      <pre className={mono ? "mono" : ""}>{isEmpty ? emptyValue : displayValue}</pre>
    </section>
  );
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
