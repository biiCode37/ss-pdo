import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { supabase } from "@/services/supabase";
import {
  fetchRegionalMonitoringData,
  fetchRegionalPeriodMonitoringData,
  getRelativeDate,
  type RegionalMonitoringResult,
  type MonitoringPeriodFilter,
} from "@/services/allRouteMonitoringService";
import { fetchDailyFleetShiftsByDate } from "@/services/fleetStatusService";
import { verifyDailyRouteReport } from "@/services/dailyRouteReportService";
import {
  ingestRegionalRouteSummaries,
  ingestRegionalRouteSummariesForRange,
  ingestSingleRouteSummary,
  ingestSingleRouteSummaryForRange,
  type IngestionProgress,
} from "@/services/regionalIngestionService";
import type { DailyFleetShiftWithUnits } from "@/types/supabase";
import { showSuccessToast, showErrorAlert, showConfirmDialog } from "@/utils/alertUtils";
import { TEXT_ERRORS, TEXT_ALERTS, TEXT_MONITORING } from "@/constants/texts";

import { MonitoringHeader } from "./MonitoringHeader";
import { IngestionProgressModal } from "./IngestionProgressModal";
import { MonthlySyncModal } from "./MonthlySyncModal";
import { MonitoringStates } from "./MonitoringStates";
import { MonitoringBottomNav, type MonitoringTab } from "./MonitoringBottomNav";
import { MonitoringDashboardTab } from "./tabs/MonitoringDashboardTab";
import { MonitoringRoutesTab } from "./tabs/MonitoringRoutesTab";
import { MonitoringKorwilTab } from "./tabs/MonitoringKorwilTab";
import { MonitoringFleetStatusTab } from "./tabs/MonitoringFleetStatusTab";
import { MonitoringWaReportTab } from "./tabs/MonitoringWaReportTab";
import { SUPERVISOR_TABS, matchesSupervisorTab } from "./monitoringUtils";
import { usePageAccess } from "@/context/PageAccessContext";
import { getStoredUserRole } from "@/utils/roleStorage";
import {
  PageDisabledState,
  SuperadminMaintenanceBanner,
  AccessRestrictedState,
} from "@/components/pageManagement";

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
  // 1. Navigation Tab State (Persisten via sessionStorage agar tidak ter-reset)
  const [activeTab, setActiveTabState] = useState<MonitoringTab>(() => {
    try {
      const saved = sessionStorage.getItem("SS_MONITORING_ACTIVE_TAB") as MonitoringTab;
      if (
        saved &&
        ["dashboard", "routes", "fleet_status", "wa_report", "korwil"].includes(saved)
      ) {
        return saved;
      }
    } catch {
      // Abaikan jika storage diblokir
    }
    return "dashboard";
  });

  const setActiveTab = useCallback((tab: MonitoringTab) => {
    setActiveTabState(tab);
    try {
      sessionStorage.setItem("SS_MONITORING_ACTIVE_TAB", tab);
    } catch {
      // Abaikan jika storage diblokir
    }
  }, []);

  const { canAccessPage, isUnderMaintenance } = usePageAccess();
  const currentUserRole = getStoredUserRole();

  // 2. Date & Period State
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(
    currentDate || todayStr,
  );
  const prevCurrentDateRef = useRef(currentDate);

  const [currentPeriod, setCurrentPeriod] = useState<MonitoringPeriodFilter>({
    mode: "daily",
    date: currentDate || todayStr,
    startDate: currentDate || todayStr,
    endDate: currentDate || todayStr,
    label: currentDate || todayStr,
  });

  useEffect(() => {
    if (currentDate && currentDate !== prevCurrentDateRef.current) {
      prevCurrentDateRef.current = currentDate;
      setSelectedDate(currentDate);
      if (currentPeriod.mode === "daily") {
        setCurrentPeriod((prev) => ({
          ...prev,
          date: currentDate,
          startDate: currentDate,
          endDate: currentDate,
          label: currentDate,
        }));
      }
    }
  }, [currentDate, currentPeriod.mode]);

  // 3. Data State
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [data, setData] = useState<RegionalMonitoringResult | null>(null);
  const [fleetShifts, setFleetShifts] = useState<DailyFleetShiftWithUnits[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [syncing18Routes, setSyncing18Routes] = useState<boolean>(false);
  const [ingestionProgress, setIngestionProgress] = useState<IngestionProgress | null>(null);
  const [showProgressModal, setShowProgressModal] = useState<boolean>(false);
  const [showMonthlySyncModal, setShowMonthlySyncModal] = useState<boolean>(false);
  const [isBulking, setIsBulking] = useState<boolean>(false);
  const [verifyingRouteId, setVerifyingRouteId] = useState<number | null>(null);
  const [syncingRouteId, setSyncingRouteId] = useState<number | null>(null);

  // 4. Load Data Function
  // Mendukung mode "initial" (skeleton awal), "refresh" (spinner header), dan "silent" (realtime in-place update)
  const loadData = useCallback(
    async (
      modeOrRefreshIndicator: boolean | "initial" | "refresh" | "silent" = "initial",
      periodOverride?: MonitoringPeriodFilter
    ) => {
      const activePeriod = periodOverride || currentPeriod;
      const isSilent = modeOrRefreshIndicator === "silent";
      const isRefresh =
        modeOrRefreshIndicator === true || modeOrRefreshIndicator === "refresh";
      const isInitial =
        modeOrRefreshIndicator === false || modeOrRefreshIndicator === "initial";

      if (isRefresh) {
        setRefreshing(true);
      } else if (isInitial && !data) {
        // Hanya tampilkan full skeleton loading jika data belum ada di memori
        setLoading(true);
      }

      if (!isSilent) {
        setErrorMessage(null);
      }

      try {
        const regionalPromise =
          activePeriod.mode === "daily"
            ? fetchRegionalMonitoringData(activePeriod.date)
            : fetchRegionalPeriodMonitoringData(activePeriod.startDate, activePeriod.endDate);

        const [regionalRes, fleetRes] = await Promise.all([
          regionalPromise,
          fetchDailyFleetShiftsByDate(selectedDate).catch((err) => {
            console.warn("[AllRouteMonitoringPage] Gagal memuat fleet shifts:", err);
            return [] as DailyFleetShiftWithUnits[];
          }),
        ]);
        setData(regionalRes);
        setFleetShifts(fleetRes);
      } catch (err: unknown) {
        console.warn("[AllRouteMonitoringPage] Gagal memuat data monitoring:", err);
        if (!data) {
          setErrorMessage(TEXT_ERRORS.LOAD_REGIONAL_FAILED);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedDate, currentPeriod, data],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadDataRef = useRef(loadData);
  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  // 4b. Realtime Subscription: Dengarkan perubahan tabel daily_route_reports secara hening (Silent In-place Update)
  useEffect(() => {
    const channel = supabase
      .channel("monitoring-realtime-reports")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "daily_route_reports",
        },
        () => {
          // Lakukan pembaruan latar belakang secara hening tanpa loading skeleton / unmounting
          loadDataRef.current?.("silent");
        }
      )
      .subscribe((status) => {
        // Tangani fluktuasi koneksi secara hening tanpa unhandled websocket error
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          // Koneksi websocket terputus sementara, biarkan fallback ke manual refresh
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handlePeriodChange = (newPeriod: MonitoringPeriodFilter) => {
    setCurrentPeriod(newPeriod);
    if (newPeriod.mode === "daily") {
      setSelectedDate(newPeriod.date);
      onDateChange?.(newPeriod.date);
    }
    loadData(false, newPeriod);
  };

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

  // 9. Direct Ingestion 18 Rute Handler (Mendukung Harian, Mingguan, & Rentang dengan Smart Incremental)
  const handleSync18Routes = async (force: boolean = false) => {
    try {
      setSyncing18Routes(true);
      setIngestionProgress(null);
      setShowProgressModal(true);

      const isRangeMode = currentPeriod.mode === "weekly" || currentPeriod.mode === "custom" || currentPeriod.mode === "monthly";
      const res = isRangeMode
        ? await ingestRegionalRouteSummariesForRange(
            currentPeriod.startDate,
            currentPeriod.endDate,
            (prog) => setIngestionProgress(prog),
            { force }
          )
        : await ingestRegionalRouteSummaries(selectedDate, (prog) => {
            setIngestionProgress(prog);
          }, { force });

      if (res.success) {
        setShowProgressModal(false);

        // Jika data sudah 100% lengkap di database (tanpa perlu request Google Sheets)
        if (res.allUpToDate && !force) {
          const rangeLabel = isRangeMode
            ? `${currentPeriod.startDate} s.d. ${currentPeriod.endDate}`
            : selectedDate;

          const wantForce = await showConfirmDialog({
            title: TEXT_MONITORING.INGESTION.CONFIRM_FORCE_TITLE,
            text: TEXT_MONITORING.INGESTION.CONFIRM_FORCE_TEXT(rangeLabel),
            confirmButtonText: TEXT_MONITORING.INGESTION.CONFIRM_FORCE_CONFIRM,
            cancelButtonText: TEXT_MONITORING.INGESTION.CONFIRM_FORCE_CANCEL,
            icon: "info",
          });

          if (wantForce) {
            return handleSync18Routes(true);
          } else {
            showSuccessToast(TEXT_MONITORING.INGESTION.ALL_UP_TO_DATE_TOAST);
            await loadData(true);
            return;
          }
        }

        // Tampilkan feedback toast yang akurat
        if (res.skippedExisting !== undefined && res.skippedExisting > 0) {
          showSuccessToast(
            TEXT_MONITORING.INGESTION.INCREMENTAL_SUCCESS_TOAST(
              res.syncedFromSheet,
              (res.skippedFromApp || 0) + res.skippedExisting
            )
          );
        } else if (isRangeMode) {
          const daysCount =
            Math.round(
              (new Date(currentPeriod.endDate).getTime() -
                new Date(currentPeriod.startDate).getTime()) /
                (1000 * 60 * 60 * 24)
            ) + 1;
          showSuccessToast(
            TEXT_MONITORING.INGESTION.RANGE_SUCCESS_TOAST(
              daysCount > 0 ? daysCount : 7,
              res.skippedFromApp,
              res.syncedFromSheet
            )
          );
        } else {
          showSuccessToast(
            TEXT_MONITORING.INGESTION.SUCCESS_TOAST(
              res.skippedFromApp,
              res.syncedFromSheet
            )
          );
        }

        if (res.errors && res.errors.length > 0) {
          showSuccessToast(
            TEXT_MONITORING.INGESTION.PARTIAL_WARN(res.errors.length)
          );
        }
        await loadData(true);
      } else {
        setShowProgressModal(false);
        showErrorAlert(
          TEXT_MONITORING.INGESTION.FAILED_TITLE,
          res.errors.join("\n") || "Gagal menyinkronkan data rute wilayah"
        );
      }
    } catch (err: unknown) {
      setShowProgressModal(false);
      console.warn("[AllRouteMonitoringPage] Gagal tarik 18 rute:", err);
      showErrorAlert(
        TEXT_MONITORING.INGESTION.FAILED_TITLE,
        TEXT_ERRORS.LOAD_DATA_FAILED
      );
    } finally {
      setSyncing18Routes(false);
    }
  };

  // 10. Monthly Master Ingestion Handler
  const [selYearStr, selMonthStr] = selectedDate.split("-");
  const selYear = parseInt(selYearStr, 10) || new Date().getFullYear();
  const selMonth = parseInt(selMonthStr, 10) || new Date().getMonth() + 1;
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const selMonthName = monthNames[selMonth - 1] || "Oktober";

  const handleMonthlySyncSuccess = async (saved: number, skipped: number) => {
    showSuccessToast(
      TEXT_MONITORING.MONTHLY_SYNC.SUCCESS_SUMMARY(saved, skipped)
    );
    await loadData(true);
  };

  // 11. Single Route Ingestion Handler (Mendukung Harian & Mingguan/Rentang)
  const handleSyncSingleRoute = async (route: any) => {
    setSyncingRouteId(route.id);
    try {
      const isRangeMode = currentPeriod.mode === "weekly" || currentPeriod.mode === "custom";
      if (isRangeMode) {
        const res = await ingestSingleRouteSummaryForRange(
          currentPeriod.startDate,
          currentPeriod.endDate,
          route.id
        );
        if (res.success) {
          showSuccessToast(
            TEXT_MONITORING.ROUTE_CARD.SYNC_ROUTE_RANGE_SUCCESS(
              route.routeCode,
              res.syncedDays
            )
          );
          await loadData(true);
        } else {
          showErrorAlert(
            TEXT_MONITORING.ROUTE_CARD.BTN_SYNC_ROUTE,
            res.errors.join("\n") || TEXT_MONITORING.ROUTE_CARD.SYNC_ROUTE_FAILED(route.routeCode)
          );
        }
      } else {
        const res = await ingestSingleRouteSummary(selectedDate, route.id);
        if (res.success) {
          showSuccessToast(
            TEXT_MONITORING.ROUTE_CARD.SYNC_ROUTE_SUCCESS(route.routeCode)
          );
          await loadData(true);
        } else {
          showErrorAlert(
            TEXT_MONITORING.ROUTE_CARD.BTN_SYNC_ROUTE,
            res.error || TEXT_MONITORING.ROUTE_CARD.SYNC_ROUTE_FAILED(route.routeCode)
          );
        }
      }
    } catch (err: unknown) {
      console.warn("[AllRouteMonitoringPage] Gagal sinkronisasi rute tunggal:", err);
      showErrorAlert(
        TEXT_MONITORING.ROUTE_CARD.BTN_SYNC_ROUTE,
        TEXT_MONITORING.ROUTE_CARD.SYNC_ROUTE_FAILED(route.routeCode)
      );
    } finally {
      setSyncingRouteId(null);
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
        currentPeriod={currentPeriod}
        onPeriodChange={handlePeriodChange}
        onOpenMonthlySyncModal={() => setShowMonthlySyncModal(true)}
        onOpenProfile={onOpenProfile}
      />

      {/* Main Content Area: States or Active Tab */}
      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          paddingBottom: "calc(76px + env(safe-area-inset-bottom, 12px))",
        }}
      >
        <MonitoringStates
          loading={loading && !data}
          errorMessage={errorMessage}
          onRetry={() => loadData("initial")}
        />

        {(!loading || data) && !errorMessage && data && (
          <>
            {activeTab === "dashboard" && (
              !canAccessPage("regional_summary", currentUserRole) ? (
                isUnderMaintenance("regional_summary") ? (
                  <PageDisabledState />
                ) : (
                  <AccessRestrictedState />
                )
              ) : (
                <>
                  {currentUserRole === "superadmin" &&
                    isUnderMaintenance("regional_summary") && (
                      <SuperadminMaintenanceBanner />
                    )}
                  <MonitoringDashboardTab
                    data={data}
                    confirmedRoutesCount={confirmedRoutesCount}
                    totalRoutesCount={data.totalRoutesCount || 18}
                    onSelectRoute={onSelectRoute}
                  />
                </>
              )
            )}

            {activeTab === "routes" && (
              <MonitoringRoutesTab
                routes={data.routes}
                fleetShifts={fleetShifts}
                onVerifyRoute={(routeId) =>
                  handleVerifyRoute(routeId, "submitted")
                }
                onBulkVerify={handleBulkVerify}
                onSelectRoute={onSelectRoute}
                onSyncRoute={handleSyncSingleRoute}
                verifyingRouteId={verifyingRouteId}
                syncingRouteId={syncingRouteId}
                isBulking={isBulking}
              />
            )}

            {activeTab === "korwil" && (
              <MonitoringKorwilTab
                data={data}
                onSelectRoute={onSelectRoute}
              />
            )}

            {activeTab === "fleet_status" && (
              <MonitoringFleetStatusTab
                selectedDate={selectedDate}
                fleetShifts={fleetShifts}
                routes={data.routes}
                onRefresh={() => loadData(true)}
              />
            )}

            {activeTab === "wa_report" && (
              !canAccessPage("regional_wa_report", currentUserRole) ? (
                isUnderMaintenance("regional_wa_report") ? (
                  <PageDisabledState />
                ) : (
                  <AccessRestrictedState />
                )
              ) : (
                <>
                  {currentUserRole === "superadmin" &&
                    isUnderMaintenance("regional_wa_report") && (
                      <SuperadminMaintenanceBanner />
                    )}
                  <MonitoringWaReportTab
                    data={data}
                    selectedDate={selectedDate}
                    fleetShifts={fleetShifts}
                    onRefresh={() => loadData(true)}
                  />
                </>
              )
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

      {/* Ingestion Progress Modal */}
      <IngestionProgressModal
        isOpen={showProgressModal}
        progress={ingestionProgress}
        onClose={() => setShowProgressModal(false)}
        title={
          currentPeriod.mode === "weekly"
            ? TEXT_MONITORING.INGESTION.MODAL_TITLE_WEEKLY
            : TEXT_MONITORING.INGESTION.MODAL_TITLE
        }
        subtitle={
          currentPeriod.mode === "weekly" || currentPeriod.mode === "custom"
            ? TEXT_MONITORING.INGESTION.MODAL_SUBTITLE_RANGE(
                `${currentPeriod.startDate} s.d. ${currentPeriod.endDate}`
              )
            : TEXT_MONITORING.INGESTION.MODAL_SUBTITLE
        }
      />

      {/* Monthly Sync Modal */}
      <MonthlySyncModal
        isOpen={showMonthlySyncModal}
        onClose={() => setShowMonthlySyncModal(false)}
        onSuccess={handleMonthlySyncSuccess}
        currentYear={selYear}
        currentMonth={selMonth}
        monthName={selMonthName}
      />
    </div>
  );
});

export default AllRouteMonitoringPage;
