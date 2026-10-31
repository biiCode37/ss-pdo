import { memo } from "react";
import { ClipboardList, BarChart3, Bus, ListOrdered } from "lucide-react";
import { TEXT_DASHBOARD } from "../constants/texts";

interface BottomNavProps {
  activeTab: "input" | "analytics" | "units" | "plotting";
  onSelectTab: (tab: "input" | "analytics" | "units" | "plotting") => void;
  pendingQueueCount?: number;
}

function BottomNavComponent({
  activeTab,
  onSelectTab,
  pendingQueueCount = 0,
}: BottomNavProps) {
  const handleTabClick = (tab: "input" | "analytics" | "units" | "plotting") => {
    if (activeTab !== tab) {
      onSelectTab(tab);
    }
  };

  return (
    <div className="bottom-nav-wrapper">
      <nav className="bottom-nav" aria-label={TEXT_DASHBOARD.NAV_MAIN}>
        <button
          type="button"
          onClick={() => handleTabClick("input")}
          className={`bottom-nav-item ${activeTab === "input" ? "active" : ""}`}
          title={TEXT_DASHBOARD.TABS.INPUT_SS}
          aria-label={TEXT_DASHBOARD.TABS.INPUT_SS}
          data-testid="bottom-nav-input"
        >
          <div className="bottom-nav-icon-wrapper">
            <ClipboardList size={19} />
            {pendingQueueCount > 0 && (
              <span className="bottom-nav-badge">{pendingQueueCount}</span>
            )}
          </div>
          <span className="bottom-nav-label">
            {TEXT_DASHBOARD.TABS.INPUT_SHORT}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick("analytics")}
          className={`bottom-nav-item ${activeTab === "analytics" ? "active" : ""}`}
          title={TEXT_DASHBOARD.TABS.DASHBOARD}
          aria-label={TEXT_DASHBOARD.TABS.DASHBOARD}
          data-testid="bottom-nav-analytics"
        >
          <div className="bottom-nav-icon-wrapper">
            <BarChart3 size={19} />
          </div>
          <span className="bottom-nav-label">
            {TEXT_DASHBOARD.TABS.DASHBOARD_SHORT}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick("units")}
          className={`bottom-nav-item ${activeTab === "units" ? "active" : ""}`}
          title={TEXT_DASHBOARD.TABS.UNIT_LIST}
          aria-label={TEXT_DASHBOARD.TABS.UNIT_LIST}
          data-testid="bottom-nav-units"
        >
          <div className="bottom-nav-icon-wrapper">
            <Bus size={19} />
          </div>
          <span className="bottom-nav-label">
            {TEXT_DASHBOARD.TABS.UNIT_SHORT}
          </span>
        </button>
        <button
          type="button"
          onClick={() => handleTabClick("plotting")}
          className={`bottom-nav-item ${activeTab === "plotting" ? "active" : ""}`}
          title={TEXT_DASHBOARD.TABS.PLOTTING}
          aria-label={TEXT_DASHBOARD.TABS.PLOTTING}
          data-testid="bottom-nav-plotting"
        >
          <div className="bottom-nav-icon-wrapper">
            <ListOrdered size={19} />
          </div>
          <span className="bottom-nav-label">
            {TEXT_DASHBOARD.TABS.PLOTTING_SHORT}
          </span>
        </button>
      </nav>
    </div>
  );
}

export const BottomNav = memo(BottomNavComponent);
