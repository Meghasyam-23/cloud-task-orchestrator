import { AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { createJob, getHealth, getJobs } from "./api/client.js";
import { Header } from "./components/Header.jsx";
import { deriveJobMetrics } from "./utils/jobMetrics.js";
import { ArchitectureView } from "./views/ArchitectureView.jsx";
import { JobsView } from "./views/JobsView.jsx";
import { MonitoringView } from "./views/MonitoringView.jsx";
import { OverviewView } from "./views/OverviewView.jsx";

const THEME_STORAGE_KEY = "cto-theme-preference";
const tabs = [
  { id: "overview", label: "Overview" },
  { id: "jobs", label: "Jobs" },
  { id: "monitoring", label: "Monitoring" },
  { id: "architecture", label: "Architecture" },
];

function App() {
  const [activeTab, setActiveTab] = useState("overview");
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

  function handleSelectJob(job) {
    setSelectedJobId(job?.job_id ?? null);
  }

  function renderActiveView() {
    const sharedProps = {
      jobs,
      loading,
      metrics,
      onSelectJob: handleSelectJob,
      selectedJob,
      selectedJobId,
    };

    if (activeTab === "jobs") {
      return <JobsView {...sharedProps} />;
    }

    if (activeTab === "monitoring") {
      return <MonitoringView loading={loading} metrics={metrics} />;
    }

    if (activeTab === "architecture") {
      return <ArchitectureView />;
    }

    return (
      <OverviewView
        {...sharedProps}
        health={health}
        onSubmitJob={handleCreateJob}
        submitting={submitting}
      />
    );
  }

  return (
    <main className="app-shell">
      <Header
        activeTab={activeTab}
        activeTheme={activeTheme}
        loading={loading}
        onRefresh={refreshData}
        onTabChange={setActiveTab}
        onThemeChange={setThemeMode}
        tabs={tabs}
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

      {renderActiveView()}
    </main>
  );
}

export default App;
