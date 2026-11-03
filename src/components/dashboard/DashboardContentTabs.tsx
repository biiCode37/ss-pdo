import React from "react";
import { SwipeableContainer } from "@/components/SwipeableContainer";
import { BusList } from "@/components/BusList";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { UnitSummaryDashboard } from "@/components/UnitSummaryDashboard";
import { extractMonthYearLabel } from "@/utils/analytics";
import { usePageAccess } from "@/context/PageAccessContext";
import { getStoredUserRole } from "@/utils/roleStorage";
import {
  PageDisabledState,
  AccessRestrictedState,
} from "@/components/pageManagement";
import type { BusData, HeaderMap } from "@/services/googleSheets";
import type { SyncItem } from "@/hooks/useOfflineSync";
import { DailyPlottingPage } from "@/components/plotting";
import type { DailyRoutePlotting, Route } from "@/types/supabase";

interface DashboardContentTabsProps {
  mainTab: "input" | "analytics" | "units" | "plotting";
  onSwipeNext: () => void;
  onSwipePrev: () => void;
  onOpenPageManagement?: () => void;
  busData: BusData[];
  headerMap: HeaderMap;
  currentSheetId: string;
  currentTabName: string;
  queue: SyncItem[];
  addToQueue: (item: Omit<SyncItem, "id" | "status" | "retryCount">) => void;
  isLoading: boolean;
  onUpdateBus: (rowIndex: number, updates: Partial<BusData>) => void;
  accRangeDetails: {
    startDay: number;
    startMonth: number;
    startYear: number;
    endDay: number;
    endMonth: number;
    endYear: number;
  } | null;
  onExitAccumulation: () => void;
  isShiftConfirmed: boolean;
  activeShift: 1 | 2;
  sheetSummary: Record<string, number>;
  selectedTab: string;
  refreshKey: number;
  sheetUrl: string;
  activeMonth: number;
  activeYear: number;
  onSelectTab: (newTab: string) => Promise<void>;
  onSelectUnit: (unit: string) => void;
  missingColumns?: string[];
  previousDayKmMap?: Record<string, string>;
  previousDayRefMap?: Record<string, import("@/hooks/usePreviousDayOdometer").OdometerRefInfo>;
  matchedRoute?: Route | null;
  operationalReportDate?: string;
  plotting?: DailyRoutePlotting | null;
  onPlottingChange?: (plotting: DailyRoutePlotting) => void;
  routeControlBar?: React.ReactNode;
  inputHeaderTarget?: HTMLDivElement | null;
}

export const DashboardContentTabs: React.FC<DashboardContentTabsProps> = ({
  mainTab,
  onSwipeNext,
  onSwipePrev,
  onOpenPageManagement: _onOpenPageManagement,
  busData,
  headerMap,
  currentSheetId,
  currentTabName,
  queue,
  addToQueue,
  isLoading,
  onUpdateBus,
  accRangeDetails,
  onExitAccumulation,
  isShiftConfirmed,
  activeShift,
  sheetSummary,
  selectedTab,
  refreshKey,
  sheetUrl,
  activeMonth,
  activeYear,
  onSelectTab,
  onSelectUnit,
  missingColumns: _missingColumns,
  previousDayKmMap,
  previousDayRefMap,
  matchedRoute,
  operationalReportDate,
  plotting,
  onPlottingChange,
  routeControlBar,
  inputHeaderTarget,
}) => {
  const { canAccessPage, isUnderMaintenance } = usePageAccess();
  const currentUserRole = getStoredUserRole();

  return (
    <SwipeableContainer
      onSwipeLeft={onSwipeNext}
      onSwipeRight={onSwipePrev}
    >
      {/* TAB 1: Entri Data Bus */}
      <div style={{ display: mainTab === "input" ? "block" : "none" }}>
        {!canAccessPage("input", currentUserRole) ? (
          isUnderMaintenance("input") ? <PageDisabledState /> : <AccessRestrictedState />
        ) : (
            <BusList
              data={busData}
              sheetId={currentSheetId}
              tabName={currentTabName}
              headerMap={headerMap}
              syncQueue={queue}
              addToQueue={addToQueue}
              isLoading={isLoading}
              onUpdateBus={onUpdateBus}
              accRange={accRangeDetails}
              onExitAccumulation={onExitAccumulation}
              isShiftConfirmed={isShiftConfirmed}
              activeShift={activeShift}
              previousDayKmMap={previousDayKmMap}
              previousDayRefMap={previousDayRefMap}
              plotting={plotting}
              routeControlBar={routeControlBar}
              headerTarget={mainTab === "input" ? inputHeaderTarget : null}
            />
        )}
      </div>

      {/* TAB 2: Dashboard Analitik */}
      <div style={{ display: mainTab === "analytics" ? "block" : "none" }}>
        {!canAccessPage("analytics", currentUserRole) ? (
          isUnderMaintenance("analytics") ? <PageDisabledState /> : <AccessRestrictedState />
        ) : (
            <AnalyticsDashboard
              busData={busData}
              isLoading={isLoading}
              sheetSummary={sheetSummary}
              sheetId={currentSheetId}
              selectedTab={selectedTab}
              refreshKey={refreshKey}
              monthLabel={extractMonthYearLabel(sheetUrl)}
              activeMonth={activeMonth}
              activeYear={activeYear}
              accRange={accRangeDetails}
              onSelectTab={onSelectTab}
              onSelectUnit={onSelectUnit}
            />
        )}
      </div>

      {/* TAB 3: Rekap Armada (Units) */}
      <div style={{ display: mainTab === "units" ? "block" : "none" }}>
        {!canAccessPage("units", currentUserRole) ? (
          isUnderMaintenance("units") ? <PageDisabledState /> : <AccessRestrictedState />
        ) : (
            <UnitSummaryDashboard
              busData={busData}
              isLoading={isLoading}
              sheetId={currentSheetId}
              selectedTab={selectedTab}
              activeMonth={activeMonth}
              activeYear={activeYear}
              accRange={accRangeDetails}
            />
        )}
      </div>
      {/* TAB 4: Plotting Harian */}
      <div style={{ display: mainTab === "plotting" ? "block" : "none" }}>
        {!canAccessPage("plotting", currentUserRole) ? (
          isUnderMaintenance("plotting") ? <PageDisabledState /> : <AccessRestrictedState />
        ) : (
            <DailyPlottingPage
              routeId={matchedRoute?.id || 0}
              routeCode={matchedRoute?.route_code || ""}
              routeName={matchedRoute?.route_name || ""}
              date={operationalReportDate || selectedTab}
              buses={busData}
              headerMap={headerMap}
              onPlottingChange={onPlottingChange}
              sheetId={currentSheetId}
              tabName={selectedTab}
              addToQueue={addToQueue}
              onUpdateBus={onUpdateBus}
            />
        )}
      </div>
    </SwipeableContainer>
  );
};
