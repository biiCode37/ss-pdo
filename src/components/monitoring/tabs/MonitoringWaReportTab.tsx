import React, { useState, useMemo } from "react";
import type { RegionalMonitoringResult } from "@/services/allRouteMonitoringService";
import type { DailyFleetShiftWithUnits } from "@/types/supabase";
import { TEXT_WA_REPORT } from "@/constants/texts";
import {
  generateWaReportFormat1,
  generateWaReportFormat2,
  generateWaReportFormat3,
  openWhatsApp,
  type RouteWaData,
  type RouteFleetReportItem,
  type RegionTotals,
} from "@/utils/waReportGenerator";
import { showSuccessToast } from "@/utils/alertUtils";
import { FileSpreadsheet, Copy, Share2, Sun, Moon, AlertTriangle, PlusCircle } from "lucide-react";
import { QuickKorlapFleetModal } from "@/components/fleetStatus/QuickKorlapFleetModal";

export interface MonitoringWaReportTabProps {
  data: RegionalMonitoringResult;
  selectedDate: string;
  fleetShifts?: DailyFleetShiftWithUnits[];
  onRefresh?: () => void;
}

export const MonitoringWaReportTab: React.FC<MonitoringWaReportTabProps> = ({
  data,
  selectedDate,
  fleetShifts,
  onRefresh,
}) => {
  const [format, setFormat] = useState<1 | 2 | 3>(1);
  const [format3Shift, setFormat3Shift] = useState<1 | 2>(1);
  const [quickRoute, setQuickRoute] = useState<{ routeCode: string; routeId: number; defaultRenops?: number } | null>(null);

  // Map RouteWaData for Format 1 & 2
  const routeWaData: RouteWaData[] = useMemo(() => {
    return data.routes.map((r, idx) => ({
      no: idx + 1,
      routeCode: r.routeCode,
      routeName: r.routeName,
      operatorName: r.operatorName,
      isLooping: r.isLooping,
      todayPassengers: r.todayPassengers,
      yesterdayPassengers: r.yesterdayPassengers,
      lastWeekPassengers: r.lastWeekPassengers,
      targetHk: r.targetHk,
      bestRecord: r.bestRecord,
      achievementKm: r.achievementKm,
      kmBaku: r.kmBaku,
      renops: r.totalRenops,
      realops: r.totalRealops,
      trafficJamSpots: r.trafficJamSpots,
      operationalIssues: r.operationalIssues,
      headwayFastest: r.headwayFastest,
      headwaySlowest: r.headwaySlowest,
      toaShift1: r.toaShift1,
      manualShift1: r.manualShift1,
      totalShift1: r.totalShift1,
      toaShift2: r.toaShift2,
      manualShift2: r.manualShift2,
      totalShift2: r.totalShift2,
    }));
  }, [data.routes]);

  // RegionTotals for Format 2
  const regionTotals: RegionTotals = useMemo(() => {
    return {
      tomShift1: data.tomShift1,
      manualShift1: data.manualShift1,
      totalShift1: data.totalShift1,
      yesterdayShift1: data.yesterdayShift1,
      lastWeekShift1: data.lastWeekShift1,
      tomShift2: data.tomShift2,
      manualShift2: data.manualShift2,
      totalShift2: data.totalShift2,
      yesterdayShift2: data.yesterdayShift2,
      lastWeekShift2: data.lastWeekShift2,
      totalToday: data.totalTodayPassengers,
      totalTarget: data.totalTargetPassengers,
      totalYesterday: data.totalYesterdayPassengers,
      totalLastWeek: data.totalLastWeekPassengers,
    };
  }, [data]);

  // RouteFleetReportItem for Format 3 (Menerapkan Hierarki 3 Jalur)
  const routeFleetData: RouteFleetReportItem[] = useMemo(() => {
    return data.routes.map((r, idx) => {
      // 1. Jalur 1 (Utama): Data di DB (Laporan A2 Petugas atau Input Korlap)
      const matchingShift = fleetShifts?.find(
        (s) => s.route_code === r.routeCode && s.shift === format3Shift,
      );

      if (matchingShift) {
        const nonSgoUnits =
          matchingShift.non_sgo_units?.map((u) => ({
            unit: u.unit_body,
            note: u.note || u.status_code,
            isOff: u.status_code === "OFF",
          })) || [];

        return {
          no: idx + 1,
          routeCode: r.routeCode,
          routeName: r.routeName,
          operatorName: r.operatorName,
          renops: matchingShift.target_renops || r.defaultRenops || 0,
          realops: matchingShift.realops ?? 0,
          hasData: true,
          sourceType: matchingShift.source_type || 'pdo_a2',
          nonSgoUnits,
        };
      }

      // 2. Jalur 2 (Fallback Otomatis Spreadsheet): Ritase / Unit Beroperasi di Sheet Asli
      const ssRenops = (format3Shift === 1 ? r.renopsShift1 : r.renopsShift2) || r.defaultRenops || 0;
      const ssRawRealops = format3Shift === 1 ? r.realopsShift1 : r.realopsShift2;
      const ssNonSgo =
        (format3Shift === 1 ? r.fleetStatusShift1 : r.fleetStatusShift2)?.map(
          (u) => ({
            unit: u.unit,
            note: u.note,
            isOff: u.isOff,
          })
        ) || [];

      // Validasi aktivitas nyata: ada trip > 0, penumpang > 0, ada unit non-SGO terdeteksi, atau status submitted/verified
      const hasActualActivity =
        (r.totalTrips && r.totalTrips > 0) ||
        (r.todayPassengers && r.todayPassengers > 0) ||
        ssNonSgo.length > 0 ||
        r.status === "submitted" ||
        r.status === "verified";

      if (hasActualActivity) {
        const kendalaCount = ssNonSgo.filter((u) => !u.isOff).length;
        const calculatedRealops =
          kendalaCount > 0
            ? Math.min(ssRawRealops, Math.max(0, ssRenops - kendalaCount))
            : ssRawRealops;

        return {
          no: idx + 1,
          routeCode: r.routeCode,
          routeName: r.routeName,
          operatorName: r.operatorName,
          renops: ssRenops,
          realops: calculatedRealops,
          hasData: true,
          sourceType: 'spreadsheet_auto',
          nonSgoUnits: ssNonSgo,
        };
      }

      // 3. Jalur 3: Belum Ada Data (Menunggu Keputusan / Input Korlap)
      return {
        no: idx + 1,
        routeCode: r.routeCode,
        routeName: r.routeName,
        operatorName: r.operatorName,
        renops: r.defaultRenops || 0,
        realops: 0,
        hasData: false,
        sourceType: 'empty',
        nonSgoUnits: [],
      };
    });
  }, [data.routes, fleetShifts, format3Shift]);

  // Active report text
  const reportText = useMemo(() => {
    if (format === 1) {
      return generateWaReportFormat1(selectedDate, routeWaData);
    }
    if (format === 2) {
      return generateWaReportFormat2(selectedDate, routeWaData, regionTotals);
    }
    return generateWaReportFormat3(selectedDate, format3Shift, routeFleetData);
  }, [format, format3Shift, selectedDate, routeWaData, regionTotals, routeFleetData]);

  // Pending Routes for Format 3
  const pendingRoutes = useMemo(
    () => routeFleetData.filter((r) => r.hasData === false),
    [routeFleetData]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      showSuccessToast(TEXT_WA_REPORT.ACTIONS.COPY_SUCCESS);
    } catch {
      // Fallback
      showSuccessToast(TEXT_WA_REPORT.ACTIONS.COPY_SUCCESS);
    }
  };

  const handleShare = () => {
    openWhatsApp(reportText);
  };

  return (
    <div
      className="monitoring-wa-report-tab"
      style={{
        padding: "16px 16px 0 16px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      {/* 1. Header & Format Segmented Tabs */}
      <div
        className="monitoring-card"
        style={{
          background: "var(--card-bg, rgba(23, 23, 23, 0.75))",
          borderRadius: "16px",
          border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
          padding: "16px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
          }}
        >
          <FileSpreadsheet
            size={18}
            style={{ color: "var(--accent-color, #3ECF8E)" }}
          />
          <h3
            style={{
              fontSize: "14px",
              fontWeight: 700,
              margin: 0,
              color: "var(--text-primary)",
            }}
          >
            {TEXT_WA_REPORT.STUDIO_TITLE}
          </h3>
        </div>

        {/* 3 Format Tabs */}
        <div
          className="no-scrollbar"
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            padding: "2px 16px 4px 0",
            WebkitOverflowScrolling: "touch",
            marginBottom: format === 3 ? "12px" : "0",
          }}
        >
          <button
            type="button"
            data-testid="format-tab-1"
            onClick={() => setFormat(1)}
            style={{
              flex: 1,
              minWidth: "160px",
              padding: "10px 12px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: format === 1 ? 800 : 500,
              background:
                format === 1
                  ? "var(--accent-color, #3ECF8E)"
                  : "var(--input-bg, rgba(255, 255, 255, 0.04))",
              color: format === 1 ? "#000" : "var(--text-primary)",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
              cursor: "pointer",
              textAlign: "center",
              flexShrink: 0,
              transition: "all 0.2s ease",
            }}
          >
            {TEXT_WA_REPORT.FORMAT_LABELS.FORMAT_1}
          </button>

          <button
            type="button"
            data-testid="format-tab-2"
            onClick={() => setFormat(2)}
            style={{
              flex: 1,
              minWidth: "160px",
              padding: "10px 12px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: format === 2 ? 800 : 500,
              background:
                format === 2
                  ? "var(--accent-color, #3ECF8E)"
                  : "var(--input-bg, rgba(255, 255, 255, 0.04))",
              color: format === 2 ? "#000" : "var(--text-primary)",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
              cursor: "pointer",
              textAlign: "center",
              flexShrink: 0,
              transition: "all 0.2s ease",
            }}
          >
            {TEXT_WA_REPORT.FORMAT_LABELS.FORMAT_2}
          </button>

          <button
            type="button"
            data-testid="format-tab-3"
            onClick={() => setFormat(3)}
            style={{
              flex: 1,
              minWidth: "160px",
              padding: "10px 12px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: format === 3 ? 800 : 500,
              background:
                format === 3
                  ? "var(--accent-color, #3ECF8E)"
                  : "var(--input-bg, rgba(255, 255, 255, 0.04))",
              color: format === 3 ? "#000" : "var(--text-primary)",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
              cursor: "pointer",
              textAlign: "center",
              flexShrink: 0,
              transition: "all 0.2s ease",
            }}
          >
            {TEXT_WA_REPORT.FORMAT_LABELS.FORMAT_3}
          </button>
        </div>

        {/* Sub-toggle Shift for Format 3 */}
        {format === 3 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              paddingTop: "4px",
            }}
          >
            <button
              type="button"
              onClick={() => setFormat3Shift(1)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "10px",
                fontSize: "11.5px",
                fontWeight: format3Shift === 1 ? 700 : 500,
                background:
                  format3Shift === 1
                    ? "rgba(245, 158, 11, 0.2)"
                    : "var(--input-bg, rgba(255, 255, 255, 0.05))",
                color: format3Shift === 1 ? "#F59E0B" : "var(--text-secondary)",
                border:
                  format3Shift === 1
                    ? "1px solid rgba(245, 158, 11, 0.35)"
                    : "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
                cursor: "pointer",
              }}
            >
              <Sun size={13} />
              <span>Shift 1 (Pagi)</span>
            </button>

            <button
              type="button"
              onClick={() => setFormat3Shift(2)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "10px",
                fontSize: "11.5px",
                fontWeight: format3Shift === 2 ? 700 : 500,
                background:
                  format3Shift === 2
                    ? "rgba(99, 102, 241, 0.2)"
                    : "var(--input-bg, rgba(255, 255, 255, 0.05))",
                color: format3Shift === 2 ? "#818CF8" : "var(--text-secondary)",
                border:
                  format3Shift === 2
                    ? "1px solid rgba(99, 102, 241, 0.35)"
                    : "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
                cursor: "pointer",
              }}
            >
              <Moon size={13} />
              <span>Shift 2 (Siang)</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Format 3 Data Readiness Banner & Quick Input for Korlap */}
      {format === 3 && pendingRoutes.length > 0 && (
        <div
          className="monitoring-card"
          style={{
            background: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.25)",
            borderRadius: "16px",
            padding: "14px 16px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <AlertTriangle size={18} style={{ color: "#F59E0B" }} />
            <h4
              style={{
                fontSize: "13.5px",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              {TEXT_WA_REPORT.DATA_READINESS.BANNER_TITLE(pendingRoutes.length, format3Shift)}
            </h4>
          </div>
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              margin: "0 0 12px 0",
              lineHeight: 1.5,
            }}
          >
            {TEXT_WA_REPORT.DATA_READINESS.BANNER_DESC}
          </p>

          <div
            className="no-scrollbar"
            style={{
              display: "flex",
              gap: "8px",
              overflowX: "auto",
              paddingBottom: "4px",
            }}
          >
            {pendingRoutes.map((pr) => {
              const originalRoute = data.routes.find((r) => r.routeCode === pr.routeCode);
              return (
                <div
                  key={pr.routeCode}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "var(--card-bg, rgba(23, 23, 23, 0.8))",
                    border: "1px solid var(--card-border, rgba(255, 255, 255, 0.1))",
                    borderRadius: "10px",
                    padding: "6px 10px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>
                    {pr.routeCode}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    Target: {pr.renops}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (originalRoute) {
                        setQuickRoute({
                          routeId: originalRoute.id,
                          routeCode: originalRoute.routeCode,
                          defaultRenops: originalRoute.defaultRenops,
                        });
                      }
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      background: "rgba(62, 207, 142, 0.15)",
                      color: "var(--accent-color, #3ECF8E)",
                      border: "1px solid rgba(62, 207, 142, 0.3)",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <PlusCircle size={12} />
                    <span>{TEXT_WA_REPORT.DATA_READINESS.INPUT_QUICK_BTN}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Action Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        <button
          type="button"
          data-testid="copy-wa-report-btn"
          onClick={handleCopy}
          style={{
            flex: 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "11px 16px",
            borderRadius: "12px",
            background: "var(--input-bg, rgba(255, 255, 255, 0.08))",
            color: "var(--text-primary)",
            border: "1px solid var(--card-border, rgba(255, 255, 255, 0.12))",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <Copy size={16} />
          <span>{TEXT_WA_REPORT.ACTIONS.COPY}</span>
        </button>

        <button
          type="button"
          data-testid="send-wa-report-btn"
          onClick={handleShare}
          style={{
            flex: 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "11px 16px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
            color: "#ffffff",
            border: "none",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(37, 211, 102, 0.35)",
            transition: "all 0.15s ease",
          }}
        >
          <Share2 size={16} />
          <span>{TEXT_WA_REPORT.ACTIONS.SHARE}</span>
        </button>
      </div>

      {/* 4. Live Monospace Preview Box */}
      <div
        className="monitoring-card"
        style={{
          background: "var(--card-bg, rgba(23, 23, 23, 0.9))",
          borderRadius: "16px",
          border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
          padding: "16px",
        }}
      >
        <pre
          data-testid="wa-preview-box"
          style={{
            margin: 0,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: "12px",
            lineHeight: 1.5,
            color: "var(--text-primary)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            maxHeight: "520px",
            overflowY: "auto",
            userSelect: "text",
          }}
        >
          {reportText}
        </pre>
      </div>

      {quickRoute && (
        <QuickKorlapFleetModal
          isOpen={true}
          onClose={() => setQuickRoute(null)}
          routeId={quickRoute.routeId}
          routeCode={quickRoute.routeCode}
          selectedDate={selectedDate}
          shift={format3Shift}
          defaultRenops={quickRoute.defaultRenops || 30}
          onSaveSuccess={() => {
            setQuickRoute(null);
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
};

export default MonitoringWaReportTab;
