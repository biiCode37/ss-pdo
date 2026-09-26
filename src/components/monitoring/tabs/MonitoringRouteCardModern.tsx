import React from "react";
import { CheckCircle2, Send, Clock, AlertTriangle, ChevronRight, Check } from "lucide-react";
import type { RegionalRouteItem } from "@/services/allRouteMonitoringService";
import { TEXT_MONITORING } from "@/constants/texts";

export interface MonitoringRouteCardModernProps {
  route: RegionalRouteItem;
  onCardClick?: (route: RegionalRouteItem) => void;
  onVerify?: (routeId: number, status: "verified") => void;
  onSelectRoute?: (routeCode: string) => void;
  isVerifying?: boolean;
}

export const MonitoringRouteCardModern: React.FC<MonitoringRouteCardModernProps> = ({
  route,
  onCardClick,
  onVerify,
  onSelectRoute,
  isVerifying,
}) => {
  const isVerified = route.status === "verified";
  const isSubmitted = route.status === "submitted";
  const isDraft = route.status === "draft";
  const isEmpty = route.status === "empty";

  const totalToa = route.toaShift1 + route.toaShift2;
  const totalManual = route.manualShift1 + route.manualShift2;
  const renops = route.totalRenops || route.defaultRenops || 0;
  const realops = route.totalRealops || 0;
  const kmPerBus = route.kmPerBus ?? (realops > 0 ? (route.totalKm / realops).toFixed(0) : route.achievementKm?.toFixed(0) ?? 0);
  const paxPct = route.paxPercentage
    ? `${route.paxPercentage.toFixed(1)}%`
    : route.targetPax > 0
    ? `${((route.todayPassengers / route.targetPax) * 100).toFixed(1)}%`
    : "0.0%";

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick(route);
    } else if (onSelectRoute) {
      onSelectRoute(route.routeCode);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid={`route-card-${route.routeCode}`}
      aria-label={TEXT_MONITORING.ROUTE_CARD.ARIA_CARD_CLICK(route.routeCode)}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className="monitoring-card"
      style={{
        background: "var(--card-bg, rgba(23, 23, 23, 0.75))",
        borderRadius: "16px",
        border: isSubmitted
          ? "1px solid rgba(56, 189, 248, 0.35)"
          : "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
        padding: "13px 14px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
        position: "relative",
        cursor: "pointer",
        transition: "transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      {/* 1. Header: Badge, Operator, Korlap, Status Badges */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Route Code Badge */}
          <span
            data-testid={`open-route-${route.routeCode}`}
            style={{
              padding: "4px 10px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 800,
              background: "rgba(62, 207, 142, 0.12)",
              color: "var(--accent-color, #3ECF8E)",
              border: "1px solid rgba(62, 207, 142, 0.3)",
              letterSpacing: "0.2px",
              display: "inline-block",
            }}
          >
            {route.routeCode}
          </span>

          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-primary)",
                lineHeight: 1.2,
              }}
            >
              {route.operatorName || "Mikrotrans"}
            </div>
            <div
              style={{
                fontSize: "10.5px",
                color: "var(--text-secondary)",
                marginTop: "2px",
              }}
            >
              {TEXT_MONITORING.ROUTE_CARD.KORLAP_PREFIX} {route.supervisorName}
            </div>
          </div>
        </div>

        {/* Badges: Provenance & Status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          {/* Provenance Badge */}
          {route.dataSource === "app_input" ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                padding: "2px 6px",
                borderRadius: "6px",
                fontSize: "10.5px",
                fontWeight: 700,
                background: "rgba(16, 185, 129, 0.12)",
                color: "#10b981",
                border: "1px solid rgba(16, 185, 129, 0.25)",
              }}
              title="Data dikirim melalui input aplikasi"
            >
              {TEXT_MONITORING.PROVENANCE.APP_INPUT}
            </span>
          ) : route.dataSource === "sheet_ingestion" ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                padding: "2px 6px",
                borderRadius: "6px",
                fontSize: "10.5px",
                fontWeight: 700,
                background: "rgba(56, 189, 248, 0.12)",
                color: "#38bdf8",
                border: "1px solid rgba(56, 189, 248, 0.25)",
              }}
              title="Data ditarik langsung dari Google Sheet rute"
            >
              {TEXT_MONITORING.PROVENANCE.SHEET_SYNC}
            </span>
          ) : null}

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
        </div>
      </div>

      {/* 2. 3-Column Core Metrics Box */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "8px",
          background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
          border: "1px solid var(--card-border, rgba(255, 255, 255, 0.05))",
          borderRadius: "12px",
          padding: "9px 8px",
          textAlign: "center",
        }}
      >
        {/* Armada: Realops / Renops */}
        <div>
          <div
            style={{
              fontSize: "10.5px",
              color: "var(--text-secondary)",
              fontWeight: 600,
            }}
          >
            {TEXT_MONITORING.ROUTE_CARD.LBL_CORE_FLEET}
          </div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 800,
              color: "var(--text-primary)",
              marginTop: "2px",
            }}
          >
            {realops}/{renops}
          </div>
          <div
            style={{
              fontSize: "9.5px",
              color: "var(--text-secondary)",
              marginTop: "1px",
              whiteSpace: "nowrap",
            }}
          >
            S1:{route.realopsShift1 ?? "-"} • S2:{route.realopsShift2 ?? "-"}
          </div>
        </div>

        {/* Pelanggan: Total, TOA, Manual */}
        <div>
          <div
            style={{
              fontSize: "10.5px",
              color: "var(--text-secondary)",
              fontWeight: 600,
            }}
          >
            {TEXT_MONITORING.ROUTE_CARD.LBL_CORE_PASSENGERS}
          </div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 800,
              color: "var(--accent-color, #3ECF8E)",
              marginTop: "2px",
            }}
          >
            {route.todayPassengers.toLocaleString("id-ID")}
          </div>
          <div
            style={{
              fontSize: "9.5px",
              color: "var(--text-secondary)",
              marginTop: "1px",
              whiteSpace: "nowrap",
            }}
          >
            {TEXT_MONITORING.ROUTE_CARD.PAX_TOA_PREFIX} {totalToa.toLocaleString("id-ID")} •{" "}
            {TEXT_MONITORING.ROUTE_CARD.PAX_MANUAL_PREFIX} {totalManual.toLocaleString("id-ID")}
          </div>
        </div>

        {/* Efisiensi: KM/Bus & Capaian % */}
        <div>
          <div
            style={{
              fontSize: "10.5px",
              color: "var(--text-secondary)",
              fontWeight: 600,
            }}
          >
            {TEXT_MONITORING.ROUTE_CARD.LBL_CORE_KM}
          </div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 800,
              color: "var(--text-primary)",
              marginTop: "2px",
            }}
          >
            {kmPerBus}
          </div>
          <div
            style={{
              fontSize: "9.5px",
              color: "var(--text-secondary)",
              marginTop: "1px",
              whiteSpace: "nowrap",
            }}
          >
            {TEXT_MONITORING.ROUTE_CARD.PCT_PAX_PREFIX} {paxPct}
          </div>
        </div>
      </div>

      {/* 3. Secondary Chips & Action Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          paddingTop: "1px",
        }}
      >
        {/* Left: Trend Chips H-1 & H-7 */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              padding: "2px 6px",
              borderRadius: "6px",
              background: "var(--input-bg, rgba(255, 255, 255, 0.04))",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.07))",
              color: "var(--text-secondary)",
            }}
          >
            {TEXT_MONITORING.ROUTE_CARD.PAX_YESTERDAY_PREFIX}{" "}
            {route.yesterdayPassengers ? route.yesterdayPassengers.toLocaleString("id-ID") : "-"}
          </span>

          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              padding: "2px 6px",
              borderRadius: "6px",
              background: "var(--input-bg, rgba(255, 255, 255, 0.04))",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.07))",
              color: "var(--text-secondary)",
            }}
          >
            {TEXT_MONITORING.ROUTE_CARD.PAX_LAST_WEEK_PREFIX}{" "}
            {route.lastWeekPassengers ? route.lastWeekPassengers.toLocaleString("id-ID") : "-"}
          </span>
        </div>

        {/* Right: Verify Action & Tap Chevron Affordance */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {isSubmitted && (
            <button
              type="button"
              data-testid={`verify-btn-${route.routeCode}`}
              onClick={(e) => {
                e.stopPropagation();
                onVerify?.(route.id, "verified");
              }}
              disabled={isVerifying}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 12px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                color: "#ffffff",
                border: "none",
                fontSize: "11.5px",
                fontWeight: 700,
                cursor: isVerifying ? "wait" : "pointer",
                opacity: isVerifying ? 0.7 : 1,
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                transition: "all 0.15s ease",
              }}
            >
              <Check size={13} />
              <span>{TEXT_MONITORING.ROUTE_CARD.BTN_VERIFY}</span>
            </button>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              color: "var(--text-secondary)",
              padding: "4px",
              opacity: 0.6,
            }}
          >
            <ChevronRight size={15} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringRouteCardModern;
