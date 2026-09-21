import React, { useState, useMemo } from "react";
import { Search, CheckCheck, X, Filter } from "lucide-react";
import type { RegionalRouteItem } from "@/services/allRouteMonitoringService";
import { SUPERVISORS } from "@/services/allRouteMonitoringService";
import { TEXT_MONITORING } from "@/constants/texts";
import { showConfirmDialog } from "@/utils/alertUtils";
import { MonitoringRouteCardModern } from "./MonitoringRouteCardModern";

export interface MonitoringRoutesTabProps {
  routes: RegionalRouteItem[];
  onVerifyRoute: (routeId: number, status: "verified") => void;
  onBulkVerify: () => Promise<void>;
  onSelectRoute?: (routeCode: string) => void;
  verifyingRouteId?: number | null;
  isBulking?: boolean;
}

type StatusFilterType = "all" | "submitted" | "uncompleted" | "verified";

export const MonitoringRoutesTab: React.FC<MonitoringRoutesTabProps> = ({
  routes,
  onVerifyRoute,
  onBulkVerify,
  onSelectRoute,
  verifyingRouteId,
  isBulking,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("all");
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>("all");

  // Submitted routes ready for bulk verification
  const submittedRoutes = useMemo(() => {
    return routes.filter((r) => r.status === "submitted");
  }, [routes]);

  // Counts for filter chips
  const counts = useMemo(() => {
    const submitted = routes.filter((r) => r.status === "submitted").length;
    const verified = routes.filter((r) => r.status === "verified").length;
    const uncompleted = routes.filter(
      (r) => r.status === "draft" || r.status === "empty",
    ).length;
    return { all: routes.length, submitted, verified, uncompleted };
  }, [routes]);

  // Filtered routes list
  const filteredRoutes = useMemo(() => {
    return routes.filter((route) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          route.routeCode.toLowerCase().includes(q) ||
          route.routeName.toLowerCase().includes(q) ||
          route.operatorName.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // Status chip filter
      if (statusFilter === "submitted" && route.status !== "submitted") return false;
      if (statusFilter === "verified" && route.status !== "verified") return false;
      if (
        statusFilter === "uncompleted" &&
        route.status !== "draft" &&
        route.status !== "empty"
      ) {
        return false;
      }

      // Supervisor filter
      if (
        selectedSupervisor !== "all" &&
        route.supervisorName !== selectedSupervisor
      ) {
        return false;
      }

      return true;
    });
  }, [routes, searchQuery, statusFilter, selectedSupervisor]);

  const handleBulkVerifyClick = async () => {
    if (submittedRoutes.length === 0) return;

    const confirmed = await showConfirmDialog({
      title: TEXT_MONITORING.BULK_VERIFY.CONFIRM_TITLE,
      text: TEXT_MONITORING.BULK_VERIFY.CONFIRM_TEXT(submittedRoutes.length),
      confirmButtonText: TEXT_MONITORING.BULK_VERIFY.CONFIRM_BUTTON,
      cancelButtonText: TEXT_MONITORING.BULK_VERIFY.CANCEL_BUTTON,
    });

    if (confirmed) {
      await onBulkVerify();
    }
  };

  return (
    <div
      className="monitoring-routes-tab"
      style={{
        padding: "16px",
        maxWidth: "1200px",
        margin: "0 auto",
        paddingBottom: "84px",
      }}
    >
      {/* 1. Search Toolbar & Bulk Verify */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          {/* Search Box */}
          <div
            style={{
              flex: "1 1 240px",
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "12px",
                color: "var(--text-secondary)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              data-testid="routes-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari rute (JAK.XX), lintasan, atau operator..."
              style={{
                width: "100%",
                padding: "9px 34px 9px 36px",
                borderRadius: "12px",
                background: "var(--card-bg, rgba(23, 23, 23, 0.75))",
                border: "1px solid var(--card-border, rgba(255, 255, 255, 0.1))",
                color: "var(--text-primary)",
                fontSize: "13px",
                outline: "none",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "10px",
                  background: "transparent",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Bulk Verify Button */}
          {submittedRoutes.length > 0 && (
            <button
              type="button"
              data-testid="bulk-verify-btn"
              onClick={handleBulkVerifyClick}
              disabled={isBulking}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 16px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                color: "#ffffff",
                border: "none",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: isBulking ? "wait" : "pointer",
                opacity: isBulking ? 0.7 : 1,
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
              }}
            >
              <CheckCheck size={16} />
              <span>
                {TEXT_MONITORING.BULK_VERIFY.BUTTON_LABEL(
                  submittedRoutes.length,
                )}
              </span>
            </button>
          )}
        </div>

        {/* Status Chips */}
        <div
          className="no-scrollbar"
          style={{
            display: "flex",
            gap: "6px",
            overflowX: "auto",
            paddingBottom: "2px",
          }}
        >
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            style={{
              padding: "6px 12px",
              borderRadius: "10px",
              fontSize: "11.5px",
              fontWeight: statusFilter === "all" ? 700 : 500,
              background:
                statusFilter === "all"
                  ? "var(--accent-color, #3ECF8E)"
                  : "var(--input-bg, rgba(255, 255, 255, 0.05))",
              color: statusFilter === "all" ? "#000" : "var(--text-secondary)",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Semua ({counts.all})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("submitted")}
            style={{
              padding: "6px 12px",
              borderRadius: "10px",
              fontSize: "11.5px",
              fontWeight: statusFilter === "submitted" ? 700 : 500,
              background:
                statusFilter === "submitted"
                  ? "rgba(56, 189, 248, 0.2)"
                  : "var(--input-bg, rgba(255, 255, 255, 0.05))",
              color:
                statusFilter === "submitted"
                  ? "#38bdf8"
                  : "var(--text-secondary)",
              border:
                statusFilter === "submitted"
                  ? "1px solid rgba(56, 189, 248, 0.4)"
                  : "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Perlu Verifikasi ({counts.submitted})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("uncompleted")}
            style={{
              padding: "6px 12px",
              borderRadius: "10px",
              fontSize: "11.5px",
              fontWeight: statusFilter === "uncompleted" ? 700 : 500,
              background:
                statusFilter === "uncompleted"
                  ? "rgba(245, 158, 11, 0.2)"
                  : "var(--input-bg, rgba(255, 255, 255, 0.05))",
              color:
                statusFilter === "uncompleted"
                  ? "#f59e0b"
                  : "var(--text-secondary)",
              border:
                statusFilter === "uncompleted"
                  ? "1px solid rgba(245, 158, 11, 0.4)"
                  : "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Belum Lengkap ({counts.uncompleted})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("verified")}
            style={{
              padding: "6px 12px",
              borderRadius: "10px",
              fontSize: "11.5px",
              fontWeight: statusFilter === "verified" ? 700 : 500,
              background:
                statusFilter === "verified"
                  ? "rgba(16, 185, 129, 0.2)"
                  : "var(--input-bg, rgba(255, 255, 255, 0.05))",
              color:
                statusFilter === "verified"
                  ? "#10b981"
                  : "var(--text-secondary)",
              border:
                statusFilter === "verified"
                  ? "1px solid rgba(16, 185, 129, 0.4)"
                  : "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Terverifikasi ({counts.verified})
          </button>
        </div>

        {/* Korlap Filter Chips */}
        <div
          className="no-scrollbar"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            overflowX: "auto",
            paddingBottom: "2px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "11px",
              color: "var(--text-secondary)",
              marginRight: "4px",
            }}
          >
            <Filter size={12} />
            <span>Korlap:</span>
          </div>

          <button
            type="button"
            onClick={() => setSelectedSupervisor("all")}
            style={{
              padding: "4px 10px",
              borderRadius: "8px",
              fontSize: "11px",
              fontWeight: selectedSupervisor === "all" ? 700 : 500,
              background:
                selectedSupervisor === "all"
                  ? "var(--input-bg, rgba(255, 255, 255, 0.15))"
                  : "transparent",
              color:
                selectedSupervisor === "all"
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
              border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Semua
          </button>

          {SUPERVISORS.map((spv) => (
            <button
              key={spv}
              type="button"
              onClick={() => setSelectedSupervisor(spv)}
              style={{
                padding: "4px 10px",
                borderRadius: "8px",
                fontSize: "11px",
                fontWeight: selectedSupervisor === spv ? 700 : 500,
                background:
                  selectedSupervisor === spv
                    ? "var(--input-bg, rgba(255, 255, 255, 0.15))"
                    : "transparent",
                color:
                  selectedSupervisor === spv
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                border: "1px solid var(--card-border, rgba(255, 255, 255, 0.08))",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {spv.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Routes Grid */}
      {filteredRoutes.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 16px",
            color: "var(--text-secondary)",
            background: "var(--card-bg, rgba(23, 23, 23, 0.5))",
            borderRadius: "16px",
            border: "1px solid var(--card-border, rgba(255, 255, 255, 0.06))",
          }}
        >
          <p style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>
            Tidak ada rute yang cocok dengan filter yang dipilih.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "12px",
          }}
        >
          {filteredRoutes.map((route) => (
            <MonitoringRouteCardModern
              key={route.routeCode}
              route={route}
              onVerify={onVerifyRoute}
              onSelectRoute={onSelectRoute}
              isVerifying={verifyingRouteId === route.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MonitoringRoutesTab;
