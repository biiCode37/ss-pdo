import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import {
  fetchRegionalMonitoringData,
  getRelativeDate,
  type RegionalMonitoringResult,
} from "@/services/allRouteMonitoringService";
import { verifyDailyRouteReport } from "@/services/dailyRouteReportService";
import { WaReportModal } from "@/components/WaReportModal";
import { showSuccessToast, showErrorAlert } from "@/utils/alertUtils";
import { TEXT_ERRORS, TEXT_ALERTS } from "@/constants/texts";

import {
  SUPERVISOR_TABS,
  matchesSupervisorTab,
} from "./monitoringUtils";
import { MonitoringHeader } from "./MonitoringHeader";
import { MonitoringReadinessBanner } from "./MonitoringReadinessBanner";
import { MonitoringKpiCards } from "./MonitoringKpiCards";
import { MonitoringSupervisorTabs } from "./MonitoringSupervisorTabs";
import { MonitoringRouteCard } from "./MonitoringRouteCard";
import { MonitoringStates } from "./MonitoringStates";

// Re-export untuk kompatibilitas penuh (Zero Breaking Change)
export { SUPERVISOR_TABS, matchesSupervisorTab };

export interface AllRouteMonitoringPageProps {
  onBackToRouteView?: () => void;
  onSelectRoute?: (routeCode: string) => void;
  currentDate?: string;
  onDateChange?: (newDate: string) => void;
  currentUserEmail?: string;
}

export const AllRouteMonitoringPage = memo(function AllRouteMonitoringPage({
  onBackToRouteView,
  onSelectRoute,
  currentDate,
  onDateChange,
  currentUserEmail,
}: AllRouteMonitoringPageProps) {
  // Date state
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

  // Data state
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [data, setData] = useState<RegionalMonitoringResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter state
  const [selectedSupervisorTab, setSelectedSupervisorTab] =
    useState<string>("ALL");

  // Modal state
  const [isWaModalOpen, setIsWaModalOpen] = useState<boolean>(false);

  // Load regional data
  const loadData = useCallback(
    async (showRefreshIndicator = false) => {
      if (showRefreshIndicator) setRefreshing(true);
      else setLoading(true);
      setErrorMessage(null);

      try {
        const res = await fetchRegionalMonitoringData(selectedDate);
        setData(res);
      } catch (err: unknown) {
        console.warn("[AllRouteMonitoringPage] Gagal memuat data:", err);
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

  // Date step handlers
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

  // Verification handler
  const handleVerifyRoute = async (routeId: number, currentStatus: string) => {
    if (currentStatus === "verified") return;
    try {
      await verifyDailyRouteReport(routeId, selectedDate, currentUserEmail);
      showSuccessToast(TEXT_ALERTS.TOAST.SUCCESS_VERIFIED);
      // Refresh data locally
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
        return {
          ...prev,
          routes: updatedRoutes,
          verifiedCount,
        };
      });
    } catch (err: unknown) {
      console.warn("[AllRouteMonitoringPage] Gagal verifikasi laporan:", err);
      showErrorAlert("Gagal", TEXT_ERRORS.VERIFY_FAILED);
    }
  };

  // Filtered routes
  const filteredRoutes = useMemo(() => {
    if (!data) return [];
    if (selectedSupervisorTab === "ALL") return data.routes;
    return data.routes.filter((r) =>
      matchesSupervisorTab(r.supervisorName, selectedSupervisorTab),
    );
  }, [data, selectedSupervisorTab]);

  const overallArmadaPct = useMemo(() => {
    if (!data || data.totalRenops === 0) return 0;
    return (data.totalRealops / data.totalRenops) * 100;
  }, [data]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bg-color, #0c0c0c)",
        color: "var(--text-primary, #ededed)",
        paddingBottom: "96px",
        transition: "background-color 0.2s ease, color 0.2s ease",
      }}
    >
      {/* 1. Sticky Top Header */}
      <MonitoringHeader
        onBackToRouteView={onBackToRouteView}
        selectedDate={selectedDate}
        onStepDate={handleStepDate}
        onDateInputChange={handleDateInputChange}
        onRefresh={() => loadData(true)}
        refreshing={refreshing}
        loading={loading}
        onOpenWaModal={() => setIsWaModalOpen(true)}
        hasData={Boolean(data)}
      />

      {/* 2. Main Content Area */}
      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Loading & Error States */}
        <MonitoringStates
          loading={loading}
          errorMessage={errorMessage}
          onRetry={() => loadData(false)}
        />

        {/* Loaded Content */}
        {!loading && !errorMessage && data && (
          <>
            {/* 1. Readiness Progress Banner */}
            <MonitoringReadinessBanner
              submittedCount={data.submittedCount}
              totalRoutesCount={data.totalRoutesCount}
              verifiedCount={data.verifiedCount}
              draftCount={data.draftCount}
              emptyCount={data.emptyCount}
            />

            {/* 2. Regional KPI Cards Grid */}
            <MonitoringKpiCards
              data={data}
              overallArmadaPct={overallArmadaPct}
            />

            {/* 3. Korlap Filter Tabs */}
            <MonitoringSupervisorTabs
              selectedSupervisorTab={selectedSupervisorTab}
              onSelectSupervisorTab={setSelectedSupervisorTab}
              routes={data.routes}
            />

            {/* 4. Route Cards Grid */}
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "12px",
              }}
            >
              {filteredRoutes.map((route) => (
                <MonitoringRouteCard
                  key={route.id}
                  route={route}
                  onVerify={() => handleVerifyRoute(route.id, route.status)}
                  onSelectRoute={onSelectRoute}
                />
              ))}
            </section>
          </>
        )}
      </main>

      {/* 3. WhatsApp Report Modal */}
      {data && (
        <WaReportModal
          isOpen={isWaModalOpen}
          onClose={() => setIsWaModalOpen(false)}
          regionalData={data}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
});

export default AllRouteMonitoringPage;
