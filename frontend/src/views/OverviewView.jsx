import { HealthCards } from "../components/HealthCards.jsx";
import { JobDetailPanel } from "../components/JobDetailPanel.jsx";
import { JobForm } from "../components/JobForm.jsx";
import { JobsTable } from "../components/JobsTable.jsx";
import { QueuePipeline } from "../components/ObservabilitySection.jsx";

export function OverviewView({ health, jobs, loading, metrics, onSelectJob, onSubmitJob, selectedJob, selectedJobId, submitting }) {
  const recentJobs = [...jobs]
    .sort((a, b) => new Date(b.updated_at ?? b.created_at) - new Date(a.updated_at ?? a.created_at))
    .slice(0, 8);

  return (
    <section className="view-stack overview-view" aria-label="Overview">
      <HealthCards health={health} stats={metrics.stats} loading={loading} />
      <div className="overview-command">
        <JobForm compact submitting={submitting} onSubmit={onSubmitJob} />
        <QueuePipeline data={metrics.pipelineData} total={metrics.stats.total} />
        <JobDetailPanel job={selectedJob} metrics={metrics} onClose={() => onSelectJob(null)} />
      </div>
      <JobsTable
        compact
        description="Latest activity from the live queue."
        emptyDescription="Submit a job to populate recent activity."
        jobs={recentJobs}
        loading={loading}
        onSelectJob={onSelectJob}
        selectedJobId={selectedJobId}
        title="Recent jobs"
      />
    </section>
  );
}
