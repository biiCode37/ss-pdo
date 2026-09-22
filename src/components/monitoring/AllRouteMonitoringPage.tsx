import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import {
  fetchRegionalMonitoringData,
  getRelativeDate,
  type RegionalMonitoringResult,
} from "@/services/allRouteMonitoringService";
import { fetchDailyFleetShiftsByDate } from "@/services/fleetStatusService";
import { verifyDailyRouteReport } from "@/services/dailyRouteReportService";
import { ingestRegionalRouteSummaries } from "@/services/regionalIngestionService";
import type { DailyFleetShiftWithUnits } from "@/types/supabase";
import { showSuccessToast, showErrorAlert } from "@/utils/alertUtils";
import { TEXT_ERRORS, TEXT_ALERTS, TEXT_MONITORING } from "@/constants/texts";

import { MonitoringHeader } from "./MonitoringHeader";
import { MonitoringStates } from "./MonitoringStates";
import { MonitoringBottomNav, type MonitoringTab } from "./MonitoringBottomNav";
import { MonitoringDashboardTab } from "./tabs/MonitoringDashboardTab";
import { MonitoringRoutesTab } from "./tabs/MonitoringRoutesTab";
import { MonitoringFleetStatusTab } from "./tabs/MonitoringFleetStatusTab";
import { MonitoringWaReportTab } from "./tabs/MonitoringWaReportTab";
import { SUPERVISOR_TABS, matchesSupervisorTab } from "./monitoringUtils";

// Re-export untuk kompatibilitas penuh (Zero Breaking Change)
export { SUPERVISOR_TABS, matchesSupervisorTab };

export interface AllRouteMonitoringPageProps {
  onBackToRouteView?: () => void;
  onOpenProfile?: () => void;
  onSelectRoute?: (routeCode: string) => void;
  currentDate?: string;
  onDateChange?: (newDate: string) => void;
  currentUserEmail?: string;
}

export const AllRouteMonitoringPage = memo(function AllRouteMonitoringPage({
  onBackToRouteView,
  onOpenProfile,
  onSelectRoute,
  currentDate,
  onDateChange,
  currentUserEmail,
}: AllRouteMonitoringPageProps) {
  // 1. Navigation Tab State
  const [activeTab, setActiveTab] = useState<MonitoringTab>("dashboard");

  // 2. Date State
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(
    currentDate || todayStr,
  );
  const prevCurrentDateRef = useRef(currentDate);

  useEffect(() => {
    if (currentDate && currentDate !== prevCurrentDateRef.current) {
      prevCurrentDateRef.current = currentDate;
      setSelectedDate(currentDate);
    }
  }, [currentDate]);

  // 3. Data State
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [data, setData] = useState<RegionalMonitoringResult | null>(null);
  const [fleetShifts, setFleetShifts] = useState<DailyFleetShiftWithUnits[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [syncing18Routes, setSyncing18Routes] = useState<boolean>(false);
  const [isBulking, setIsBulking] = useState<boolean>(false);
  const [verifyingRouteId, setVerifyingRouteId] = useState<number | null>(null);

  // 4. Load Data Function
  const loadData = useCallback(
    async (showRefreshIndicator = false) => {
      if (showRefreshIndicator) setRefreshing(true);
      else setLoading(true);
      setErrorMessage(null);

      try {
        const [regionalRes, fleetRes] = await Promise.all([
          fetchRegionalMonitoringData(selectedDate),
          fetchDailyFleetShiftsByDate(selectedDate).catch((err) => {
            console.warn("[AllRouteMonitoringPage] Gagal memuat fleet shifts:", err);
            return [] as DailyFleetShiftWithUnits[];
          }),
        ]);
        setData(regionalRes);
        setFleetShifts(fleetRes);
      } catch (err: unknown) {
        console.warn("[AllRouteMonitoringPage] Gagal memuat data monitoring:", err);
        setErrorMessage(TEXT_ERRORS.LOAD_REGIONAL_FAILED);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedDate],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 5. Date Step Handlers
  const handleStepDate = (days: number) => {
    try {
      const nextDateStr = getRelativeDate(selectedDate, days);
      setSelectedDate(nextDateStr);
      onDateChange?.(nextDateStr);
    } catch (err) {
      console.warn("[AllRouteMonitoringPage] Gagal navigasi tanggal:", err);
    }
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      setSelectedDate(val);
      onDateChange?.(val);
    }
  };

  // 6. Confirmed Routes Count
  const confirmedRoutesCount = useMemo(() => {
    if (fleetShifts && fleetShifts.length > 0) {
      const confirmedCodes = new Set(
        fleetShifts.filter((s) => s.is_confirmed).map((s) => s.route_code),
      );
      return confirmedCodes.size;
    }
    return (
      data?.routes.filter((r) => r.isFleetConfirmedS1 || r.isFleetConfirmedS2)
        .length || 0
    );
  }, [fleetShifts, data]);

  // 7. Verification Handler (Single Route)
  const handleVerifyRoute = async (routeId: number, currentStatus: string) => {
    if (currentStatus === "verified") return;
    try {
      setVerifyingRouteId(routeId);
      await verifyDailyRouteReport(routeId, selectedDate, currentUserEmail);
      showSuccessToast(TEXT_ALERTS.TOAST.SUCCESS_VERIFIED);
      setData((prev) => {
        if (!prev) return prev;
        const updatedRoutes = prev.routes.map((r) => {
          if (r.id === routeId) {
            return { ...r, status: "verified" as const };
          }
          return r;
        });
        const verifiedCount = updatedRoutes.filter(
          (r) => r.status === "verified",
        ).length;
        const submittedCount = updatedRoutes.filter(
          (r) => r.status === "submitted",
        ).length;
        return {
          ...prev,
          routes: updatedRoutes,
          verifiedCount,
          submittedCount,
        };
      });
    } catch (err: unknown) {
      console.warn("[AllRouteMonitoringPage] Gagal verifikasi laporan:", err);
      showErrorAlert("Gagal", TEXT_ERRORS.VERIFY_FAILED);
    } finally {
      setVerifyingRouteId(null);
    }
  };

  // 8. Bulk Verification Handler
  const handleBulkVerify = async () => {
    if (!data) return;
    const submitted = data.routes.filter((r) => r.status === "submitted");
    if (submitted.length === 0) return;

    try {
      setIsBulking(true);
      for (const route of submitted) {
        await verifyDailyRouteReport(route.id, selectedDate, currentUserEmail);
      }
      showSuccessToast(
        TEXT_MONITORING.BULK_VERIFY.SUCCESS_TOAST(submitted.length),
      );
      await loadData(true);
    } catch (err: unknown) {
      console.warn("[AllRouteMonitoringPage] Gagal bulk verify:", err);
      showErrorAlert("Gagal", TEXT_ERRORS.VERIFY_FAILED);
    } finally {
      setIsBulking(false);
    }
  };

  // 9. Direct Ingestion 18 Rute Handler
  const handleSync18Routes = async () => {
    try {
      setSyncing18Routes(true);
      const res = await ingestRegionalRouteSummaries(selectedDate);

      if (res.success) {
        showSuccessToast(
          TEXT_MONITORING.INGESTION.SUCCESS_TOAST(
            res.skippedFromApp,
            res.syncedFromSheet
          )
        );
        if (res.errors && res.errors.length > 0) {
          showSuccessToast(
            TEXT_MONITORING.INGESTION.PARTIAL_WARN(res.errors.length)
          );
        }
        await loadData(true);
      } else {
        showErrorAlert(
          TEXT_MONITORING.INGESTION.FAILED_TITLE,
          res.errors.join("\n") || "Gagal menyinkronkan data rute wilayah"
        );
      }
    } catch (err: unknown) {
      console.warn("[AllRouteMonitoringPage] Gagal tarik 18 rute:", err);
      showErrorAlert(
        TEXT_MONITORING.INGESTION.FAILED_TITLE,
        TEXT_ERRORS.LOAD_DATA_FAILED
      );
    } finally {
      setSyncing18Routes(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bg-color, #0c0c0c)",
        color: "var(--text-primary, #ededed)",
        transition: "background-color 0.2s ease, color 0.2s ease",
      }}
    >
      {/* Top Header */}
      <MonitoringHeader
        onBackToRouteView={onBackToRouteView}
        selectedDate={selectedDate}
        onStepDate={handleStepDate}
        onDateInputChange={handleDateInputChange}
        onRefresh={() => loadData(true)}
        refreshing={refreshing}
        loading={loading}
        onSync18Routes={handleSync18Routes}
        syncing18Routes={syncing18Routes}
      />

      {/* Main Content Area: States or Active Tab */}
      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <MonitoringStates
          loading={loading}
          errorMessage={errorMessage}
          onRetry={() => loadData(false)}
        />

        {!loading && !errorMessage && data && (
          <>
            {activeTab === "dashboard" && (
              <MonitoringDashboardTab
                data={data}
                confirmedRoutesCount={confirmedRoutesCount}
                totalRoutesCount={data.totalRoutesCount || 18}
                onSelectRoute={onSelectRoute}
              />
            )}

            {activeTab === "routes" && (
              <MonitoringRoutesTab
                routes={data.routes}
                onVerifyRoute={(routeId) =>
                  handleVerifyRoute(routeId, "submitted")
                }
                onBulkVerify={handleBulkVerify}
                onSelectRoute={onSelectRoute}
                verifyingRouteId={verifyingRouteId}
                isBulking={isBulking}
              />
            )}

            {activeTab === "fleet_status" && (
              <MonitoringFleetStatusTab
                selectedDate={selectedDate}
                fleetShifts={fleetShifts}
                routes={data.routes}
              />
            )}

            {activeTab === "wa_report" && (
              <MonitoringWaReportTab
                data={data}
                selectedDate={selectedDate}
                fleetShifts={fleetShifts}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <MonitoringBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenProfile={onOpenProfile}
      />
    </div>
  );
});

export default AllRouteMonitoringPage;
