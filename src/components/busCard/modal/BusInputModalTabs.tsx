import React from "react";
import { TEXT_ALERTS } from "@/constants/texts";
import type { ModalTab } from "./useBusInputForm";

interface BusInputModalTabsProps {
  activeTab: ModalTab;
  onSelectTab: (tab: ModalTab) => void;
}

// refact_222: kontrol segmen bersama (.ui-segmented), tanpa ikon dekoratif.
const TABS: Array<{ id: ModalTab; label: string }> = [
  { id: "shift1", label: TEXT_ALERTS.BUS_INPUT_MODAL.TAB_SHIFT_1 },
  { id: "shift2", label: TEXT_ALERTS.BUS_INPUT_MODAL.TAB_SHIFT_2 },
  { id: "trip", label: TEXT_ALERTS.BUS_INPUT_MODAL.TAB_RITASE },
  { id: "notes", label: TEXT_ALERTS.BUS_INPUT_MODAL.TAB_KET },
];

export const BusInputModalTabs: React.FC<BusInputModalTabsProps> = ({
  activeTab,
  onSelectTab,
}) => (
  <div role="tablist" className="ui-segmented bus-modal-tabs">
    {TABS.map((tab) => (
      <button
        key={tab.id}
        role="tab"
        type="button"
        className="ui-segmented-btn"
        aria-selected={activeTab === tab.id}
        onClick={() => onSelectTab(tab.id)}
      >
        {tab.label}
      </button>
    ))}
  </div>
);
