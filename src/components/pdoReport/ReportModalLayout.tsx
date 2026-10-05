import React from "react";
import { Bus, X } from "lucide-react";
import { TEXT_COMMON, TEXT_PDO_FORM } from "@/constants/texts";
import { ModalShell } from "@/components/ui/ModalShell";
import { ReportStatusBadge } from "./ReportStatusBadge";

export interface ReportModalLayoutProps {
  isOpen: boolean;
  onClose?: () => void;
  routeCode: string;
  status: "draft" | "submitted" | "verified";
  children: React.ReactNode;
}

export const ReportModalLayout: React.FC<ReportModalLayoutProps> = ({
  isOpen,
  onClose,
  routeCode,
  status,
  children,
}) => {
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      keepMounted={true}
      title={TEXT_PDO_FORM.CARD_TITLE}
      id="route-operational-report-modal"
      backHandlerId="route_operational_report_sheet"
      zIndex={99999}
      backdropClassName="modal-overlay operational-report-modal-overlay"
      backdropStyle={{
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        alignItems: "flex-end",
        touchAction: "none",
        animation: "fadeIn 0.2s ease-out",
      }}
      contentClassName="glass pdo-operational-card"
      contentStyle={{
        width: "100%",
        maxWidth: "580px",
        maxHeight: "min(90dvh, 760px)",
        overflowY: "auto",
        padding:
          "16px 20px calc(28px + env(safe-area-inset-bottom, 16px)) 20px",
        borderTopLeftRadius: "24px",
        borderTopRightRadius: "24px",
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        backgroundColor: "var(--bg-card, #171717)",
        border: "1px solid var(--border-color)",
        borderBottom: "none",
        boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.5)",
        animation: "slideUp 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "contain",
      }}
    >
      {/* Top Handle Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          paddingBottom: "12px",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "4px",
            borderRadius: "2px",
            backgroundColor: "var(--text-secondary)",
            opacity: 0.35,
          }}
        />
      </div>

      {/* Modal Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: "12px",
          marginBottom: "16px",
          borderBottom:
            "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "rgba(62, 207, 142, 0.12)",
              color: "var(--accent-color, #3ECF8E)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Bus size={18} />
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.2px",
              }}
            >
              {TEXT_PDO_FORM.CARD_TITLE}
            </h3>
            <span
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                fontWeight: 500,
              }}
            >
              {TEXT_PDO_FORM.CARD_SUBTITLE(routeCode)}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ReportStatusBadge status={status} />
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                padding: "4px",
                cursor: "pointer",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title={TEXT_COMMON.BUTTONS.CLOSE}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {children}
    </ModalShell>
  );
};
