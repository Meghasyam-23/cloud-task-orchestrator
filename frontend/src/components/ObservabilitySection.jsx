import { ArrowRight, CheckCircle2, Database, Gauge, GitBranch, Server, TerminalSquare } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const STATUS_COLORS = {
  QUEUED: "var(--status-queued)",
  RUNNING: "var(--status-running)",
  COMPLETED: "var(--status-completed)",
  FAILED: "var(--status-failed)",
};

const TASK_COLORS = {
  text_transform: "var(--chart-blue)",
  data_cleanup: "var(--chart-teal)",
  file_summary: "var(--chart-violet)",
};

export function ObservabilitySection({ metrics, loading }) {
  return (
    <section className="observability-grid" aria-label="Observability charts">
      <ThroughputChart data={metrics.throughputData} loading={loading} />
      <StatusDonut data={metrics.statusData} total={metrics.stats.total} loading={loading} />
      <TaskTypeBreakdown data={metrics.taskTypeData} loading={loading} />
      <ArchitectureCard />
    </section>
  );
}

export function OperationsTelemetry({ metrics }) {
  return (
    <div className="operations-telemetry" aria-label="Queue pipeline and worker insights">
      <QueuePipeline data={metrics.pipelineData} total={metrics.stats.total} />
      <WorkerInsights insights={metrics.insights} />
    </div>
  );
}

export function ThroughputChart({ data, loading }) {
  return (
    <section className="panel chart-panel throughput-panel">
      <PanelTitle
        eyebrow="Throughput"
        title="Job flow over time"
        description="Submitted jobs use created_at; completed jobs use updated_at."
      />
      <ChartFrame empty={!loading && data.length === 0}>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 12, right: 18, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="submitted"
              stroke="var(--chart-blue)"
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="completed"
              stroke="var(--status-completed)"
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartFrame>
    </section>
  );
}

export function StatusDonut({ data, total, loading }) {
  return (
    <section className="panel chart-panel">
      <PanelTitle eyebrow="State" title="Job status" description="Current distribution from Redis-backed job metadata." />
      <ChartFrame empty={!loading && total === 0}>
        <div className="donut-shell">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={66} outerRadius={88} paddingAngle={3}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-center">
            <strong>{total}</strong>
            <span>jobs</span>
          </div>
        </div>
        <LegendGrid items={data} colors={STATUS_COLORS} />
      </ChartFrame>
    </section>
  );
}

export function QueuePipeline({ data, total }) {
  const submitted = data.find((item) => item.name === "Submitted")?.value ?? 0;
  const queued = data.find((item) => item.name === "Queued")?.value ?? 0;
  const running = data.find((item) => item.name === "Running")?.value ?? 0;
  const completed = data.find((item) => item.name === "Completed")?.value ?? 0;
  const failed = data.find((item) => item.name === "Failed")?.value ?? 0;

  return (
    <section className="panel pipeline-panel">
      <PanelTitle
        eyebrow="Queue pipeline"
        title="Execution path"
        description="A live control-plane view from job state counts."
      />
      <div className="pipeline-track">
        <PipelineNode label="Submitted" value={submitted} tone="submitted" />
        <PipelineArrow />
        <PipelineNode label="Queued" value={queued} tone="queued" />
        <PipelineArrow />
        <PipelineNode label="Running" value={running} tone="running" />
        <PipelineArrow className="terminal-arrow" />
        <div className="terminal-nodes">
          <PipelineNode label="Completed" value={completed} tone="completed" />
          <PipelineNode label="Failed" value={failed} tone="failed" />
        </div>
      </div>
      <div className="pipeline-footer">
        <span>Total observed jobs</span>
        <strong>{total}</strong>
      </div>
    </section>
  );
}

export function TaskTypeBreakdown({ data, loading }) {
  const hasData = data.some((item) => item.value > 0);

  return (
    <section className="panel chart-panel">
      <PanelTitle eyebrow="Workload mix" title="Task type breakdown" description="Counts by task_type from current jobs." />
      <ChartFrame empty={!loading && !hasData}>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 18, bottom: 0, left: 18 }}>
            <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
            <YAxis
              dataKey="name"
              type="category"
              width={112}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
            />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="value" radius={[0, 5, 5, 0]}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={TASK_COLORS[entry.name]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
    </section>
  );
}

export function WorkerInsights({ insights }) {
  const items = [
    { label: "Queue depth", value: insights.queueDepth, hint: "QUEUED jobs" },
    { label: "Active jobs", value: insights.activeJobs, hint: "RUNNING jobs" },
    { label: "Completed", value: insights.completedJobs, hint: "Finished successfully" },
    { label: "Failed", value: insights.failedJobs, hint: "Needs inspection" },
    { label: "Avg retries", value: insights.averageRetryCount.toFixed(2), hint: "Across all jobs" },
  ];

  return (
    <section className="panel insights-panel">
      <PanelTitle eyebrow="Worker insights" title="Queue health" description="Operational signals derived from jobs." />
      <div className="insight-list">
        {items.map((item) => (
          <div className="insight-row" key={item.label}>
            <div>
              <span>{item.label}</span>
              <p>{item.hint}</p>
            </div>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ArchitectureCard() {
  const nodes = [
    { label: "React Dashboard", icon: Gauge },
    { label: "FastAPI Backend", icon: Server },
    { label: "Redis Queue", icon: Database },
    { label: "Worker Service", icon: TerminalSquare },
    { label: "Job Result", icon: CheckCircle2 },
  ];

  return (
    <section className="panel architecture-panel">
      <PanelTitle eyebrow="Static architecture" title="System topology" description="Runtime path for submitted work." />
      <div className="architecture-flow">
        {nodes.map((node, index) => {
          const Icon = node.icon;
          return (
            <div className="architecture-step" key={node.label}>
              <div className="architecture-node">
                <Icon size={17} />
                <span>{node.label}</span>
              </div>
              {index < nodes.length - 1 ? <ArrowRight size={16} className="architecture-arrow" /> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PipelineNode({ label, value, tone }) {
  return (
    <div className={`pipeline-node ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PipelineArrow({ className = "" }) {
  return (
    <div className={`pipeline-arrow ${className}`} aria-hidden="true">
      <GitBranch size={16} />
    </div>
  );
}

function PanelTitle({ eyebrow, title, description }) {
  return (
    <div className="panel-heading compact-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function ChartFrame({ empty, children }) {
  return (
    <div className="chart-frame">
      {empty ? (
        <div className="chart-empty">
          <strong>No job data yet</strong>
          <span>Submit a job to populate this view from Redis-backed job metadata.</span>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function LegendGrid({ items, colors }) {
  return (
    <div className="legend-grid">
      {items.map((item) => (
        <div className="legend-item" key={item.name}>
          <span style={{ backgroundColor: colors[item.name] }} />
          <strong>{item.value}</strong>
          <p>{item.name}</p>
        </div>
      ))}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      {label ? <strong>{label}</strong> : null}
      {payload.map((item) => (
        <p key={item.dataKey ?? item.name}>
          <span style={{ backgroundColor: item.color }} />
          {item.name}: {item.value}
        </p>
      ))}
    </div>
  );
}
