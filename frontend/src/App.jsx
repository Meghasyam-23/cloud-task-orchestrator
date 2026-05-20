import { AlertTriangle } from "lucide-react";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";

import { createJob, getHealth, getJobs } from "./api/client.js";
import { Header } from "./components/Header.jsx";
import { HealthCards } from "./components/HealthCards.jsx";
import { JobDetailPanel } from "./components/JobDetailPanel.jsx";
import { JobForm } from "./components/JobForm.jsx";
import { JobsTable } from "./components/JobsTable.jsx";
import { deriveJobMetrics } from "./utils/jobMetrics.js";

const ObservabilitySection = lazy(() =>
  import("./components/ObservabilitySection.jsx").then((module) => ({
    default: module.ObservabilitySection,
  })),
);

const OperationsTelemetry = lazy(() =>
  import("./components/ObservabilitySection.jsx").then((module) => ({
    default: module.OperationsTelemetry,
  })),
);

const THEME_STORAGE_KEY = "cto-theme-preference";

function App() {
  const [health, setHealth] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [themeMode, setThemeMode] = useState(() => {
    return window.localStorage.getItem(THEME_STORAGE_KEY) ?? "system";
  });
  const [systemTheme, setSystemTheme] = useState(() => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const selectedJob = useMemo(
    () => jobs.find((job) => job.job_id === selectedJobId) ?? null,
    [jobs, selectedJobId],
  );

  const metrics = useMemo(() => deriveJobMetrics(jobs), [jobs]);
  const activeTheme = themeMode === "system" ? systemTheme : themeMode;

  async function refreshData() {
    setLoading(true);
    setError("");

    try {
      const [healthResponse, jobsResponse] = await Promise.all([getHealth(), getJobs()]);
      const nextJobs = jobsResponse.jobs ?? [];

      setHealth(healthResponse);
      setJobs(nextJobs);

      if (selectedJobId && !nextJobs.some((job) => job.job_id === selectedJobId)) {
        setSelectedJobId(null);
      }
    } catch (err) {
      setError(err.message || "Backend is unreachable.");
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateJob(job) {
    setSubmitting(true);
    setError("");

    try {
      const response = await createJob(job);
      await refreshData();
      setSelectedJobId(response.job_id);
    } catch (err) {
      setError(err.message || "Unable to submit job.");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    refreshData();
    const interval = window.setInterval(refreshData, 8000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function handleSystemThemeChange(event) {
      setSystemTheme(event.matches ? "dark" : "light");
    }

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    document.documentElement.dataset.theme = activeTheme;
    document.documentElement.style.colorScheme = activeTheme;
  }, [activeTheme, themeMode]);

  return (
    <main className="app-shell">
      <Header
        activeTheme={activeTheme}
        loading={loading}
        onRefresh={refreshData}
        onThemeChange={setThemeMode}
        themeMode={themeMode}
      />

      {error ? (
        <section className="error-banner" role="alert">
          <AlertTriangle size={18} />
          <div>
            <strong>Backend unreachable</strong>
            <p>{error}</p>
          </div>
        </section>
      ) : null}

      <HealthCards health={health} stats={metrics.stats} loading={loading} />

      <section className="workspace-grid" aria-label="Primary workspace">
        <div className="workspace-main">
          <JobForm submitting={submitting} onSubmit={handleCreateJob} />
          <JobsTable
            jobs={jobs}
            loading={loading}
            selectedJobId={selectedJobId}
            onSelectJob={(job) => setSelectedJobId(job.job_id)}
          />
        </div>
        <aside className="workspace-sidebar" aria-label="Queue and job inspection">
          <Suspense fallback={<section className="panel observability-loading compact">Loading queue telemetry...</section>}>
            <OperationsTelemetry metrics={metrics} />
          </Suspense>
          <JobDetailPanel job={selectedJob} metrics={metrics} onClose={() => setSelectedJobId(null)} />
        </aside>
      </section>

      <Suspense fallback={<section className="panel observability-loading">Loading observability views...</section>}>
        <ObservabilitySection metrics={metrics} loading={loading} />
      </Suspense>
    </main>
  );
}

export default App;
