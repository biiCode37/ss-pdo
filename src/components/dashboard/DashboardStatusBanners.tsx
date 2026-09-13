import React from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { ShiftConfirmationAlertBar } from "@/components/fleetStatus/ShiftConfirmationAlertBar";
import {
  BusCardSkeleton,
  DailyToaTrendSkeleton,
  UnitCardSkeleton,
} from "@/components/Skeletons";
import {
  TEXT_COMMON,
  TEXT_AUTH,
} from "@/constants/texts";
import { isUsingServiceAccount, reauthenticateSession } from "@/services/googleSheets";
import type { BusData } from "@/services/googleSheets";
import type { Route } from "@/types/supabase";

interface DashboardStatusBannersProps {
  pullDistance: number;
  touchStartY: number;
  isRefreshing: boolean;
  isOnline: boolean;
  isAuthExpired: boolean;
  isReauthenticating: boolean;
  onReauthenticate: () => Promise<void>;
  error: string | null;
  missingColumns: string[];
  needsReauth?: boolean;
  confirmedShifts: { 1: boolean; 2: boolean };
  matchedRoute: Route | null;
  selectedTab: string;
  busData: BusData[] | null;
  activeShift: 1 | 2;
  onOpenFleetModal: () => void;
  isLoading: boolean;
  mainTab: "input" | "analytics" | "units";
}

export const DashboardStatusBanners: React.FC<DashboardStatusBannersProps> = ({
  pullDistance,
  touchStartY,
  isRefreshing,
  isOnline,
  isAuthExpired,
  isReauthenticating,
  onReauthenticate,
  error,
  missingColumns,
  needsReauth,
  confirmedShifts,
  matchedRoute,
  selectedTab,
  busData,
  activeShift,
  onOpenFleetModal,
  isLoading,
  mainTab,
}) => {
  return (
    <>
      {/* Pull To Refresh Indicator */}
      <div
        style={{
          height: pullDistance > 0 ? `${pullDistance}px` : "0",
          overflow: "hidden",
          transition: touchStartY === 0 ? "height 0.3s ease" : "none",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            transform: `rotate(${pullDistance * 3}deg)`,
            color: "var(--accent-color)",
          }}
        >
          <RefreshCw size={24} className={isRefreshing ? "spinner" : ""} />
        </div>
      </div>

      {/* Offline Banner */}
      {!isOnline && (
        <div className="offline-banner">
          {TEXT_COMMON.STATUS.OFFLINE_BANNER}
        </div>
      )}

      {/* Auth Expired Banner */}
      {!isUsingServiceAccount() && isAuthExpired && (
        <div
          style={{
            background: "var(--danger-color, #ef4444)",
            color: "#ffffff",
            padding: "12px 16px",
            borderRadius: "12px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            boxShadow: "0 4px 12px rgba(239, 68, 68, 0.25)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            <AlertTriangle size={20} />
            <span>{TEXT_AUTH.SESSION_EXPIRED_BANNER}</span>
          </div>
          <button
            type="button"
            className="btn"
            style={{
              background: "#ffffff",
              color: "var(--danger-color, #ef4444)",
              fontWeight: "bold",
              whiteSpace: "nowrap",
              border: "none",
              padding: "8px 14px",
              fontSize: "13px",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            onClick={onReauthenticate}
            disabled={isReauthenticating}
          >
            {isReauthenticating ? (
              <RefreshCw size={14} className="spinner" />
            ) : (
              <RefreshCw size={14} />
            )}
            {isReauthenticating ? TEXT_COMMON.STATUS.PROCESSING : TEXT_AUTH.REAUTH_BTN}
          </button>
        </div>
      )}

      {/* Shift Confirmation Bar */}
      <ShiftConfirmationAlertBar
        isOpen={
          !confirmedShifts[activeShift] &&
          Boolean(matchedRoute) &&
          selectedTab !== "AKUMULASI" &&
          Boolean(busData && busData.length > 0)
        }
        shift={activeShift}
        routeCode={matchedRoute?.route_code || ""}
        onOpenModal={onOpenFleetModal}
      />

      {/* Error Message */}
      {error && !isAuthExpired && (
        <div className="error-text" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Missing Columns Banner */}
      {missingColumns.length > 0 && (
        <div
          style={{
            marginTop: 12,
            marginBottom: 16,
            padding: "10px 14px",
            background: "rgba(234, 179, 8, 0.12)",
            border: "1px solid rgba(234, 179, 8, 0.4)",
            borderRadius: "8px",
            fontSize: "13px",
            lineHeight: 1.5,
            color: "var(--warning-color)",
          }}
        >
          ⚠️ Kolom berikut <strong>tidak terdeteksi</strong> di header sheet dan{" "}
          <strong>TIDAK akan tersimpan</strong>: {missingColumns.join(", ")}.
          Hubungi admin untuk memperbaiki header.
        </div>
      )}

      {/* Needs Reauth Warning Banner */}
      {needsReauth && (
        <div
          className="card"
          style={{
            marginTop: "16px",
            marginBottom: "16px",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            borderColor: "var(--danger-color, #ef4444)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            padding: "12px 16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "var(--danger-color, #ef4444)" }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{TEXT_AUTH.SESSION_NEED_REAUTH}</span>
          </div>
          <button
            onClick={() => reauthenticateSession().catch(() => {})}
            style={{
              padding: "6px 12px",
              backgroundColor: "var(--danger-color, #ef4444)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {TEXT_AUTH.REFRESH_SESSION_BTN}
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && !busData && (
        <div style={{ marginTop: "16px" }}>
          {mainTab === "analytics" && <DailyToaTrendSkeleton />}
          {mainTab === "input" && <BusCardSkeleton count={5} />}
          {mainTab === "units" && <UnitCardSkeleton count={6} />}
        </div>
      )}
    </>
  );
};
