import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  ExternalLink,
  Check,
  CheckCircle2,
  Send,
  Clock,
  AlertTriangle,
  Bus,
  ShieldCheck,
} from "lucide-react";
import type { DailyFleetShiftWithUnits } from "@/types/supabase";
import { extractRouteTroubledUnits } from "../monitoringUtils";
import type { RegionalRouteItem } from "@/services/allRouteMonitoringService";
import { TEXT_MONITORING } from "@/constants/texts";
import { acquireScrollLock } from "@/utils/scrollLockCoordinator";

export interface MonitoringRouteDetailModalProps {
  route: RegionalRouteItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectRoute?: (routeCode: string) => void;
  onVerifyRoute?: (routeId: number, status: "verified") => void;
  isVerifying?: boolean;
  fleetShifts?: DailyFleetShiftWithUnits[];
}

type TabType = "operasional" | "shift" | "produktivitas";

export const MonitoringRouteDetailModal: React.FC<MonitoringRouteDetailModalProps> = ({
  route,
  isOpen,
  onClose,
  onSelectRoute,
  onVerifyRoute,
  isVerifying,
  fleetShifts,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("operasional");

  // Coordinated Body Scroll Lock (Reference Counting)
  useEffect(() => {
    if (!isOpen) return;
    const releaseLock = acquireScrollLock();
    return () => {
      releaseLock();
    };
  }, [isOpen]);

  const troubledUnits = useMemo(() => {
    if (!isOpen || !route) return [];
    return extractRouteTroubledUnits(route, fleetShifts);
  }, [isOpen, route, fleetShifts]);

  if (!isOpen || !route) return null;

  const isVerified = route.status === "verified";
  const isSubmitted = route.status === "submitted";
  const isDraft = route.status === "draft";
  const isEmpty = route.status === "empty";

  // Calculations & Fallbacks
  const renops = route.totalRenops || route.defaultRenops || 0;
  const realops = route.totalRealops || 0;
  const fleetRatio = renops > 0 ? ((realops / renops) * 100).toFixed(1) : "0.0";
  const totalPax = route.todayPassengers || 0;
  const targetPax = route.targetPax ?? route.targetHk ?? 0;
  const paxPct =
    route.paxPercentage !== undefined
      ? Number(route.paxPercentage).toFixed(1)
      : route.targetPercentage !== undefined
      ? Number(route.targetPercentage).toFixed(1)
      : targetPax > 0
      ? ((totalPax / targetPax) * 100).toFixed(1)
      : "0.0";
  const kmTempuh = route.totalKm || 0;
  const kmPerBus =
    route.kmPerBus !== undefined
      ? route.kmPerBus
      : route.achievementKm !== undefined
      ? route.achievementKm
      : realops > 0
      ? (kmTempuh / realops).toFixed(1)
      : 0;
  const numKmPerBus = Number(kmPerBus);
  const displayKmPerBus = !isNaN(numKmPerBus)
    ? Number.isInteger(numKmPerBus)
      ? String(numKmPerBus)
      : Number(numKmPerBus.toFixed(1)).toLocaleString("id-ID")
    : String(kmPerBus);
  const targetPaxPerKm =
    route.targetPaxPerKm !== undefined
      ? Number(route.targetPaxPerKm).toFixed(2)
      : route.targetPassengersPerKm !== undefined
      ? Number(route.targetPassengersPerKm).toFixed(2)
      : "-";
  const paxPerKm =
    route.paxPerKm !== undefined
      ? Number(route.paxPerKm).toFixed(2)
      : route.passengersPerKm !== undefined
      ? Number(route.passengersPerKm).toFixed(2)
      : "-";
  const paxPerKmPct =
    route.paxPerKmPercentage !== undefined
      ? Number(route.paxPerKmPercentage).toFixed(1)
      : route.passengersPerKmPercentage !== undefined
      ? Number(route.passengersPerKmPercentage).toFixed(1)
      : "-";
  const totalRitasePp =
    route.totalRitasePp !== undefined
      ? route.totalRitasePp
      : route.totalTrips
      ? route.totalTrips / 2
      : 0;
  const kmBaku = route.kmBaku || 0;
  const ritasePerBus =
    route.ritasePerBus !== undefined
      ? route.ritasePerBus
      : route.tripsPerBus !== undefined
      ? route.tripsPerBus / 2
      : realops > 0
      ? totalRitasePp / realops
      : 0;
  const numRitasePerBus = Number(ritasePerBus);
  const displayRitasePerBus = !isNaN(numRitasePerBus)
    ? Number(Number(numRitasePerBus.toFixed(2)))
    : ritasePerBus;
  const paxPerBus =
    route.paxPerBus !== undefined
      ? Math.round(route.paxPerBus)
      : route.passengersPerBus !== undefined
      ? Math.round(route.passengersPerBus)
      : realops > 0
      ? Math.round(totalPax / realops)
      : 0;

  const tMetrics = TEXT_MONITORING.ROUTE_DETAIL_MODAL.METRICS;
  const tFleet = TEXT_MONITORING.ROUTE_DETAIL_MODAL.FLEET_SECTION;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={TEXT_MONITORING.ROUTE_DETAIL_MODAL.TITLE(route.routeCode)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "var(--color-overlay, rgba(0, 0, 0, 0.65))",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        overscrollBehavior: "contain",
        touchAction: "none",
      }}
      onClick={onClose}
      onTouchMove={(e) => {
        // Cegah scroll tembus ke background saat user menyentuh/menggeser area backdrop blur
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          maxHeight: "90vh",
          backgroundColor: "var(--color-surface-default)",
          color: "var(--color-text-primary)",
          borderTopLeftRadius: "24px",
          borderTopRightRadius: "24px",
          border: "1px solid var(--color-border-subtle)",
          boxShadow: "0 -8px 36px var(--color-shadow, rgba(0, 0, 0, 0.35))",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          overscrollBehavior: "contain",
          animation: "pmSheetSlideUp 0.32s cubic-bezier(0.32, 0.72, 0, 1)",
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
              width: "38px",
              height: "4px",
              borderRadius: "2px",
              backgroundColor: "var(--color-border-control)",
              opacity: 0.5,
            }}
          />
        </div>

        {/* Modal Header */}
        <div
          style={{
            padding: "12px 18px",
            borderBottom: "1px solid var(--color-border-subtle)",
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
                  backgroundColor: "var(--color-role-admin-bg)",
                  color: "var(--color-role-admin-fg)",
                  border: "1px solid var(--color-role-admin-border)",
                  letterSpacing: "0.2px",
                }}
              >
                {route.routeCode}
              </span>
              <h2
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                }}
              >
                {TEXT_MONITORING.ROUTE_DETAIL_MODAL.TITLE(route.routeCode)}
              </h2>
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--color-text-secondary)",
                marginTop: "4px",
                lineHeight: 1.4,
              }}
            >
              {TEXT_MONITORING.ROUTE_DETAIL_MODAL.SUBTITLE(
                route.routeName ||
                  route.operatorName ||
                  TEXT_MONITORING.ROUTE_DETAIL_MODAL.DEFAULT_OPERATOR,
                route.supervisorName
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            {/* Status Badge */}
            {isVerified && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  backgroundColor: "var(--color-success-bg)",
                  color: "var(--color-success-fg)",
                  border: "1px solid var(--color-success-border)",
                }}
              >
                <CheckCircle2 size={12} />
                {TEXT_MONITORING.ROUTE_CARD.BADGE_VERIFIED}
              </span>
            )}
            {isSubmitted && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  backgroundColor: "var(--color-info-bg)",
                  color: "var(--color-info-fg)",
                  border: "1px solid var(--color-info-border)",
                }}
              >
                <Send size={12} />
                {TEXT_MONITORING.ROUTE_CARD.BADGE_SUBMITTED}
              </span>
            )}
            {isDraft && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  backgroundColor: "var(--color-warning-bg)",
                  color: "var(--color-warning-fg)",
                  border: "1px solid var(--color-warning-border)",
                }}
              >
                <Clock size={12} />
                {TEXT_MONITORING.ROUTE_CARD.BADGE_DRAFT}
              </span>
            )}
            {isEmpty && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  backgroundColor: "var(--color-surface-subtle)",
                  color: "var(--color-text-muted)",
                  border: "1px solid var(--color-border-subtle)",
                }}
              >
                <AlertTriangle size={12} />
                {TEXT_MONITORING.ROUTE_CARD.BADGE_EMPTY}
              </span>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                backgroundColor: "var(--color-surface-subtle)",
                border: "1px solid var(--color-border-subtle)",
                color: "var(--color-text-secondary)",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
              }}
              title={TEXT_MONITORING.ROUTE_DETAIL_MODAL.ACTIONS.BTN_CLOSE_TITLE}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Segmented Tabs Bar */}
        <div
          style={{
            padding: "8px 16px",
            backgroundColor: "var(--color-surface-subtle)",
            borderBottom: "1px solid var(--color-border-subtle)",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "6px",
          }}
        >
          <button
            type="button"
            data-testid="tab-operasional"
            onClick={() => setActiveTab("operasional")}
            style={{
              padding: "8px 4px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: activeTab === "operasional" ? 700 : 500,
              backgroundColor:
                activeTab === "operasional"
                  ? "var(--color-surface-default)"
                  : "transparent",
              color:
                activeTab === "operasional"
                  ? "var(--color-text-primary)"
                  : "var(--color-text-secondary)",
              border:
                activeTab === "operasional"
                  ? "1px solid var(--color-border-subtle)"
                  : "1px solid transparent",
              boxShadow:
                activeTab === "operasional"
                  ? "0 2px 6px var(--color-shadow, rgba(0, 0, 0, 0.08))"
                  : "none",
              cursor: "pointer",
              transition: "all 0.18s cubic-bezier(0.32, 0.72, 0, 1)",
              textAlign: "center",
            }}
          >
            {TEXT_MONITORING.ROUTE_DETAIL_MODAL.TABS.OPERASIONAL}
          </button>

          <button
            type="button"
            data-testid="tab-shift"
            onClick={() => setActiveTab("shift")}
            style={{
              padding: "8px 4px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: activeTab === "shift" ? 700 : 500,
              backgroundColor:
                activeTab === "shift"
                  ? "var(--color-surface-default)"
                  : "transparent",
              color:
                activeTab === "shift"
                  ? "var(--color-text-primary)"
                  : "var(--color-text-secondary)",
              border:
                activeTab === "shift"
                  ? "1px solid var(--color-border-subtle)"
                  : "1px solid transparent",
              boxShadow:
                activeTab === "shift"
                  ? "0 2px 6px var(--color-shadow, rgba(0, 0, 0, 0.08))"
                  : "none",
              cursor: "pointer",
              transition: "all 0.18s cubic-bezier(0.32, 0.72, 0, 1)",
              textAlign: "center",
            }}
          >
            {TEXT_MONITORING.ROUTE_DETAIL_MODAL.TABS.SHIFT}
          </button>

          <button
            type="button"
            data-testid="tab-produktivitas"
            onClick={() => setActiveTab("produktivitas")}
            style={{
              padding: "8px 4px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: activeTab === "produktivitas" ? 700 : 500,
              backgroundColor:
                activeTab === "produktivitas"
                  ? "var(--color-surface-default)"
                  : "transparent",
              color:
                activeTab === "produktivitas"
                  ? "var(--color-text-primary)"
                  : "var(--color-text-secondary)",
              border:
                activeTab === "produktivitas"
                  ? "1px solid var(--color-border-subtle)"
                  : "1px solid transparent",
              boxShadow:
                activeTab === "produktivitas"
                  ? "0 2px 6px var(--color-shadow, rgba(0, 0, 0, 0.08))"
                  : "none",
              cursor: "pointer",
              transition: "all 0.18s cubic-bezier(0.32, 0.72, 0, 1)",
              textAlign: "center",
            }}
          >
            {TEXT_MONITORING.ROUTE_DETAIL_MODAL.TABS.PRODUKTIVITAS}
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div
          className="no-scrollbar"
          style={{
            padding: "16px 18px",
            overflowY: "auto",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-y",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {/* TAB 1: OPERASIONAL */}
          {activeTab === "operasional" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
              {/* Row 1: Renops & Realops (2 columns) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    backgroundColor: "var(--color-surface-subtle)",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    border: "1px solid var(--color-border-subtle)",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                    {tMetrics.RENOPS}
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 800, marginTop: "4px", color: "var(--color-text-primary)" }}>
                    {renops} <span style={{ fontSize: "11.5px", fontWeight: 500, color: "var(--color-text-secondary)" }}>{tMetrics.UNIT_BUS}</span>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "var(--color-surface-subtle)",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    border: "1px solid var(--color-border-subtle)",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                    {tMetrics.REALOPS}
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 800,
                      marginTop: "4px",
                      color: "var(--color-action-primary-bg)",
                    }}
                  >
                    {realops} <span style={{ fontSize: "11.5px", fontWeight: 500, color: "var(--color-text-secondary)" }}>{tMetrics.UNIT_BUS}</span>
                  </div>
                  <div style={{ fontSize: "10.5px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                    {tMetrics.REALOPS_SHIFT_SUBTEXT(route.realopsShift1 ?? "-", route.realopsShift2 ?? "-")}
                  </div>
                </div>
              </div>

              {/* Row 2: Rasio Kesiapan & KM per Bus (Full width split card) */}
              <div
                style={{
                  backgroundColor: "var(--color-surface-subtle)",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  border: "1px solid var(--color-border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                <div>
                  <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                    {tMetrics.FLEET_RATIO}
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 700, marginTop: "2px", color: "var(--color-text-primary)" }}>
                    {fleetRatio}%
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                    {tMetrics.KM_BUS}
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 700, marginTop: "2px", color: "var(--color-text-primary)" }}>
                    {displayKmPerBus} <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-text-secondary)" }}>{tMetrics.UNIT_KM}</span>
                  </div>
                </div>
              </div>

              {/* Row 3: KM Tempuh & Pelanggan / KM (2 columns) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    backgroundColor: "var(--color-surface-subtle)",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    border: "1px solid var(--color-border-subtle)",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                    {tMetrics.KM_TEMPUH}
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 800, marginTop: "4px", color: "var(--color-text-primary)" }}>
                    {kmTempuh.toLocaleString("id-ID")}{" "}
                    <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-text-secondary)" }}>{tMetrics.UNIT_KM}</span>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "var(--color-surface-subtle)",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    border: "1px solid var(--color-border-subtle)",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                    {tMetrics.PELANGGAN_KM}
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 800, marginTop: "4px", color: "var(--color-text-primary)" }}>
                    {paxPerKm}{" "}
                    <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-text-secondary)" }}>{tMetrics.UNIT_PAX_PER_KM}</span>
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                    {tMetrics.TARGET_CAP_SUBTEXT(targetPaxPerKm, paxPerKmPct)}
                  </div>
                </div>
              </div>

              {/* Row 4: Status Kesiapan Armada Bus (FULL WIDTH SPANNING CONTAINER) */}
              <div
                data-testid="route-modal-fleet-section"
                style={{
                  backgroundColor: "var(--color-surface-subtle)",
                  borderRadius: "14px",
                  padding: "14px",
                  border: "1px solid var(--color-border-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  width: "100%",
                  boxSizing: "border-box",
                  marginTop: "2px",
                }}
              >
                {/* Header Section */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Bus
                      size={16}
                      style={{
                        color:
                          troubledUnits.length > 0
                            ? "var(--color-warning-fg)"
                            : realops > 0
                            ? "var(--color-success-fg)"
                            : "var(--color-text-secondary)",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "12.5px",
                        fontWeight: 700,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {tFleet.TITLE}
                    </span>
                  </div>

                  {troubledUnits.length > 0 ? (
                    <span
                      data-testid="route-modal-fleet-badge-troubled"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "10.5px",
                        fontWeight: 700,
                        color: "var(--color-warning-fg)",
                        backgroundColor: "var(--color-warning-bg)",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        border: "1px solid var(--color-warning-border)",
                      }}
                    >
                      <AlertTriangle size={11} />
                      {tFleet.BADGE_TROUBLED(troubledUnits.length)}
                    </span>
                  ) : realops > 0 ? (
                    <span
                      data-testid="route-modal-fleet-badge-ready"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "10.5px",
                        fontWeight: 700,
                        color: "var(--color-success-fg)",
                        backgroundColor: "var(--color-success-bg)",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        border: "1px solid var(--color-success-border)",
                      }}
                    >
                      <ShieldCheck size={12} />
                      {tFleet.BADGE_ALL_READY}
                    </span>
                  ) : null}
                </div>

                {/* Content: Troubled Units List / Clean State / Empty */}
                {troubledUnits.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    {troubledUnits.map((u, idx) => (
                      <div
                        key={`${u.unit}-${idx}`}
                        data-testid="route-modal-troubled-unit-item"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          borderRadius: "10px",
                          backgroundColor: "var(--color-surface-default)",
                          border: "1px solid var(--color-border-subtle)",
                          gap: "10px",
                        }}
                      >
                        {/* Unit Body & Note */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            minWidth: 0,
                            flex: 1,
                          }}
                        >
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: 800,
                              color: "var(--color-text-primary)",
                              letterSpacing: "0.2px",
                            }}
                          >
                            {u.unit}
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              color: "var(--color-text-secondary)",
                              marginTop: "2px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={u.note}
                          >
                            {u.note}
                          </span>
                        </div>

                        {/* Status Badge & Shifts */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            flexShrink: 0,
                          }}
                        >
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              background: u.badgeBg,
                              color: u.badgeColor,
                              border: u.badgeBorder ? `1px solid ${u.badgeBorder}` : "none",
                              padding: "2px 7px",
                              borderRadius: "5px",
                              letterSpacing: "0.2px",
                            }}
                          >
                            {u.statusCode}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : realops > 0 ? (
                  <div
                    data-testid="route-modal-fleet-clean"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      backgroundColor: "var(--color-success-bg)",
                      border: "1px solid var(--color-success-border)",
                    }}
                  >
                    <ShieldCheck size={18} style={{ color: "var(--color-success-fg)", flexShrink: 0 }} />
                    <span
                      style={{
                        fontSize: "11.5px",
                        color: "var(--color-success-fg)",
                        fontWeight: 500,
                        lineHeight: 1.4,
                      }}
                    >
                      {tFleet.ALL_READY_DESC}
                    </span>
                  </div>
                ) : (
                  <div
                    data-testid="route-modal-fleet-empty"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      backgroundColor: "var(--color-surface-default)",
                      border: "1px dashed var(--color-border-subtle)",
                    }}
                  >
                    <Clock size={16} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                    <span
                      style={{
                        fontSize: "11.5px",
                        color: "var(--color-text-secondary)",
                        lineHeight: 1.4,
                      }}
                    >
                      {tFleet.NO_DATA_DESC}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PELANGGAN & SHIFT */}
          {activeTab === "shift" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
              {/* Total & Target Pelanggan (Hero Card) */}
              <div
                style={{
                  backgroundColor: "var(--color-surface-subtle)",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  border: "1px solid var(--color-border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                <div>
                  <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                    {tMetrics.TOTAL_PELANGGAN}
                  </div>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 800,
                      color: "var(--color-action-primary-bg)",
                      marginTop: "2px",
                    }}
                  >
                    {totalPax.toLocaleString("id-ID")}{" "}
                    <span style={{ fontSize: "11.5px", fontWeight: 500, color: "var(--color-text-secondary)" }}>
                      {tMetrics.UNIT_PAX}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                    {tMetrics.TARGET_PELANGGAN}
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "2px", color: "var(--color-text-primary)" }}>
                    {targetPax > 0 ? targetPax.toLocaleString("id-ID") : "-"}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--color-success-fg)",
                      marginTop: "1px",
                    }}
                  >
                    {tMetrics.ACHIEVEMENT_PCT(paxPct)}
                  </div>
                </div>
              </div>

              {/* Rincian Shift 1 */}
              <div
                style={{
                  backgroundColor: "var(--color-surface-subtle)",
                  borderRadius: "14px",
                  padding: "14px",
                  border: "1px solid var(--color-border-subtle)",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                <div style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "10px" }}>
                  {tMetrics.SHIFT_1_HEADER}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", textAlign: "center" }}>
                  <div style={{ backgroundColor: "var(--color-surface-default)", border: "1px solid var(--color-border-subtle)", padding: "10px 8px", borderRadius: "10px" }}>
                    <div style={{ fontSize: "10.5px", color: "var(--color-text-secondary)" }}>{tMetrics.TOA_LABEL}</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "3px", color: "var(--color-text-primary)" }}>
                      {(route.toaShift1 || 0).toLocaleString("id-ID")}
                    </div>
                  </div>
                  <div style={{ backgroundColor: "var(--color-surface-default)", border: "1px solid var(--color-border-subtle)", padding: "10px 8px", borderRadius: "10px" }}>
                    <div style={{ fontSize: "10.5px", color: "var(--color-text-secondary)" }}>{tMetrics.MANUAL_LABEL}</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "3px", color: "var(--color-text-primary)" }}>
                      {(route.manualShift1 || 0).toLocaleString("id-ID")}
                    </div>
                  </div>
                  <div style={{ backgroundColor: "var(--color-surface-default)", border: "1px solid var(--color-border-subtle)", padding: "10px 8px", borderRadius: "10px" }}>
                    <div style={{ fontSize: "10.5px", color: "var(--color-text-secondary)" }}>{tMetrics.TOTAL_SHIFT_LABEL}</div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-action-primary-bg)", marginTop: "3px" }}>
                      {(route.totalShift1 || (route.toaShift1 + route.manualShift1) || 0).toLocaleString("id-ID")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rincian Shift 2 */}
              <div
                style={{
                  backgroundColor: "var(--color-surface-subtle)",
                  borderRadius: "14px",
                  padding: "14px",
                  border: "1px solid var(--color-border-subtle)",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                <div style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "10px" }}>
                  {tMetrics.SHIFT_2_HEADER}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", textAlign: "center" }}>
                  <div style={{ backgroundColor: "var(--color-surface-default)", border: "1px solid var(--color-border-subtle)", padding: "10px 8px", borderRadius: "10px" }}>
                    <div style={{ fontSize: "10.5px", color: "var(--color-text-secondary)" }}>{tMetrics.TOA_LABEL}</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "3px", color: "var(--color-text-primary)" }}>
                      {(route.toaShift2 || 0).toLocaleString("id-ID")}
                    </div>
                  </div>
                  <div style={{ backgroundColor: "var(--color-surface-default)", border: "1px solid var(--color-border-subtle)", padding: "10px 8px", borderRadius: "10px" }}>
                    <div style={{ fontSize: "10.5px", color: "var(--color-text-secondary)" }}>{tMetrics.MANUAL_LABEL}</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "3px", color: "var(--color-text-primary)" }}>
                      {(route.manualShift2 || 0).toLocaleString("id-ID")}
                    </div>
                  </div>
                  <div style={{ backgroundColor: "var(--color-surface-default)", border: "1px solid var(--color-border-subtle)", padding: "10px 8px", borderRadius: "10px" }}>
                    <div style={{ fontSize: "10.5px", color: "var(--color-text-secondary)" }}>{tMetrics.TOTAL_SHIFT_LABEL}</div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-action-primary-bg)", marginTop: "3px" }}>
                      {(route.totalShift2 || (route.toaShift2 + route.manualShift2) || 0).toLocaleString("id-ID")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Komparasi Historis */}
              <div
                style={{
                  backgroundColor: "var(--color-surface-subtle)",
                  borderRadius: "14px",
                  padding: "14px",
                  border: "1px solid var(--color-border-subtle)",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                <div style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "10px" }}>
                  {tMetrics.HISTORICAL_HEADER}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div style={{ backgroundColor: "var(--color-surface-default)", border: "1px solid var(--color-border-subtle)", padding: "10px 12px", borderRadius: "10px" }}>
                    <div style={{ fontSize: "10.5px", color: "var(--color-text-secondary)" }}>{tMetrics.PAX_YESTERDAY}</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "3px", color: "var(--color-text-primary)" }}>
                      {route.yesterdayPassengers ? route.yesterdayPassengers.toLocaleString("id-ID") : "-"}
                    </div>
                  </div>
                  <div style={{ backgroundColor: "var(--color-surface-default)", border: "1px solid var(--color-border-subtle)", padding: "10px 12px", borderRadius: "10px" }}>
                    <div style={{ fontSize: "10.5px", color: "var(--color-text-secondary)" }}>{tMetrics.PAX_LAST_WEEK}</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "3px", color: "var(--color-text-primary)" }}>
                      {route.lastWeekPassengers ? route.lastWeekPassengers.toLocaleString("id-ID") : "-"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRODUKTIVITAS & RITASE */}
          {activeTab === "produktivitas" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    backgroundColor: "var(--color-surface-subtle)",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    border: "1px solid var(--color-border-subtle)",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                    {tMetrics.TOTAL_RITASE_PP}
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 800, marginTop: "4px", color: "var(--color-text-primary)" }}>
                    {totalRitasePp} <span style={{ fontSize: "11.5px", fontWeight: 500, color: "var(--color-text-secondary)" }}>{tMetrics.UNIT_RIT}</span>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "var(--color-surface-subtle)",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    border: "1px solid var(--color-border-subtle)",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                    {tMetrics.KM_BAKU}
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 800, marginTop: "4px", color: "var(--color-text-primary)" }}>
                    {kmBaku} <span style={{ fontSize: "11.5px", fontWeight: 500, color: "var(--color-text-secondary)" }}>{tMetrics.UNIT_KM}</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    backgroundColor: "var(--color-surface-subtle)",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    border: "1px solid var(--color-border-subtle)",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                    {tMetrics.RITASE_BUS}
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 700, marginTop: "4px", color: "var(--color-text-primary)" }}>
                    {displayRitasePerBus} <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-text-secondary)" }}>{tMetrics.UNIT_RIT_PER_BUS}</span>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "var(--color-surface-subtle)",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    border: "1px solid var(--color-border-subtle)",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                    {tMetrics.PELANGGAN_BUS}
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 700, marginTop: "4px", color: "var(--color-text-primary)" }}>
                    {paxPerBus} <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-text-secondary)" }}>{tMetrics.UNIT_PAX_PER_BUS}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        <div
          style={{
            padding: "12px 18px calc(12px + env(safe-area-inset-bottom, 0px))",
            borderTop: "1px solid var(--color-border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            flexWrap: "wrap",
            gap: "10px",
            backgroundColor: "var(--color-surface-default)",
          }}
        >
          {/* Close button */}
          <button
            type="button"
            data-testid="modal-btn-close"
            onClick={onClose}
            style={{
              padding: "9px 16px",
              borderRadius: "10px",
              backgroundColor: "var(--color-surface-subtle)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border-subtle)",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
              minHeight: "40px",
              transition: "all 0.15s ease",
            }}
          >
            {TEXT_MONITORING.ROUTE_DETAIL_MODAL.ACTIONS.BTN_CLOSE}
          </button>

          {/* Open Sheet Button */}
          <button
            type="button"
            data-testid="modal-btn-open-sheet"
            onClick={() => onSelectRoute?.(route.routeCode)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 16px",
              borderRadius: "10px",
              backgroundColor: "var(--color-action-primary-bg)",
              color: "var(--color-action-primary-fg)",
              border: "none",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
              minHeight: "40px",
              transition: "all 0.15s ease",
            }}
          >
            <ExternalLink size={14} />
            <span>{TEXT_MONITORING.ROUTE_DETAIL_MODAL.ACTIONS.BTN_OPEN_SHEET}</span>
          </button>

          {/* Verify Button (if submitted) */}
          {isSubmitted && (
            <button
              type="button"
              data-testid="modal-btn-verify"
              onClick={() => onVerifyRoute?.(route.id, "verified")}
              disabled={isVerifying}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 16px",
                borderRadius: "10px",
                backgroundColor: "var(--color-success-fg)",
                color: "var(--color-surface-default)",
                border: "none",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: isVerifying ? "wait" : "pointer",
                opacity: isVerifying ? 0.7 : 1,
                minHeight: "40px",
              }}
            >
              <Check size={14} />
              <span>{TEXT_MONITORING.ROUTE_DETAIL_MODAL.ACTIONS.BTN_VERIFY}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonitoringRouteDetailModal;
