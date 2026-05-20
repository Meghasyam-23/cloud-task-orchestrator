import {
  StatusDonut,
  TaskTypeBreakdown,
  ThroughputChart,
  WorkerInsights,
} from "../components/ObservabilitySection.jsx";

export function MonitoringView({ loading, metrics }) {
  return (
    <section className="monitoring-grid" aria-label="Monitoring">
      <ThroughputChart data={metrics.throughputData} loading={loading} />
      <StatusDonut data={metrics.statusData} total={metrics.stats.total} loading={loading} />
      <TaskTypeBreakdown data={metrics.taskTypeData} loading={loading} />
      <WorkerInsights insights={metrics.insights} />
    </section>
  );
}
