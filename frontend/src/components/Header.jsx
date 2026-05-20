import { Activity, LayoutDashboard, Boxes, Activity as ActivityIcon, GitBranch, Sun, Moon, RefreshCw } from "lucide-react";

const tabIcons = {
  overview: LayoutDashboard,
  jobs: Boxes,
  monitoring: ActivityIcon,
  architecture: GitBranch,
};

const tabLabels = {
  overview: "Overview",
  jobs: "Jobs",
  monitoring: "Monitor",
  architecture: "Arch",
};

const themeSequence = ["light", "dark"];

const themeIcons = { light: Sun, dark: Moon };
const themeTooltips = { light: "Light mode", dark: "Dark mode" };

export function Header({
  activeTab,
  loading,
  onRefresh,
  onTabChange,
  onThemeChange,
  tabs,
  themeMode,
}) {
  function cycleTheme() {
    const idx = themeSequence.indexOf(themeMode);
    onThemeChange(themeSequence[(idx + 1) % themeSequence.length]);
  }

  const ThemeIcon = themeIcons[themeMode] ?? Sun;

  return (
    <nav className="side-rail" aria-label="Main navigation">
      <div className="rail-brand" title="Cloud Task Orchestrator" aria-label="Cloud Task Orchestrator">
        <div className="rail-brand-mark" aria-hidden="true">
          <Activity size={18} />
        </div>
      </div>

      <div className="rail-nav">
        {tabs.map((tab) => {
          const Icon = tabIcons[tab.id];
          return (
            <button
              key={tab.id}
              className={`rail-item${activeTab === tab.id ? " active" : ""}`}
              type="button"
              onClick={() => onTabChange(tab.id)}
              title={tab.label}
              aria-label={tab.label}
              aria-current={activeTab === tab.id ? "page" : undefined}
            >
              <Icon size={20} />
              <span>{tabLabels[tab.id]}</span>
            </button>
          );
        })}
      </div>

      <div className="rail-bottom">
        <button
          className="rail-icon-btn"
          type="button"
          title={themeTooltips[themeMode]}
          aria-label={themeTooltips[themeMode]}
          onClick={cycleTheme}
        >
          <ThemeIcon size={17} />
        </button>
        <button
          className="rail-icon-btn"
          type="button"
          title="Refresh data"
          aria-label="Refresh data"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw size={17} className={loading ? "spin" : ""} />
        </button>
      </div>
    </nav>
  );
}
