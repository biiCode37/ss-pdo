import React from "react";
import {
  Bus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { TEXT_MONITORING, TEXT_COMMON } from "@/constants/texts";
import { formatIndonesianDateLabel } from "./monitoringUtils";
import { UserProfileHeader } from "@/components/UserProfileHeader";

export interface MonitoringHeaderProps {
  onBackToRouteView?: () => void;
  onOpenProfile?: () => void;
  selectedDate: string;
  onStepDate: (days: number) => void;
  onDateInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRefresh: () => void;
  refreshing: boolean;
  loading: boolean;
  onOpenWaModal?: () => void;
  hasData?: boolean;
  onSync18Routes?: () => void;
  syncing18Routes?: boolean;
}

export const MonitoringHeader: React.FC<MonitoringHeaderProps> = ({
  onOpenProfile,
  selectedDate,
  onStepDate,
  onDateInputChange,
  onRefresh,
  refreshing,
  loading,
  onSync18Routes,
  syncing18Routes,
}) => {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "var(--card-bg, rgba(23, 23, 23, 0.95))",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
        padding: "12px 16px",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        {/* Pojok Kiri: Judul & Subtitle */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div>
            <h1
              style={{
                fontSize: "17px",
                fontWeight: 800,
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "var(--text-primary, #ededed)",
                letterSpacing: "-0.3px",
              }}
            >
              <Bus
                size={20}
                style={{ color: "var(--accent-color, #3ECF8E)", flexShrink: 0 }}
              />
              <span>{TEXT_MONITORING.HEADER.TITLE}</span>
            </h1>
            <span
              style={{
                fontSize: "11px",
                color: "var(--text-secondary, #8b8b8b)",
                fontWeight: 500,
                display: "block",
                marginTop: "1px",
              }}
            >
              {TEXT_MONITORING.HEADER.SUBTITLE}
            </span>
          </div>
        </div>

        {/* Pojok Kanan: Date Navigator, Refresh, Sync Global, Profile Avatar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          {/* Date Navigator Box */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "var(--input-bg, rgba(255, 255, 255, 0.05))",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.1))",
              borderRadius: "12px",
              padding: "2px",
            }}
          >
            <button
              type="button"
              onClick={() => onStepDate(-1)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-primary, #ededed)",
                padding: "6px 8px",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
              title={TEXT_COMMON.NAV.PREV_DAY}
            >
              <ChevronLeft size={16} />
            </button>

            <label
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 8px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--text-primary, #ededed)",
                userSelect: "none",
              }}
            >
              <Calendar
                size={14}
                style={{ color: "var(--accent-color, #3ECF8E)" }}
              />
              <span>{formatIndonesianDateLabel(selectedDate)}</span>
              <input
                type="date"
                value={selectedDate}
                onChange={onDateInputChange}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  cursor: "pointer",
                  width: "100%",
                  height: "100%",
                }}
              />
            </label>

            <button
              type="button"
              onClick={() => onStepDate(1)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-primary, #ededed)",
                padding: "6px 8px",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
              title={TEXT_COMMON.NAV.NEXT_DAY}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing || loading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "12px",
              background: "var(--input-bg, rgba(255, 255, 255, 0.05))",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.1))",
              color: "var(--text-primary, #ededed)",
              cursor: refreshing || loading ? "wait" : "pointer",
              opacity: refreshing || loading ? 0.6 : 1,
              transition: "all 0.2s ease",
            }}
            title={TEXT_MONITORING.HEADER.REFRESH_TITLE}
          >
            <RefreshCw
              size={16}
              style={{
                animation: refreshing ? "spin 1s linear infinite" : "none",
              }}
            />
          </button>

          {/* Tarik 18 Rute Button (Direct Action) */}
          {onSync18Routes && (
            <button
              type="button"
              onClick={onSync18Routes}
              disabled={syncing18Routes || loading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 12px",
                borderRadius: "12px",
                background: "rgba(62, 207, 142, 0.12)",
                border: "1px solid rgba(62, 207, 142, 0.25)",
                color: "var(--accent-color, #3ECF8E)",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: syncing18Routes || loading ? "not-allowed" : "pointer",
                opacity: syncing18Routes || loading ? 0.6 : 1,
                transition: "all 0.2s ease",
              }}
              title={TEXT_MONITORING.INGESTION.TOOLTIP}
            >
              <RefreshCw
                size={16}
                style={{
                  animation: syncing18Routes ? "spin 1s linear infinite" : "none",
                }}
              />
              <span>
                {syncing18Routes
                  ? TEXT_MONITORING.INGESTION.BUTTON_LOADING
                  : TEXT_MONITORING.INGESTION.BUTTON_LABEL}
              </span>
            </button>
          )}

          {/* User Profile Trigger Button */}
          {onOpenProfile && (
            <div style={{ marginLeft: "4px" }}>
              <UserProfileHeader onOpenProfile={onOpenProfile} />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default MonitoringHeader;
