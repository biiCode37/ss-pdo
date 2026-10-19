import React from "react";
import { AlertTriangle } from "lucide-react";
import { SwipeableContainer } from "@/components/SwipeableContainer";
import { BusList } from "@/components/BusList";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { UnitSummaryDashboard } from "@/components/UnitSummaryDashboard";
import { extractMonthYearLabel } from "@/utils/analytics";
import { TEXT_DASHBOARD } from "@/constants/texts";
import { usePageAccess } from "@/context/PageAccessContext";
import { getStoredUserRole } from "@/utils/roleStorage";
import { PageDisabledState, SuperadminMaintenanceBanner } from "@/components/pageManagement";
import type { BusData, HeaderMap } from "@/services/googleSheets";
import type { SyncItem } from "@/hooks/useOfflineSync";

interface DashboardContentTabsProps {
  mainTab: "input" | "analytics" | "units";
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
  missingColumns: string[];
  previousDayKmMap?: Record<string, string>;
  previousDayRefMap?: Record<string, import("@/hooks/usePreviousDayOdometer").OdometerRefInfo>;
}

export const DashboardContentTabs: React.FC<DashboardContentTabsProps> = ({
  mainTab,
  onSwipeNext,
  onSwipePrev,
  onOpenPageManagement,
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
  missingColumns,
  previousDayKmMap,
  previousDayRefMap,
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
          <PageDisabledState />
        ) : (
          <>
            {currentUserRole === "superadmin" && isUnderMaintenance("input") && (
              <SuperadminMaintenanceBanner onManageAccess={onOpenPageManagement} />
            )}
            {missingColumns.length > 0 && (
              <div
                className="card"
                style={{
                  marginBottom: "16px",
                  backgroundColor: "var(--warning-bg, rgba(245, 158, 11, 0.1))",
                  borderColor: "var(--warning-border, #f59e0b)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "var(--warning-text, #d97706)",
                    fontWeight: 600,
                  }}
                >
                  <AlertTriangle size={18} />
                  <span>{TEXT_DASHBOARD.MISSING_COLS_TITLE}</span>
                </div>
                <ul
                  style={{
                    margin: "8px 0 0 24px",
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                  }}
                >
                  {missingColumns.map((col, i) => (
                    <li key={i}>{col}</li>
                  ))}
                </ul>
              </div>
            )}

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
            />
          </>
        )}
      </div>

      {/* TAB 2: Dashboard Analitik */}
      <div style={{ display: mainTab === "analytics" ? "block" : "none" }}>
        {!canAccessPage("analytics", currentUserRole) ? (
          <PageDisabledState />
        ) : (
          <>
            {currentUserRole === "superadmin" && isUnderMaintenance("analytics") && (
              <SuperadminMaintenanceBanner onManageAccess={onOpenPageManagement} />
            )}
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
          </>
        )}
      </div>

      {/* TAB 3: Rekap Armada (Units) */}
      <div style={{ display: mainTab === "units" ? "block" : "none" }}>
        {!canAccessPage("units", currentUserRole) ? (
          <PageDisabledState />
        ) : (
          <>
            {currentUserRole === "superadmin" && isUnderMaintenance("units") && (
              <SuperadminMaintenanceBanner onManageAccess={onOpenPageManagement} />
            )}
            <UnitSummaryDashboard
              busData={busData}
              isLoading={isLoading}
              sheetId={currentSheetId}
              selectedTab={selectedTab}
              activeMonth={activeMonth}
              activeYear={activeYear}
              accRange={accRangeDetails}
            />
          </>
        )}
      </div>
    </SwipeableContainer>
  );
};
