import React from "react";
import type { RegionalRouteItem } from "@/services/allRouteMonitoringService";
import { SUPERVISOR_TABS, matchesSupervisorTab } from "./monitoringUtils";

interface MonitoringSupervisorTabsProps {
  selectedSupervisorTab: string;
  onSelectSupervisorTab: (tabId: string) => void;
  routes: RegionalRouteItem[];
}

export const MonitoringSupervisorTabs: React.FC<
  MonitoringSupervisorTabsProps
> = ({ selectedSupervisorTab, onSelectSupervisorTab, routes }) => {
  return (
    <section
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        overflowX: "auto",
        paddingBottom: "4px",
      }}
      className="no-scrollbar"
    >
      {SUPERVISOR_TABS.map((tab) => {
        const isSelected = selectedSupervisorTab === tab.id;
        const count = routes.filter((r) =>
          matchesSupervisorTab(r.supervisorName, tab.id),
        ).length;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectSupervisorTab(tab.id)}
            style={{
              padding: "8px 14px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: 700,
              whiteSpace: "nowrap",
              border: isSelected
                ? "1px solid var(--accent-color, #3ECF8E)"
                : "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
              background: isSelected
                ? "var(--accent-color, #3ECF8E)"
                : "var(--card-bg, rgba(23, 23, 23, 0.85))",
              color: isSelected ? "#ffffff" : "var(--text-secondary, #8b8b8b)",
              cursor: "pointer",
              transition: "all 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
              boxShadow: isSelected
                ? "0 4px 12px rgba(62, 207, 142, 0.25)"
                : "none",
            }}
          >
            {tab.label} ({count})
          </button>
        );
      })}
    </section>
  );
};
