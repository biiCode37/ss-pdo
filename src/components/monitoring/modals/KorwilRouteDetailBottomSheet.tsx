// ponytail: Implementasi modal bottom sheet mandiri berbasis vanilla CSS variables tanpa dependency modal eksternal
import React, { useEffect, useMemo } from "react";
import {
  X,
  ExternalLink,
  Award,
  Bus,
  Users,
  Route as RouteIcon,
  Zap,
} from "lucide-react";
import type { RegionalRouteItem } from "@/services/allRouteMonitoringService";
import { TEXT_MONITORING } from "@/constants/texts";
import { acquireScrollLock } from "@/utils/scrollLockCoordinator";
import { formatNumber, formatDecimal, extractRouteTroubledUnits } from "../monitoringUtils";
import { getRoutePeakRecord } from "@/constants/routeRecords";

export interface KorwilRouteDetailBottomSheetProps {
  route: RegionalRouteItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectRoute?: (routeCode: string) => void;
}

export const KorwilRouteDetailBottomSheet: React.FC<KorwilRouteDetailBottomSheetProps> = ({
  route,
  isOpen,
  onClose,
  onSelectRoute,
}) => {
  const troubledUnits = useMemo(() => {
    if (!isOpen || !route) return [];
    return extractRouteTroubledUnits(route);
  }, [isOpen, route]);

  // Coordinated body scroll lock saat sheet terbuka
  useEffect(() => {
    if (!isOpen) return;
    const releaseLock = acquireScrollLock();
    return () => {
      releaseLock();
    };
  }, [isOpen]);

  if (!isOpen || !route) return null;

  const t = TEXT_MONITORING.KORWIL_ROUTE_SHEET;
  const labels = t.LABELS;

  // 1. Kesiapan Armada
  const renops = route.totalRenops || route.defaultRenops || 0;
  const realops = route.totalRealops || 0;
  const fleetRatio = renops > 0 ? (realops / renops) * 100 : 0;

  // 2. Rincian Shift 1 & 2
  const toaS1 = route.toaShift1 || 0;
  const manualS1 = route.manualShift1 || 0;
  const totalS1 = route.totalShift1 || (toaS1 + manualS1);

  const toaS2 = route.toaShift2 || 0;
  const manualS2 = route.manualShift2 || 0;
  const totalS2 = route.totalShift2 || (toaS2 + manualS2);

  const totalPax = route.todayPassengers || (totalS1 + totalS2);
  const targetPax = route.targetPax ?? route.targetHk ?? 0;
  const paxPct =
    route.paxPercentage !== undefined
      ? Number(route.paxPercentage)
      : targetPax > 0
      ? (totalPax / targetPax) * 100
      : 0;

  // 3. Jarak & Ritase PP
  const kmTempuh = route.totalKm || 0;
  const kmPerBus =
    route.kmPerBus !== undefined
      ? Number(route.kmPerBus)
      : route.achievementKm !== undefined
      ? Number(route.achievementKm)
      : realops > 0
      ? kmTempuh / realops
      : 0;

  const totalRitasePp =
    route.totalRitasePp !== undefined
      ? route.totalRitasePp
      : route.kmBaku > 0
      ? kmTempuh / route.kmBaku
      : route.totalTrips
      ? route.totalTrips / 2
      : 0;

  const ritasePerBus =
    route.ritasePerBus !== undefined
      ? Number(route.ritasePerBus)
      : realops > 0
      ? totalRitasePp / realops
      : 0;

  // 4. Rasio Efisiensi & Produktivitas
  const targetPaxPerKm =
    route.targetPaxPerKm !== undefined
      ? Number(route.targetPaxPerKm)
      : route.targetPassengersPerKm !== undefined
      ? Number(route.targetPassengersPerKm)
      : 1.5;

  const paxPerKm =
    route.paxPerKm !== undefined
      ? Number(route.paxPerKm)
      : route.passengersPerKm !== undefined
      ? Number(route.passengersPerKm)
      : kmTempuh > 0
      ? totalPax / kmTempuh
      : 0;

  const paxPerKmPct =
    route.paxPerKmPercentage !== undefined
      ? Number(route.paxPerKmPercentage)
      : targetPaxPerKm > 0
      ? (paxPerKm / targetPaxPerKm) * 100
      : 0;

  const paxPerBus =
    route.paxPerBus !== undefined
      ? Math.round(route.paxPerBus)
      : route.passengersPerBus !== undefined
      ? Math.round(route.passengersPerBus)
      : realops > 0
      ? Math.round(totalPax / realops)
      : 0;

  const peakFallback = getRoutePeakRecord(route.routeCode);
  const bestRecord = route.bestRecord || peakFallback?.peak || 0;
  const bestRecordDate = route.bestRecordDate || peakFallback?.date || "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.TITLE(route.routeCode)}
      data-testid="korwil-route-detail-bottom-sheet"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        overscrollBehavior: "contain",
      }}
      onClick={onClose}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "540px",
          maxHeight: "88vh",
          background: "var(--card-bg, #18181b)",
          color: "var(--text-primary, #ffffff)",
          borderTopLeftRadius: "24px",
          borderTopRightRadius: "24px",
          border: "1px solid var(--card-border, rgba(255, 255, 255, 0.1))",
          boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.45)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "slideUp 0.28s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: "10px",
            paddingBottom: "4px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "4px",
              borderRadius: "2px",
              background: "rgba(255, 255, 255, 0.25)",
            }}
          />
        </div>

        {/* Header Rute */}
        <div
          style={{
            padding: "12px 18px",
            borderBottom: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 800,
                  background: "rgba(62, 207, 142, 0.15)",
                  color: "var(--accent-color, #3ECF8E)",
                  border: "1px solid rgba(62, 207, 142, 0.3)",
                }}
              >
                {route.routeCode}
              </span>
              <h2
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--text-primary, #ededed)",
                }}
              >
                {t.TITLE(route.routeCode)}
              </h2>
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-secondary, #888)",
                marginTop: "4px",
              }}
            >
              {t.SUBTITLE(
                route.routeName || route.operatorName || "Mikrotrans",
                route.supervisorName || "-"
              )}
            </div>
          </div>

          <button
            type="button"
            data-testid="korwil-sheet-close-btn"
            onClick={onClose}
            style={{
              background: "var(--input-bg, rgba(255, 255, 255, 0.06))",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.1))",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-secondary, #888)",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content Body (Single Scroll Vertical) */}
        <div
          className="no-scrollbar"
          style={{
            padding: "16px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {/* Hero Highlight Card: Rekor Pelanggan Tertinggi (Kolom AS & AT) */}
          {bestRecord > 0 && (
            <div
              style={{
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(62, 207, 142, 0.05))",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                borderRadius: "14px",
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {/* Header Title di Dalam Card */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Award size={15} style={{ color: "var(--accent-color, #10B981)" }} />
                <span
                  style={{
                    fontSize: "11.5px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                    color: "var(--accent-color, #10B981)",
                  }}
                >
                  {t.RECORD_BADGE}
                </span>
              </div>

              {/* Baris Bawah: Nilai Rekor (Kiri) & Hari/Tanggal (Kanan Pojok Sejajar) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
              >
                {/* Sisi Kiri: Nilai Rekor */}
                <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--accent-color, #3ECF8E)" }}>
                  {formatNumber(bestRecord)}{" "}
                  <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary, #ededed)" }}>
                    {labels.UNIT_PAX}
                  </span>
                </div>

                {/* Sisi Kanan (Sejajar): Hari dan Tanggal */}
                {bestRecordDate && (
                  <span
                    data-testid="korwil-sheet-record-date"
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--accent-color, #10B981)",
                      background: "rgba(16, 185, 129, 0.12)",
                      padding: "4px 10px",
                      borderRadius: "8px",
                      border: "1px solid rgba(16, 185, 129, 0.25)",
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {bestRecordDate}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* GRUP 1: Kesiapan Armada (RENOPS & REALOPS) */}
          <div
            style={{
              background: "var(--card-bg, rgba(255, 255, 255, 0.03))",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
              borderRadius: "14px",
              padding: "12px 14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <Bus size={16} style={{ color: "var(--accent-color, #3ECF8E)" }} />
              <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--text-primary, #ededed)" }}>
                {t.SECTIONS.FLEET}
              </h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              <div style={{ background: "var(--input-bg, rgba(255, 255, 255, 0.03))", padding: "8px 10px", borderRadius: "10px" }}>
                <span style={{ fontSize: "10.5px", color: "var(--text-secondary, #888)", display: "block" }}>
                  {labels.RENOPS}
                </span>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary, #ededed)" }}>
                  {formatNumber(renops)} <span style={{ fontSize: "10px", fontWeight: 400 }}>{labels.UNIT_BUS}</span>
                </span>
              </div>

              <div style={{ background: "var(--input-bg, rgba(255, 255, 255, 0.03))", padding: "8px 10px", borderRadius: "10px" }}>
                <span style={{ fontSize: "10.5px", color: "var(--text-secondary, #888)", display: "block" }}>
                  {labels.REALOPS}
                </span>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary, #ededed)" }}>
                  {formatNumber(realops)} <span style={{ fontSize: "10px", fontWeight: 400 }}>{labels.UNIT_BUS}</span>
                </span>
              </div>

              <div style={{ background: "var(--input-bg, rgba(255, 255, 255, 0.03))", padding: "8px 10px", borderRadius: "10px" }}>
                <span style={{ fontSize: "10.5px", color: "var(--text-secondary, #888)", display: "block" }}>
                  {labels.FLEET_RATIO}
                </span>
                <span style={{ fontSize: "14px", fontWeight: 800, color: fleetRatio >= 95 ? "#10B981" : "#F59E0B" }}>
                  {formatDecimal(fleetRatio)}%
                </span>
              </div>
            </div>
            {troubledUnits.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px" }}>
                {troubledUnits.map((u, idx) => (
                  <div
                    key={`${u.unit}-${idx}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "5px 8px",
                      borderRadius: "8px",
                      background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
                      border: "1px solid var(--card-border, rgba(255, 255, 255, 0.05))",
                      gap: "8px",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: "11.5px", fontWeight: 800, color: "var(--text-primary, #ededed)" }}>
                        {u.unit}
                      </span>
                      <span
                        style={{
                          fontSize: "10.5px",
                          color: "var(--text-secondary, #888)",
                          marginTop: "1px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={u.note}
                      >
                        {u.note}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 700,
                          background: u.badgeBg,
                          color: u.badgeColor,
                          padding: "2px 5px",
                          borderRadius: "4px",
                        }}
                      >
                        {u.statusCode}
                      </span>
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 600,
                          color: "var(--text-secondary, #888)",
                          padding: "2px 4px",
                          borderRadius: "4px",
                          background: "rgba(255, 255, 255, 0.06)",
                        }}
                      >
                        {u.shifts.map((s) => `S${s}`).join(" • ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* GRUP 2: Rincian Penumpang per Shift & Target Capaian */}
          <div
            style={{
              background: "var(--card-bg, rgba(255, 255, 255, 0.03))",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
              borderRadius: "14px",
              padding: "12px 14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <Users size={16} style={{ color: "var(--accent-color, #3ECF8E)" }} />
              <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--text-primary, #ededed)" }}>
                {t.SECTIONS.SHIFT_BREAKDOWN}
              </h3>
            </div>

            {/* Shift 1 & Shift 2 Side-by-Side */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", marginBottom: "10px" }}>
              {/* Shift 1 */}
              <div
                style={{
                  background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
                  border: "1px solid var(--card-border, rgba(255, 255, 255, 0.05))",
                  borderRadius: "10px",
                  padding: "10px",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-primary, #ededed)", marginBottom: "6px" }}>
                  {labels.SHIFT_1}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary, #888)", marginBottom: "2px" }}>
                  <span>{labels.TOA}:</span>
                  <span style={{ fontWeight: 600, color: "var(--text-primary, #ededed)" }}>{formatNumber(toaS1)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary, #888)", marginBottom: "4px" }}>
                  <span>{labels.MANUAL}:</span>
                  <span style={{ fontWeight: 600, color: "var(--text-primary, #ededed)" }}>{formatNumber(manualS1)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", borderTop: "1px dashed var(--card-border, rgba(255, 255, 255, 0.1))", paddingTop: "4px" }}>
                  <span style={{ fontWeight: 700 }}>{labels.TOTAL}:</span>
                  <span style={{ fontWeight: 800, color: "var(--accent-color, #3ECF8E)" }}>{formatNumber(totalS1)}</span>
                </div>
              </div>

              {/* Shift 2 */}
              <div
                style={{
                  background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
                  border: "1px solid var(--card-border, rgba(255, 255, 255, 0.05))",
                  borderRadius: "10px",
                  padding: "10px",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-primary, #ededed)", marginBottom: "6px" }}>
                  {labels.SHIFT_2}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary, #888)", marginBottom: "2px" }}>
                  <span>{labels.TOA}:</span>
                  <span style={{ fontWeight: 600, color: "var(--text-primary, #ededed)" }}>{formatNumber(toaS2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary, #888)", marginBottom: "4px" }}>
                  <span>{labels.MANUAL}:</span>
                  <span style={{ fontWeight: 600, color: "var(--text-primary, #ededed)" }}>{formatNumber(manualS2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", borderTop: "1px dashed var(--card-border, rgba(255, 255, 255, 0.1))", paddingTop: "4px" }}>
                  <span style={{ fontWeight: 700 }}>{labels.TOTAL}:</span>
                  <span style={{ fontWeight: 800, color: "var(--accent-color, #3ECF8E)" }}>{formatNumber(totalS2)}</span>
                </div>
              </div>
            </div>

            {/* Total Pelanggan & Target */}
            <div
              style={{
                background: "rgba(62, 207, 142, 0.08)",
                border: "1px solid rgba(62, 207, 142, 0.2)",
                borderRadius: "10px",
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <div>
                <span style={{ fontSize: "10.5px", color: "var(--text-secondary, #888)", display: "block" }}>
                  {labels.TOTAL_PAX}
                </span>
                <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--accent-color, #3ECF8E)" }}>
                  {formatNumber(totalPax)} <span style={{ fontSize: "11px", fontWeight: 500 }}>{labels.UNIT_PAX}</span>
                </span>
              </div>

              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "10.5px", color: "var(--text-secondary, #888)", display: "block" }}>
                  {labels.TARGET_PAX}: {formatNumber(targetPax)}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "9999px",
                    background: paxPct >= 80 ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                    color: paxPct >= 80 ? "#10B981" : "#F59E0B",
                    display: "inline-block",
                    marginTop: "2px",
                  }}
                >
                  {formatDecimal(paxPct)}% {labels.PAX_ACHIEVEMENT}
                </span>
              </div>
            </div>
          </div>

          {/* GRUP 3: Jarak & Ritase PP */}
          <div
            style={{
              background: "var(--card-bg, rgba(255, 255, 255, 0.03))",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
              borderRadius: "14px",
              padding: "12px 14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <RouteIcon size={16} style={{ color: "var(--accent-color, #3ECF8E)" }} />
              <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--text-primary, #ededed)" }}>
                {t.SECTIONS.DISTANCE_RITASE}
              </h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
              {/* KM Tempuh */}
              <div style={{ background: "var(--input-bg, rgba(255, 255, 255, 0.03))", padding: "8px 10px", borderRadius: "10px" }}>
                <span style={{ fontSize: "10.5px", color: "var(--text-secondary, #888)", display: "block" }}>
                  {labels.KM_TEMPUH}
                </span>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary, #ededed)" }}>
                  {Number.isInteger(kmTempuh) ? formatNumber(kmTempuh) : formatDecimal(kmTempuh, 2)}{" "}
                  <span style={{ fontSize: "10px", fontWeight: 400 }}>{labels.UNIT_KM}</span>
                </span>
              </div>

              {/* KM per Bus */}
              <div style={{ background: "var(--input-bg, rgba(255, 255, 255, 0.03))", padding: "8px 10px", borderRadius: "10px" }}>
                <span style={{ fontSize: "10.5px", color: "var(--text-secondary, #888)", display: "block" }}>
                  {labels.KM_PER_BUS}
                </span>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary, #ededed)" }}>
                  {formatDecimal(kmPerBus, 2)} <span style={{ fontSize: "10px", fontWeight: 400 }}>km/bus</span>
                </span>
              </div>

              {/* Total Ritase PP */}
              <div style={{ background: "var(--input-bg, rgba(255, 255, 255, 0.03))", padding: "8px 10px", borderRadius: "10px" }}>
                <span style={{ fontSize: "10.5px", color: "var(--text-secondary, #888)", display: "block" }}>
                  {labels.TOTAL_RITASE_PP}
                </span>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary, #ededed)" }}>
                  {Number.isInteger(totalRitasePp) ? formatNumber(totalRitasePp) : formatDecimal(totalRitasePp, 1)}{" "}
                  <span style={{ fontSize: "10px", fontWeight: 400 }}>{labels.UNIT_RIT}</span>
                </span>
              </div>

              {/* Ritase per Bus */}
              <div style={{ background: "var(--input-bg, rgba(255, 255, 255, 0.03))", padding: "8px 10px", borderRadius: "10px" }}>
                <span style={{ fontSize: "10.5px", color: "var(--text-secondary, #888)", display: "block" }}>
                  {labels.RITASE_PER_BUS}
                </span>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary, #ededed)" }}>
                  {formatDecimal(ritasePerBus, 1)} <span style={{ fontSize: "10px", fontWeight: 400 }}>rit/bus</span>
                </span>
              </div>
            </div>
          </div>

          {/* GRUP 4: Rasio Efisiensi & Produktivitas */}
          <div
            style={{
              background: "var(--card-bg, rgba(255, 255, 255, 0.03))",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
              borderRadius: "14px",
              padding: "12px 14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <Zap size={16} style={{ color: "var(--accent-color, #3ECF8E)" }} />
              <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--text-primary, #ededed)" }}>
                {t.SECTIONS.EFFICIENCY}
              </h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
              {/* Pelanggan / KM Riil */}
              <div style={{ background: "var(--input-bg, rgba(255, 255, 255, 0.03))", padding: "8px 10px", borderRadius: "10px" }}>
                <span style={{ fontSize: "10.5px", color: "var(--text-secondary, #888)", display: "block" }}>
                  {labels.PAX_PER_KM}
                </span>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--accent-color, #3ECF8E)" }}>
                  {formatDecimal(paxPerKm, 3)} <span style={{ fontSize: "10px", fontWeight: 400 }}>{labels.UNIT_PAX_PER_KM}</span>
                </span>
              </div>

              {/* Target Pelanggan / KM */}
              <div style={{ background: "var(--input-bg, rgba(255, 255, 255, 0.03))", padding: "8px 10px", borderRadius: "10px" }}>
                <span style={{ fontSize: "10.5px", color: "var(--text-secondary, #888)", display: "block" }}>
                  {labels.TARGET_PAX_PER_KM}
                </span>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary, #ededed)" }}>
                  {formatDecimal(targetPaxPerKm)}{" "}
                  <span style={{ fontSize: "10px", fontWeight: 500, color: paxPerKmPct >= 50 ? "#10B981" : "#F59E0B" }}>
                    ({formatDecimal(paxPerKmPct)}%)
                  </span>
                </span>
              </div>

              {/* Pelanggan per Bus */}
              <div
                style={{
                  gridColumn: "span 2",
                  background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
                  padding: "8px 10px",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: "11px", color: "var(--text-secondary, #888)" }}>
                  {labels.PAX_PER_BUS}
                </span>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-primary, #ededed)" }}>
                  {formatNumber(paxPerBus)} <span style={{ fontSize: "11px", fontWeight: 500 }}>{labels.UNIT_PAX_PER_BUS}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Tombol Aksi */}
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
            background: "var(--card-bg, #18181b)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {onSelectRoute && (
            <button
              type="button"
              data-testid="korwil-sheet-open-dashboard-btn"
              onClick={() => {
                onClose();
                onSelectRoute(route.routeCode);
              }}
              style={{
                width: "100%",
                padding: "10px 16px",
                borderRadius: "12px",
                background: "var(--accent-color, #3ECF8E)",
                color: "#0a0a0a",
                border: "none",
                fontSize: "13px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(62, 207, 142, 0.25)",
                transition: "opacity 0.2s ease",
              }}
            >
              <ExternalLink size={16} />
              {t.ACTIONS.OPEN_DASHBOARD}
            </button>
          )}

          <button
            type="button"
            data-testid="korwil-sheet-dismiss-btn"
            onClick={onClose}
            style={{
              width: "100%",
              padding: "8px 16px",
              borderRadius: "12px",
              background: "transparent",
              color: "var(--text-secondary, #888)",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.1))",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t.ACTIONS.CLOSE}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KorwilRouteDetailBottomSheet;
