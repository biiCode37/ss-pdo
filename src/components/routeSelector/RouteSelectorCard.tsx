import { useState, useEffect, useRef, useMemo, memo } from "react";
import { getFormattedDateBadge } from "@/utils/analytics";
import { TEXT_DASHBOARD } from "@/constants/texts";
import {
  MONTH_NAMES_ID,
  INDO_DAYS,
  INDO_MONTHS_SHORT,
  useRouteCascade,
  useAddRouteForm,
  UnifiedRouteControlBar,
  AddRouteModal,
  RouteSelectorSheet,
} from "./index";
import type { RouteSelectorCardProps } from "./types";

function RouteSelectorCardComponent({
  sheetUrl,
  setSheetUrl,
  selectedTab,
  setSelectedTab,
  days,
  isLoading,
  isDataLoaded,
  currentSheetId,
  currentTabName,
  onLoadData,
  accRange,
  onExitAccumulation,
  reportRoute,
  reportStatus,
  onOpenReportModal,
  onRouteCodeChange,
  externalOpenTrigger,
}: RouteSelectorCardProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(!isDataLoaded);
  const prevLoadingRef = useRef(isLoading);

  const isAccumulation = selectedTab === "AKUMULASI";

  const {
    flatSheets,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    selectedRouteCode,
    setSelectedRouteCode,
    formTab,
    setFormTab,
    availableYears,
    availableMonths,
    availableRouteCodes,
    monthEnabled,
    routeEnabled,
    dateEnabled,
    handleYearChange,
    handleMonthChange,
    handleRouteCodeChange,
    handleTabChange,
    getSheetForSelection,
    loadRoutes,
  } = useRouteCascade({
    isDataLoaded,
    currentSheetId,
    currentTabName,
    selectedTab,
    setSelectedTab,
    sheetUrl,
    setSheetUrl,
    days,
    onRouteCodeChange,
  });

  const {
    isAddingRoute,
    setIsAddingRoute,
    isSaving,
    formError,
    newRouteCodeSuffix,
    newRouteUrl,
    setNewRouteUrl,
    newMonth,
    setNewMonth,
    newYear,
    setNewYear,
    checkStatus,
    checkMessage,
    duplicateWarningMessage,
    isCheckingLink,
    handleRouteCodeSuffixInput,
    handleSaveRoute,
    resetForm,
  } = useAddRouteForm({
    flatSheets,
    days,
    isAccumulation,
    loadRoutes,
    setSheetUrl,
    setSelectedRouteCode,
    setSelectedMonth,
    setSelectedYear,
    setSelectedTab,
    onLoadData,
  });

  // Auto tutup sheet saat data berhasil selesai di-load (transisi dari loading -> selesai)
  useEffect(() => {
    if (prevLoadingRef.current && !isLoading && isDataLoaded) {
      setIsSheetOpen(false);
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading, isDataLoaded]);

  // Buka drawer sheet dan inisialisasi formTab dengan tanggal aktif saat tombol pill ditekan
  useEffect(() => {
    if (externalOpenTrigger && externalOpenTrigger > 0) {
      setFormTab(currentTabName || selectedTab || String(new Date().getDate()));
      setIsSheetOpen(true);
    }
  }, [externalOpenTrigger]);

  const displayDateLabel = useMemo(() => {
    const targetYear = selectedYear ?? new Date().getFullYear();
    const targetMonth = selectedMonth ?? new Date().getMonth() + 1;

    if (selectedTab === "AKUMULASI") {
      return `Akumulasi (${getFormattedDateBadge("AKUMULASI", targetMonth, targetYear, accRange)})`;
    }

    const rawDay = currentTabName || selectedTab;
    const parsedDay = parseInt(rawDay, 10);
    const validDay =
      !isNaN(parsedDay) && parsedDay >= 1 && parsedDay <= 31
        ? parsedDay
        : new Date().getDate();

    const dateObj = new Date(targetYear, targetMonth - 1, validDay);
    const dayName = INDO_DAYS[dateObj.getDay()];
    const padDay = String(validDay).padStart(2, "0");
    const monthName = INDO_MONTHS_SHORT[targetMonth - 1] || "Jan";

    return `${dayName}, ${padDay} ${monthName} ${targetYear}`;
  }, [selectedTab, currentTabName, selectedYear, selectedMonth, accRange]);

  const warningMessage =
    !getSheetForSelection(selectedRouteCode) &&
    selectedRouteCode &&
    selectedMonth &&
    selectedYear
      ? TEXT_DASHBOARD.ROUTE_SELECTOR.NO_ROUTE_SHEET_WARNING(
          selectedRouteCode,
          MONTH_NAMES_ID[selectedMonth],
          selectedYear,
        )
      : null;

  return (
    <>
      <UnifiedRouteControlBar
        displayDateLabel={displayDateLabel}
        isAccumulation={isAccumulation}
        days={days}
        sheetUrl={sheetUrl}
        setSelectedTab={setSelectedTab}
        onLoadData={onLoadData}
        onExitAccumulation={onExitAccumulation}
        reportRoute={reportRoute}
        reportStatus={reportStatus}
        onOpenReportModal={onOpenReportModal}
      />

      {/* Contextual Bottom Sheet Drawer */}
      <RouteSelectorSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        selectedYear={selectedYear}
        onYearChange={handleYearChange}
        availableYears={availableYears}
        selectedMonth={selectedMonth}
        onMonthChange={handleMonthChange}
        availableMonths={availableMonths}
        monthEnabled={monthEnabled}
        selectedRouteCode={selectedRouteCode}
        onRouteCodeChange={handleRouteCodeChange}
        availableRouteCodes={availableRouteCodes}
        routeEnabled={routeEnabled}
        selectedTab={formTab}
        onTabChange={handleTabChange}
        days={days}
        dateEnabled={dateEnabled}
        isAccumulation={formTab === "AKUMULASI" || isAccumulation}
        isLoading={isLoading}
        sheetUrl={sheetUrl}
        onLoadData={(tab, targetUrl) => {
          const finalTab = tab || formTab;
          setSelectedTab(finalTab);
          if (
            isAccumulation &&
            finalTab &&
            finalTab !== "AKUMULASI" &&
            onExitAccumulation
          ) {
            onExitAccumulation(finalTab);
          } else {
            onLoadData(finalTab, targetUrl);
          }
          setIsSheetOpen(false);
        }}
        onOpenAddRoute={() => setIsAddingRoute(true)}
        warningMessage={warningMessage}
        onExitAccumulation={onExitAccumulation}
      />

      {/* Modal Tambah Rute Baru */}
      <AddRouteModal
        isOpen={isAddingRoute}
        onClose={resetForm}
        newRouteCodeSuffix={newRouteCodeSuffix}
        onRouteCodeSuffixChange={handleRouteCodeSuffixInput}
        newMonth={newMonth}
        onMonthChange={setNewMonth}
        newYear={newYear}
        onYearChange={setNewYear}
        newRouteUrl={newRouteUrl}
        onRouteUrlChange={setNewRouteUrl}
        checkStatus={checkStatus}
        checkMessage={checkMessage}
        duplicateWarningMessage={duplicateWarningMessage}
        formError={formError}
        isSaving={isSaving}
        isCheckingLink={isCheckingLink}
        onSaveRoute={handleSaveRoute}
      />
    </>
  );
}

export const RouteSelectorCard = memo(RouteSelectorCardComponent);
export default RouteSelectorCard;
