import { memo } from "react";
import { safeFormatNumber } from "../utils/numberUtils";
import { slugifyUnitId } from "../utils/analytics";
import { FormattedNoteText } from "./FormattedNoteText";
import {
  Bus,
  Navigation,
  Users,
  Repeat,
  AlertTriangle,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
} from "lucide-react";
import type { UnitSummaryItem, UnitShiftStatus } from "../utils/unitAnalytics";

interface Props {
  item: UnitSummaryItem;
  targetTrip?: { pergi: number; pulang: number } | null;
  /** Callback stabil berparameter unit — memo(UnitCard) jadi efektif */
  onSelectUnit: (unit: string) => void;
}

function renderStatusBadge(status: UnitShiftStatus) {
  switch (status) {
    case "FULL_COMPLETE":
      return (
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: "8px",
            backgroundColor: "rgba(34, 197, 94, 0.15)",
            color: "var(--success-color, #22c55e)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
          <span>S1 & S2 Lengkap</span>
        </span>
      );
    case "SHIFT_1_ONLY":
      return (
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: "8px",
            backgroundColor: "rgba(245, 158, 11, 0.15)",
            color: "#f59e0b",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>Negatif Data S2</span>
        </span>
      );
    case "SHIFT_2_ONLY":
      return (
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: "8px",
            backgroundColor: "rgba(245, 158, 11, 0.15)",
            color: "#f59e0b",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>Negatif Data S1</span>
        </span>
      );
    case "INCOMPLETE":
      return (
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: "8px",
            backgroundColor: "rgba(245, 158, 11, 0.15)",
            color: "#f59e0b",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <Clock size={14} style={{ flexShrink: 0 }} />
          <span>Parsial</span>
        </span>
      );
    case "EMPTY":
    default:
      return (
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: "8px",
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            color: "var(--danger-color, #ef4444)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <XCircle size={14} style={{ flexShrink: 0 }} />
          <span>Negatif Data S1 & S2</span>
        </span>
      );
  }
}

function UnitCardComponent({ item, targetTrip, onSelectUnit }: Props) {
  // BUG-61: Kartu interaktif kini dapat diakses keyboard & screen reader
  const handleClick = () => onSelectUnit(item.unit);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelectUnit(item.unit);
    }
  };

  const pergiVal = (item.tripPergi || "").trim();
  const pulangVal = (item.tripPulang || "").trim();
  const hasTrip = pergiVal !== "" || pulangVal !== "";
  const pergiNum = parseInt(pergiVal || "0", 10);
  const pulangNum = parseInt(pulangVal || "0", 10);

  const targetP = targetTrip?.pergi ?? 0;
  const targetQ = targetTrip?.pulang ?? 0;
  const hasTarget = Boolean(targetTrip && targetP > 0 && targetQ > 0);

  const isTargetAchieved = hasTarget && hasTrip && pergiNum >= targetP && pulangNum >= targetQ;
  const isBelowTarget = hasTarget && hasTrip && (pergiNum < targetP || pulangNum < targetQ);
  const isImbalanced = hasTrip && pergiVal !== pulangVal;

  return (
    <div
      id={`unit-card-${slugifyUnitId(item.unit)}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Lihat detail unit ${item.unit}`}
      className="bus-card glass"
      style={{
        padding: "12px 14px",
        borderRadius: "14px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        transition:
          "transform 0.18s cubic-bezier(0.32, 0.72, 0, 1), box-shadow 0.18s cubic-bezier(0.32, 0.72, 0, 1)",
      }}
    >
      {/* Line 1: Unit Title + Detailed Shift Status Badge */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: 800,
            fontSize: "15px",
          }}
        >
          <Bus
            size={17}
            style={{ color: "var(--accent-color)", flexShrink: 0 }}
          />
          <span>{item.unit}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          {renderStatusBadge(item.shiftStatus)}
        </div>
      </div>

      {/* Line 2: Inline Compact Stats Badges (KM, Pnp, Trip) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          fontSize: "12px",
          color: "var(--text-secondary)",
        }}
      >
        {/* Total KM */}
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <Navigation size={13} style={{ color: "var(--shift1-color)", flexShrink: 0 }} />
          <strong style={{ color: "var(--shift1-color)", fontWeight: 800 }}>
            {safeFormatNumber(item.totalKm)}
          </strong>{" "}
          <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
            KM
          </span>
        </div>

        <span style={{ opacity: 0.3 }}>|</span>

        {/* Total Pnp */}
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <Users size={13} style={{ color: "var(--shift1-color)", flexShrink: 0 }} />
          <strong style={{ color: "var(--text-primary)", fontWeight: 800 }}>
            {safeFormatNumber(item.totalPassengers)}
          </strong>{" "}
          <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
            Pnp
          </span>
        </div>

        <span style={{ opacity: 0.3 }}>|</span>

        {/* Capaian Trip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
          title={
            isBelowTarget
              ? `Kurang Ritase: ${pergiVal || "0"}/${pulangVal || "0"} Rit (Target Rute: ${targetP}/${targetQ} Rit)`
              : isTargetAchieved
                ? `Target Tercapai: ${pergiVal || "0"}/${pulangVal || "0"} Rit`
                : isImbalanced
                  ? `Trip Tidak Seimbang: ${pergiVal || "0"}/${pulangVal || "0"} Rit`
                  : undefined
          }
        >
          <Repeat
            size={13}
            style={{
              color: isBelowTarget
                ? "var(--warning-text, #f59e0b)"
                : isTargetAchieved
                  ? "#10b981"
                  : isImbalanced
                    ? "#f97316"
                    : hasTrip
                      ? "var(--accent-color)"
                      : "var(--text-secondary)",
              flexShrink: 0,
            }}
          />
          {hasTrip ? (
            <strong
              style={{
                color: isBelowTarget
                  ? "var(--warning-text, #f59e0b)"
                  : isTargetAchieved
                    ? "#10b981"
                    : isImbalanced
                      ? "#f97316"
                      : "var(--text-primary)",
                fontWeight: 800,
              }}
            >
              {isBelowTarget ? `⚠️ ${pergiVal || "0"}/${pulangVal || "0"}` : `${pergiVal || "0"}/${pulangVal || "0"}`}
            </strong>
          ) : (
            <span style={{ color: "var(--text-secondary)", opacity: 0.7 }}>0/0</span>
          )}{" "}
          <span
            style={{
              fontSize: "11px",
              color: isBelowTarget
                ? "var(--warning-text, #f59e0b)"
                : isTargetAchieved
                  ? "#10b981"
                  : "var(--text-secondary)",
            }}
          >
            Rit
          </span>
        </div>
      </div>

      {/* Line 3: Value Catatan Keterangan (Tanpa Pembungkus) */}
      {item.notes && item.notes.length > 0 && (
        <div
          style={{
            fontSize: "11px",
            color: "var(--warning-text)",
            fontWeight: 600,
            letterSpacing: "0.01em",
            display: "flex",
            gap: "8px",
            alignItems: "flex-start",
          }}
        >
          <AlertTriangle
            size={13}
            style={{ color: "#f97316", flexShrink: 0, marginTop: "2px" }}
          />
          <div
            style={{
              flex: 1,
              lineHeight: "1.3",
              wordBreak: "break-word",
              textTransform: "uppercase",
            }}
          >
            <FormattedNoteText text={item.notes[0]} />
          </div>
        </div>
      )}
    </div>
  );
}

export const UnitCard = memo(UnitCardComponent);
