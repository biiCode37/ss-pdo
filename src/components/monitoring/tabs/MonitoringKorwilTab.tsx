import React, { useState } from "react";
import {
  Users,
  ChevronDown,
  ChevronUp,
  Award,
  Bus,
  Gauge,
  RotateCcw,
  UserCheck,
  ArrowUpRight,
} from "lucide-react";
import { TEXT_MONITORING } from "@/constants/texts";
import type {
  RegionalMonitoringResult,
  SupervisorTeamSummary,
  RegionalRouteItem,
} from "@/services/allRouteMonitoringService";
import { formatNumber, formatDecimal } from "../monitoringUtils";

export interface MonitoringKorwilTabProps {
  data: RegionalMonitoringResult;
  onSelectRoute?: (routeCode: string) => void;
}

export const MonitoringKorwilTab: React.FC<MonitoringKorwilTabProps> = ({
  data,
  onSelectRoute,
}) => {
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});

  const toggleTeamExpand = (teamId: string) => {
    setExpandedTeams((prev) => ({
      ...prev,
      [teamId]: !prev[teamId],
    }));
  };

  const supervisorSummaries: SupervisorTeamSummary[] = data.supervisorSummaries || [];
  const hasData = data.routes.length > 0;

  if (!hasData && supervisorSummaries.length === 0) {
    return (
      <div
        className="monitoring-card"
        style={{
          textAlign: "center",
          padding: "48px 20px",
          color: "var(--text-secondary)",
        }}
      >
        <Users size={48} style={{ opacity: 0.4, margin: "0 auto 16px auto", display: "block" }} />
        <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 8px 0", color: "var(--text-primary)" }}>
          {TEXT_MONITORING.KORWIL_TAB.EMPTY_TITLE}
        </h3>
        <p style={{ fontSize: "13px", margin: 0, opacity: 0.8 }}>
          {TEXT_MONITORING.KORWIL_TAB.EMPTY_DESC}
        </p>
      </div>
    );
  }

  // Calculate Regional Total Ritase PP if not available directly
  const totalRitasePp = data.routes.reduce((acc, r) => {
    if (r.totalRitasePp !== undefined && r.totalRitasePp !== null) return acc + r.totalRitasePp;
    if (r.kmBaku > 0) return acc + r.totalKm / r.kmBaku;
    return acc + (r.totalTrips ? r.totalTrips / 2 : 0);
  }, 0);
  const avgRitasePerBus = data.totalRealops > 0 ? totalRitasePp / data.totalRealops : 0;
  const targetPct =
    data.totalTargetPassengers > 0
      ? (data.totalTodayPassengers / data.totalTargetPassengers) * 100
      : 0;

  return (
    <div className="monitoring-korwil-tab" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* 1. KARTU RANGKUMAN TOTAL 18 RUTE WILAYAH */}
      <div
        className="monitoring-card"
        style={{
          background: "var(--card-bg, #1e1e1e)",
          border: "1px solid var(--card-border, rgba(255, 255, 255, 0.1))",
          borderRadius: "16px",
          padding: "16px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, var(--accent-color, #3ECF8E), #10B981, #059669)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <div>
            <h2
              style={{
                fontSize: "15px",
                fontWeight: 800,
                color: "var(--text-primary, #ededed)",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Award size={18} style={{ color: "var(--accent-color, #3ECF8E)" }} />
              {TEXT_MONITORING.KORWIL_TAB.TOTAL_WILAYAH_CARD}
            </h2>
            <span style={{ fontSize: "11px", color: "var(--text-secondary, #888)", display: "block", marginTop: "2px" }}>
              {TEXT_MONITORING.KORWIL_TAB.TOTAL_WILAYAH_DESC}
            </span>
          </div>

          <span
            style={{
              padding: "4px 10px",
              borderRadius: "9999px",
              fontSize: "11px",
              fontWeight: 700,
              background: "rgba(62, 207, 142, 0.12)",
              color: "var(--accent-color, #3ECF8E)",
              border: "1px solid rgba(62, 207, 142, 0.3)",
            }}
          >
            {TEXT_MONITORING.KORWIL_TAB.ROUTES_COUNT(data.routes.length || 18)}
          </span>
        </div>

        {/* Macro Grid 4 Metrics */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "10px",
          }}
        >
          {/* Unit Operasi */}
          <div
            style={{
              background: "var(--input-bg, rgba(255, 255, 255, 0.04))",
              padding: "10px 12px",
              borderRadius: "12px",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
            }}
          >
            <span style={{ fontSize: "11px", color: "var(--text-secondary, #888)", display: "block" }}>
              {TEXT_MONITORING.KPI.FLEET_LABEL}
            </span>
            <div style={{ fontSize: "17px", fontWeight: 800, color: "var(--text-primary, #ededed)", marginTop: "2px" }}>
              {data.totalRealops} <span style={{ fontSize: "11px", fontWeight: 500 }}>{TEXT_MONITORING.KPI.FLEET_UNIT}</span>
            </div>
            <span style={{ fontSize: "10px", color: "var(--text-secondary, #888)" }}>
              {data.totalRenops} Renops
            </span>
          </div>

          {/* Total KM Tempuh */}
          <div
            style={{
              background: "var(--input-bg, rgba(255, 255, 255, 0.04))",
              padding: "10px 12px",
              borderRadius: "12px",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
            }}
          >
            <span style={{ fontSize: "11px", color: "var(--text-secondary, #888)", display: "block" }}>
              {TEXT_MONITORING.KPI.KM_LABEL}
            </span>
            <div style={{ fontSize: "17px", fontWeight: 800, color: "var(--text-primary, #ededed)", marginTop: "2px" }}>
              {formatNumber(data.totalKm)} <span style={{ fontSize: "11px", fontWeight: 500 }}>{TEXT_MONITORING.KPI.KM_UNIT}</span>
            </div>
            <span style={{ fontSize: "10px", color: "var(--text-secondary, #888)" }}>
              {formatDecimal(data.averageKmPerBus)} {TEXT_MONITORING.DASHBOARD.MACRO_KPIS.PER_BUS}
            </span>
          </div>

          {/* Total Penumpang */}
          <div
            style={{
              background: "var(--input-bg, rgba(255, 255, 255, 0.04))",
              padding: "10px 12px",
              borderRadius: "12px",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
            }}
          >
            <span style={{ fontSize: "11px", color: "var(--text-secondary, #888)", display: "block" }}>
              {TEXT_MONITORING.KPI.PASSENGER_LABEL}
            </span>
            <div style={{ fontSize: "17px", fontWeight: 800, color: "var(--accent-color, #3ECF8E)", marginTop: "2px" }}>
              {formatNumber(data.totalTodayPassengers)} <span style={{ fontSize: "11px", fontWeight: 500 }}>{TEXT_MONITORING.KPI.PASSENGER_UNIT}</span>
            </div>
            <span style={{ fontSize: "10px", color: "var(--text-secondary, #888)" }}>
              {formatDecimal(targetPct)}% Capaian
            </span>
          </div>

          {/* Total Ritase PP */}
          <div
            style={{
              background: "var(--input-bg, rgba(255, 255, 255, 0.04))",
              padding: "10px 12px",
              borderRadius: "12px",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
            }}
          >
            <span style={{ fontSize: "11px", color: "var(--text-secondary, #888)", display: "block" }}>
              {TEXT_MONITORING.ROUTE_DETAIL_MODAL.METRICS.TOTAL_RITASE_PP}
            </span>
            <div style={{ fontSize: "17px", fontWeight: 800, color: "var(--text-primary, #ededed)", marginTop: "2px" }}>
              {formatNumber(totalRitasePp)} <span style={{ fontSize: "11px", fontWeight: 500 }}>{TEXT_MONITORING.ROUTE_DETAIL_MODAL.METRICS.UNIT_RIT}</span>
            </div>
            <span style={{ fontSize: "10px", color: "var(--text-secondary, #888)" }}>
              {formatDecimal(avgRitasePerBus)} {TEXT_MONITORING.ROUTE_DETAIL_MODAL.METRICS.UNIT_RIT_PER_BUS}
            </span>
          </div>
        </div>
      </div>

      {/* 2. 3 KARTU TIM KORWIL */}
      {supervisorSummaries.map((team) => {
        const isExpanded = !!expandedTeams[team.id];
        const isHighTarget = team.targetAchievementPercentage >= 80;
        const isMediumTarget = team.targetAchievementPercentage >= 60;
        const badgeColor = isHighTarget ? "#10B981" : isMediumTarget ? "#F59E0B" : "#EF4444";
        const badgeBg = isHighTarget
          ? "rgba(16, 185, 129, 0.12)"
          : isMediumTarget
          ? "rgba(245, 158, 11, 0.12)"
          : "rgba(239, 68, 68, 0.12)";

        return (
          <div
            key={team.id}
            data-testid={`korwil-team-card-${team.id}`}
            style={{
              background: "var(--card-bg, #1e1e1e)",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
              borderRadius: "16px",
              padding: "16px",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
              transition: "all 0.25s cubic-bezier(0.32, 0.72, 0, 1)",
            }}
          >
            {/* Header Tim Korwil */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "12px",
                marginBottom: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    background: "rgba(62, 207, 142, 0.12)",
                    border: "1px solid rgba(62, 207, 142, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent-color, #3ECF8E)",
                    flexShrink: 0,
                  }}
                >
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: "15px",
                      fontWeight: 800,
                      color: "var(--text-primary, #ededed)",
                      margin: 0,
                      lineHeight: 1.2,
                    }}
                  >
                    {team.name}
                  </h3>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--text-secondary, #888)",
                      display: "block",
                      marginTop: "2px",
                    }}
                  >
                    {TEXT_MONITORING.KORWIL_TAB.SUPERVISOR_PREFIX} {team.routes.length} Rute Mikrotrans
                  </span>
                </div>
              </div>

              {/* Capaian Target Pill */}
              <div
                style={{
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  background: badgeBg,
                  color: badgeColor,
                  border: `1px solid ${badgeColor}33`,
                  fontSize: "11.5px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {formatDecimal(team.targetAchievementPercentage)}% Target
              </div>
            </div>

            {/* Metrik Grid Tim */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              {/* Unit Operasi */}
              <div
                style={{
                  background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
                  padding: "8px 10px",
                  borderRadius: "10px",
                }}
              >
                <span style={{ fontSize: "10.5px", color: "var(--text-secondary, #888)" }}>
                  {TEXT_MONITORING.KPI.FLEET_LABEL}
                </span>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary, #ededed)" }}>
                  {team.totalRealops} Bus{" "}
                  <span style={{ fontSize: "10px", color: "var(--text-secondary, #888)", fontWeight: 400 }}>
                    ({team.totalRenops} Ren)
                  </span>
                </div>
              </div>

              {/* Total KM & KM/Bus */}
              <div
                style={{
                  background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
                  padding: "8px 10px",
                  borderRadius: "10px",
                }}
              >
                <span style={{ fontSize: "10.5px", color: "var(--text-secondary, #888)" }}>
                  {TEXT_MONITORING.KPI.KM_LABEL}
                </span>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary, #ededed)" }}>
                  {formatNumber(team.totalKm)} km{" "}
                  <span style={{ fontSize: "10px", color: "var(--text-secondary, #888)", fontWeight: 400 }}>
                    ({formatDecimal(team.averageKmPerBus)} km/bus)
                  </span>
                </div>
              </div>

              {/* Total Penumpang */}
              <div
                style={{
                  background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
                  padding: "8px 10px",
                  borderRadius: "10px",
                }}
              >
                <span style={{ fontSize: "10.5px", color: "var(--text-secondary, #888)" }}>
                  {TEXT_MONITORING.KPI.PASSENGER_LABEL}
                </span>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--accent-color, #3ECF8E)" }}>
                  {formatNumber(team.totalTodayPassengers)} org
                </div>
              </div>

              {/* Total Ritase PP & Rit/Bus */}
              <div
                style={{
                  background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
                  padding: "8px 10px",
                  borderRadius: "10px",
                }}
              >
                <span style={{ fontSize: "10.5px", color: "var(--text-secondary, #888)" }}>
                  {TEXT_MONITORING.ROUTE_DETAIL_MODAL.METRICS.TOTAL_RITASE_PP}
                </span>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary, #ededed)" }}>
                  {formatNumber(team.totalRitasePp)} rit{" "}
                  <span style={{ fontSize: "10px", color: "var(--text-secondary, #888)", fontWeight: 400 }}>
                    ({formatDecimal(team.averageRitasePerBus)} rit/bus)
                  </span>
                </div>
              </div>
            </div>

            {/* Accordion Toggle Button */}
            <button
              type="button"
              data-testid={`toggle-routes-${team.id}`}
              onClick={() => toggleTeamExpand(team.id)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1px dashed var(--card-border, rgba(255, 255, 255, 0.15))",
                background: isExpanded ? "rgba(255, 255, 255, 0.03)" : "transparent",
                color: "var(--text-primary, #ededed)",
                fontSize: "12px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
              }}
            >
              <span>
                {isExpanded
                  ? TEXT_MONITORING.KORWIL_TAB.COLLAPSE_ROUTES
                  : `${TEXT_MONITORING.KORWIL_TAB.EXPAND_ROUTES} (${team.routes.length})`}
              </span>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* Expanded Route Items List */}
            {isExpanded && (
              <div
                data-testid={`korwil-routes-list-${team.id}`}
                style={{
                  marginTop: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  animation: "fadeIn 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
                }}
              >
                {team.routes.map((route: RegionalRouteItem) => {
                  const routeRitasePp =
                    route.totalRitasePp ??
                    (route.kmBaku > 0 ? route.totalKm / route.kmBaku : (route.totalTrips ? route.totalTrips / 2 : 0));

                  return (
                    <div
                      key={route.id}
                      data-testid={`korwil-route-row-${route.routeCode}`}
                      onClick={() => onSelectRoute?.(route.routeCode)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        background: "var(--input-bg, rgba(255, 255, 255, 0.02))",
                        border: "1px solid var(--card-border, rgba(255, 255, 255, 0.05))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: onSelectRoute ? "pointer" : "default",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                        <span
                          style={{
                            padding: "2px 6px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 800,
                            background: "rgba(62, 207, 142, 0.12)",
                            color: "var(--accent-color, #3ECF8E)",
                          }}
                        >
                          {route.routeCode}
                        </span>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "var(--text-primary, #ededed)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {route.routeName}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                        <div style={{ textAlign: "right", fontSize: "11px" }}>
                          <span style={{ fontWeight: 700, color: "var(--text-primary, #ededed)" }}>
                            {formatNumber(route.todayPassengers)} org
                          </span>
                          <span style={{ color: "var(--text-secondary, #888)", display: "block", fontSize: "10px" }}>
                            {formatNumber(routeRitasePp)} rit
                          </span>
                        </div>
                        {onSelectRoute && (
                          <ArrowUpRight size={14} style={{ color: "var(--text-secondary, #888)" }} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MonitoringKorwilTab;
