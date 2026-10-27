import React, { useState, useMemo, useCallback } from "react";
import type { DailyFleetShiftWithUnits } from "@/types/supabase";
import type { RegionalRouteItem } from "@/services/allRouteMonitoringService";
import { TEXT_MONITORING, TEXT_FLEET_STATUS } from "@/constants/texts";
import {
  Bus,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Edit3,
} from "lucide-react";
import { sortRoutesByCode } from "@/utils/routeSorting";
import { normalizeRouteCode } from "@/services/googleSheets/globalReportReader";
import { QuickKorlapFleetModal } from "@/components/fleetStatus/QuickKorlapFleetModal";

export interface MonitoringFleetStatusTabProps {
  selectedDate: string;
  fleetShifts: DailyFleetShiftWithUnits[];
  routes?: RegionalRouteItem[];
  onRefresh?: () => void;
}

type ShiftFilter = "all" | 1 | 2;
type StatusFilter = "all" | "TO" | "OFF" | "SO";

export interface TroubledUnitItem {
  unit: string;
  note: string;
  statusCode: string;
  badgeBg: string;
  badgeColor: string;
  isOff: boolean;
  shift: 1 | 2;
  routeCode: string;
}

export interface RouteTroubledGroup {
  routeCode: string;
  routeName: string;
  operatorName: string;
  routeId: number;
  totalRenops: number;
  totalRealops: number;
  units: TroubledUnitItem[];
}

export interface NormalRouteGroup {
  routeCode: string;
  routeName: string;
  operatorName: string;
  routeId: number;
  totalRenops: number;
  totalRealops: number;
}

/**
 * Infer status code dan warna badge dari teks kendala
 */
export function inferStatusCode(
  rawNote: string,
  isOff?: boolean,
  statusCodeHint?: string
): { code: string; color: string; bg: string } {
  const note = (rawNote || "").trim();
  const hint = (statusCodeHint || "").toUpperCase().trim();

  // 1. OFF
  if (isOff || hint === "OFF" || /\bOFF\b/i.test(note)) {
    return {
      code: "OFF",
      color: "#F43F5E",
      bg: "rgba(244, 63, 94, 0.15)",
    };
  }

  // 2. TO / TO EVDAL
  if (
    hint === "TO" ||
    /\bT\.?O(?:\s*EVDAL)?\b/i.test(note) ||
    /EVDAL/i.test(note)
  ) {
    const isEvdal = /EVDAL/i.test(note);
    return {
      code: isEvdal ? "TO EVDAL" : "T.O",
      color: "#F59E0B",
      bg: "rgba(245, 158, 11, 0.15)",
    };
  }

  // 3. SO (Stop Operasi)
  if (hint === "SO" || /\bSO\b/i.test(note) || /STOP\s*OPS?/i.test(note)) {
    return {
      code: "SO",
      color: "#A855F7",
      bg: "rgba(168, 85, 247, 0.15)",
    };
  }

  // 4. BA Code (Berita Acara / Laka / Sakit / Kendala Operasi)
  const baMatch = note.match(/\bBA\.?0?([1-6])\b/i);
  if (baMatch) {
    return {
      code: `BA.0${baMatch[1]}`,
      color: "#FB923C",
      bg: "rgba(251, 146, 60, 0.15)",
    };
  }

  // 5. KEUR
  if (/PROGRAM\s*KEUR/i.test(note) || /\bKEUR\b/i.test(note)) {
    return {
      code: "KEUR",
      color: "#38BDF8",
      bg: "rgba(56, 189, 248, 0.15)",
    };
  }

  // 6. TEKNIS / PERBAIKAN / BENGKEL
  if (/PERBAIKAN|BENGKEL|MOGOK|RADIATOR|AC\s*PANAS/i.test(note)) {
    return {
      code: "TEKNIS",
      color: "#C084FC",
      bg: "rgba(192, 132, 252, 0.15)",
    };
  }

  // 7. OKB
  if (/\bOKB\b/i.test(note)) {
    return {
      code: "OKB",
      color: "#60A5FA",
      bg: "rgba(96, 165, 250, 0.15)",
    };
  }

  // 8. RENOP
  if (/\bRENOP\b/i.test(note)) {
    return {
      code: "RENOP",
      color: "#34D399",
      bg: "rgba(52, 211, 153, 0.15)",
    };
  }

  // 9. Jika ada hint selain generic
  if (hint && hint !== "CATATAN" && hint !== "OTHER" && hint.length <= 8) {
    return {
      code: hint,
      color: "#FBBF24",
      bg: "rgba(251, 191, 36, 0.15)",
    };
  }

  // 10. Fallback first word or KENDALA
  if (note) {
    const firstWord = note.split(/[\s:-]+/)[0].toUpperCase().slice(0, 8);
    if (firstWord && !["CATATAN", "KENDALA"].includes(firstWord)) {
      return {
        code: firstWord,
        color: "#FBBF24",
        bg: "rgba(251, 191, 36, 0.15)",
      };
    }
  }

  return {
    code: "KENDALA",
    color: "#FBBF24",
    bg: "rgba(251, 191, 36, 0.15)",
  };
}

/**
 * Format catatan agar bersih tanpa prefix shift redundan
 */
export function formatUnitNote(note: string): string {
  if (!note) return "-";
  return note.replace(/^S[12]:\s*/i, "").trim() || "-";
}

export const MonitoringFleetStatusTab: React.FC<MonitoringFleetStatusTabProps> = ({
  selectedDate,
  fleetShifts,
  routes = [],
  onRefresh,
}) => {
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [quickRoute, setQuickRoute] = useState<{
    routeCode: string;
    routeId: number;
    shift: 1 | 2;
  } | null>(null);

  // Status buka/tutup akordeon rute (default: semua rute bermasalah terbuka)
  const [collapsedRoutes, setCollapsedRoutes] = useState<Record<string, boolean>>({});

  const toggleRouteCollapse = useCallback((routeCode: string) => {
    setCollapsedRoutes((prev) => ({
      ...prev,
      [routeCode]: !prev[routeCode],
    }));
  }, []);

  const toggleAllCollapse = useCallback((collapsed: boolean, routeCodes: string[]) => {
    const update: Record<string, boolean> = {};
    for (const code of routeCodes) {
      update[code] = collapsed;
    }
    setCollapsedRoutes(update);
  }, []);

  // 1. DUAL-SOURCE RESOLUTION: Memadukan DB (fleetShifts) dan Spreadsheet (routes)
  const resolvedFleetData = useMemo(() => {
    // Kumpulkan daftar kode rute unik: prioritas dari routes (18 rute), fallback ke fleetShifts
    const targetRouteMap = new Map<
      string,
      { routeCode: string; routeName: string; operatorName: string; routeId: number; routeItem?: RegionalRouteItem }
    >();

    if (routes && routes.length > 0) {
      for (const r of routes) {
        targetRouteMap.set(r.routeCode, {
          routeCode: r.routeCode,
          routeName: r.routeName || "",
          operatorName: r.operatorName || "Mikrotrans",
          routeId: r.id,
          routeItem: r,
        });
      }
    } else {
      for (const s of fleetShifts) {
        if (s.route_code && !targetRouteMap.has(s.route_code)) {
          targetRouteMap.set(s.route_code, {
            routeCode: s.route_code,
            routeName: "",
            operatorName: "Mikrotrans",
            routeId: s.route_id || 0,
          });
        }
      }
    }

    const shiftsToInspect: (1 | 2)[] =
      shiftFilter === "all" ? [1, 2] : [shiftFilter];

    const troubledList: RouteTroubledGroup[] = [];
    const normalList: NormalRouteGroup[] = [];

    let aggTotalRenops = 0;
    let aggTotalRealops = 0;
    let aggTotalTo = 0;
    let aggTotalOff = 0;
    let aggTotalSo = 0;
    let aggTotalOther = 0;

    for (const [routeCode, meta] of targetRouteMap.entries()) {
      const r = meta.routeItem;
      let routeRenops = 0;
      let routeRealops = 0;
      const routeUnits: TroubledUnitItem[] = [];
      let hasAnyData = false;

      for (const sh of shiftsToInspect) {
        // Cari data shift di DB (Laporan A2 atau Input Korlap)
        const dbShift = fleetShifts.find(
          (s) =>
            s.shift === sh &&
            (s.route_code === routeCode ||
              normalizeRouteCode(s.route_code) === normalizeRouteCode(routeCode))
        );

        // Ambil data dari spreadsheet jika ada
        const ssRenops =
          (sh === 1 ? r?.renopsShift1 : r?.renopsShift2) ||
          r?.defaultRenops ||
          0;
        const ssRealops = sh === 1 ? r?.realopsShift1 : r?.realopsShift2;
        const ssRawUnits =
          (sh === 1 ? r?.fleetStatusShift1 : r?.fleetStatusShift2) || [];

        if (dbShift) {
          hasAnyData = true;
          const ren = dbShift.target_renops || ssRenops;
          const real = dbShift.realops ?? (ssRealops ?? 0);
          routeRenops += ren;
          routeRealops += real;

          // Ambil unit kendala dari DB
          const dbUnits = dbShift.non_sgo_units || [];
          if (dbUnits.length > 0) {
            for (const u of dbUnits) {
              const parsed = inferStatusCode(u.note || "", u.status_code === "OFF", u.status_code);
              routeUnits.push({
                unit: u.unit_body,
                note: formatUnitNote(u.note || u.status_code),
                statusCode: parsed.code,
                badgeBg: parsed.bg,
                badgeColor: parsed.color,
                isOff: u.status_code === "OFF",
                shift: sh,
                routeCode,
              });
            }
          } else if (ssRawUnits.length > 0) {
            // Fallback ke spreadsheet jika DB belum punya rincian unit
            for (const u of ssRawUnits) {
              const parsed = inferStatusCode(u.note || "", u.isOff);
              routeUnits.push({
                unit: u.unit,
                note: formatUnitNote(u.note),
                statusCode: parsed.code,
                badgeBg: parsed.bg,
                badgeColor: parsed.color,
                isOff: u.isOff,
                shift: sh,
                routeCode,
              });
            }
          }
        } else if (r) {
          // Jalur Fallback: Spreadsheet Ingestion
          const hasActivity =
            (r.totalTrips && r.totalTrips > 0) ||
            (r.todayPassengers && r.todayPassengers > 0) ||
            ssRawUnits.length > 0 ||
            r.status === "submitted" ||
            r.status === "verified";

          if (hasActivity || ssRenops > 0) {
            hasAnyData = true;
            routeRenops += ssRenops;
            routeRealops += ssRealops ?? 0;

            for (const u of ssRawUnits) {
              const parsed = inferStatusCode(u.note || "", u.isOff);
              routeUnits.push({
                unit: u.unit,
                note: formatUnitNote(u.note),
                statusCode: parsed.code,
                badgeBg: parsed.bg,
                badgeColor: parsed.color,
                isOff: u.isOff,
                shift: sh,
                routeCode,
              });
            }
          }
        }
      }

      // Filter unit berdasarkan status kendala jika ada filter aktif
      const filteredUnits = routeUnits.filter((u) => {
        if (statusFilter === "all") return true;
        if (statusFilter === "TO") return u.statusCode.includes("TO");
        if (statusFilter === "OFF") return u.statusCode === "OFF" || u.isOff;
        if (statusFilter === "SO") return u.statusCode === "SO";
        return true;
      });

      // Akumulasi statistik makro
      aggTotalRenops += routeRenops;
      aggTotalRealops += routeRealops;
      for (const u of filteredUnits) {
        if (u.statusCode.includes("TO")) aggTotalTo++;
        else if (u.statusCode === "OFF" || u.isOff) aggTotalOff++;
        else if (u.statusCode === "SO") aggTotalSo++;
        else aggTotalOther++;
      }

      // Klasifikasi rute: Terkendala vs Normal
      if (filteredUnits.length > 0) {
        troubledList.push({
          routeCode,
          routeName: meta.routeName,
          operatorName: meta.operatorName,
          routeId: meta.routeId,
          totalRenops: routeRenops,
          totalRealops: routeRealops,
          units: filteredUnits,
        });
      } else if (hasAnyData) {
        normalList.push({
          routeCode,
          routeName: meta.routeName,
          operatorName: meta.operatorName,
          routeId: meta.routeId,
          totalRenops: routeRenops,
          totalRealops: routeRealops,
        });
      }
    }

    const totalTerkendala = aggTotalTo + aggTotalOff + aggTotalSo + aggTotalOther;
    const persentase =
      aggTotalRenops > 0
        ? ((aggTotalRealops / aggTotalRenops) * 100).toFixed(1)
        : "0.0";

    return {
      troubledRoutes: sortRoutesByCode(troubledList),
      normalRoutes: sortRoutesByCode(normalList),
      stats: {
        totalFleet: aggTotalRenops,
        totalBeroperasi: aggTotalRealops,
        totalTerkendala,
        totalTo: aggTotalTo,
        totalOff: aggTotalOff,
        totalSo: aggTotalSo,
        persentase,
      },
    };
  }, [routes, fleetShifts, shiftFilter, statusFilter]);

  const { troubledRoutes, normalRoutes, stats } = resolvedFleetData;
  const troubledRouteCodes = useMemo(
    () => troubledRoutes.map((r) => r.routeCode),
    [troubledRoutes]
  );

  const areAllCollapsed = useMemo(() => {
    if (troubledRouteCodes.length === 0) return false;
    return troubledRouteCodes.every((code) => !!collapsedRoutes[code]);
  }, [troubledRouteCodes, collapsedRoutes]);

  const hasAnyFleetData = stats.totalFleet > 0 || troubledRoutes.length > 0 || normalRoutes.length > 0;

  return (
    <div
      className="monitoring-fleet-status-tab"
      style={{
        padding: "16px 14px calc(90px + env(safe-area-inset-bottom, 16px)) 14px",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      {/* 1. Header & Macro Stats Bar */}
      <div
        className="monitoring-card"
        style={{
          background: "var(--card-bg, rgba(23, 23, 23, 0.75))",
          borderRadius: "16px",
          border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
          padding: "14px",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Bus size={18} style={{ color: "var(--accent-color, #3ECF8E)" }} />
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 700,
                margin: 0,
                color: "var(--text-primary)",
                letterSpacing: "-0.2px",
              }}
            >
              {TEXT_MONITORING.FLEET_TAB.TITLE}
            </h3>
          </div>
          <span
            style={{
              fontSize: "10.5px",
              fontWeight: 600,
              color: "var(--text-secondary)",
              background: "var(--input-bg, rgba(255, 255, 255, 0.05))",
              padding: "2px 8px",
              borderRadius: "6px",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
            }}
          >
            18 Rute Wilayah
          </span>
        </div>

        {/* 3 Macro Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
          }}
        >
          {/* Total Armada (Renops) */}
          <div
            style={{
              background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.05))",
              borderRadius: "12px",
              padding: "8px 10px",
            }}
          >
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                display: "block",
              }}
            >
              {TEXT_MONITORING.FLEET_TAB.TOTAL_FLEET}
            </span>
            <div
              style={{
                fontSize: "17px",
                fontWeight: 800,
                color: "var(--text-primary)",
                marginTop: "2px",
                lineHeight: 1.2,
              }}
            >
              {stats.totalFleet}{" "}
              <span style={{ fontSize: "10px", fontWeight: 500 }}>Unit</span>
            </div>
          </div>

          {/* Armada Beroperasi (Realops) */}
          <div
            style={{
              background: "rgba(16, 185, 129, 0.06)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              borderRadius: "12px",
              padding: "8px 10px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: 600,
                  color: "#10B981",
                }}
              >
                {TEXT_MONITORING.FLEET_TAB.SGO_LABEL}
              </span>
              <CheckCircle2 size={12} style={{ color: "#10B981" }} />
            </div>
            <div
              style={{
                fontSize: "17px",
                fontWeight: 800,
                color: "#10B981",
                marginTop: "2px",
                lineHeight: 1.2,
              }}
            >
              {stats.totalBeroperasi}{" "}
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                }}
              >
                ({stats.persentase}%)
              </span>
            </div>
          </div>

          {/* Armada Terkendala */}
          <div
            style={{
              background:
                stats.totalTerkendala > 0
                  ? "rgba(245, 158, 11, 0.06)"
                  : "var(--input-bg, rgba(255, 255, 255, 0.03))",
              border:
                stats.totalTerkendala > 0
                  ? "1px solid rgba(245, 158, 11, 0.25)"
                  : "1px solid var(--card-border, rgba(255, 255, 255, 0.05))",
              borderRadius: "12px",
              padding: "8px 10px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: 600,
                  color: stats.totalTerkendala > 0 ? "#F59E0B" : "var(--text-secondary)",
                }}
              >
                {TEXT_MONITORING.FLEET_TAB.NON_SGO_LABEL}
              </span>
              {stats.totalTerkendala > 0 && (
                <AlertTriangle size={12} style={{ color: "#F59E0B" }} />
              )}
            </div>
            <div
              style={{
                fontSize: "17px",
                fontWeight: 800,
                color: stats.totalTerkendala > 0 ? "#F59E0B" : "var(--text-primary)",
                marginTop: "2px",
                lineHeight: 1.2,
              }}
            >
              {stats.totalTerkendala}{" "}
              <span style={{ fontSize: "10px", fontWeight: 500 }}>Unit</span>
            </div>
            <div
              style={{
                fontSize: "9px",
                color: "var(--text-secondary)",
                marginTop: "2px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              TO:{stats.totalTo} • OFF:{stats.totalOff} • SO:{stats.totalSo}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter Controls: Shift & Status */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          marginBottom: "12px",
        }}
      >
        {/* Shift Filter */}
        <div
          className="no-scrollbar"
          style={{
            display: "flex",
            gap: "5px",
            overflowX: "auto",
          }}
        >
          <button
            type="button"
            onClick={() => setShiftFilter("all")}
            style={{
              padding: "5px 10px",
              borderRadius: "8px",
              fontSize: "11px",
              fontWeight: shiftFilter === "all" ? 700 : 500,
              background:
                shiftFilter === "all"
                  ? "var(--accent-color, #3ECF8E)"
                  : "var(--input-bg, rgba(255, 255, 255, 0.05))",
              color: shiftFilter === "all" ? "#000" : "var(--text-secondary)",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {TEXT_MONITORING.FLEET_TAB.ALL_SHIFTS}
          </button>

          <button
            type="button"
            onClick={() => setShiftFilter(1)}
            style={{
              padding: "5px 10px",
              borderRadius: "8px",
              fontSize: "11px",
              fontWeight: shiftFilter === 1 ? 700 : 500,
              background:
                shiftFilter === 1
                  ? "var(--accent-color, #3ECF8E)"
                  : "var(--input-bg, rgba(255, 255, 255, 0.05))",
              color: shiftFilter === 1 ? "#000" : "var(--text-secondary)",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Shift 1 (Pagi)
          </button>

          <button
            type="button"
            onClick={() => setShiftFilter(2)}
            style={{
              padding: "5px 10px",
              borderRadius: "8px",
              fontSize: "11px",
              fontWeight: shiftFilter === 2 ? 700 : 500,
              background:
                shiftFilter === 2
                  ? "var(--accent-color, #3ECF8E)"
                  : "var(--input-bg, rgba(255, 255, 255, 0.05))",
              color: shiftFilter === 2 ? "#000" : "var(--text-secondary)",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Shift 2 (Siang)
          </button>
        </div>

        {/* Status Type Filter */}
        <div
          className="no-scrollbar"
          style={{
            display: "flex",
            gap: "5px",
            overflowX: "auto",
          }}
        >
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            style={{
              padding: "4px 9px",
              borderRadius: "7px",
              fontSize: "10.5px",
              fontWeight: statusFilter === "all" ? 700 : 500,
              background:
                statusFilter === "all"
                  ? "var(--input-bg, rgba(255, 255, 255, 0.15))"
                  : "transparent",
              color:
                statusFilter === "all"
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {TEXT_MONITORING.FLEET_TAB.ALL_NON_SGO}
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("TO")}
            style={{
              padding: "4px 9px",
              borderRadius: "7px",
              fontSize: "10.5px",
              fontWeight: statusFilter === "TO" ? 700 : 500,
              background:
                statusFilter === "TO"
                  ? "rgba(245, 158, 11, 0.2)"
                  : "transparent",
              color: statusFilter === "TO" ? "#F59E0B" : "var(--text-secondary)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            TO (Tidak Operasi)
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("OFF")}
            style={{
              padding: "4px 9px",
              borderRadius: "7px",
              fontSize: "10.5px",
              fontWeight: statusFilter === "OFF" ? 700 : 500,
              background:
                statusFilter === "OFF"
                  ? "rgba(244, 63, 94, 0.2)"
                  : "transparent",
              color: statusFilter === "OFF" ? "#F43F5E" : "var(--text-secondary)",
              border: "1px solid rgba(244, 63, 94, 0.25)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            OFF (Libur)
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("SO")}
            style={{
              padding: "4px 9px",
              borderRadius: "7px",
              fontSize: "10.5px",
              fontWeight: statusFilter === "SO" ? 700 : 500,
              background:
                statusFilter === "SO"
                  ? "rgba(168, 85, 247, 0.2)"
                  : "transparent",
              color: statusFilter === "SO" ? "#A855F7" : "var(--text-secondary)",
              border: "1px solid rgba(168, 85, 247, 0.25)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            SO (Stop Operasi)
          </button>
        </div>
      </div>

      {/* 3. Empty States / Loading Indicator */}
      {!hasAnyFleetData ? (
        <div
          style={{
            background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
            border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
            borderRadius: "16px",
            padding: "36px 16px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "var(--input-bg, rgba(255, 255, 255, 0.06))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-secondary, #8b8b8b)",
              marginBottom: "2px",
            }}
          >
            <Bus size={22} />
          </div>
          <h4
            style={{
              margin: 0,
              fontSize: "14px",
              fontWeight: 800,
              color: "var(--text-primary)",
            }}
          >
            {TEXT_MONITORING.FLEET_TAB.NO_DATA_TITLE}
          </h4>
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              color: "var(--text-secondary)",
              maxWidth: "360px",
              lineHeight: 1.4,
            }}
          >
            {TEXT_MONITORING.FLEET_TAB.NO_DATA_DESC}
          </p>
        </div>
      ) : troubledRoutes.length === 0 && normalRoutes.length > 0 ? (
        /* Seluruh rute normal tanpa kendala */
        <div
          style={{
            background: "rgba(16, 185, 129, 0.05)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            borderRadius: "16px",
            padding: "24px 16px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "14px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "rgba(16, 185, 129, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10B981",
            }}
          >
            <ShieldCheck size={26} />
          </div>
          <h4
            style={{
              margin: 0,
              fontSize: "14px",
              fontWeight: 800,
              color: "var(--text-primary)",
            }}
          >
            {TEXT_MONITORING.FLEET_TAB.EMPTY_TITLE}
          </h4>
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              color: "var(--text-secondary)",
              maxWidth: "380px",
              lineHeight: 1.4,
            }}
          >
            {TEXT_MONITORING.FLEET_TAB.EMPTY_DESC}
          </p>
        </div>
      ) : null}

      {/* 4. Troubled Routes Section (Rute Terkendala) */}
      {troubledRoutes.length > 0 && (
        <div style={{ marginBottom: "14px" }}>
          {/* Header Action Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
              padding: "0 2px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#F59E0B",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span>⚠️</span>
              <span>{TEXT_MONITORING.FLEET_TAB.TROUBLED_ROUTES_COUNT(troubledRoutes.length)}</span>
            </span>

            <button
              type="button"
              onClick={() => toggleAllCollapse(!areAllCollapsed, troubledRouteCodes)}
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "2px 6px",
              }}
            >
              {areAllCollapsed
                ? TEXT_MONITORING.FLEET_TAB.EXPAND_ALL
                : TEXT_MONITORING.FLEET_TAB.COLLAPSE_ALL}
            </button>
          </div>

          {/* Rute List Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {troubledRoutes.map((group) => {
              const isCollapsed = !!collapsedRoutes[group.routeCode];

              return (
                <div
                  key={group.routeCode}
                  className="monitoring-card"
                  style={{
                    background: "var(--card-bg, rgba(23, 23, 23, 0.75))",
                    borderRadius: "14px",
                    border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
                    padding: "10px 12px",
                    transition: "all 0.2s ease",
                  }}
                >
                  {/* Route Header (Akordeon Trigger) */}
                  <div
                    onClick={() => toggleRouteCollapse(group.routeCode)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      gap: "8px",
                      userSelect: "none",
                    }}
                  >
                    {/* Left: Code & Operator */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "7px",
                          fontSize: "11.5px",
                          fontWeight: 800,
                          background: "rgba(62, 207, 142, 0.12)",
                          color: "var(--accent-color, #3ECF8E)",
                          border: "1px solid rgba(62, 207, 142, 0.25)",
                          flexShrink: 0,
                        }}
                      >
                        {group.routeCode}
                      </span>
                      <span
                        style={{
                          fontSize: "11.5px",
                          color: "var(--text-secondary)",
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={group.operatorName}
                      >
                        {group.operatorName}
                      </span>
                    </div>

                    {/* Right: Actions & Counter */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flexShrink: 0,
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickRoute({
                            routeCode: group.routeCode,
                            routeId: group.routeId,
                            shift: shiftFilter === "all" ? 1 : shiftFilter,
                          });
                        }}
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          color: "#38bdf8",
                          background: "rgba(56, 189, 248, 0.12)",
                          padding: "3px 7px",
                          borderRadius: "6px",
                          border: "1px solid rgba(56, 189, 248, 0.25)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                        title={TEXT_FLEET_STATUS.QUICK_KORLAP.MODAL_TITLE}
                      >
                        <Edit3 size={11} />
                        <span>{TEXT_MONITORING.FLEET_TAB.EDIT_ROUTE_BTN}</span>
                      </button>

                      <span
                        style={{
                          fontSize: "10.5px",
                          fontWeight: 700,
                          color: "#F59E0B",
                          background: "rgba(245, 158, 11, 0.12)",
                          padding: "3px 7px",
                          borderRadius: "6px",
                          border: "1px solid rgba(245, 158, 11, 0.25)",
                        }}
                      >
                        {TEXT_MONITORING.FLEET_TAB.ROUTE_ISSUES_COUNT(group.units.length)}
                      </span>

                      <div
                        style={{
                          color: "var(--text-secondary)",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                      </div>
                    </div>
                  </div>

                  {/* Units List (Compact Rows) */}
                  {!isCollapsed && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        marginTop: "10px",
                        paddingTop: "8px",
                        borderTop:
                          "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
                      }}
                    >
                      {group.units.map((unit, idx) => (
                        <div
                          key={`${unit.unit}-${unit.shift}-${idx}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "6px 10px",
                            borderRadius: "8px",
                            background:
                              "var(--input-bg, rgba(255, 255, 255, 0.03))",
                            border:
                              "1px solid var(--card-border, rgba(255, 255, 255, 0.05))",
                            gap: "8px",
                          }}
                        >
                          {/* Unit Body & Detail */}
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              minWidth: 0,
                              flex: 1,
                            }}
                          >
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: 800,
                                color: "var(--text-primary)",
                                letterSpacing: "0.2px",
                              }}
                            >
                              {unit.unit}
                            </span>
                            <span
                              style={{
                                fontSize: "11px",
                                color: "var(--text-secondary)",
                                marginTop: "1px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={unit.note}
                            >
                              {unit.note}
                            </span>
                          </div>

                          {/* Status Badge & Shift */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              flexShrink: 0,
                            }}
                          >
                            <span
                              style={{
                                fontSize: "9.5px",
                                fontWeight: 700,
                                background: unit.badgeBg,
                                color: unit.badgeColor,
                                padding: "2px 6px",
                                borderRadius: "5px",
                                letterSpacing: "0.2px",
                              }}
                            >
                              {unit.statusCode}
                            </span>
                            <span
                              style={{
                                fontSize: "9.5px",
                                fontWeight: 600,
                                color: "var(--text-secondary)",
                                padding: "2px 5px",
                                borderRadius: "5px",
                                background: "rgba(255, 255, 255, 0.06)",
                              }}
                            >
                              S{unit.shift}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Normal Routes Section (Rute Beroperasi Penuh / Tanpa Kendala) */}
      {normalRoutes.length > 0 && (
        <div
          className="monitoring-card"
          style={{
            background: "var(--card-bg, rgba(23, 23, 23, 0.75))",
            borderRadius: "14px",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            padding: "12px 14px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <ShieldCheck size={16} style={{ color: "#10B981" }} />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {TEXT_MONITORING.FLEET_TAB.NORMAL_ROUTES_TITLE}
              </span>
            </div>
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 700,
                color: "#10B981",
                background: "rgba(16, 185, 129, 0.12)",
                padding: "2px 7px",
                borderRadius: "6px",
                border: "1px solid rgba(16, 185, 129, 0.25)",
              }}
            >
              {TEXT_MONITORING.FLEET_TAB.NORMAL_ROUTES_COUNT(normalRoutes.length)}
            </span>
          </div>

          <p
            style={{
              margin: "0 0 10px 0",
              fontSize: "11px",
              color: "var(--text-secondary)",
              lineHeight: 1.3,
            }}
          >
            {TEXT_MONITORING.FLEET_TAB.NORMAL_ROUTES_SUBTITLE}
          </p>

          {/* Chips Grid */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "5px",
            }}
          >
            {normalRoutes.map((nr) => (
              <span
                key={nr.routeCode}
                style={{
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  background: "rgba(16, 185, 129, 0.08)",
                  color: "#10B981",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  cursor: "default",
                }}
                title={`${nr.routeCode} - ${nr.operatorName}`}
              >
                {nr.routeCode}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 6. Quick Korlap Fleet Modal */}
      {quickRoute && (
        <QuickKorlapFleetModal
          isOpen={true}
          onClose={() => setQuickRoute(null)}
          routeId={quickRoute.routeId}
          routeCode={quickRoute.routeCode}
          selectedDate={selectedDate}
          shift={quickRoute.shift}
          onSaveSuccess={() => {
            setQuickRoute(null);
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
};

export default MonitoringFleetStatusTab;
