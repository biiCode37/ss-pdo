import { X, Lock } from "lucide-react";
import { TEXT_FLEET_STATUS } from "@/constants/texts";

interface FleetStatusHeaderProps {
  routeCode: string;
  renopsTarget: number;
  targetRenops: number;
  onTargetRenopsChange: (val: number) => void;
  selectedDate: string;
  dayLabel?: string;
  isLocked?: boolean;
  confirmedBy?: string;
  confirmedAt?: string;
  onClose: () => void;
}

export function FleetStatusHeader({
  routeCode,
  renopsTarget,
  targetRenops,
  onTargetRenopsChange,
  selectedDate,
  dayLabel,
  isLocked = false,
  confirmedBy,
  confirmedAt,
  onClose,
}: FleetStatusHeaderProps) {
  const formattedTime = confirmedAt
    ? new Date(confirmedAt).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

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
        <div style={{ flex: 1, minWidth: 0 }}>
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

            {/* Editable or Locked Target Renops */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "6px",
                background: "rgba(62, 207, 142, 0.14)",
                color: "var(--accent-color, #3ECF8E)",
                border: "1px solid rgba(62, 207, 142, 0.3)",
              }}
            >
              <span>{TEXT_FLEET_STATUS.TARGET_RENOPS_INPUT.LABEL}</span>
              {isLocked ? (
                <span>{targetRenops || renopsTarget} {TEXT_FLEET_STATUS.TARGET_RENOPS_INPUT.UNIT_SUFFIX}</span>
              ) : (
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={targetRenops}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    onTargetRenopsChange(isNaN(parsed) ? 0 : Math.max(0, parsed));
                  }}
                  title={TEXT_FLEET_STATUS.TARGET_RENOPS_INPUT.EDIT_TITLE}
                  style={{
                    width: "38px",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px dashed var(--accent-color, #3ECF8E)",
                    color: "inherit",
                    fontFamily: "inherit",
                    fontSize: "11px",
                    fontWeight: 800,
                    textAlign: "center",
                    outline: "none",
                    padding: "0 2px",
                  }}
                />
              )}
              {!isLocked && (
                <span>{TEXT_FLEET_STATUS.TARGET_RENOPS_INPUT.UNIT_SUFFIX}</span>
              )}
            </div>

            {/* Locked Badge */}
            {isLocked && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: "6px",
                  background: "rgba(239, 68, 68, 0.15)",
                  color: "#f87171",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                }}
                title={TEXT_FLEET_STATUS.LOCK.LOCKED_TOOLTIP}
              >
                <Lock size={10} />
                <span>
                  {confirmedBy
                    ? TEXT_FLEET_STATUS.LOCK.LOCKED_BADGE(formattedTime || "Waktu", confirmedBy)
                    : TEXT_FLEET_STATUS.LOCK.LOCKED_BTN_LABEL}
                </span>
              </span>
            )}
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
