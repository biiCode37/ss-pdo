import { ClipboardList, BarChart3, Bus, MoreHorizontal } from "lucide-react";

interface BottomNavProps {
  activeTab: "input" | "analytics" | "units";
  onSelectTab: (tab: "input" | "analytics" | "units") => void;
  onOpenMore: () => void;
  pendingQueueCount?: number;
}

export function BottomNav({
  activeTab,
  onSelectTab,
  onOpenMore,
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
          onClick={() => handleTabClick("input")}
          className={`bottom-nav-item ${activeTab === "input" ? "active" : ""}`}
          title="Input SS"
          aria-label="Input SS"
        >
          <div className="bottom-nav-icon-wrapper">
            <ClipboardList size={20} />
            {pendingQueueCount > 0 && (
              <span className="bottom-nav-badge">{pendingQueueCount}</span>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick("analytics")}
          className={`bottom-nav-item ${activeTab === "analytics" ? "active" : ""}`}
          title="Dashboard"
          aria-label="Dashboard"
        >
          <div className="bottom-nav-icon-wrapper">
            <BarChart3 size={20} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick("units")}
          className={`bottom-nav-item ${activeTab === "units" ? "active" : ""}`}
          title="Daftar Unit"
          aria-label="Daftar Unit"
        >
          <div className="bottom-nav-icon-wrapper">
            <Bus size={20} />
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenMore}
          className="bottom-nav-item"
          title="Lainnya"
          aria-label="Lainnya"
        >
          <div className="bottom-nav-icon-wrapper">
            <MoreHorizontal size={20} />
          </div>
        </button>
      </nav>
    </div>
  );
}
