import { memo } from "react";
import { LayoutDashboard, Route, Bus, FileSpreadsheet } from "lucide-react";
import { TEXT_MONITORING } from "@/constants/texts";

export type MonitoringTab = "dashboard" | "routes" | "fleet_status" | "wa_report";

export interface MonitoringBottomNavProps {
  activeTab: MonitoringTab;
  onSelectTab: (tab: MonitoringTab) => void;
}

interface NavItemConfig {
  id: MonitoringTab;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItemConfig[] = [
  {
    id: "dashboard",
    label: TEXT_MONITORING.NAV.DASHBOARD,
    icon: LayoutDashboard,
  },
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
    <div
      className="monitoring-bottom-nav-wrapper"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "var(--card-bg, rgba(23, 23, 23, 0.95))",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.2)",
      }}
    >
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          height: "64px",
          maxWidth: "768px",
          margin: "0 auto",
          padding: "0 8px",
        }}
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
              className={`monitoring-tab-btn ${isActive ? "active" : ""}`}
              onClick={() => onSelectTab(item.id)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px",
                height: "52px",
                minWidth: "48px",
                borderRadius: "12px",
                border: "none",
                background: isActive
                  ? "var(--accent-bg-subtle, rgba(62, 207, 142, 0.12))"
                  : "transparent",
                color: isActive
                  ? "var(--accent-color, #3ECF8E)"
                  : "var(--text-secondary, #8b8b8b)",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
                padding: "4px 6px",
                outline: "none",
              }}
            >
              <Icon
                size={20}
                style={{
                  strokeWidth: isActive ? 2.5 : 1.8,
                  transform: isActive ? "scale(1.05)" : "scale(1)",
                  transition: "transform 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
                }}
              />
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: isActive ? 700 : 500,
                  letterSpacing: "-0.2px",
                  whiteSpace: "nowrap",
                }}
              >
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
