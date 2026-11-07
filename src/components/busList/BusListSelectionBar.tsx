import React from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { TEXT_DASHBOARD } from "@/constants/texts";

interface BusListSelectionBarProps {
  selectedCount: number;
  isSubmitting: boolean;
  onApply: () => void;
  onCancel: () => void;
}

/**
 * Bar aksi mengambang mode "Pilih Unit": jumlah terpilih, Set Trip Terpilih, Batal.
 * Diposisikan di atas BottomNav agar tidak menutupi navigasi.
 */
export const BusListSelectionBar: React.FC<BusListSelectionBarProps> = ({
  selectedCount,
  isSubmitting,
  onApply,
  onCancel,
}) => {
  const canApply = selectedCount > 0 && !isSubmitting;

  // Portal ke body agar position:fixed tidak terpengaruh ancestor ber-transform.
  return createPortal(
    <div
      role="region"
      aria-label={TEXT_DASHBOARD.BUS_LIST.SELECTED_ACTION_BAR_ARIA}
      data-testid="selection-action-bar"
      style={{
        position: "fixed",
        left: "12px",
        right: "12px",
        bottom: "calc(84px + env(safe-area-inset-bottom, 0px))",
        zIndex: 51,
        maxWidth: "520px",
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 8px 8px 14px",
        borderRadius: "14px",
        background: "var(--color-surface-raised)",
        border: "1px solid var(--color-border-subtle)",
        boxShadow: "0 12px 32px -8px var(--color-shadow)",
        animation: "fadeIn 0.2s cubic-bezier(0.32, 0.72, 0, 1) forwards",
      }}
    >
      <span
        aria-live="polite"
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: "13px",
          fontWeight: 700,
          color: "var(--color-text-primary)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {TEXT_DASHBOARD.BUS_LIST.SELECTED_COUNT(selectedCount)}
      </span>
      <button
        type="button"
        data-testid="btn-cancel-selection"
        onClick={onCancel}
        disabled={isSubmitting}
        style={{
          height: "36px",
          padding: "0 12px",
          borderRadius: "10px",
          border: "1px solid var(--color-border-subtle)",
          background: "transparent",
          color: "var(--color-text-secondary)",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {TEXT_DASHBOARD.BUS_LIST.SELECTED_CANCEL_BTN}
      </button>
      <button
        type="button"
        data-testid="btn-apply-selected-trip"
        onClick={onApply}
        disabled={!canApply}
        style={{
          height: "36px",
          padding: "0 14px",
          borderRadius: "10px",
          border: "none",
          background: "var(--color-action-primary-bg)",
          color: "var(--color-action-primary-fg)",
          fontSize: "13px",
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          whiteSpace: "nowrap",
          cursor: canApply ? "pointer" : "not-allowed",
          opacity: canApply ? 1 : 0.55,
        }}
      >
        {isSubmitting && <Loader2 size={16} className="spinner" />}
        {TEXT_DASHBOARD.BUS_LIST.SELECTED_APPLY_BTN}
      </button>
    </div>,
    document.body,
  );
};
