import { ChevronRight, Inbox } from "lucide-react";

import { StatusBadge } from "./StatusBadge.jsx";

export function JobsTable({
  compact = false,
  description = "Live queue and processing history from the backend API.",
  emptyDescription = "Submit a job to watch it move from queued to completed.",
  emptyTitle = "No jobs yet",
  jobs,
  loading,
  onSelectJob,
  selectedJobId,
  title = "Jobs",
}) {
  return (
    <section className={`panel jobs-panel ${compact ? "compact-table" : ""}`}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      {loading && jobs.length === 0 ? (
        <div className="table-loading">
          <div className="skeleton-row" />
          <div className="skeleton-row" />
          <div className="skeleton-row" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <Inbox size={28} />
          <h3>{emptyTitle}</h3>
          <p>{emptyDescription}</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Task</th>
                <th>Status</th>
                <th>Retries</th>
                <th>Updated</th>
                <th aria-label="Open detail" />
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr
                  className={job.job_id === selectedJobId ? "selected-row" : ""}
                  key={job.job_id}
                  onClick={() => onSelectJob(job)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectJob(job);
                    }
                  }}
                  tabIndex={0}
                >
                  <td className="mono truncate">{job.job_id}</td>
                  <td>{job.task_type}</td>
                  <td>
                    <StatusBadge status={job.status} />
                  </td>
                  <td>{job.retry_count ?? 0}</td>
                  <td>{formatDate(job.updated_at)}</td>
                  <td>
                    <ChevronRight size={16} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
