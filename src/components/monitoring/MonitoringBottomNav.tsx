import { memo, useState, useEffect } from "react";
import { LayoutDashboard, Route, Bus, FileSpreadsheet, User } from "lucide-react";
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
    id: "dashboard",
    label: TEXT_MONITORING.NAV.DASHBOARD,
    icon: LayoutDashboard,
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
  onOpenProfile,
}: MonitoringBottomNavProps) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    () => localStorage.getItem("PDO_USER_AVATAR") || undefined
  );

  useEffect(() => {
    const handleStorage = () => {
      setAvatarUrl(localStorage.getItem("PDO_USER_AVATAR") || undefined);
      setAvatarFailed(false);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

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

        {/* User Profile Menu Item */}
        {onOpenProfile && (
          <button
            type="button"
            role="button"
            data-testid="monitoring-tab-profile"
            aria-label={TEXT_MONITORING.NAV.PROFILE}
            title={TEXT_MONITORING.NAV.PROFILE}
            className="bottom-nav-item monitoring-tab-btn"
            onClick={onOpenProfile}
          >
            <div className="bottom-nav-icon-wrapper">
              {avatarUrl && !avatarFailed ? (
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "1.5px solid currentColor",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={avatarUrl}
                    alt={TEXT_MONITORING.NAV.PROFILE}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarFailed(true)}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              ) : (
                <User size={19} />
              )}
            </div>
            <span className="bottom-nav-label">
              {TEXT_MONITORING.NAV.PROFILE}
            </span>
          </button>
        )}
      </nav>
    </div>
  );
});

export default MonitoringBottomNav;
