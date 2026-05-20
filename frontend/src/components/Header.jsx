import { Activity, Monitor, Moon, RefreshCw, Sun } from "lucide-react";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function Header({ activeTheme, loading, onRefresh, onThemeChange, themeMode }) {
  return (
    <header className="topbar">
      <div className="brand-group">
        <div className="brand-mark" aria-hidden="true">
          <Activity size={18} />
        </div>
        <div>
          <div className="brand-line">
            <h1>Cloud Task Orchestrator</h1>
            <span className="environment-badge">Local Stack</span>
          </div>
          <p>Queue, process, and observe asynchronous workloads.</p>
        </div>
      </div>
      <div className="header-actions">
        <div className="theme-toggle" role="group" aria-label={`Theme selection. Active theme ${activeTheme}.`}>
          {themeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                className={themeMode === option.value ? "active" : ""}
                key={option.value}
                type="button"
                onClick={() => onThemeChange(option.value)}
                aria-pressed={themeMode === option.value}
              >
                <Icon size={14} />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
        <button className="icon-button primary-action" type="button" onClick={onRefresh} disabled={loading}>
          <RefreshCw size={16} className={loading ? "spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>
    </header>
  );
}
