import { memo } from "react";
import { safeFormatNumber } from "../utils/numberUtils";
import { slugifyUnitId } from "../utils/analytics";
import { FormattedNoteText } from "./FormattedNoteText";
import { classifyUnitKeterangan, shouldShowKeteranganStrip } from "../utils/keteranganUtils";
import { parseIndonesianNumber } from "../utils/numberUtils";
import { UnitStatusBadge } from "./ui/UnitStatusBadge";
import { UNIT_STATUS_CARD_CLASS } from "./ui/unitStatusClass";
import { TEXT_DASHBOARD } from "../constants/texts";
import {
  Bus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
} from "lucide-react";
import type { UnitSummaryItem, UnitShiftStatus } from "../utils/unitAnalytics";

interface Props {
  item: UnitSummaryItem;
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
            backgroundColor: "rgba(34, 197, 94, 0.12)",
            color: "var(--success-color, #22c55e)",
            border: "1px solid rgba(34, 197, 94, 0.25)",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <CheckCircle2 size={13} style={{ flexShrink: 0 }} />
          <span>{TEXT_DASHBOARD.UNIT_CARD.STATUS_FULL_COMPLETE}</span>
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
            backgroundColor: "rgba(245, 158, 11, 0.12)",
            color: "#f59e0b",
            border: "1px solid rgba(245, 158, 11, 0.25)",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <AlertCircle size={13} style={{ flexShrink: 0 }} />
          <span>{TEXT_DASHBOARD.UNIT_CARD.STATUS_SHIFT_1_ONLY}</span>
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
            backgroundColor: "rgba(245, 158, 11, 0.12)",
            color: "#f59e0b",
            border: "1px solid rgba(245, 158, 11, 0.25)",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <AlertCircle size={13} style={{ flexShrink: 0 }} />
          <span>{TEXT_DASHBOARD.UNIT_CARD.STATUS_SHIFT_2_ONLY}</span>
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
            backgroundColor: "rgba(245, 158, 11, 0.12)",
            color: "#f59e0b",
            border: "1px solid rgba(245, 158, 11, 0.25)",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <Clock size={13} style={{ flexShrink: 0 }} />
          <span>{TEXT_DASHBOARD.UNIT_CARD.STATUS_INCOMPLETE}</span>
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
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            color: "var(--text-secondary)",
            border: "1px solid var(--card-border)",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <XCircle size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
          <span>{TEXT_DASHBOARD.UNIT_CARD.STATUS_EMPTY}</span>
        </span>
      );
  }
}

function UnitCardComponent({ item, onSelectUnit }: Props) {
  const noteText = item.keterangan || (item.notes && item.notes[0]) || "";
  // Warna kartu = riwayat keterangan sepanjang hari (S1+S2)
  const unitStatus = classifyUnitKeterangan(noteText);

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
  // ponytail: 1 Ritase = 2 Trip (PP)
  const ritase = (parseIndonesianNumber(pergiVal, 0) + parseIndonesianNumber(pulangVal, 0)) / 2;

  return (
    <div
      id={`unit-card-${slugifyUnitId(item.unit)}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={TEXT_DASHBOARD.UNIT_CARD.ARIA_VIEW_DETAIL(item.unit)}
      className={`bus-card glass ${UNIT_STATUS_CARD_CLASS[unitStatus]}`.trim()}
      style={{
        padding: 0,
        borderRadius: "16px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
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
          padding: "12px 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: 800,
            fontSize: "16px",
          }}
        >
          <Bus
            size={16}
            style={{ color: "var(--accent-color)", flexShrink: 0 }}
          />
          <span className="bus-card-unit">{item.unit}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <UnitStatusBadge keterangan={noteText} />
          {(unitStatus === "NORMAL" || unitStatus === "KENDALA") &&
            renderStatusBadge(item.shiftStatus)}
        </div>
      </div>

      {/* Line 2: Modern 3-Column Glanceable Metric Strip */}
      <div className="bus-metric-strip">
        {/* Kolom 1: Ritase */}
        <div className="bus-metric-col">
          <span className="bus-metric-label">{TEXT_DASHBOARD.UNIT_CARD.LABEL_RITASE}</span>
          <span
            className="bus-metric-value"
            style={{ color: hasTrip ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}
          >
            {hasTrip ? (
              <>
                {String(ritase)}
                <span className="bus-metric-unit">{TEXT_DASHBOARD.UNIT_CARD.RIT_UNIT}</span>
              </>
            ) : (
              <span className="bus-metric-empty">-</span>
            )}
          </span>
        </div>

        {/* Kolom 2: Total KM Tempuh */}
        <div className="bus-metric-col">
          <span className="bus-metric-label">{TEXT_DASHBOARD.UNIT_CARD.LABEL_KM}</span>
          <span className="bus-metric-value" style={{ color: "var(--shift1-color)" }}>
            {item.totalKm > 0 ? (
              <>
                {safeFormatNumber(item.totalKm)}
                <span className="bus-metric-unit">{TEXT_DASHBOARD.UNIT_CARD.KM_UNIT}</span>
              </>
            ) : (
              <span className="bus-metric-empty">-</span>
            )}
          </span>
        </div>

        {/* Kolom 3: Total Pelanggan */}
        <div className="bus-metric-col">
          <span className="bus-metric-label">{TEXT_DASHBOARD.UNIT_CARD.LABEL_PASSENGER}</span>
          <span className="bus-metric-value" style={{ color: "var(--text-primary)" }}>
            {item.totalPassengers > 0 ? (
              <>
                {safeFormatNumber(item.totalPassengers)}
                <span className="bus-metric-unit">{TEXT_DASHBOARD.UNIT_CARD.PNP_UNIT}</span>
              </>
            ) : (
              <span className="bus-metric-empty">-</span>
            )}
          </span>
        </div>
      </div>

      {/* Line 3: Value Catatan Keterangan (disupresi jika hanya status tetap murni seperti OFF / TO EVDAL) */}
      {shouldShowKeteranganStrip(noteText) && (
        <div
          style={{
            padding: "8px 16px 10px 16px",
            borderTop: "1px solid var(--card-border)",
            fontSize: "11.5px",
            color: "var(--warning-text)",
            fontWeight: 600,
            letterSpacing: "0.01em",
            display: "flex",
            gap: "8px",
            alignItems: "flex-start",
            background: "rgba(245, 158, 11, 0.04)",
          }}
        >
          <AlertTriangle
            size={13}
            style={{ color: "var(--orange-color, #f97316)", flexShrink: 0, marginTop: "2px" }}
          />
          <div
            style={{
              flex: 1,
              lineHeight: "1.35",
              wordBreak: "break-word",
              textTransform: "uppercase",
            }}
          >
            <FormattedNoteText text={noteText} />
          </div>
        </div>
      )}
    </div>
  );
}

export const UnitCard = memo(UnitCardComponent);
