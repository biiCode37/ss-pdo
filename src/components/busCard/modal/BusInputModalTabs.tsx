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
  const getTabStyle = (tab: ModalTab) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "8px 4px",
    borderRadius: "8px",
    fontSize: "0.82rem",
    fontWeight: activeTab === tab ? 700 : 500,
    background: activeTab === tab ? "rgba(56, 189, 248, 0.15)" : "transparent",
    color: activeTab === tab ? "#38bdf8" : "var(--text-secondary, #94a3b8)",
    border: activeTab === tab ? "1px solid rgba(56, 189, 248, 0.3)" : "none",
    cursor: "pointer",
  });

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "4px",
        padding: "8px 0",
        borderBottom: "1px solid var(--border-color, rgba(255, 255, 255, 0.06))",
      }}
    >
      <button
        type="button"
        onClick={() => onSelectTab("shift1")}
        style={getTabStyle("shift1")}
      >
        <Gauge size={14} />
        <span>Shift 1</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab("shift2")}
        style={getTabStyle("shift2")}
      >
        <Gauge size={14} />
        <span>Shift 2</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab("trip")}
        style={getTabStyle("trip")}
      >
        <Bus size={14} />
        <span>{TEXT_ALERTS.BUS_INPUT_MODAL.TAB_RITASE}</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab("notes")}
        style={getTabStyle("notes")}
      >
        <FileText size={14} />
        <span>{TEXT_ALERTS.BUS_INPUT_MODAL.TAB_KET}</span>
      </button>
    </div>
  );
};
