import React, { useState } from "react";
import { X, ExternalLink, Check, CheckCircle2, Send, Clock, AlertTriangle } from "lucide-react";
import type { RegionalRouteItem } from "@/services/allRouteMonitoringService";
import { TEXT_MONITORING } from "@/constants/texts";

export interface MonitoringRouteDetailModalProps {
  route: RegionalRouteItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectRoute?: (routeCode: string) => void;
  onVerifyRoute?: (routeId: number, status: "verified") => void;
  isVerifying?: boolean;
}

type TabType = "operasional" | "shift" | "produktivitas";

export const MonitoringRouteDetailModal: React.FC<MonitoringRouteDetailModalProps> = ({
  route,
  isOpen,
  onClose,
  onSelectRoute,
  onVerifyRoute,
  isVerifying,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("operasional");

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
  const targetPax = route.targetPax || 0;
  const paxPct = route.paxPercentage ? route.paxPercentage.toFixed(1) : (targetPax > 0 ? ((totalPax / targetPax) * 100).toFixed(1) : "0.0");
  const kmTempuh = route.totalKm || 0;
  const kmPerBus = route.kmPerBus ?? (realops > 0 ? (kmTempuh / realops).toFixed(1) : 0);
  const targetPaxPerKm = route.targetPaxPerKm ? Number(route.targetPaxPerKm).toFixed(2) : "-";
  const paxPerKm = route.paxPerKm ? Number(route.paxPerKm).toFixed(2) : "-";
  const paxPerKmPct = route.paxPerKmPercentage ? Number(route.paxPerKmPercentage).toFixed(1) : "-";
  const totalRitasePp = route.totalRitasePp ?? (route.totalTrips ? Math.round(route.totalTrips / 2) : 0);
  const kmBaku = route.kmBaku || 0;
  const ritasePerBus = route.ritasePerBus ?? (realops > 0 ? (totalRitasePp / realops).toFixed(1) : 0);
  const paxPerBus = route.paxPerBus ?? (realops > 0 ? Math.round(totalPax / realops) : 0);

  const tMetrics = TEXT_MONITORING.ROUTE_DETAIL_MODAL.METRICS;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={TEXT_MONITORING.ROUTE_DETAIL_MODAL.TITLE(route.routeCode)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          maxHeight: "90vh",
          background: "var(--card-bg, #18181b)",
          color: "var(--text-primary, #ffffff)",
          borderTopLeftRadius: "24px",
          borderTopRightRadius: "24px",
          border: "1px solid var(--card-border, rgba(255, 255, 255, 0.1))",
          boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.45)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
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
              background: "rgba(255, 255, 255, 0.2)",
            }}
          />
        </div>

        {/* Modal Header */}
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
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {TEXT_MONITORING.ROUTE_DETAIL_MODAL.TITLE(route.routeCode)}
              </h2>
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                marginTop: "4px",
              }}
            >
              {TEXT_MONITORING.ROUTE_DETAIL_MODAL.SUBTITLE(
                route.routeName || route.operatorName || "Mikrotrans",
                route.supervisorName
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
                  background: "rgba(16, 185, 129, 0.12)",
                  color: "#10b981",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
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
                  background: "rgba(56, 189, 248, 0.12)",
                  color: "#38bdf8",
                  border: "1px solid rgba(56, 189, 248, 0.25)",
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
                  background: "rgba(245, 158, 11, 0.12)",
                  color: "#f59e0b",
                  border: "1px solid rgba(245, 158, 11, 0.25)",
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
                  background: "rgba(161, 161, 170, 0.12)",
                  color: "#a1a1aa",
                  border: "1px solid rgba(161, 161, 170, 0.25)",
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
                background: "transparent",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "6px",
              }}
              title="Tutup Modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Segmented Tabs Bar */}
        <div
          style={{
            padding: "8px 16px",
            background: "var(--input-bg, rgba(255, 255, 255, 0.02))",
            borderBottom: "1px solid var(--card-border, rgba(255, 255, 255, 0.05))",
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
              padding: "7px 4px",
              borderRadius: "10px",
              fontSize: "11.5px",
              fontWeight: activeTab === "operasional" ? 700 : 500,
              background:
                activeTab === "operasional"
                  ? "var(--input-bg, rgba(255, 255, 255, 0.15))"
                  : "transparent",
              color:
                activeTab === "operasional"
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {TEXT_MONITORING.ROUTE_DETAIL_MODAL.TABS.OPERASIONAL}
          </button>

          <button
            type="button"
            data-testid="tab-shift"
            onClick={() => setActiveTab("shift")}
            style={{
              padding: "7px 4px",
              borderRadius: "10px",
              fontSize: "11.5px",
              fontWeight: activeTab === "shift" ? 700 : 500,
              background:
                activeTab === "shift"
                  ? "var(--input-bg, rgba(255, 255, 255, 0.15))"
                  : "transparent",
              color:
                activeTab === "shift"
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {TEXT_MONITORING.ROUTE_DETAIL_MODAL.TABS.SHIFT}
          </button>

          <button
            type="button"
            data-testid="tab-produktivitas"
            onClick={() => setActiveTab("produktivitas")}
            style={{
              padding: "7px 4px",
              borderRadius: "10px",
              fontSize: "11.5px",
              fontWeight: activeTab === "produktivitas" ? 700 : 500,
              background:
                activeTab === "produktivitas"
                  ? "var(--input-bg, rgba(255, 255, 255, 0.15))"
                  : "transparent",
              color:
                activeTab === "produktivitas"
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
              cursor: "pointer",
              transition: "all 0.15s ease",
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
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {/* TAB 1: OPERASIONAL */}
          {activeTab === "operasional" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
                    borderRadius: "12px",
                    padding: "12px",
                    border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    {tMetrics.RENOPS}
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 800, marginTop: "4px" }}>
                    {renops} <span style={{ fontSize: "11px", fontWeight: 500 }}>{tMetrics.UNIT_BUS}</span>
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
                    borderRadius: "12px",
                    padding: "12px",
                    border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    {tMetrics.REALOPS}
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 800, marginTop: "4px", color: "var(--accent-color, #3ECF8E)" }}>
                    {realops} <span style={{ fontSize: "11px", fontWeight: 500 }}>{tMetrics.UNIT_BUS}</span>
                  </div>
                  <div style={{ fontSize: "10.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    S1: {route.realopsShift1 ?? "-"} • S2: {route.realopsShift2 ?? "-"}
                  </div>
                </div>
              </div>

              {/* Rasio Kesiapan */}
              <div
                style={{
                  background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
                  borderRadius: "12px",
                  padding: "12px",
                  border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    {tMetrics.FLEET_RATIO}
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 700, marginTop: "2px" }}>
                    {fleetRatio}%
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    {tMetrics.KM_BUS}
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 700, marginTop: "2px" }}>
                    {kmPerBus} <span style={{ fontSize: "11px" }}>{tMetrics.UNIT_KM}</span>
                  </div>
                </div>
              </div>

              {/* KM Tempuh & Pelanggan / KM */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
                    borderRadius: "12px",
                    padding: "12px",
                    border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    {tMetrics.KM_TEMPUH}
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 800, marginTop: "4px" }}>
                    {kmTempuh.toLocaleString("id-ID")} <span style={{ fontSize: "11px" }}>{tMetrics.UNIT_KM}</span>
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
                    borderRadius: "12px",
                    padding: "12px",
                    border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    {tMetrics.PELANGGAN_KM}
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 800, marginTop: "4px" }}>
                    {paxPerKm} <span style={{ fontSize: "11px" }}>Org/KM</span>
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    Target: {targetPaxPerKm} • Cap: {paxPerKmPct}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PELANGGAN & SHIFT */}
          {activeTab === "shift" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* Total & Target Pelanggan */}
              <div
                style={{
                  background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
                  borderRadius: "12px",
                  padding: "14px",
                  border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    {tMetrics.TOTAL_PELANGGAN}
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--accent-color, #3ECF8E)", marginTop: "2px" }}>
                    {totalPax.toLocaleString("id-ID")}{" "}
                    <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-primary)" }}>
                      {tMetrics.UNIT_PAX}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    {tMetrics.TARGET_PELANGGAN}
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "2px" }}>
                    {targetPax > 0 ? targetPax.toLocaleString("id-ID") : "-"}
                  </div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--accent-color, #3ECF8E)", marginTop: "1px" }}>
                    Capaian: {paxPct}%
                  </div>
                </div>
              </div>

              {/* Rincian Shift 1 */}
              <div
                style={{
                  background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
                  borderRadius: "12px",
                  padding: "12px",
                  border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
                  {tMetrics.SHIFT_1_HEADER}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", textAlign: "center" }}>
                  <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "8px", borderRadius: "8px" }}>
                    <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>{tMetrics.TOA_LABEL}</div>
                    <div style={{ fontSize: "13px", fontWeight: 700, marginTop: "2px" }}>
                      {(route.toaShift1 || 0).toLocaleString("id-ID")}
                    </div>
                  </div>
                  <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "8px", borderRadius: "8px" }}>
                    <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>{tMetrics.MANUAL_LABEL}</div>
                    <div style={{ fontSize: "13px", fontWeight: 700, marginTop: "2px" }}>
                      {(route.manualShift1 || 0).toLocaleString("id-ID")}
                    </div>
                  </div>
                  <div style={{ background: "rgba(255, 255, 255, 0.04)", padding: "8px", borderRadius: "8px" }}>
                    <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>{tMetrics.TOTAL_SHIFT_LABEL}</div>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--accent-color, #3ECF8E)", marginTop: "2px" }}>
                      {(route.totalShift1 || (route.toaShift1 + route.manualShift1) || 0).toLocaleString("id-ID")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rincian Shift 2 */}
              <div
                style={{
                  background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
                  borderRadius: "12px",
                  padding: "12px",
                  border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
                  {tMetrics.SHIFT_2_HEADER}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", textAlign: "center" }}>
                  <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "8px", borderRadius: "8px" }}>
                    <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>{tMetrics.TOA_LABEL}</div>
                    <div style={{ fontSize: "13px", fontWeight: 700, marginTop: "2px" }}>
                      {(route.toaShift2 || 0).toLocaleString("id-ID")}
                    </div>
                  </div>
                  <div style={{ background: "rgba(255, 255, 255, 0.02)", padding: "8px", borderRadius: "8px" }}>
                    <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>{tMetrics.MANUAL_LABEL}</div>
                    <div style={{ fontSize: "13px", fontWeight: 700, marginTop: "2px" }}>
                      {(route.manualShift2 || 0).toLocaleString("id-ID")}
                    </div>
                  </div>
                  <div style={{ background: "rgba(255, 255, 255, 0.04)", padding: "8px", borderRadius: "8px" }}>
                    <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>{tMetrics.TOTAL_SHIFT_LABEL}</div>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--accent-color, #3ECF8E)", marginTop: "2px" }}>
                      {(route.totalShift2 || (route.toaShift2 + route.manualShift2) || 0).toLocaleString("id-ID")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Komparasi Historis */}
              <div
                style={{
                  background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
                  borderRadius: "12px",
                  padding: "12px",
                  border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
                  {tMetrics.HISTORICAL_HEADER}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <div style={{ fontSize: "10.5px", color: "var(--text-secondary)" }}>{tMetrics.PAX_YESTERDAY}</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "2px" }}>
                      {route.yesterdayPassengers ? route.yesterdayPassengers.toLocaleString("id-ID") : "-"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "10.5px", color: "var(--text-secondary)" }}>{tMetrics.PAX_LAST_WEEK}</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "2px" }}>
                      {route.lastWeekPassengers ? route.lastWeekPassengers.toLocaleString("id-ID") : "-"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRODUKTIVITAS & RITASE */}
          {activeTab === "produktivitas" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
                    borderRadius: "12px",
                    padding: "12px",
                    border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    {tMetrics.TOTAL_RITASE_PP}
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 800, marginTop: "4px" }}>
                    {totalRitasePp} <span style={{ fontSize: "11px" }}>{tMetrics.UNIT_RIT}</span>
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
                    borderRadius: "12px",
                    padding: "12px",
                    border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    {tMetrics.KM_BAKU}
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 800, marginTop: "4px" }}>
                    {kmBaku} <span style={{ fontSize: "11px" }}>{tMetrics.UNIT_KM}</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
                    borderRadius: "12px",
                    padding: "12px",
                    border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    {tMetrics.RITASE_BUS}
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 700, marginTop: "4px" }}>
                    {ritasePerBus} <span style={{ fontSize: "11px" }}>{tMetrics.UNIT_RIT}/Bus</span>
                  </div>
                </div>

                <div
                  style={{
                    background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
                    borderRadius: "12px",
                    padding: "12px",
                    border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    {tMetrics.PELANGGAN_BUS}
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 700, marginTop: "4px" }}>
                    {paxPerBus} <span style={{ fontSize: "11px" }}>{tMetrics.UNIT_PAX}/Bus</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        <div
          style={{
            padding: "12px 18px",
            borderTop: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "8px",
            background: "var(--card-bg, #18181b)",
          }}
        >
          {/* Close button */}
          <button
            type="button"
            data-testid="modal-btn-close"
            onClick={onClose}
            style={{
              padding: "8px 14px",
              borderRadius: "10px",
              background: "transparent",
              color: "var(--text-secondary)",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.1))",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
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
              padding: "8px 14px",
              borderRadius: "10px",
              background: "var(--input-bg, rgba(255, 255, 255, 0.08))",
              color: "var(--text-primary)",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.15))",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <ExternalLink size={13} />
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
                padding: "8px 14px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                color: "#ffffff",
                border: "none",
                fontSize: "12px",
                fontWeight: 700,
                cursor: isVerifying ? "wait" : "pointer",
                opacity: isVerifying ? 0.7 : 1,
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
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
