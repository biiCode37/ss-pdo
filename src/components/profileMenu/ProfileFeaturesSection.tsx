import React, { useState } from "react";
import {
  Globe,
  Layers,
  Sparkles,
  Sun,
  Moon,
  CloudOff,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import {
  showFormatSheetConfirm,
  showToast,
  showSuccessToast,
  showWarningToast,
  showErrorAlert,
} from "@/utils/alertUtils";
import { formatUserError } from "@/utils/errorFormatter";
import { TEXT_DASHBOARD } from "@/constants/texts";

interface ProfileFeaturesSectionProps {
  onDismiss: () => void;
  onOpenRegionalMonitoring?: () => void;
  onReturnToRouteView?: () => void;
  isInMonitoringView?: boolean;
  onOpenAccumulation?: () => void;
  onFormatWholeSheet?: () => Promise<void>;
  currentTabName?: string;
  hasActiveData?: boolean;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isOnline: boolean;
  offlineQueueCount: number;
}

export const ProfileFeaturesSection: React.FC<ProfileFeaturesSectionProps> = ({
  onDismiss,
  onOpenRegionalMonitoring,
  onReturnToRouteView,
  isInMonitoringView,
  onOpenAccumulation,
  onFormatWholeSheet,
  currentTabName,
  hasActiveData,
  isDarkMode,
  onToggleTheme,
  isOnline,
  offlineQueueCount,
}) => {
  const [isFormatting, setIsFormatting] = useState(false);

  const handleFormatSpreadsheetClick = async () => {
    if (!onFormatWholeSheet) return;
    if (!hasActiveData) {
      showWarningToast(TEXT_DASHBOARD.PROFILE_MENU.SELECT_ROUTE_DATE_FIRST);
      return;
    }

    onDismiss();
    const confirmed = await showFormatSheetConfirm(currentTabName || "aktif");
    if (!confirmed) return;

    try {
      setIsFormatting(true);
      showToast({
        title: TEXT_DASHBOARD.PROFILE_MENU.FORMATTING_PROGRESS,
        icon: "info",
        timer: 2500,
      });
      await onFormatWholeSheet();
      showSuccessToast(TEXT_DASHBOARD.PROFILE_MENU.FORMAT_SUCCESS);
    } catch (err: any) {
      showErrorAlert(
        formatUserError(err, TEXT_DASHBOARD.PROFILE_MENU.FORMAT_FAILED) ||
          TEXT_DASHBOARD.PROFILE_MENU.FORMAT_FAILED,
      );
    } finally {
      setIsFormatting(false);
    }
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <span
        style={{
          fontSize: "10.5px",
          fontWeight: 700,
          letterSpacing: "0.5px",
          color: "var(--text-secondary)",
          textTransform: "uppercase",
          display: "block",
          marginBottom: "8px",
          paddingLeft: "4px",
        }}
      >
        {TEXT_DASHBOARD.PROFILE_MENU.FEATURES_SECTION}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {/* Monitoring Wilayah & Laporan WA OR Kembali ke Operasi Rute */}
        {isInMonitoringView ? (
          <button
            type="button"
            onClick={() => {
              onDismiss();
              onReturnToRouteView?.();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              borderRadius: "12px",
              background: "var(--bg-secondary, rgba(255,255,255,0.03))",
              border: "1px solid var(--card-border)",
              color: "var(--text-primary)",
              fontWeight: 500,
              fontSize: "13.5px",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <RotateCcw size={18} style={{ color: "var(--accent-color)" }} />
              <div style={{ textAlign: "left" }}>
                <div>{TEXT_DASHBOARD.PROFILE_MENU.RETURN_TO_ROUTE}</div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    marginTop: "1px",
                  }}
                >
                  {TEXT_DASHBOARD.PROFILE_MENU.RETURN_TO_ROUTE_DESC}
                </div>
              </div>
            </div>
            <ChevronRight size={16} style={{ opacity: 0.5, flexShrink: 0 }} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              onDismiss();
              onOpenRegionalMonitoring?.();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              borderRadius: "12px",
              background: "var(--bg-secondary, rgba(255,255,255,0.03))",
              border: "1px solid var(--card-border)",
              color: "var(--text-primary)",
              fontWeight: 500,
              fontSize: "13.5px",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Globe size={18} style={{ color: "var(--accent-color)" }} />
              <div style={{ textAlign: "left" }}>
                <div>{TEXT_DASHBOARD.PROFILE_MENU.REGIONAL_MONITORING}</div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    marginTop: "1px",
                  }}
                >
                  {TEXT_DASHBOARD.PROFILE_MENU.REGIONAL_MONITORING_DESC}
                </div>
              </div>
            </div>
            <ChevronRight size={16} style={{ opacity: 0.5, flexShrink: 0 }} />
          </button>
        )}

        {/* Rekap Akumulasi Lintas Periode */}
        {/* BUG-59: Fitur sebelumnya hard-coded disabled "Coming Soon"
            padahal AccumulationSheet sudah lengkap & handler tersambung
            dari Dashboard — aktifkan wiring yang benar. */}
        <button
          type="button"
          onClick={() => {
            onDismiss();
            onOpenAccumulation?.();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            borderRadius: "12px",
            background: "var(--bg-secondary, rgba(255,255,255,0.03))",
            border: "1px solid var(--card-border)",
            color: "var(--text-primary)",
            fontWeight: 500,
            fontSize: "13.5px",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Layers size={18} style={{ color: "var(--accent-color)" }} />
            <span>{TEXT_DASHBOARD.PROFILE_MENU.CROSS_PERIOD}</span>
          </div>
          <ChevronRight size={16} style={{ opacity: 0.5, flexShrink: 0 }} />
        </button>

        {/* Rapikan & Format Spreadsheet */}
        <button
          type="button"
          onClick={handleFormatSpreadsheetClick}
          disabled={isFormatting}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            borderRadius: "12px",
            background: "var(--bg-secondary, rgba(255,255,255,0.03))",
            border: "1px solid var(--card-border)",
            color: "var(--text-primary)",
            fontWeight: 500,
            fontSize: "13.5px",
            cursor: isFormatting ? "wait" : "pointer",
            opacity: isFormatting ? 0.7 : 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Sparkles size={18} style={{ color: "var(--accent-color)" }} />
            <div style={{ textAlign: "left" }}>
              <div>{TEXT_DASHBOARD.PROFILE_MENU.FORMAT_SHEET}</div>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  marginTop: "1px",
                }}
              >
                {TEXT_DASHBOARD.PROFILE_MENU.FORMAT_SHEET_DESC}
              </div>
            </div>
          </div>
          <ChevronRight size={16} style={{ opacity: 0.5, flexShrink: 0 }} />
        </button>

        {/* Toggle Theme */}
        <button
          type="button"
          onClick={onToggleTheme}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            borderRadius: "12px",
            background: "var(--bg-secondary, rgba(255,255,255,0.03))",
            border: "1px solid var(--card-border)",
            color: "var(--text-primary)",
            fontWeight: 500,
            fontSize: "13.5px",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {isDarkMode ? (
              <Sun size={18} style={{ color: "#f59e0b" }} />
            ) : (
              <Moon size={18} style={{ color: "var(--accent-color)" }} />
            )}
            <span>{TEXT_DASHBOARD.PROFILE_MENU.THEME_MODE}</span>
          </div>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text-secondary)",
              background: "var(--surface-color)",
              padding: "4px 8px",
              borderRadius: "6px",
              border: "1px solid var(--card-border)",
            }}
          >
            {isDarkMode
              ? TEXT_DASHBOARD.PROFILE_MENU.DARK_MODE
              : TEXT_DASHBOARD.PROFILE_MENU.LIGHT_MODE}
          </span>
        </button>

        {/* Status Antrean Sync Offline (jika ada) */}
        {(!isOnline || offlineQueueCount > 0) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              borderRadius: "12px",
              background: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              color: "var(--warning-color, #f59e0b)",
              fontWeight: 600,
              fontSize: "13px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <CloudOff size={18} />
              <span>
                {!isOnline
                  ? TEXT_DASHBOARD.PROFILE_MENU.OFFLINE_MODE
                  : TEXT_DASHBOARD.PROFILE_MENU.SYNC_QUEUE}
              </span>
            </div>
            {offlineQueueCount > 0 && (
              <span
                style={{
                  background: "#f59e0b",
                  color: "#000",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                {offlineQueueCount} {TEXT_DASHBOARD.PROFILE_MENU.PENDING_SUFFIX}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
