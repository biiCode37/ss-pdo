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
import { FileSpreadsheet, Copy, Share2, Sun, Moon } from "lucide-react";

export interface MonitoringWaReportTabProps {
  data: RegionalMonitoringResult;
  selectedDate: string;
  fleetShifts?: DailyFleetShiftWithUnits[];
}

export const MonitoringWaReportTab: React.FC<MonitoringWaReportTabProps> = ({
  data,
  selectedDate,
  fleetShifts,
}) => {
  const [format, setFormat] = useState<1 | 2 | 3>(1);
  const [format3Shift, setFormat3Shift] = useState<1 | 2>(1);

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

  // RouteFleetReportItem for Format 3
  const routeFleetData: RouteFleetReportItem[] = useMemo(() => {
    return data.routes.map((r, idx) => {
      const matchingShift = fleetShifts?.find(
        (s) => s.route_code === r.routeCode && s.shift === format3Shift,
      );
      const renops = format3Shift === 1 ? r.renopsShift1 : r.renopsShift2;
      const realops = format3Shift === 1 ? r.realopsShift1 : r.realopsShift2;

      const nonSgoUnits =
        matchingShift?.non_sgo_units?.map((u) => ({
          unit: u.unit_body,
          note: u.notes || u.status_type,
          isOff: u.status_type === "OFF",
        })) || [];

      return {
        no: idx + 1,
        routeCode: r.routeCode,
        routeName: r.routeName,
        operatorName: r.operatorName,
        renops: matchingShift ? matchingShift.target_renops : renops,
        realops: matchingShift ? matchingShift.realops : realops,
        nonSgoUnits,
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
        padding: "16px",
        maxWidth: "1200px",
        margin: "0 auto",
        paddingBottom: "84px",
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
            Report Studio WhatsApp
          </h3>
        </div>

        {/* 3 Format Tabs */}
        <div
          className="no-scrollbar"
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
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

      {/* 2. Action Bar */}
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

      {/* 3. Live Monospace Preview Box */}
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
    </div>
  );
};

export default MonitoringWaReportTab;
