import type { BusData } from "@/services/googleSheets";
import { cleanShiftNote } from "@/utils/keteranganUtils";
import { TEXT_FLEET_STATUS } from "@/constants/texts";
import type { BrushMode, StatusMap } from "./types";

interface FleetStatusGridProps {
  buses: BusData[];
  unitMap: StatusMap;
  currentShift: 1 | 2;
  activeBrush: BrushMode;
  isLocked?: boolean;
  onCardTap: (rowIndex: number) => void;
}

export function FleetStatusGrid({
  buses,
  unitMap,
  currentShift,
  activeBrush,
  isLocked = false,
  onCardTap,
}: FleetStatusGridProps) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px 20px",
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "contain",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
          gap: "10px",
        }}
      >
        {buses.map((bus) => {
          const unitVal = unitMap.get(bus.rowIndex);
          const note = cleanShiftNote(currentShift === 1 ? unitVal?.s1 : unitVal?.s2);
          const upper = note.toUpperCase();

          const isSgo = !upper;
          const isOff = upper.includes("OFF");
          const isSo = upper.includes("SO");
          const isTo = upper.includes("TO");
          const isOther = !isSgo && !isOff && !isSo && !isTo;

          let cardBg = "var(--input-bg, rgba(255, 255, 255, 0.03))";
          let cardBorder = "1px solid var(--border-color, rgba(255, 255, 255, 0.08))";
          let badgeBg = "rgba(16, 185, 129, 0.12)";
          let badgeColor = "#10b981";
          let badgeText = "SGO";

          if (isOff) {
            cardBg = "rgba(245, 158, 11, 0.08)";
            cardBorder = "1px solid rgba(245, 158, 11, 0.35)";
            badgeBg = "rgba(245, 158, 11, 0.2)";
            badgeColor = "#f59e0b";
            badgeText = "OFF";
          } else if (isSo) {
            cardBg = "rgba(168, 85, 247, 0.08)";
            cardBorder = "1px solid rgba(168, 85, 247, 0.35)";
            badgeBg = "rgba(168, 85, 247, 0.2)";
            badgeColor = "#c084fc";
            badgeText = "SO";
          } else if (isTo) {
            cardBg = "rgba(239, 68, 68, 0.08)";
            cardBorder = "1px solid rgba(239, 68, 68, 0.35)";
            badgeBg = "rgba(239, 68, 68, 0.2)";
            badgeColor = "#ef4444";
            badgeText = "T.O";
          } else if (isOther) {
            cardBg = "rgba(14, 165, 233, 0.08)";
            cardBorder = "1px solid rgba(14, 165, 233, 0.35)";
            badgeBg = "rgba(14, 165, 233, 0.2)";
            badgeColor = "#38bdf8";
            badgeText = note.length > 10 ? `${note.slice(0, 10)}...` : note;
          }

          return (
            <div
              key={bus.rowIndex}
              data-unit={bus.unit}
              className="fleet-status-bus-card"
              onClick={() => onCardTap(bus.rowIndex)}
              style={{
                background: cardBg,
                border: cardBorder,
                borderRadius: "12px",
                padding: "10px 12px",
                cursor: isLocked ? "default" : "pointer",
                userSelect: "none",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "72px",
                transition: "all 0.15s ease",
                opacity: isLocked ? 0.85 : 1,
              }}
              title={isLocked ? TEXT_FLEET_STATUS.LOCK.LOCKED_TOOLTIP : TEXT_FLEET_STATUS.MODAL.APPLY_STATUS_TITLE(activeBrush)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.2px",
                  }}
                >
                  {bus.unit}
                </span>

                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 800,
                    padding: "2px 6px",
                    borderRadius: "6px",
                    background: badgeBg,
                    color: badgeColor,
                  }}
                >
                  {badgeText}
                </span>
              </div>

              {/* Sub-note */}
              {note ? (
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    marginTop: "6px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontWeight: 500,
                  }}
                >
                  {note}
                </span>
              ) : (
                <span
                  style={{
                    fontSize: "11px",
                    color: "rgba(255, 255, 255, 0.25)",
                    marginTop: "6px",
                    fontWeight: 500,
                  }}
                >
                  {TEXT_FLEET_STATUS.MODAL.SGO_FULL_LABEL}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
