import { AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { createJob, getHealth, getJobs } from "./api/client.js";
import { Header } from "./components/Header.jsx";
import { HealthCards } from "./components/HealthCards.jsx";
import { JobDetailPanel } from "./components/JobDetailPanel.jsx";
import { JobForm } from "./components/JobForm.jsx";
import { JobsTable } from "./components/JobsTable.jsx";

function App() {
  const [health, setHealth] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedJob = useMemo(
    () => jobs.find((job) => job.job_id === selectedJobId) ?? null,
    [jobs, selectedJobId],
  );

  const stats = useMemo(() => {
    return jobs.reduce(
      (acc, job) => {
        acc.total += 1;
        const key = job.status?.toLowerCase();
        if (key && key in acc) {
          acc[key] += 1;
        }
        return acc;
      },
      { total: 0, queued: 0, running: 0, completed: 0, failed: 0 },
    );
  }, [jobs]);

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

  return (
    <main className="app-shell">
      <Header loading={loading} onRefresh={refreshData} />

      {error ? (
        <section className="error-banner" role="alert">
          <AlertTriangle size={18} />
          <div>
            <strong>Backend unreachable</strong>
            <p>{error}</p>
          </div>
        </section>
      ) : null}

      <HealthCards health={health} stats={stats} loading={loading} />

      <div className="dashboard-grid">
        <div className="main-column">
          <JobForm submitting={submitting} onSubmit={handleCreateJob} />
          <JobsTable
            jobs={jobs}
            loading={loading}
            selectedJobId={selectedJobId}
            onSelectJob={(job) => setSelectedJobId(job.job_id)}
          />
        </div>
        <JobDetailPanel job={selectedJob} onClose={() => setSelectedJobId(null)} />
      </div>
    </main>
  );
}

export default App;
