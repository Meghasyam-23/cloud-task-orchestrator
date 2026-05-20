import { Activity, Boxes, GitBranch, LayoutDashboard } from "lucide-react";

const tabIcons = {
  overview: LayoutDashboard,
  jobs: Boxes,
  monitoring: Activity,
  architecture: GitBranch,
};

export function TopNav({ activeTab, onTabChange, tabs }) {
  return (
    <nav className="top-nav" aria-label="Dashboard views">
      {tabs.map((tab) => {
        const Icon = tabIcons[tab.id];
        return (
          <button
            className={activeTab === tab.id ? "active" : ""}
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            aria-current={activeTab === tab.id ? "page" : undefined}
          >
            <Icon size={15} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
