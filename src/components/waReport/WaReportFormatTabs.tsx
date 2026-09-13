import { AlertTriangle, FileText } from "lucide-react";
import { TEXT_WA_REPORT } from "@/constants/texts";
import type { RegionalRouteItem } from "@/services/allRouteMonitoringService";
import type { FormatType, SupervisorFilter } from "./types";

interface WaReportFormatTabsProps {
  formatType: FormatType;
  onSelectFormat: (type: FormatType) => void;
  selectedShift: 1 | 2;
  onSelectShift: (shift: 1 | 2) => void;
  supervisorFilter: SupervisorFilter;
  onSelectSupervisor: (sup: SupervisorFilter) => void;
  unsubmittedCount: number;
  totalRoutesCount: number;
  isFormat3Blocked: boolean;
  unconfirmedRoutes: RegionalRouteItem[];
}

export function WaReportFormatTabs({
  formatType,
  onSelectFormat,
  selectedShift,
  onSelectShift,
  supervisorFilter,
  onSelectSupervisor,
  unsubmittedCount,
  totalRoutesCount,
  isFormat3Blocked,
  unconfirmedRoutes,
}: WaReportFormatTabsProps) {
  return (
    <>
      {/* Warning Banner if unsubmitted routes (Only for Format 1 & 2) */}
      {unsubmittedCount > 0 && formatType !== "format3" && (
        <div
          style={{
            background: "rgba(245, 158, 11, 0.12)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "12px",
            padding: "10px 12px",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "12px",
            color: "#d97706",
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>
            {TEXT_WA_REPORT.WARNING_UNSUBMITTED(unsubmittedCount, totalRoutesCount)}
          </span>
        </div>
      )}

      {/* Tab Format Selector - 3 Equal Columns Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "6px",
          background: "var(--input-bg, rgba(255, 255, 255, 0.05))",
          border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
          borderRadius: "12px",
          padding: "4px",
          marginBottom: "10px",
        }}
      >
        <button
          type="button"
          onClick={() => onSelectFormat("format1")}
          style={{
            padding: "6px 4px",
            borderRadius: "8px",
            border: formatType === "format1" ? "1px solid rgba(56, 189, 248, 0.5)" : "1px solid transparent",
            background: formatType === "format1" ? "rgba(56, 189, 248, 0.15)" : "transparent",
            color: formatType === "format1" ? "#38bdf8" : "var(--text-secondary, #94a3b8)",
            boxShadow: formatType === "format1" ? "0 2px 8px rgba(0,0,0,0.2)" : "none",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "2px",
            transition: "all 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11.5px", fontWeight: 700 }}>
            <FileText size={12} />
            <span>{TEXT_WA_REPORT.FORMAT_TABS.FORMAT_1}</span>
          </div>
          <span style={{ fontSize: "9.5px", opacity: 0.8, fontWeight: 500 }}>
            {TEXT_WA_REPORT.FORMAT_TABS.FORMAT_1_SUB}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectFormat("format2")}
          style={{
            padding: "6px 4px",
            borderRadius: "8px",
            border: formatType === "format2" ? "1px solid rgba(56, 189, 248, 0.5)" : "1px solid transparent",
            background: formatType === "format2" ? "rgba(56, 189, 248, 0.15)" : "transparent",
            color: formatType === "format2" ? "#38bdf8" : "var(--text-secondary, #94a3b8)",
            boxShadow: formatType === "format2" ? "0 2px 8px rgba(0,0,0,0.2)" : "none",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "2px",
            transition: "all 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11.5px", fontWeight: 700 }}>
            <FileText size={12} />
            <span>{TEXT_WA_REPORT.FORMAT_TABS.FORMAT_2}</span>
          </div>
          <span style={{ fontSize: "9.5px", opacity: 0.8, fontWeight: 500 }}>
            {TEXT_WA_REPORT.FORMAT_TABS.FORMAT_2_SUB}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectFormat("format3")}
          style={{
            padding: "6px 4px",
            borderRadius: "8px",
            border: formatType === "format3" ? "1px solid rgba(56, 189, 248, 0.5)" : "1px solid transparent",
            background: formatType === "format3" ? "rgba(56, 189, 248, 0.15)" : "transparent",
            color: formatType === "format3" ? "#38bdf8" : "var(--text-secondary, #94a3b8)",
            boxShadow: formatType === "format3" ? "0 2px 8px rgba(0,0,0,0.2)" : "none",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "2px",
            transition: "all 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11.5px", fontWeight: 700 }}>
            <FileText size={12} />
            <span>{TEXT_WA_REPORT.FORMAT_TABS.FORMAT_3}</span>
          </div>
          <span style={{ fontSize: "9.5px", opacity: 0.8, fontWeight: 500 }}>
            {TEXT_WA_REPORT.FORMAT_TABS.FORMAT_3_SUB}
          </span>
        </button>
      </div>

      {/* Sub-selector Shift for Format 3 - Adaptive Semantic Shift Colors */}
      {formatType === "format3" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
            background: "var(--input-bg, rgba(255, 255, 255, 0.05))",
            border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
            padding: "4px",
            borderRadius: "12px",
            marginBottom: "10px",
          }}
        >
          <button
            type="button"
            onClick={() => onSelectShift(1)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: selectedShift === 1 ? "1px solid var(--shift1-color, #38bdf8)" : "1px solid transparent",
              background: selectedShift === 1 ? "var(--shift1-bg, rgba(56, 189, 248, 0.18))" : "transparent",
              color: selectedShift === 1 ? "var(--shift1-color, #38bdf8)" : "var(--text-secondary, #94a3b8)",
              fontSize: "12px",
              fontWeight: selectedShift === 1 ? 700 : 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <span>{TEXT_WA_REPORT.SHIFT_SELECTOR.SHIFT_1}</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectShift(2)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: selectedShift === 2 ? "1px solid var(--shift2-color, #c084fc)" : "1px solid transparent",
              background: selectedShift === 2 ? "var(--shift2-bg, rgba(192, 132, 252, 0.18))" : "transparent",
              color: selectedShift === 2 ? "var(--shift2-color, #c084fc)" : "var(--text-secondary, #94a3b8)",
              fontSize: "12px",
              fontWeight: selectedShift === 2 ? 700 : 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <span>{TEXT_WA_REPORT.SHIFT_SELECTOR.SHIFT_2}</span>
          </button>
        </div>
      )}

      {/* Filter Lingkup Korlap - Only for Format 1 & 2 */}
      {formatType !== "format3" && (
        <div
          style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "8px", marginBottom: "10px" }}
          className="no-scrollbar"
        >
          {[
            { id: "ALL", label: TEXT_WA_REPORT.SUPERVISOR_TABS.ALL(18) },
            { id: "RANTO", label: TEXT_WA_REPORT.SUPERVISOR_TABS.RANTO(6) },
            { id: "ABDUL", label: TEXT_WA_REPORT.SUPERVISOR_TABS.ABDUL(6) },
            { id: "MOAMAR", label: TEXT_WA_REPORT.SUPERVISOR_TABS.MOAMAR(6) },
          ].map((item) => {
            const active = supervisorFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSupervisor(item.id as SupervisorFilter)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "16px",
                  border: active ? "1px solid #2563eb" : "1px solid var(--card-border, rgba(255, 255, 255, 0.12))",
                  background: active ? "#2563eb" : "var(--input-bg, rgba(255, 255, 255, 0.05))",
                  color: active ? "#ffffff" : "var(--text-secondary, #94a3b8)",
                  fontSize: "11px",
                  fontWeight: active ? 600 : 500,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Format 3 Blocking Alert - Compact, High Aesthetic */}
      {isFormat3Blocked && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "12px",
            padding: "10px 12px",
            marginBottom: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f87171", fontWeight: 700, fontSize: "12px" }}>
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span>{TEXT_WA_REPORT.BLOCKING_TITLE(selectedShift)}</span>
          </div>
          <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary, #94a3b8)", lineHeight: 1.35 }}>
            {TEXT_WA_REPORT.BLOCKING_DESC(unconfirmedRoutes.length)}
          </p>
          <div
            style={{
              display: "flex",
              gap: "6px",
              overflowX: "auto",
              paddingBottom: "2px",
              marginTop: "4px",
            }}
            className="no-scrollbar"
          >
            {unconfirmedRoutes.map((r) => (
              <span
                key={r.id}
                style={{
                  fontSize: "10.5px",
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: "6px",
                  background: "rgba(239, 68, 68, 0.2)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  color: "#f87171",
                  whiteSpace: "nowrap",
                  letterSpacing: "0.2px",
                }}
              >
                {r.routeCode}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
