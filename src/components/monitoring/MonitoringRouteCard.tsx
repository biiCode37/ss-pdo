import React from "react";
import { CheckCircle2, Send, Clock, AlertTriangle } from "lucide-react";
import type { RegionalRouteItem } from "@/services/allRouteMonitoringService";
import { TEXT_MONITORING } from "@/constants/texts";
import { formatNumber, formatDecimal } from "./monitoringUtils";

interface MonitoringRouteCardProps {
  route: RegionalRouteItem;
  onVerify: () => void;
  onSelectRoute?: (routeCode: string) => void;
}

export const MonitoringRouteCard: React.FC<MonitoringRouteCardProps> = ({
  route,
  onVerify,
  onSelectRoute,
}) => {
  const isVerified = route.status === "verified";
  const isSubmitted = route.status === "submitted";
  const isDraft = route.status === "draft";
  const isEmpty = route.status === "empty";

  return (
    <div
      style={{
        background: "var(--card-bg, rgba(23, 23, 23, 0.85))",
        border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
        borderRadius: "16px",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "12px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        transition: "transform 0.15s ease, border-color 0.15s ease",
      }}
    >
      {/* Top Section: Code Badge, Name, Operator & Status Badge */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Route Code Badge */}
            <span
              onClick={() => onSelectRoute?.(route.routeCode)}
              style={{
                padding: "4px 10px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 800,
                letterSpacing: "0.4px",
                background: "rgba(62, 207, 142, 0.12)",
                color: "var(--accent-color, #3ECF8E)",
                border: "1px solid rgba(62, 207, 142, 0.25)",
                cursor: "pointer",
              }}
              title={TEXT_MONITORING.ROUTE_CARD.OPEN_ROUTE_TITLE}
            >
              {route.routeCode}
            </span>

            <span
              style={{
                fontSize: "12px",
                color: "var(--text-secondary, #8b8b8b)",
                fontWeight: 600,
                maxWidth: "140px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {route.operatorName || "-"}
            </span>
          </div>

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
              <CheckCircle2 size={13} />
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
                background: "rgba(59, 130, 246, 0.12)",
                color: "#3b82f6",
                border: "1px solid rgba(59, 130, 246, 0.25)",
              }}
            >
              <Send size={13} />
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
              <Clock size={13} />
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
                fontWeight: 600,
                background: "rgba(255, 255, 255, 0.05)",
                color: "var(--text-secondary, #8b8b8b)",
                border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
              }}
            >
              <AlertTriangle size={13} />
              {TEXT_MONITORING.ROUTE_CARD.BADGE_EMPTY}
            </span>
          )}
        </div>

        {/* Route Name */}
        <h3
          onClick={() => onSelectRoute?.(route.routeCode)}
          style={{
            fontSize: "13.5px",
            fontWeight: 700,
            color: "var(--text-primary, #ededed)",
            margin: 0,
            cursor: "pointer",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={route.routeName}
        >
          {route.routeName}
        </h3>

        {/* Korlap Info */}
        <div style={{ fontSize: "11px", color: "var(--text-secondary, #8b8b8b)" }}>
          {TEXT_MONITORING.ROUTE_CARD.KORLAP_PREFIX}{" "}
          <strong
            style={{
              color: "var(--text-primary, #ededed)",
              fontWeight: 600,
            }}
          >
            {route.supervisorName}
          </strong>
        </div>
      </div>

      {/* Metrics Section: 3-column Box */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "8px",
          padding: "10px",
          borderRadius: "12px",
          background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
          border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
          textAlign: "center",
        }}
      >
        {/* Armada */}
        <div>
          <span
            style={{
              fontSize: "10px",
              color: "var(--text-secondary, #8b8b8b)",
              textTransform: "uppercase",
              fontWeight: 600,
              display: "block",
            }}
          >
            {TEXT_MONITORING.ROUTE_CARD.METRIC_ARMADA}
          </span>
          <div
            className="tabular-nums"
            style={{
              fontSize: "13px",
              fontWeight: 800,
              color: "var(--text-primary, #ededed)",
              marginTop: "2px",
            }}
          >
            {route.totalRealops} / {route.totalRenops}
          </div>
          <span
            className="tabular-nums"
            style={{
              fontSize: "10px",
              color: "var(--text-secondary)",
              display: "block",
              marginTop: "1px",
            }}
          >
            S1:{route.realopsShift1} | S2:{route.realopsShift2}
          </span>
        </div>

        {/* Pelanggan */}
        <div>
          <span
            style={{
              fontSize: "10px",
              color: "var(--text-secondary, #8b8b8b)",
              textTransform: "uppercase",
              fontWeight: 600,
              display: "block",
            }}
          >
            {TEXT_MONITORING.ROUTE_CARD.METRIC_PASSENGERS}
          </span>
          <div
            className="tabular-nums"
            style={{
              fontSize: "13px",
              fontWeight: 800,
              color: "var(--accent-color, #3ECF8E)",
              marginTop: "2px",
            }}
          >
            {formatNumber(route.todayPassengers)}
          </div>
          <span
            className="tabular-nums"
            style={{
              fontSize: "10px",
              color: "var(--text-secondary)",
              display: "block",
              marginTop: "1px",
            }}
          >
            S1:{formatNumber(route.totalShift1)} S2:
            {formatNumber(route.totalShift2)}
          </span>
        </div>

        {/* Total KM */}
        <div>
          <span
            style={{
              fontSize: "10px",
              color: "var(--text-secondary, #8b8b8b)",
              textTransform: "uppercase",
              fontWeight: 600,
              display: "block",
            }}
          >
            {TEXT_MONITORING.ROUTE_CARD.METRIC_KM}
          </span>
          <div
            className="tabular-nums"
            style={{
              fontSize: "13px",
              fontWeight: 800,
              color: "#38bdf8",
              marginTop: "2px",
            }}
          >
            {formatDecimal(route.totalKm, 1)}
          </div>
          <span
            className="tabular-nums"
            style={{
              fontSize: "10px",
              color: "var(--text-secondary)",
              display: "block",
              marginTop: "1px",
            }}
          >
            {TEXT_MONITORING.ROUTE_CARD.KM_PER_BUS_PREFIX}{" "}
            {formatDecimal(route.achievementKm, 1)}
          </span>
        </div>
      </div>

      {/* Macet & Kendala tags (jika ada) */}
      {(route.trafficJamSpots.length > 0 || route.operationalIssues) && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            fontSize: "11px",
          }}
        >
          {route.trafficJamSpots.length > 0 && (
            <div
              style={{
                padding: "4px 8px",
                borderRadius: "6px",
                background: "rgba(245, 158, 11, 0.1)",
                border: "1px solid rgba(245, 158, 11, 0.2)",
                color: "#f59e0b",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              <strong>{TEXT_MONITORING.ROUTE_CARD.JAM_PREFIX}</strong>{" "}
              {route.trafficJamSpots.join(", ")}
            </div>
          )}
          {route.operationalIssues && (
            <div
              style={{
                padding: "4px 8px",
                borderRadius: "6px",
                background: "var(--input-bg, rgba(255, 255, 255, 0.05))",
                border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
                color: "var(--text-secondary, #8b8b8b)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              <strong>{TEXT_MONITORING.ROUTE_CARD.ISSUE_PREFIX}</strong>{" "}
              {route.operationalIssues}
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "6px",
          borderTop: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
          fontSize: "11px",
        }}
      >
        <span style={{ color: "var(--text-secondary, #8b8b8b)" }}>
          {TEXT_MONITORING.ROUTE_CARD.HEADWAY_LABEL(
            route.headwayFastest,
            route.headwaySlowest,
          )}
        </span>

        {isSubmitted && !isVerified && (
          <button
            type="button"
            onClick={onVerify}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "8px",
              background: "var(--accent-color, #3ECF8E)",
              color: "#ffffff",
              border: "none",
              fontSize: "11.5px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <CheckCircle2 size={13} />
            <span>{TEXT_MONITORING.ROUTE_CARD.BTN_VERIFY}</span>
          </button>
        )}
      </div>
    </div>
  );
};
