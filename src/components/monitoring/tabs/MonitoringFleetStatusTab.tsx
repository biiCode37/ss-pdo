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
  Clock,
} from "lucide-react";
import { sortRoutesByCode } from "@/utils/routeSorting";
import { normalizeRouteCode } from "@/services/googleSheets/globalReportReader";
import { QuickKorlapFleetModal } from "@/components/fleetStatus/QuickKorlapFleetModal";
import {
  type TroubledUnitItem,
  inferStatusCode,
  formatUnitNote,
} from "../monitoringUtils";

export interface MonitoringFleetStatusTabProps {
  selectedDate: string;
  fleetShifts: DailyFleetShiftWithUnits[];
  routes?: RegionalRouteItem[];
  onRefresh?: () => void;
}

type ShiftFilter = "all" | 1 | 2;
type StatusFilter = "all" | "BA" | "TEKNIS" | "TO" | "OFF" | "SO";

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

export interface PendingRouteGroup {
  routeCode: string;
  routeName: string;
  operatorName: string;
  routeId: number;
  defaultRenops: number;
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
    defaultRenops?: number;
    initialRealops?: number;
    initialNotes?: string;
  } | null>(null);

  // Default: Seluruh kartu rute tertutup (COLLAPSED) sesuai instruksi user
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set());

  const toggleRouteCollapse = useCallback((routeCode: string) => {
    setExpandedRoutes((prev) => {
      const next = new Set(prev);
      if (next.has(routeCode)) {
        next.delete(routeCode);
      } else {
        next.add(routeCode);
      }
      return next;
    });
  }, []);

  const expandAllRoutes = useCallback((routeCodes: string[]) => {
    setExpandedRoutes(new Set(routeCodes));
  }, []);

  const collapseAllRoutes = useCallback(() => {
    setExpandedRoutes(new Set());
  }, []);

  // 1. DUAL-SOURCE RESOLUTION & DEDUPLIKASI CERDAS
  const resolvedFleetData = useMemo(() => {
    const targetRouteMap = new Map<
      string,
      {
        routeCode: string;
        routeName: string;
        operatorName: string;
        routeId: number;
        routeItem?: RegionalRouteItem;
      }
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
    const pendingList: PendingRouteGroup[] = [];

    let aggTotalRenops = 0;
    let aggTotalRealops = 0;
    let aggTotalTo = 0;
    let aggTotalOff = 0;
    let aggTotalSo = 0;
    let aggTotalBa = 0;
    let aggTotalTeknis = 0;
    let aggTotalOther = 0;

    for (const [routeCode, meta] of targetRouteMap.entries()) {
      const r = meta.routeItem;
      let routeRenops = 0;
      let routeRealops = 0;

      // Peta unit per bodi untuk deduplikasi cerdas antar shift
      const unitMap = new Map<
        string,
        {
          unit: string;
          notes: string[];
          shifts: (1 | 2)[];
          statusCode: string;
          badgeBg: string;
          badgeColor: string;
          badgeBorder?: string;
          isOff: boolean;
        }
      >();

      let hasDbShift = false;
      let hasSsActivity = false;

      for (const sh of shiftsToInspect) {
        const dbShift = fleetShifts.find(
          (s) =>
            s.shift === sh &&
            (s.route_code === routeCode ||
              normalizeRouteCode(s.route_code) === normalizeRouteCode(routeCode))
        );

        const ssRenops =
          (sh === 1 ? r?.renopsShift1 : r?.renopsShift2) ||
          r?.defaultRenops ||
          0;
        const ssRealops = sh === 1 ? r?.realopsShift1 : r?.realopsShift2;
        const ssRawUnits =
          (sh === 1 ? r?.fleetStatusShift1 : r?.fleetStatusShift2) || [];

        if (dbShift) {
          hasDbShift = true;
          const ren = dbShift.target_renops || ssRenops;
          const real = dbShift.realops ?? (ssRealops ?? 0);

          if (shiftFilter === "all") {
            routeRenops = Math.max(routeRenops, ren);
            routeRealops = Math.max(routeRealops, real);
          } else {
            routeRenops += ren;
            routeRealops += real;
          }

          const dbUnits = dbShift.non_sgo_units || [];
          if (dbUnits.length > 0) {
            for (const u of dbUnits) {
              const body = u.unit_body.trim().toUpperCase();
              const parsed = inferStatusCode(
                u.note || "",
                u.status_code === "OFF",
                u.status_code
              );
              const formattedNote = formatUnitNote(u.note || u.status_code);

              if (unitMap.has(body)) {
                const existing = unitMap.get(body)!;
                if (!existing.shifts.includes(sh)) existing.shifts.push(sh);
                if (
                  formattedNote !== "-" &&
                  !existing.notes.includes(formattedNote)
                ) {
                  existing.notes.push(formattedNote);
                }
              } else {
                unitMap.set(body, {
                  unit: body,
                  notes: formattedNote !== "-" ? [formattedNote] : [],
                  shifts: [sh],
                  statusCode: parsed.code,
                  badgeBg: parsed.bg,
                  badgeColor: parsed.color,
                  badgeBorder: parsed.border,
                  isOff: u.status_code === "OFF",
                });
              }
            }
          } else if (ssRawUnits.length > 0) {
            for (const u of ssRawUnits) {
              const body = u.unit.trim().toUpperCase();
              const parsed = inferStatusCode(u.note || "", u.isOff);
              const formattedNote = formatUnitNote(u.note);

              if (unitMap.has(body)) {
                const existing = unitMap.get(body)!;
                if (!existing.shifts.includes(sh)) existing.shifts.push(sh);
                if (
                  formattedNote !== "-" &&
                  !existing.notes.includes(formattedNote)
                ) {
                  existing.notes.push(formattedNote);
                }
              } else {
                unitMap.set(body, {
                  unit: body,
                  notes: formattedNote !== "-" ? [formattedNote] : [],
                  shifts: [sh],
                  statusCode: parsed.code,
                  badgeBg: parsed.bg,
                  badgeColor: parsed.color,
                  badgeBorder: parsed.border,
                  isOff: u.isOff,
                });
              }
            }
          }
        } else if (r) {
          const hasActivity =
            Boolean(r.totalTrips && r.totalTrips > 0) ||
            Boolean(r.todayPassengers && r.todayPassengers > 0) ||
            Boolean(ssRealops && ssRealops > 0) ||
            ssRawUnits.length > 0 ||
            r.status === "submitted" ||
            r.status === "verified";

          if (hasActivity) {
            hasSsActivity = true;
          }

          if (hasActivity || ssRenops > 0) {
            if (shiftFilter === "all") {
              routeRenops = Math.max(routeRenops, ssRenops);
              routeRealops = Math.max(routeRealops, ssRealops ?? 0);
            } else {
              routeRenops += ssRenops;
              routeRealops += ssRealops ?? 0;
            }

            for (const u of ssRawUnits) {
              const body = u.unit.trim().toUpperCase();
              const parsed = inferStatusCode(u.note || "", u.isOff);
              const formattedNote = formatUnitNote(u.note);

              if (unitMap.has(body)) {
                const existing = unitMap.get(body)!;
                if (!existing.shifts.includes(sh)) existing.shifts.push(sh);
                if (
                  formattedNote !== "-" &&
                  !existing.notes.includes(formattedNote)
                ) {
                  existing.notes.push(formattedNote);
                }
              } else {
                unitMap.set(body, {
                  unit: body,
                  notes: formattedNote !== "-" ? [formattedNote] : [],
                  shifts: [sh],
                  statusCode: parsed.code,
                  badgeBg: parsed.bg,
                  badgeColor: parsed.color,
                  badgeBorder: parsed.border,
                  isOff: u.isOff,
                });
              }
            }
          }
        }
      }

      // Convert unitMap ke array terurut
      const allRouteUnits: TroubledUnitItem[] = Array.from(
        unitMap.values()
      ).map((item) => ({
        unit: item.unit,
        note: item.notes.length > 0 ? item.notes.join(" • ") : "-",
        statusCode: item.statusCode,
        badgeBg: item.badgeBg,
        badgeColor: item.badgeColor,
        badgeBorder: item.badgeBorder,
        isOff: item.isOff,
        shifts: item.shifts,
        shift: item.shifts[0],
        routeCode,
      }));

      // Filter berdasarkan status kendala
      const filteredUnits = allRouteUnits.filter((u) => {
        if (statusFilter === "all") return true;
        if (statusFilter === "BA") return u.statusCode.startsWith("BA");
        if (statusFilter === "TEKNIS")
          return ["KEUR", "TEKNIS"].includes(u.statusCode);
        if (statusFilter === "TO") return u.statusCode.includes("TO");
        if (statusFilter === "OFF") return u.statusCode === "OFF" || u.isOff;
        if (statusFilter === "SO") return u.statusCode === "SO";
        return true;
      });

      // Akumulasi statistik makro
      aggTotalRenops += routeRenops;
      aggTotalRealops += routeRealops;

      for (const u of filteredUnits) {
        if (u.statusCode.startsWith("BA")) aggTotalBa++;
        else if (["KEUR", "TEKNIS"].includes(u.statusCode)) aggTotalTeknis++;
        else if (u.statusCode.includes("TO")) aggTotalTo++;
        else if (u.statusCode === "OFF" || u.isOff) aggTotalOff++;
        else if (u.statusCode === "SO") aggTotalSo++;
        else aggTotalOther++;
      }

      // Klasifikasi rute: 1) Terkendala, 2) Normal, 3) Menunggu Laporan
      const hasRealReport = hasDbShift || hasSsActivity;

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
      } else if (hasRealReport) {
        normalList.push({
          routeCode,
          routeName: meta.routeName,
          operatorName: meta.operatorName,
          routeId: meta.routeId,
          totalRenops: routeRenops,
          totalRealops: routeRealops,
        });
      } else {
        pendingList.push({
          routeCode,
          routeName: meta.routeName,
          operatorName: meta.operatorName,
          routeId: meta.routeId,
          defaultRenops: r?.defaultRenops || 0,
        });
      }
    }

    const totalTerkendala =
      aggTotalBa +
      aggTotalTeknis +
      aggTotalTo +
      aggTotalOff +
      aggTotalSo +
      aggTotalOther;

    const persentase =
      aggTotalRenops > 0
        ? ((aggTotalRealops / aggTotalRenops) * 100).toFixed(1)
        : "0.0";

    return {
      troubledRoutes: sortRoutesByCode(troubledList),
      normalRoutes: sortRoutesByCode(normalList),
      pendingRoutes: sortRoutesByCode(pendingList),
      stats: {
        totalFleet: aggTotalRenops,
        totalBeroperasi: aggTotalRealops,
        totalTerkendala,
        totalBa: aggTotalBa,
        totalTeknis: aggTotalTeknis,
        totalTo: aggTotalTo,
        totalOff: aggTotalOff,
        totalSo: aggTotalSo,
        persentase,
      },
    };
  }, [routes, fleetShifts, shiftFilter, statusFilter]);

  const { troubledRoutes, normalRoutes, pendingRoutes, stats } = resolvedFleetData;
  const troubledRouteCodes = useMemo(
    () => troubledRoutes.map((r) => r.routeCode),
    [troubledRoutes]
  );

  const areAllCollapsed = useMemo(() => {
    return troubledRouteCodes.every((code) => !expandedRoutes.has(code));
  }, [troubledRouteCodes, expandedRoutes]);

  const hasAnyFleetData =
    stats.totalFleet > 0 ||
    troubledRoutes.length > 0 ||
    normalRoutes.length > 0 ||
    pendingRoutes.length > 0;

  return (
    <div
      className="monitoring-fleet-status-tab"
      style={{
        padding: "14px 12px calc(90px + env(safe-area-inset-bottom, 16px)) 12px",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      {/* 1. Header & Macro Stats Bar */}
      <div
        className="monitoring-card"
        style={{
          background: "var(--card-bg, rgba(23, 23, 23, 0.75))",
          borderRadius: "14px",
          border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
          padding: "12px 14px",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <Bus size={17} style={{ color: "var(--accent-color, #3ECF8E)" }} />
            <h3
              style={{
                fontSize: "13.5px",
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
              fontSize: "10px",
              fontWeight: 600,
              color: "var(--text-secondary)",
              background: "var(--input-bg, rgba(255, 255, 255, 0.05))",
              padding: "2px 7px",
              borderRadius: "5px",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
            }}
          >
            18 Rute
          </span>
        </div>

        {/* 3 Macro Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "7px",
          }}
        >
          {/* Total Armada */}
          <div
            style={{
              background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.05))",
              borderRadius: "10px",
              padding: "7px 9px",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                display: "block",
              }}
            >
              {TEXT_MONITORING.FLEET_TAB.TOTAL_FLEET}
            </span>
            <div
              style={{
                fontSize: "16px",
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

          {/* Armada Beroperasi */}
          <div
            style={{
              background: "rgba(16, 185, 129, 0.06)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              borderRadius: "10px",
              padding: "7px 9px",
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
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "#10B981",
                }}
              >
                {TEXT_MONITORING.FLEET_TAB.SGO_LABEL}
              </span>
              <CheckCircle2 size={11} style={{ color: "#10B981" }} />
            </div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 800,
                color: "#10B981",
                marginTop: "2px",
                lineHeight: 1.2,
              }}
            >
              {stats.totalBeroperasi}{" "}
              <span
                style={{
                  fontSize: "9.5px",
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
              borderRadius: "10px",
              padding: "7px 9px",
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
                  fontSize: "10px",
                  fontWeight: 600,
                  color: stats.totalTerkendala > 0 ? "#F59E0B" : "var(--text-secondary)",
                }}
              >
                {TEXT_MONITORING.FLEET_TAB.NON_SGO_LABEL}
              </span>
              {stats.totalTerkendala > 0 && (
                <AlertTriangle size={11} style={{ color: "#F59E0B" }} />
              )}
            </div>
            <div
              style={{
                fontSize: "16px",
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
                fontSize: "8.5px",
                color: "var(--text-secondary)",
                marginTop: "2px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              BA:{stats.totalBa} • TO:{stats.totalTo} • OFF:{stats.totalOff}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter Controls: Shift & Status */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "5px",
          marginBottom: "10px",
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
              padding: "4px 9px",
              borderRadius: "7px",
              fontSize: "10.5px",
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
              padding: "4px 9px",
              borderRadius: "7px",
              fontSize: "10.5px",
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
              padding: "4px 9px",
              borderRadius: "7px",
              fontSize: "10.5px",
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

        {/* Status Type Filter (Lengkap dengan BA & Keur/Teknis) */}
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
              padding: "3px 8px",
              borderRadius: "6px",
              fontSize: "10px",
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
            onClick={() => setStatusFilter("BA")}
            style={{
              padding: "3px 8px",
              borderRadius: "6px",
              fontSize: "10px",
              fontWeight: statusFilter === "BA" ? 700 : 500,
              background:
                statusFilter === "BA"
                  ? "rgba(251, 146, 60, 0.2)"
                  : "transparent",
              color: statusFilter === "BA" ? "#FB923C" : "var(--text-secondary)",
              border: "1px solid rgba(251, 146, 60, 0.25)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            BA
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("TEKNIS")}
            style={{
              padding: "3px 8px",
              borderRadius: "6px",
              fontSize: "10px",
              fontWeight: statusFilter === "TEKNIS" ? 700 : 500,
              background:
                statusFilter === "TEKNIS"
                  ? "rgba(56, 189, 248, 0.2)"
                  : "transparent",
              color: statusFilter === "TEKNIS" ? "#38BDF8" : "var(--text-secondary)",
              border: "1px solid rgba(56, 189, 248, 0.25)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Keur / Teknis
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("TO")}
            style={{
              padding: "3px 8px",
              borderRadius: "6px",
              fontSize: "10px",
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
            TO
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("OFF")}
            style={{
              padding: "3px 8px",
              borderRadius: "6px",
              fontSize: "10px",
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
            OFF
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("SO")}
            style={{
              padding: "3px 8px",
              borderRadius: "6px",
              fontSize: "10px",
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
            SO
          </button>
        </div>
      </div>

      {/* 3. Empty State Total */}
      {!hasAnyFleetData ? (
        <div
          style={{
            background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
            border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
            borderRadius: "14px",
            padding: "32px 14px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "7px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "var(--input-bg, rgba(255, 255, 255, 0.06))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-secondary, #8b8b8b)",
              marginBottom: "2px",
            }}
          >
            <Bus size={20} />
          </div>
          <h4
            style={{
              margin: 0,
              fontSize: "13.5px",
              fontWeight: 800,
              color: "var(--text-primary)",
            }}
          >
            {TEXT_MONITORING.FLEET_TAB.NO_DATA_TITLE}
          </h4>
          <p
            style={{
              margin: 0,
              fontSize: "11.5px",
              color: "var(--text-secondary)",
              maxWidth: "340px",
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
            borderRadius: "14px",
            padding: "20px 14px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "7px",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "rgba(16, 185, 129, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10B981",
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <h4
            style={{
              margin: 0,
              fontSize: "13.5px",
              fontWeight: 800,
              color: "var(--text-primary)",
            }}
          >
            {TEXT_MONITORING.FLEET_TAB.EMPTY_TITLE}
          </h4>
          <p
            style={{
              margin: 0,
              fontSize: "11.5px",
              color: "var(--text-secondary)",
              maxWidth: "360px",
              lineHeight: 1.4,
            }}
          >
            {TEXT_MONITORING.FLEET_TAB.EMPTY_DESC}
          </p>
        </div>
      ) : null}

      {/* 4. Troubled Routes Section (Rute Terkendala) */}
      {troubledRoutes.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          {/* Header Action Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "7px",
              padding: "0 2px",
            }}
          >
            <span
              style={{
                fontSize: "11.5px",
                fontWeight: 700,
                color: "#F59E0B",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span>⚠️</span>
              <span>
                {TEXT_MONITORING.FLEET_TAB.TROUBLED_ROUTES_COUNT(troubledRoutes.length)}
              </span>
            </span>

            <button
              type="button"
              onClick={() =>
                areAllCollapsed
                  ? expandAllRoutes(troubledRouteCodes)
                  : collapseAllRoutes()
              }
              style={{
                fontSize: "10.5px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "2px 5px",
              }}
            >
              {areAllCollapsed
                ? TEXT_MONITORING.FLEET_TAB.EXPAND_ALL
                : TEXT_MONITORING.FLEET_TAB.COLLAPSE_ALL}
            </button>
          </div>

          {/* Rute List Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {troubledRoutes.map((group) => {
              const isExpanded = expandedRoutes.has(group.routeCode);

              return (
                <div
                  key={group.routeCode}
                  className="monitoring-card"
                  style={{
                    background: "var(--card-bg, rgba(23, 23, 23, 0.75))",
                    borderRadius: "12px",
                    border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
                    padding: "9px 11px",
                    transition: "all 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
                  }}
                >
                  {/* Route Header (Tap to Expand/Collapse) */}
                  <div
                    onClick={() => toggleRouteCollapse(group.routeCode)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      gap: "6px",
                      userSelect: "none",
                    }}
                  >
                    {/* Left: Code & Operator */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <span
                        style={{
                          padding: "2px 7px",
                          borderRadius: "6px",
                          fontSize: "11px",
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
                          fontSize: "11px",
                          color: "var(--text-secondary)",
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "140px",
                        }}
                        title={group.operatorName}
                      >
                        {group.operatorName}
                      </span>
                    </div>

                    {/* Right: Actions & Badges */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flexShrink: 0,
                      }}
                    >
                      {/* Icon Edit Button (Tanpa teks 'Koreksi') */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickRoute({
                            routeCode: group.routeCode,
                            routeId: group.routeId,
                            shift: shiftFilter === "all" ? 1 : shiftFilter,
                            defaultRenops: group.totalRenops,
                            initialRealops: group.totalRealops,
                            initialNotes: group.units
                              .map((u) => `${u.unit} ${u.note}`)
                              .join("\n"),
                          });
                        }}
                        style={{
                          width: "25px",
                          height: "25px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "6px",
                          border: "1px solid rgba(56, 189, 248, 0.25)",
                          background: "rgba(56, 189, 248, 0.12)",
                          color: "#38bdf8",
                          cursor: "pointer",
                          padding: 0,
                          flexShrink: 0,
                        }}
                        title={TEXT_FLEET_STATUS.QUICK_KORLAP.MODAL_TITLE}
                        aria-label="Koreksi Data Rute"
                      >
                        <Edit3 size={12} />
                      </button>

                      {/* Badge Kendala: [Jumlah] + Icon Warning (Tanpa Icon Bus) */}
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          fontSize: "10.5px",
                          fontWeight: 700,
                          color: "#F59E0B",
                          background: "rgba(245, 158, 11, 0.12)",
                          padding: "2px 6px",
                          borderRadius: "5px",
                          border: "1px solid rgba(245, 158, 11, 0.25)",
                        }}
                      >
                        <span>{group.units.length}</span>
                        <AlertTriangle size={11} style={{ color: "#F59E0B" }} />
                      </span>

                      {/* Chevron Toggle */}
                      <div
                        style={{
                          color: "var(--text-secondary)",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {isExpanded ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Units List (Compact Rows, Only when expanded) */}
                  {isExpanded && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "5px",
                        marginTop: "8px",
                        paddingTop: "7px",
                        borderTop:
                          "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
                      }}
                    >
                      {group.units.map((unit, idx) => (
                        <div
                          key={`${unit.unit}-${unit.shifts.join("-")}-${idx}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "5px 8px",
                            borderRadius: "7px",
                            background:
                              "var(--input-bg, rgba(255, 255, 255, 0.03))",
                            border:
                              "1px solid var(--card-border, rgba(255, 255, 255, 0.05))",
                            gap: "6px",
                          }}
                        >
                          {/* Unit Body & Note */}
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
                                fontSize: "11.5px",
                                fontWeight: 800,
                                color: "var(--text-primary)",
                                letterSpacing: "0.2px",
                              }}
                            >
                              {unit.unit}
                            </span>
                            <span
                              style={{
                                fontSize: "10.5px",
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

                          {/* Status Badge & Shifts */}
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
                                fontSize: "9px",
                                fontWeight: 700,
                                background: unit.badgeBg,
                                color: unit.badgeColor,
                                border: unit.badgeBorder ? `1px solid ${unit.badgeBorder}` : "none",
                                padding: "2px 5px",
                                borderRadius: "4px",
                                letterSpacing: "0.2px",
                              }}
                            >
                              {unit.statusCode}
                            </span>
                            <span
                              style={{
                                fontSize: "9px",
                                fontWeight: 600,
                                color: "var(--text-secondary)",
                                padding: "2px 4px",
                                borderRadius: "4px",
                                background: "rgba(255, 255, 255, 0.06)",
                              }}
                            >
                              {unit.shifts.map((s) => `S${s}`).join(" • ")}
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

      {/* 5. Normal Routes Section (Rute Beroperasi Penuh / 100% Siap Jalan) */}
      {normalRoutes.length > 0 && (
        <div
          className="monitoring-card"
          style={{
            background: "var(--card-bg, rgba(23, 23, 23, 0.75))",
            borderRadius: "12px",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            padding: "10px 12px",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "6px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <ShieldCheck size={15} style={{ color: "#10B981" }} />
              <span
                style={{
                  fontSize: "11.5px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {TEXT_MONITORING.FLEET_TAB.NORMAL_ROUTES_TITLE}
              </span>
            </div>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#10B981",
                background: "rgba(16, 185, 129, 0.12)",
                padding: "2px 6px",
                borderRadius: "5px",
                border: "1px solid rgba(16, 185, 129, 0.25)",
              }}
            >
              {TEXT_MONITORING.FLEET_TAB.NORMAL_ROUTES_COUNT(normalRoutes.length)}
            </span>
          </div>

          <p
            style={{
              margin: "0 0 8px 0",
              fontSize: "10.5px",
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
              gap: "4px",
            }}
          >
            {normalRoutes.map((nr) => (
              <span
                key={nr.routeCode}
                style={{
                  padding: "2px 7px",
                  borderRadius: "5px",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  background: "rgba(16, 185, 129, 0.08)",
                  color: "#10B981",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  cursor: "default",
                }}
                title={`${nr.routeCode} - ${nr.operatorName} (100% Siap Jalan)`}
              >
                {nr.routeCode}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 6. Pending Routes Section (Menunggu Laporan / Belum Ada Data) */}
      {pendingRoutes.length > 0 && (
        <div
          className="monitoring-card"
          style={{
            background: "var(--card-bg, rgba(23, 23, 23, 0.75))",
            borderRadius: "12px",
            border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
            padding: "9px 12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "5px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <Clock size={13} style={{ color: "var(--text-secondary)" }} />
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                }}
              >
                Menunggu Laporan / Sinkronisasi
              </span>
            </div>
            <span
              style={{
                fontSize: "9.5px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                background: "var(--input-bg, rgba(255, 255, 255, 0.05))",
                padding: "1px 5px",
                borderRadius: "4px",
              }}
            >
              {pendingRoutes.length} Rute
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "4px",
              marginTop: "5px",
            }}
          >
            {pendingRoutes.map((pr) => (
              <span
                key={pr.routeCode}
                style={{
                  padding: "2px 6px",
                  borderRadius: "5px",
                  fontSize: "10px",
                  fontWeight: 600,
                  background: "var(--input-bg, rgba(255, 255, 255, 0.04))",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
                  cursor: "default",
                }}
                title={`${pr.routeCode} - ${pr.operatorName} (Belum Ada Data)`}
              >
                {pr.routeCode}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 7. Quick Korlap Fleet Modal */}
      {quickRoute && (
        <QuickKorlapFleetModal
          isOpen={true}
          onClose={() => setQuickRoute(null)}
          routeId={quickRoute.routeId}
          routeCode={quickRoute.routeCode}
          selectedDate={selectedDate}
          shift={quickRoute.shift}
          defaultRenops={quickRoute.defaultRenops}
          initialRealops={quickRoute.initialRealops}
          initialNotes={quickRoute.initialNotes}
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
