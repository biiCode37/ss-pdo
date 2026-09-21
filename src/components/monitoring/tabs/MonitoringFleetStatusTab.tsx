import React, { useState, useMemo } from "react";
import type { DailyFleetShiftWithUnits, DailyFleetNonSgoUnit } from "@/types/supabase";
import type { RegionalRouteItem } from "@/services/allRouteMonitoringService";
import { TEXT_MONITORING } from "@/constants/texts";
import { Bus, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

export interface MonitoringFleetStatusTabProps {
  selectedDate: string;
  fleetShifts: DailyFleetShiftWithUnits[];
  routes?: RegionalRouteItem[];
}

type ShiftFilter = "all" | 1 | 2;
type StatusFilter = "all" | "TO" | "OFF" | "SO";

interface EnrichedNonSgoUnit extends DailyFleetNonSgoUnit {
  route_code: string;
  shift: 1 | 2;
}

export const MonitoringFleetStatusTab: React.FC<MonitoringFleetStatusTabProps> = ({
  fleetShifts,
  routes = [],
}) => {
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Map routeCode -> operatorName
  const operatorMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of routes) {
      map.set(r.routeCode, r.operatorName);
    }
    return map;
  }, [routes]);

  // Filtered shifts based on active shift filter
  const relevantShifts = useMemo(() => {
    if (shiftFilter === "all") return fleetShifts;
    return fleetShifts.filter((s) => s.shift === shiftFilter);
  }, [fleetShifts, shiftFilter]);

  // Aggregate stats across relevant shifts
  const stats = useMemo(() => {
    let totalSgo = 0;
    let totalTo = 0;
    let totalOff = 0;
    let totalSo = 0;
    let totalOther = 0;

    for (const s of relevantShifts) {
      totalSgo += s.sgo_count || 0;
      totalTo += s.to_count || 0;
      totalOff += s.off_count || 0;
      totalSo += s.so_count || 0;
      totalOther += s.other_count || 0;
    }

    const totalNonSgo = totalTo + totalOff + totalSo + totalOther;
    const totalFleet = totalSgo + totalNonSgo;
    const sgoPct =
      totalFleet > 0 ? ((totalSgo / totalFleet) * 100).toFixed(1) : "100.0";

    return {
      totalFleet,
      totalSgo,
      totalNonSgo,
      totalTo,
      totalOff,
      totalSo,
      sgoPct,
    };
  }, [relevantShifts]);

  // Flatten and group non-SGO units by route
  const groupedRoutes = useMemo(() => {
    const routeMap = new Map<string, EnrichedNonSgoUnit[]>();

    for (const shift of relevantShifts) {
      const units = shift.non_sgo_units || [];
      for (const u of units) {
        if (statusFilter !== "all" && u.status_type !== statusFilter) {
          continue;
        }

        const enriched: EnrichedNonSgoUnit = {
          ...u,
          route_code: shift.route_code,
          shift: shift.shift as 1 | 2,
        };

        if (!routeMap.has(shift.route_code)) {
          routeMap.set(shift.route_code, []);
        }
        routeMap.get(shift.route_code)!.push(enriched);
      }
    }

    // Convert map to sorted list
    return Array.from(routeMap.entries()).map(([routeCode, units]) => ({
      routeCode,
      operatorName: operatorMap.get(routeCode) || "Mikrotrans",
      units,
    }));
  }, [relevantShifts, statusFilter, operatorMap]);

  return (
    <div
      className="monitoring-fleet-status-tab"
      style={{
        padding: "16px",
        maxWidth: "1200px",
        margin: "0 auto",
        paddingBottom: "84px",
      }}
    >
      {/* 1. Header & Macro Stats Bar */}
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
          <Bus size={18} style={{ color: "var(--accent-color, #3ECF8E)" }} />
          <h3
            style={{
              fontSize: "14px",
              fontWeight: 700,
              margin: 0,
              color: "var(--text-primary)",
            }}
          >
            {TEXT_MONITORING.FLEET_TAB.TITLE}
          </h3>
        </div>

        {/* 3 Macro Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
          }}
        >
          {/* Total Armada */}
          <div
            style={{
              background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.05))",
              borderRadius: "12px",
              padding: "10px 12px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-secondary)",
              }}
            >
              {TEXT_MONITORING.FLEET_TAB.TOTAL_FLEET}
            </span>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 800,
                color: "var(--text-primary)",
                marginTop: "2px",
              }}
            >
              {stats.totalFleet}{" "}
              <span style={{ fontSize: "11px", fontWeight: 500 }}>Unit</span>
            </div>
          </div>

          {/* SGO Count */}
          <div
            style={{
              background: "rgba(16, 185, 129, 0.06)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              borderRadius: "12px",
              padding: "10px 12px",
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
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#10B981",
                }}
              >
                {TEXT_MONITORING.FLEET_TAB.SGO_LABEL}
              </span>
              <CheckCircle2 size={13} style={{ color: "#10B981" }} />
            </div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 800,
                color: "#10B981",
                marginTop: "2px",
              }}
            >
              {stats.totalSgo}{" "}
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                }}
              >
                ({stats.sgoPct}%)
              </span>
            </div>
          </div>

          {/* Non-SGO Count */}
          <div
            style={{
              background:
                stats.totalNonSgo > 0
                  ? "rgba(245, 158, 11, 0.06)"
                  : "var(--input-bg, rgba(255, 255, 255, 0.03))",
              border:
                stats.totalNonSgo > 0
                  ? "1px solid rgba(245, 158, 11, 0.25)"
                  : "1px solid var(--card-border, rgba(255, 255, 255, 0.05))",
              borderRadius: "12px",
              padding: "10px 12px",
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
                  fontSize: "11px",
                  fontWeight: 600,
                  color: stats.totalNonSgo > 0 ? "#F59E0B" : "var(--text-secondary)",
                }}
              >
                {TEXT_MONITORING.FLEET_TAB.NON_SGO_LABEL}
              </span>
              {stats.totalNonSgo > 0 && (
                <AlertTriangle size={13} style={{ color: "#F59E0B" }} />
              )}
            </div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 800,
                color: stats.totalNonSgo > 0 ? "#F59E0B" : "var(--text-primary)",
                marginTop: "2px",
              }}
            >
              {stats.totalNonSgo}{" "}
              <span style={{ fontSize: "11px", fontWeight: 500 }}>Unit</span>
            </div>
            <div
              style={{
                fontSize: "9.5px",
                color: "var(--text-secondary)",
                marginTop: "2px",
                whiteSpace: "nowrap",
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
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        {/* Shift Filter */}
        <div
          className="no-scrollbar"
          style={{
            display: "flex",
            gap: "6px",
            overflowX: "auto",
          }}
        >
          <button
            type="button"
            onClick={() => setShiftFilter("all")}
            style={{
              padding: "6px 12px",
              borderRadius: "10px",
              fontSize: "11.5px",
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
              padding: "6px 12px",
              borderRadius: "10px",
              fontSize: "11.5px",
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
              padding: "6px 12px",
              borderRadius: "10px",
              fontSize: "11.5px",
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
            gap: "6px",
            overflowX: "auto",
          }}
        >
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            style={{
              padding: "5px 10px",
              borderRadius: "8px",
              fontSize: "11px",
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
              padding: "5px 10px",
              borderRadius: "8px",
              fontSize: "11px",
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
            TO (Tukar Operasi)
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("OFF")}
            style={{
              padding: "5px 10px",
              borderRadius: "8px",
              fontSize: "11px",
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
              padding: "5px 10px",
              borderRadius: "8px",
              fontSize: "11px",
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

      {/* 3. Grouped Routes or Empty State */}
      {groupedRoutes.length === 0 ? (
        <div
          style={{
            background: "rgba(16, 185, 129, 0.05)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            borderRadius: "16px",
            padding: "40px 20px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "rgba(16, 185, 129, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10B981",
              marginBottom: "4px",
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <h4
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: 800,
              color: "var(--text-primary)",
            }}
          >
            {TEXT_MONITORING.FLEET_TAB.EMPTY_TITLE}
          </h4>
          <p
            style={{
              margin: 0,
              fontSize: "12.5px",
              color: "var(--text-secondary)",
              maxWidth: "400px",
              lineHeight: 1.4,
            }}
          >
            {TEXT_MONITORING.FLEET_TAB.EMPTY_DESC}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {groupedRoutes.map((group) => (
            <div
              key={group.routeCode}
              className="monitoring-card"
              style={{
                background: "var(--card-bg, rgba(23, 23, 23, 0.75))",
                borderRadius: "16px",
                border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
                padding: "14px",
              }}
            >
              {/* Route Group Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                  paddingBottom: "10px",
                  borderBottom: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 800,
                      background: "rgba(62, 207, 142, 0.12)",
                      color: "var(--accent-color, #3ECF8E)",
                      border: "1px solid rgba(62, 207, 142, 0.25)",
                    }}
                  >
                    {group.routeCode}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    {group.operatorName}
                  </span>
                </div>

                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#F59E0B",
                    background: "rgba(245, 158, 11, 0.12)",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(245, 158, 11, 0.25)",
                  }}
                >
                  {TEXT_MONITORING.FLEET_TAB.ROUTE_ISSUES_COUNT(group.units.length)}
                </span>
              </div>

              {/* Units Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "10px",
                }}
              >
                {group.units.map((unit, idx) => {
                  const isTo = unit.status_type === "TO";
                  const isOff = unit.status_type === "OFF";
                  const isSo = unit.status_type === "SO";

                  const badgeBg = isTo
                    ? "rgba(245, 158, 11, 0.15)"
                    : isOff
                      ? "rgba(244, 63, 94, 0.15)"
                      : isSo
                        ? "rgba(168, 85, 247, 0.15)"
                        : "rgba(255, 255, 255, 0.1)";

                  const badgeColor = isTo
                    ? "#F59E0B"
                    : isOff
                      ? "#F43F5E"
                      : isSo
                        ? "#A855F7"
                        : "var(--text-primary)";

                  return (
                    <div
                      key={`${unit.unit_body}-${idx}`}
                      style={{
                        background: "var(--input-bg, rgba(255, 255, 255, 0.03))",
                        border: "1px solid var(--card-border, rgba(255, 255, 255, 0.05))",
                        borderRadius: "12px",
                        padding: "10px 12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "4px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: 800,
                            color: "var(--text-primary)",
                            letterSpacing: "0.2px",
                          }}
                        >
                          {unit.unit_body}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              background: badgeBg,
                              color: badgeColor,
                              padding: "2px 6px",
                              borderRadius: "6px",
                            }}
                          >
                            {unit.status_type}
                          </span>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 600,
                              color: "var(--text-secondary)",
                            }}
                          >
                            S{unit.shift}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: "11.5px",
                          color: "var(--text-secondary)",
                          marginTop: "4px",
                          lineHeight: 1.3,
                        }}
                      >
                        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                          {TEXT_MONITORING.FLEET_TAB.NOTES_PREFIX}{" "}
                        </span>
                        {unit.notes || "-"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MonitoringFleetStatusTab;
