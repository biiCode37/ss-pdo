import React from "react";
import { TEXT_MONITORING } from "@/constants/texts";

interface MonitoringReadinessBannerProps {
  submittedCount: number;
  totalRoutesCount: number;
  verifiedCount: number;
  draftCount: number;
  emptyCount: number;
  appInputCount?: number;
  sheetSyncCount?: number;
}

export const MonitoringReadinessBanner: React.FC<
  MonitoringReadinessBannerProps
> = ({
  submittedCount,
  totalRoutesCount,
  verifiedCount,
  draftCount,
  emptyCount,
  appInputCount,
  sheetSyncCount,
}) => {
  const pct = Math.round(
    (submittedCount / (totalRoutesCount || 1)) * 100,
  );

  return (
    <section
      style={{
        background: "var(--card-bg, rgba(23, 23, 23, 0.85))",
        border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
        borderRadius: "16px",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          fontSize: "13px",
          gap: "8px",
        }}
      >
        <span
          style={{
            color: "var(--text-secondary, #8b8b8b)",
            fontWeight: 500,
          }}
        >
          {TEXT_MONITORING.READINESS.LABEL}
        </span>
        <div style={{ textAlign: "right" }}>
          <span
            style={{
              fontWeight: 800,
              color: "var(--text-primary, #ededed)",
              display: "block",
            }}
          >
            {TEXT_MONITORING.READINESS.SUMMARY(
              submittedCount,
              totalRoutesCount,
              pct,
            )}
          </span>
          {appInputCount !== undefined && sheetSyncCount !== undefined && (
            <span
              style={{
                fontSize: "11px",
                color: "var(--text-secondary, #8b8b8b)",
                display: "block",
                marginTop: "2px",
              }}
            >
              {TEXT_MONITORING.READINESS.SUMMARY_DETAILED(
                appInputCount + sheetSyncCount,
                totalRoutesCount,
                appInputCount,
                sheetSyncCount
              )}
            </span>
          )}
        </div>
      </div>

      {/* Progress Track */}
      <div
        style={{
          width: "100%",
          height: "8px",
          borderRadius: "9999px",
          background: "var(--input-bg, rgba(255, 255, 255, 0.06))",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "linear-gradient(90deg, #3ECF8E 0%, #00C573 100%)",
            borderRadius: "9999px",
            transition: "width 0.4s ease",
          }}
        />
      </div>

      {/* Status Breakdown Legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "14px",
          fontSize: "11.5px",
          color: "var(--text-secondary, #8b8b8b)",
          paddingTop: "2px",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#10b981",
            }}
          />
          {TEXT_MONITORING.READINESS.LEGEND_VERIFIED}{" "}
          <strong style={{ color: "var(--text-primary)" }}>
            {verifiedCount}
          </strong>
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#3b82f6",
            }}
          />
          {TEXT_MONITORING.READINESS.LEGEND_SUBMITTED}{" "}
          <strong style={{ color: "var(--text-primary)" }}>
            {submittedCount - verifiedCount}
          </strong>
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#f59e0b",
            }}
          />
          {TEXT_MONITORING.READINESS.LEGEND_DRAFT}{" "}
          <strong style={{ color: "var(--text-primary)" }}>{draftCount}</strong>
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#64748b",
            }}
          />
          {TEXT_MONITORING.READINESS.LEGEND_EMPTY}{" "}
          <strong style={{ color: "var(--text-primary)" }}>{emptyCount}</strong>
        </span>
      </div>
    </section>
  );
};
