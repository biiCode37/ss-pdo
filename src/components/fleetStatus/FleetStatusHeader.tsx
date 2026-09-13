import { X } from "lucide-react";
import { TEXT_FLEET_STATUS } from "@/constants/texts";

interface FleetStatusHeaderProps {
  routeCode: string;
  renopsTarget: number;
  selectedDate: string;
  dayLabel?: string;
  onClose: () => void;
}

export function FleetStatusHeader({
  routeCode,
  renopsTarget,
  selectedDate,
  dayLabel,
  onClose,
}: FleetStatusHeaderProps) {
  return (
    <>
      {/* Top Handle Bar */}
      <div style={{ display: "flex", justifyContent: "center", paddingTop: "10px" }}>
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
          padding: "12px 20px",
          borderBottom: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <h3
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "-0.2px",
              }}
            >
              {TEXT_FLEET_STATUS.MODAL.HEADER_TITLE(routeCode)}
            </h3>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "6px",
                background: "rgba(62, 207, 142, 0.14)",
                color: "var(--accent-color, #3ECF8E)",
                border: "1px solid rgba(62, 207, 142, 0.3)",
              }}
            >
              {TEXT_FLEET_STATUS.MODAL.TARGET_RENOPS(renopsTarget)}
            </span>
          </div>
          <span
            style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              fontWeight: 500,
            }}
          >
            {selectedDate} {dayLabel ? `• ${dayLabel}` : ""}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            padding: "6px",
            cursor: "pointer",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title={TEXT_FLEET_STATUS.MODAL.CLOSE_TITLE}
        >
          <X size={20} />
        </button>
      </div>
    </>
  );
}
