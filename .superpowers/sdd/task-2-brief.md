# Task 2: Generator Format Pesan WhatsApp (Format 1 & Format 2)

**Files:**
- Create: `src/utils/waReportGenerator.ts`
- Create: `src/utils/waReportGenerator.test.ts`

**Interfaces:**
- Consumes:
  - Data agregat harian per rute:
    ```typescript
    export interface RouteWaData {
      no: number;
      routeCode: string;
      routeName: string;
      operatorName: string;
      isLooping: boolean;
      todayPassengers: number;
      yesterdayPassengers: number;
      lastWeekPassengers: number;
      targetHk: number;
      bestRecord: number;
      achievementKm: number; // KM / Bus
      kmBaku: number;
      renops: number;
      realops: number;
      trafficJamSpots: string[];
      operationalIssues: string;
      headwayFastest: number;
      headwaySlowest: number;
      // Shift breakdown
      toaShift1: number;
      manualShift1: number;
      totalShift1: number;
      toaShift2: number;
      manualShift2: number;
      totalShift2: number;
    }

    export interface RegionTotals {
      // Shift 1
      tomShift1: number;
      manualShift1: number;
      totalShift1: number;
      yesterdayShift1: number;
      lastWeekShift1: number;
      // Shift 2
      tomShift2: number;
      manualShift2: number;
      totalShift2: number;
      yesterdayShift2: number;
      lastWeekShift2: number;
      // Overall
      totalToday: number;
      totalTarget: number;
      totalYesterday: number;
      totalLastWeek: number;
    }
    ```
- Produces:
  - `generateWaReportFormat1(dateStr: string, routes: RouteWaData[]): string`
  - `generateWaReportFormat2(dateStr: string, routes: RouteWaData[], totals: RegionTotals): string`
  - `openWhatsApp(text: string): void`
