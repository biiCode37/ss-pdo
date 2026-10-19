import React from "react";
import { Gauge, Bus, FileText } from "lucide-react";
import { TEXT_ALERTS } from "@/constants/texts";
import type { ModalTab } from "./useBusInputForm";

interface BusInputModalTabsProps {
  activeTab: ModalTab;
  onSelectTab: (tab: ModalTab) => void;
}

export const BusInputModalTabs: React.FC<BusInputModalTabsProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const tabs: Array<{ id: ModalTab; label: string; icon: React.ReactNode }> = [
    {
      id: "shift1",
      label: TEXT_ALERTS.BUS_INPUT_MODAL.TAB_SHIFT_1,
      icon: <Gauge size={13} />,
    },
    {
      id: "shift2",
      label: TEXT_ALERTS.BUS_INPUT_MODAL.TAB_SHIFT_2,
      icon: <Gauge size={13} />,
    },
    {
      id: "trip",
      label: TEXT_ALERTS.BUS_INPUT_MODAL.TAB_RITASE,
      icon: <Bus size={13} />,
    },
    {
      id: "notes",
      label: TEXT_ALERTS.BUS_INPUT_MODAL.TAB_KET,
      icon: <FileText size={13} />,
    },
  ];

  return (
    <div
      role="tablist"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "4px",
        padding: "3px",
        background: "var(--input-bg, rgba(255, 255, 255, 0.04))",
        border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
        borderRadius: "12px",
        margin: "10px 0 2px 0",
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
              height: "34px",
              padding: "0 6px",
              borderRadius: "9px",
              fontSize: "0.8rem",
              fontWeight: isActive ? 700 : 500,
              background: isActive
                ? "var(--card-bg, #1e293b)"
                : "transparent",
              color: isActive
                ? "var(--accent-color, #38bdf8)"
                : "var(--text-secondary, #94a3b8)",
              border: isActive
                ? "1px solid rgba(56, 189, 248, 0.25)"
                : "1px solid transparent",
              boxShadow: isActive
                ? "0 2px 6px rgba(0, 0, 0, 0.2)"
                : "none",
              cursor: "pointer",
              transition: "all 0.18s cubic-bezier(0.32, 0.72, 0, 1)",
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
