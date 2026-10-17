import { memo } from "react";
import { LayoutDashboard, Route, Bus, FileSpreadsheet, Users } from "lucide-react";
import { TEXT_MONITORING } from "@/constants/texts";

export type MonitoringTab = "dashboard" | "routes" | "fleet_status" | "wa_report" | "korwil";

export interface MonitoringBottomNavProps {
  activeTab: MonitoringTab;
  onSelectTab: (tab: MonitoringTab) => void;
  onOpenProfile?: () => void;
}

interface NavItemConfig {
  id: MonitoringTab;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItemConfig[] = [
  {
    id: "routes",
    label: TEXT_MONITORING.NAV.ROUTES,
    icon: Route,
  },
  {
    id: "fleet_status",
    label: TEXT_MONITORING.NAV.FLEET_STATUS,
    icon: Bus,
  },
  {
    id: "dashboard",
    label: TEXT_MONITORING.NAV.DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    id: "korwil",
    label: TEXT_MONITORING.NAV.KORWIL,
    icon: Users,
  },
  {
    id: "wa_report",
    label: TEXT_MONITORING.NAV.WA_REPORT,
    icon: FileSpreadsheet,
  },
];

export const MonitoringBottomNav = memo(function MonitoringBottomNav({
  activeTab,
  onSelectTab,
}: MonitoringBottomNavProps) {
  return (
    <div className="bottom-nav-wrapper monitoring-bottom-nav-wrapper">
      <nav
        className="bottom-nav"
        role="tablist"
        aria-label={TEXT_MONITORING.HEADER.TITLE}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-testid={`monitoring-tab-${item.id}`}
              className={`bottom-nav-item monitoring-tab-btn ${isActive ? "active" : ""}`}
              onClick={() => onSelectTab(item.id)}
              title={item.label}
              aria-label={item.label}
            >
              <div className="bottom-nav-icon-wrapper">
                <Icon size={19} />
              </div>
              <span className="bottom-nav-label">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
});

export default MonitoringBottomNav;
