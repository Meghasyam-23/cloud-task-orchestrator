import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { JobDetailPanel } from "../components/JobDetailPanel.jsx";
import { JobsTable } from "../components/JobsTable.jsx";

const STATUS_OPTIONS = ["ALL", "QUEUED", "RUNNING", "COMPLETED", "FAILED"];
const TASK_OPTIONS = ["ALL", "text_transform", "data_cleanup", "file_summary"];

export function JobsView({ jobs, loading, metrics, onSelectJob, selectedJob, selectedJobId }) {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [taskFilter, setTaskFilter] = useState("ALL");
  const [query, setQuery] = useState("");

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesStatus = statusFilter === "ALL" || job.status === statusFilter;
      const matchesTask = taskFilter === "ALL" || job.task_type === taskFilter;
      const matchesQuery = normalizedQuery === "" || job.job_id.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesTask && matchesQuery;
    });
  }, [jobs, query, statusFilter, taskFilter]);

  return (
    <section className="view-stack" aria-label="Jobs">
      <div className="filters-panel panel">
        <label className="search-field">
          <Search size={15} />
          <input
            type="search"
            placeholder="Search job ID"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label>
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Task type</span>
          <select value={taskFilter} onChange={(event) => setTaskFilter(event.target.value)}>
            {TASK_OPTIONS.map((taskType) => (
              <option key={taskType} value={taskType}>
                {taskType}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="jobs-layout-grid">
        <JobsTable
          description={`${filteredJobs.length} of ${jobs.length} jobs shown.`}
          emptyDescription="Adjust filters or submit a new job from Overview."
          emptyTitle="No matching jobs"
          jobs={filteredJobs}
          loading={loading}
          onSelectJob={onSelectJob}
          selectedJobId={selectedJobId}
          title="Job inventory"
        />
        <JobDetailPanel job={selectedJob} metrics={metrics} onClose={() => onSelectJob(null)} />
      </div>
    </section>
  );
}
