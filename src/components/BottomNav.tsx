import { ClipboardList, BarChart3, Bus } from "lucide-react";

interface BottomNavProps {
  activeTab: "input" | "analytics" | "units";
  onSelectTab: (tab: "input" | "analytics" | "units") => void;
  pendingQueueCount?: number;
}

export function BottomNav({
  activeTab,
  onSelectTab,
  pendingQueueCount = 0,
}: BottomNavProps) {
  const handleTabClick = (tab: "input" | "analytics" | "units") => {
    if (activeTab !== tab) {
      onSelectTab(tab);
    }
  };

  const getIndicatorPosClass = () => {
    if (activeTab === "input") return "pos-input";
    if (activeTab === "analytics") return "pos-analytics";
    return "pos-units";
  };

  return (
    <div className="bottom-nav-wrapper">
      <nav className="bottom-nav" aria-label="Navigasi Utama">
        {/* Apple iOS Style Sliding Active Indicator Pill */}
        <div
          className={`bottom-nav-indicator ${getIndicatorPosClass()}`}
          aria-hidden="true"
        />

        <button
          type="button"
          onPointerDown={() => handleTabClick("input")}
          onClick={() => handleTabClick("input")}
          className={`bottom-nav-item ${activeTab === "input" ? "active" : ""}`}
        >
          <div className="bottom-nav-icon-wrapper">
            <ClipboardList size={18} />
            {pendingQueueCount > 0 && (
              <span className="bottom-nav-badge">{pendingQueueCount}</span>
            )}
          </div>
          <span>Input SS</span>
        </button>

        <button
          type="button"
          onPointerDown={() => handleTabClick("analytics")}
          onClick={() => handleTabClick("analytics")}
          className={`bottom-nav-item ${activeTab === "analytics" ? "active" : ""}`}
        >
          <div className="bottom-nav-icon-wrapper">
            <BarChart3 size={18} />
          </div>
          <span>Dashboard</span>
        </button>

        <button
          type="button"
          onPointerDown={() => handleTabClick("units")}
          onClick={() => handleTabClick("units")}
          className={`bottom-nav-item ${activeTab === "units" ? "active" : ""}`}
        >
          <div className="bottom-nav-icon-wrapper">
            <Bus size={18} />
          </div>
          <span>Unit</span>
        </button>
      </nav>
    </div>
  );
}
