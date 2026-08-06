import { memo } from "react";
import {
  Bus,
  Navigation,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
} from "lucide-react";
import type { UnitSummaryItem, UnitShiftStatus } from "../utils/unitAnalytics";

interface Props {
  item: UnitSummaryItem;
  onClick: () => void;
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

function UnitCardComponent({ item, onClick }: Props) {
  return (
    <div
      onClick={onClick}
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

      {/* Line 2: Inline Compact Stats Badges (KM & Pnp) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          fontSize: "12px",
          color: "var(--text-secondary)",
        }}
      >
        {/* Total KM */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Navigation size={13} style={{ color: "#38bdf8", flexShrink: 0 }} />
          <strong style={{ color: "#38bdf8", fontWeight: 800 }}>
            {item.totalKm.toLocaleString("id-ID")}
          </strong>{" "}
          <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
            KM
          </span>
        </div>

        <span style={{ opacity: 0.3 }}>|</span>

        {/* Total Pnp */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Users size={13} style={{ color: "#38bdf8", flexShrink: 0 }} />
          <strong style={{ color: "var(--text-primary)", fontWeight: 800 }}>
            {item.totalPassengers.toLocaleString("id-ID")}
          </strong>{" "}
          <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
            Pnp
          </span>
        </div>
      </div>

      {/* Line 3: Value Catatan Keterangan (Tanpa Pembungkus) */}
      {item.notes && item.notes.length > 0 && (
        <div
          style={{
            fontSize: "11px",
            color: "#fdba74",
            fontWeight: 600,
            letterSpacing: "0.01em",
            display: "flex",
            gap: "6px",
            alignItems: "center",
          }}
        >
          <AlertTriangle
            size={13}
            style={{ color: "#f97316", flexShrink: 0 }}
          />
          <span
            style={{
              lineHeight: "1.3",
              wordBreak: "break-word",
              textTransform: "uppercase",
            }}
          >
            {item.notes[0]}
          </span>
        </div>
      )}
    </div>
  );
}

export const UnitCard = memo(UnitCardComponent);
