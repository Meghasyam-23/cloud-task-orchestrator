import { Activity, RefreshCw } from "lucide-react";

export function Header({ loading, onRefresh }) {
  return (
    <header className="topbar">
      <div className="brand-group">
        <div className="brand-mark" aria-hidden="true">
          <Activity size={18} />
        </div>
        <div>
          <h1>Cloud Task Orchestrator</h1>
          <p>Queue, process, and observe asynchronous workloads across API, Redis, and workers.</p>
        </div>
      </div>
      <button className="icon-button primary-action" type="button" onClick={onRefresh} disabled={loading}>
        <RefreshCw size={16} className={loading ? "spin" : ""} />
        <span>Refresh</span>
      </button>
    </header>
  );
}
