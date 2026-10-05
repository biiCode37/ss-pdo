# Task 4: Service Agregasi & Komparasi Riwayat Wilayah (H, H-1, H-7)

**Files:**
- Create: `src/services/allRouteMonitoringService.ts`
- Create: `src/services/allRouteMonitoringService.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface RegionalRouteItem {
    id: number;
    routeCode: string;
    routeName: string;
    operatorName: string;
    isLooping: boolean;
    kmBaku: number;
    targetHk: number;
    bestRecord: number;
    supervisorName: string;
    defaultRenops: number;
    // Daily input stats
    renopsShift1: number;
    realopsShift1: number;
    renopsShift2: number;
    realopsShift2: number;
    totalRenops: number;
    totalRealops: number;
    headwayFastest: number;
    headwaySlowest: number;
    trafficJamSpots: string[];
    operationalIssues: string;
    status: 'draft' | 'submitted' | 'verified' | 'empty';
    // Bus summaries stats
    todayPassengers: number;
    yesterdayPassengers: number;
    lastWeekPassengers: number;
    totalKm: number;
    achievementKm: number; // KM/Bus
    toaShift1: number;
    manualShift1: number;
    totalShift1: number;
    toaShift2: number;
    manualShift2: number;
    totalShift2: number;
  }

  export interface RegionalMonitoringResult {
    date: string;
    yesterdayDate: string;
    lastWeekDate: string;
    routes: RegionalRouteItem[];
    // Totals
    totalRenops: number;
    totalRealops: number;
    totalTodayPassengers: number;
    totalTargetPassengers: number;
    totalYesterdayPassengers: number;
    totalLastWeekPassengers: number;
    totalKm: number;
    averageKmPerBus: number;
    // Shift Totals
    tomShift1: number;
    manualShift1: number;
    totalShift1: number;
    yesterdayShift1: number;
    lastWeekShift1: number;
    tomShift2: number;
    manualShift2: number;
    totalShift2: number;
    yesterdayShift2: number;
    lastWeekShift2: number;
    // Status counts
    submittedCount: number;
    verifiedCount: number;
    draftCount: number;
    emptyCount: number;
    totalRoutesCount: number;
  }
  ```
- Function:
  `fetchRegionalMonitoringData(dateStr: string): Promise<RegionalMonitoringResult>`
