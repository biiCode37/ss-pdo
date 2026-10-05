import type { RouteSheet } from "@/types/supabase";

export interface RouteSelectorCardProps {
  sheetUrl: string;
  setSheetUrl: (url: string) => void;
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  days: string[];
  isLoading: boolean;
  isDataLoaded: boolean;
  currentSheetId?: string;
  currentTabName?: string;
  onLoadData: (tab?: string, targetSheetUrl?: string) => void;
  accRange?: {
    startDay?: number;
    startMonth?: number;
    startYear?: number;
    endDay?: number;
    endMonth?: number;
    endYear?: number;
  } | null;
  onExitAccumulation?: (targetDay?: string) => void;
  reportRoute?: { id: number; route_code: string } | null;
  reportStatus?: "draft" | "submitted" | "verified";
  onOpenReportModal?: () => void;
  onRouteCodeChange?: (routeCode: string) => void;
  externalOpenTrigger?: number;
}

export interface FlatRouteSheet {
  routeId: number;
  routeCode: string;
  routeName: string;
  sheet: RouteSheet;
}
