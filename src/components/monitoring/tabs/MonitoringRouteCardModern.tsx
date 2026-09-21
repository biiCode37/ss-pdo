import React from "react";
import { CheckCircle2, Send, Clock, AlertTriangle, ChevronRight, Check } from "lucide-react";
import type { RegionalRouteItem } from "@/services/allRouteMonitoringService";
import { TEXT_MONITORING } from "@/constants/texts";

export interface MonitoringRouteCardModernProps {
  route: RegionalRouteItem;
  onVerify?: (routeId: number, status: "verified") => void;
  onSelectRoute?: (routeCode: string) => void;
  isVerifying?: boolean;
}

export const MonitoringRouteCardModern: React.FC<MonitoringRouteCardModernProps> = ({
  route,
  onVerify,
  onSelectRoute,
  isVerifying,
}) => {
  const isVerified = route.status === "verified";
  const isSubmitted = route.status === "submitted";
  const isDraft = route.status === "draft";
  const isEmpty = route.status === "empty";

  return (
    <div
      className="monitoring-card"
      style={{
        background: "var(--card-bg, rgba(23, 23, 23, 0.75))",
        borderRadius: "16px",
        border: isSubmitted
          ? "1px solid rgba(56, 189, 248, 0.35)"
          : "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
        position: "relative",
      }}
    >
      {/* 1. Header: Badge, Operator, Korlap, Status Badge */}
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
          <button
            type="button"
            data-testid={`open-route-${route.routeCode}`}
            onClick={() => onSelectRoute?.(route.routeCode)}
            style={{
              padding: "4px 10px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 800,
              background: "rgba(62, 207, 142, 0.12)",
              color: "var(--accent-color, #3ECF8E)",
              border: "1px solid rgba(62, 207, 142, 0.3)",
              cursor: "pointer",
              letterSpacing: "0.2px",
            }}
            title={`Buka rute ${route.routeCode}`}
          >
            {route.routeCode}
          </button>

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

        {/* Status Badge */}
        <div>
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
          padding: "10px",
          textAlign: "center",
        }}
      >
        {/* Armada */}
        <div>
          <div
            style={{
              fontSize: "10.5px",
              color: "var(--text-secondary)",
              fontWeight: 600,
            }}
          >
            {TEXT_MONITORING.ROUTE_CARD.METRIC_ARMADA}
          </div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 800,
              color: "var(--text-primary)",
              marginTop: "2px",
            }}
          >
            {route.totalRealops}/{route.totalRenops}
          </div>
          <div
            style={{
              fontSize: "9.5px",
              color: "var(--text-secondary)",
              marginTop: "1px",
            }}
          >
            S1:{route.realopsShift1} • S2:{route.realopsShift2}
          </div>
        </div>

        {/* Pelanggan */}
        <div>
          <div
            style={{
              fontSize: "10.5px",
              color: "var(--text-secondary)",
              fontWeight: 600,
            }}
          >
            {TEXT_MONITORING.ROUTE_CARD.METRIC_PASSENGERS}
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
            }}
          >
            TOA: {route.toaShift1 + route.toaShift2}
          </div>
        </div>

        {/* Ritase */}
        <div>
          <div
            style={{
              fontSize: "10.5px",
              color: "var(--text-secondary)",
              fontWeight: 600,
            }}
          >
            {TEXT_MONITORING.ROUTE_CARD.METRIC_KM}
          </div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 800,
              color: "var(--text-primary)",
              marginTop: "2px",
            }}
          >
            {route.totalTrips ? `${route.totalTrips} Rit` : `${route.totalKm} KM`}
          </div>
          <div
            style={{
              fontSize: "9.5px",
              color: "var(--text-secondary)",
              marginTop: "1px",
            }}
          >
            {TEXT_MONITORING.ROUTE_CARD.KM_PER_BUS_PREFIX}{" "}
            {route.achievementKm.toFixed(0)}
          </div>
        </div>
      </div>

      {/* 3. Action Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "8px",
          paddingTop: "2px",
        }}
      >
        {isSubmitted && (
          <button
            type="button"
            data-testid={`verify-btn-${route.routeCode}`}
            onClick={() => onVerify?.(route.id, "verified")}
            disabled={isVerifying}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
              color: "#ffffff",
              border: "none",
              fontSize: "12px",
              fontWeight: 700,
              cursor: isVerifying ? "wait" : "pointer",
              opacity: isVerifying ? 0.7 : 1,
              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
              transition: "all 0.15s ease",
            }}
          >
            <Check size={14} />
            <span>{TEXT_MONITORING.ROUTE_CARD.BTN_VERIFY}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onSelectRoute?.(route.routeCode)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "7px 12px",
            borderRadius: "10px",
            background: "var(--input-bg, rgba(255, 255, 255, 0.05))",
            color: "var(--text-primary)",
            border: "1px solid var(--card-border, rgba(255, 255, 255, 0.1))",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <span>Buka Rute</span>
          <ChevronRight size={14} style={{ opacity: 0.6 }} />
        </button>
      </div>
    </div>
  );
};
