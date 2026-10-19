import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { X, Bus, Navigation, MessageSquare, Users, AlertTriangle, Repeat } from "lucide-react";
import type { BusData } from "../services/googleSheets";
import { calculateUnitMetrics } from "../utils/unitAnalytics";
import { safeFormatNumber } from "../utils/numberUtils";
import { getFormattedDateBadge } from "../utils/analytics";
import { DailyToaTrendCard } from "./DailyToaTrendCard";
import { TEXT_UNIT_DETAIL } from "../constants/texts";
import { ModalShell } from "./ui/ModalShell";

interface Props {
  unit: string;
  busData: BusData[] | null;
  targetTrip?: { pergi: number; pulang: number } | null;
  sheetId: string;
  selectedTab: string;
  activeMonth?: number;
  activeYear?: number;
  accRange?: {
    startDay?: number;
    endDay?: number;
    startMonth?: number;
    endMonth?: number;
    startYear?: number;
    endYear?: number;
  } | null;
  onClose: () => void;
}

export function UnitDetailModal({
  unit,
  busData,
  targetTrip,
  sheetId,
  selectedTab,
  activeMonth,
  activeYear,
  accRange,
  onClose,
}: Props) {
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const isClosingRef = useRef(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dateBadge = useMemo(() => {
    return getFormattedDateBadge(selectedTab, activeMonth, activeYear, accRange);
  }, [selectedTab, activeMonth, activeYear, accRange]);

  const metrics = useMemo(() => {
    return calculateUnitMetrics(busData || [], unit);
  }, [busData, unit]);

  const handleDismiss = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);
    closeTimerRef.current = setTimeout(() => {
      onClose();
    }, 220);
  }, [onClose]);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => setIsMounted(true));
    return () => {
      cancelAnimationFrame(frameId);
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, []);

  const pergiNum = parseInt(metrics.tripPergi || "0", 10);
  const pulangNum = parseInt(metrics.tripPulang || "0", 10);
  const hasTargetTrip = Boolean(targetTrip && targetTrip.pergi > 0);
  const isTargetAchieved = hasTargetTrip && pergiNum >= (targetTrip?.pergi || 0) && pulangNum >= (targetTrip?.pulang || 0);

  return (
    <ModalShell
      isOpen={true}
      onClose={handleDismiss}
      id="unit_detail_modal"
      backHandlerId="unit_detail_modal"
      ariaLabelledBy="unit-detail-modal-title"
      zIndex={99999}
      backdropClassName="modal-overlay unit-detail-modal-overlay"
      backdropStyle={{
        alignItems: "flex-end",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        opacity: isClosing ? 0 : isMounted ? 1 : 0,
        transition:
          "opacity 0.22s cubic-bezier(0.32, 0.72, 0, 1), background-color 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
        willChange: "opacity, background-color",
      }}
      contentClassName="glass unit-detail-modal-content"
      contentStyle={{
        width: "100%",
        maxWidth: "560px",
        maxHeight: "min(88dvh, 760px)",
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderTopLeftRadius: "24px",
        borderTopRightRadius: "24px",
        padding: "16px 20px calc(24px + env(safe-area-inset-bottom, 0px)) 20px",
        background: "var(--card-bg, #171717)",
        border: "1px solid var(--card-border, rgba(255, 255, 255, 0.1))",
        borderBottom: "none",
        boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.5)",
        transform:
          isClosing || !isMounted
            ? "translateY(100%) scale(0.95)"
            : "translateY(0px) scale(1)",
        transition: "transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      {/* Top Handle Bar for visual mobile indicator */}
      <div
        className="unit-detail-modal-handle"
        style={{
          display: "flex",
          justifyContent: "center",
          paddingBottom: "4px",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "4px",
            borderRadius: "2px",
            background: "var(--card-border, rgba(255, 255, 255, 0.2))",
          }}
        />
      </div>

      {/* Header Bar: Unit Title, Subtitle & Dismiss Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: "10px",
          borderBottom: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(14, 165, 233, 0.1))",
              color: "var(--accent-color, #38bdf8)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
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
              id="unit-detail-modal-title"
              style={{
                margin: 0,
                fontSize: "1.2rem",
                fontWeight: 800,
                color: "var(--text-primary, #ededed)",
                letterSpacing: "-0.01em",
              }}
            >
              {unit}
            </h3>
            <span style={{ fontSize: "0.78rem", color: "var(--text-secondary, #94a3b8)", fontWeight: 500 }}>
              {TEXT_UNIT_DETAIL.TITLE}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label={TEXT_UNIT_DETAIL.MODAL_CLOSE_ARIA}
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "10px",
            background: "var(--input-bg, rgba(255, 255, 255, 0.05))",
            border: "1px solid var(--card-border, rgba(255, 255, 255, 0.12))",
            color: "var(--text-secondary, #94a3b8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.18s cubic-bezier(0.32, 0.72, 0, 1)",
            flexShrink: 0,
          }}
        >
          <X size={17} />
        </button>
      </div>

      {/* Row 1: Symmetrical Shift Split (Shift 1 & Shift 2 Side-by-Side) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {/* Card 1: Shift 1 */}
        <div
          style={{
            padding: "12px",
            borderRadius: "14px",
            background: "var(--shift1-bg, rgba(2, 132, 199, 0.08))",
            border: "1px solid var(--shift1-border, rgba(2, 132, 199, 0.2))",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--shift1-color, #38bdf8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>{TEXT_UNIT_DETAIL.SHIFT_1_TITLE}</span>
            {dateBadge && (
              <span
                style={{
                  fontSize: "0.68rem",
                  padding: "1px 6px",
                  borderRadius: "6px",
                  background: "var(--shift1-bg, rgba(2, 132, 199, 0.15))",
                  color: "var(--shift1-color, #38bdf8)",
                  border: "1px solid var(--shift1-border, rgba(2, 132, 199, 0.3))",
                  fontWeight: 600,
                }}
              >
                {dateBadge}
              </span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
              <Navigation size={13} style={{ color: "var(--shift1-color, #38bdf8)", flexShrink: 0 }} />
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--shift1-color, #38bdf8)" }}>
                {safeFormatNumber(metrics.kmShift1)}
              </span>
              <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #94a3b8)", fontWeight: 600 }}>
                {TEXT_UNIT_DETAIL.KM_UNIT}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
              <Users size={13} style={{ color: "var(--text-secondary, #94a3b8)", flexShrink: 0 }} />
              <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary, #ededed)" }}>
                {safeFormatNumber(metrics.totalShift1Pnp)}
              </span>
              <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #94a3b8)", fontWeight: 500 }}>
                {TEXT_UNIT_DETAIL.PASSENGER_UNIT}
              </span>
            </div>

            {metrics.manualShift1 > 0 && (
              <div
                style={{
                  fontSize: "0.68rem",
                  color: "var(--text-secondary, #94a3b8)",
                  background: "var(--input-bg, rgba(0, 0, 0, 0.2))",
                  padding: "2px 6px",
                  borderRadius: "6px",
                  border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
                  marginTop: "2px",
                }}
              >
                {TEXT_UNIT_DETAIL.TOA_LABEL} <strong>{safeFormatNumber(metrics.toaShift1)}</strong> | {TEXT_UNIT_DETAIL.MANUAL_LABEL} <strong>{safeFormatNumber(metrics.manualShift1)}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Shift 2 */}
        <div
          style={{
            padding: "12px",
            borderRadius: "14px",
            background: "var(--shift2-bg, rgba(126, 34, 206, 0.08))",
            border: "1px solid var(--shift2-border, rgba(126, 34, 206, 0.2))",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--shift2-color, #c084fc)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>{TEXT_UNIT_DETAIL.SHIFT_2_TITLE}</span>
            {dateBadge && (
              <span
                style={{
                  fontSize: "0.68rem",
                  padding: "1px 6px",
                  borderRadius: "6px",
                  background: "var(--shift2-bg, rgba(126, 34, 206, 0.15))",
                  color: "var(--shift2-color, #c084fc)",
                  border: "1px solid var(--shift2-border, rgba(126, 34, 206, 0.3))",
                  fontWeight: 600,
                }}
              >
                {dateBadge}
              </span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
              <Navigation size={13} style={{ color: "var(--shift2-color, #c084fc)", flexShrink: 0 }} />
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--shift2-color, #c084fc)" }}>
                {safeFormatNumber(metrics.kmShift2)}
              </span>
              <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #94a3b8)", fontWeight: 600 }}>
                {TEXT_UNIT_DETAIL.KM_UNIT}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
              <Users size={13} style={{ color: "var(--text-secondary, #94a3b8)", flexShrink: 0 }} />
              <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary, #ededed)" }}>
                {safeFormatNumber(metrics.totalShift2Pnp)}
              </span>
              <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #94a3b8)", fontWeight: 500 }}>
                {TEXT_UNIT_DETAIL.PASSENGER_UNIT}
              </span>
            </div>

            {metrics.manualShift2 > 0 && (
              <div
                style={{
                  fontSize: "0.68rem",
                  color: "var(--text-secondary, #94a3b8)",
                  background: "var(--input-bg, rgba(0, 0, 0, 0.2))",
                  padding: "2px 6px",
                  borderRadius: "6px",
                  border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
                  marginTop: "2px",
                }}
              >
                {TEXT_UNIT_DETAIL.TOA_LABEL} <strong>{safeFormatNumber(metrics.toaShift2)}</strong> | {TEXT_UNIT_DETAIL.MANUAL_LABEL} <strong>{safeFormatNumber(metrics.manualShift2)}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Unified 3-Column Glanceable Metric Strip (Akumulasi Total) */}
      <div
        style={{
          padding: "12px 14px",
          borderRadius: "14px",
          background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
          border: "1px solid var(--card-border, rgba(255, 255, 255, 0.1))",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div
          style={{
            fontSize: "0.78rem",
            fontWeight: 700,
            color: "var(--accent-color, #38bdf8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{TEXT_UNIT_DETAIL.TOTAL_TITLE}</span>
          {dateBadge && (
            <span
              style={{
                fontSize: "0.68rem",
                padding: "1px 6px",
                borderRadius: "6px",
                background: "rgba(56, 189, 248, 0.12)",
                color: "var(--accent-color, #38bdf8)",
                border: "1px solid rgba(56, 189, 248, 0.25)",
                fontWeight: 600,
              }}
            >
              {dateBadge}
            </span>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", textAlign: "center" }}>
          {/* Kolom 1: RITASE */}
          <div
            style={{
              padding: "8px 6px",
              borderRadius: "10px",
              background: "rgba(0, 0, 0, 0.15)",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
            }}
          >
            <span
              style={{
                fontSize: "9px",
                fontWeight: 700,
                color: "var(--text-secondary, #94a3b8)",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              {TEXT_UNIT_DETAIL.STRIP_RITASE}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
              <Repeat size={12} style={{ color: "var(--accent-color, #38bdf8)" }} />
              <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary, #ededed)" }}>
                {metrics.tripPergi || "0"}/{metrics.tripPulang || "0"}
              </span>
            </div>
            {hasTargetTrip && (
              <span
                style={{
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  padding: "1px 4px",
                  borderRadius: "4px",
                  backgroundColor: isTargetAchieved ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                  color: isTargetAchieved ? "#10b981" : "#f59e0b",
                  border: `1px solid ${isTargetAchieved ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"}`,
                }}
              >
                {isTargetAchieved
                  ? TEXT_UNIT_DETAIL.TARGET_ACHIEVED
                  : `${pergiNum}/${pulangNum}`}
              </span>
            )}
          </div>

          {/* Kolom 2: TOTAL KM */}
          <div
            style={{
              padding: "8px 6px",
              borderRadius: "10px",
              background: "rgba(0, 0, 0, 0.15)",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
            }}
          >
            <span
              style={{
                fontSize: "9px",
                fontWeight: 700,
                color: "var(--text-secondary, #94a3b8)",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              {TEXT_UNIT_DETAIL.STRIP_TOTAL_KM}
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
              <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--shift1-color, #38bdf8)" }}>
                {safeFormatNumber(metrics.totalKm)}
              </span>
              <span style={{ fontSize: "0.65rem", color: "var(--text-secondary, #94a3b8)", fontWeight: 600 }}>
                {TEXT_UNIT_DETAIL.KM_UNIT}
              </span>
            </div>
          </div>

          {/* Kolom 3: PELANGGAN */}
          <div
            style={{
              padding: "8px 6px",
              borderRadius: "10px",
              background: "rgba(0, 0, 0, 0.15)",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
            }}
          >
            <span
              style={{
                fontSize: "9px",
                fontWeight: 700,
                color: "var(--text-secondary, #94a3b8)",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              {TEXT_UNIT_DETAIL.STRIP_PASSENGERS}
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
              <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--shift2-color, #c084fc)" }}>
                {safeFormatNumber(metrics.totalPassengers)}
              </span>
              <span style={{ fontSize: "0.65rem", color: "var(--text-secondary, #94a3b8)", fontWeight: 500 }}>
                {TEXT_UNIT_DETAIL.PASSENGER_UNIT}
              </span>
            </div>
          </div>
        </div>

        {metrics.manualShift1 + metrics.manualShift2 > 0 && (
          <div
            style={{
              fontSize: "0.7rem",
              color: "var(--text-secondary, #94a3b8)",
              background: "var(--input-bg, rgba(0, 0, 0, 0.2))",
              padding: "3px 8px",
              borderRadius: "6px",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
              textAlign: "center",
            }}
          >
            {TEXT_UNIT_DETAIL.TOTAL_TOA_LABEL} <strong>{safeFormatNumber(metrics.totalToa)}</strong> | {TEXT_UNIT_DETAIL.TOTAL_MANUAL_LABEL} <strong>{safeFormatNumber(metrics.manualShift1 + metrics.manualShift2)}</strong>
          </div>
        )}
      </div>

      {/* Row 3: Grafik Tren Harian Per Unit */}
      <div>
        <DailyToaTrendCard
          sheetId={sheetId}
          selectedTab={selectedTab}
          unitFilter={unit}
        />
      </div>

      {/* Row 4: Riwayat Catatan Operasional */}
      <div
        style={{
          padding: "14px",
          borderRadius: "14px",
          background: "var(--card-bg, #1e293b)",
          border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
        }}
      >
        <div
          style={{
            fontSize: "0.82rem",
            fontWeight: 700,
            marginBottom: "10px",
            color: "var(--text-primary, #ededed)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <MessageSquare size={16} style={{ color: "var(--accent-color, #38bdf8)" }} />
          <span>{TEXT_UNIT_DETAIL.NOTES_SECTION_TITLE}</span>
        </div>

        {metrics.notes.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {metrics.notes.map((n, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  fontSize: "0.75rem",
                  color: "var(--warning-text, #f59e0b)",
                  fontWeight: 600,
                  background: "var(--warning-badge-bg, rgba(245, 158, 11, 0.1))",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  borderLeft: "3px solid var(--warning-color, #f59e0b)",
                }}
              >
                <AlertTriangle
                  size={14}
                  style={{ color: "var(--warning-color, #f59e0b)", flexShrink: 0, marginTop: "1px" }}
                />
                <span style={{ lineHeight: 1.4, wordBreak: "break-word", textTransform: "uppercase" }}>
                  {n}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p
            style={{
              margin: 0,
              fontSize: "0.78rem",
              color: "var(--text-secondary, #94a3b8)",
              fontStyle: "italic",
            }}
          >
            {TEXT_UNIT_DETAIL.NO_NOTES}
          </p>
        )}
      </div>
    </ModalShell>
  );
}

export default UnitDetailModal;
