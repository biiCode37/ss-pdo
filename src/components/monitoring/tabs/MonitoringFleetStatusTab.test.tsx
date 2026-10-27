// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import {
  MonitoringFleetStatusTab,
  inferStatusCode,
} from "@/components/monitoring/tabs/MonitoringFleetStatusTab";
import type { DailyFleetShiftWithUnits } from "@/types/supabase";
import type { RegionalRouteItem } from "@/services/allRouteMonitoringService";
import { TEXT_MONITORING } from "@/constants/texts";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockFleetShifts: DailyFleetShiftWithUnits[] = [
  {
    id: 101,
    route_id: 1,
    route_code: "JAK.01",
    date: "2026-09-21",
    shift: 1,
    target_renops: 10,
    realops: 8,
    total_units: 10,
    sgo_count: 8,
    to_count: 1,
    off_count: 1,
    so_count: 0,
    other_count: 0,
    is_confirmed: true,
    non_sgo_units: [
      {
        id: 1,
        fleet_shift_id: 101,
        unit_body: "KWK 222177",
        status_id: 2,
        status_code: "TO",
        note: "Perbaikan Radiator di Bengkel",
      },
      {
        id: 2,
        fleet_shift_id: 101,
        unit_body: "KWK 222178",
        status_id: 3,
        status_code: "OFF",
        note: "Jadwal Libur Pramudi",
      },
    ],
  },
  {
    id: 102,
    route_id: 2,
    route_code: "JAK.02",
    date: "2026-09-21",
    shift: 1,
    target_renops: 12,
    realops: 12,
    total_units: 12,
    sgo_count: 12,
    to_count: 0,
    off_count: 0,
    so_count: 0,
    other_count: 0,
    is_confirmed: true,
    non_sgo_units: [],
  },
  {
    id: 103,
    route_id: 3,
    route_code: "JAK.03",
    date: "2026-09-21",
    shift: 2,
    target_renops: 8,
    realops: 7,
    total_units: 8,
    sgo_count: 7,
    to_count: 0,
    off_count: 0,
    so_count: 1,
    other_count: 0,
    is_confirmed: true,
    non_sgo_units: [
      {
        id: 3,
        fleet_shift_id: 103,
        unit_body: "BMP 210123",
        status_id: 4,
        status_code: "SO",
        note: "Kendala Transmisi",
      },
    ],
  },
];

describe("MonitoringFleetStatusTab Component", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.clearAllMocks();
  });

  it("renders top stats bar with SGO and non-SGO totals", async () => {
    await act(async () => {
      root.render(
        <MonitoringFleetStatusTab
          selectedDate="2026-09-21"
          fleetShifts={mockFleetShifts}
        />
      );
    });

    expect(container.textContent).toContain(TEXT_MONITORING.FLEET_TAB.TITLE);
    expect(container.textContent).toContain(TEXT_MONITORING.FLEET_TAB.TOTAL_FLEET);
    expect(container.textContent).toContain(TEXT_MONITORING.FLEET_TAB.SGO_LABEL);
    expect(container.textContent).toContain(TEXT_MONITORING.FLEET_TAB.NON_SGO_LABEL);
  });

  it("groups non-SGO units by route and displays normal routes in separate section", async () => {
    await act(async () => {
      root.render(
        <MonitoringFleetStatusTab
          selectedDate="2026-09-21"
          fleetShifts={mockFleetShifts}
        />
      );
    });

    // JAK.01 has non-SGO units -> should be visible in troubled routes
    expect(container.textContent).toContain("JAK.01");
    expect(container.textContent).toContain("KWK 222177");
    expect(container.textContent).toContain("Perbaikan Radiator di Bengkel");

    // JAK.03 has non-SGO units -> should be visible in troubled routes
    expect(container.textContent).toContain("JAK.03");
    expect(container.textContent).toContain("BMP 210123");

    // JAK.02 is 100% normal -> should be visible under normal routes section
    expect(container.textContent).toContain(TEXT_MONITORING.FLEET_TAB.NORMAL_ROUTES_TITLE);
    expect(container.textContent).toContain("JAK.02");
  });

  it("filters non-SGO units by shift", async () => {
    await act(async () => {
      root.render(
        <MonitoringFleetStatusTab
          selectedDate="2026-09-21"
          fleetShifts={mockFleetShifts}
        />
      );
    });

    const shift2Btn = Array.from(container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Shift 2")
    );
    expect(shift2Btn).toBeDefined();

    await act(async () => {
      shift2Btn?.click();
    });

    // In Shift 2, only JAK.03 has issue (BMP 210123)
    expect(container.textContent).toContain("JAK.03");
    expect(container.textContent).toContain("BMP 210123");
    expect(container.textContent).not.toContain("KWK 222177");
  });

  it("renders empty state when all routes are 100% SGO", async () => {
    const allSgoShifts: DailyFleetShiftWithUnits[] = [
      {
        id: 201,
        route_id: 1,
        route_code: "JAK.01",
        date: "2026-09-21",
        shift: 1,
        target_renops: 10,
        realops: 10,
        total_units: 10,
        sgo_count: 10,
        to_count: 0,
        off_count: 0,
        so_count: 0,
        other_count: 0,
        is_confirmed: true,
        non_sgo_units: [],
      },
    ];

    await act(async () => {
      root.render(
        <MonitoringFleetStatusTab
          selectedDate="2026-09-21"
          fleetShifts={allSgoShifts}
        />
      );
    });

    expect(container.textContent).toContain(TEXT_MONITORING.FLEET_TAB.EMPTY_TITLE);
    expect(container.textContent).toContain(TEXT_MONITORING.FLEET_TAB.EMPTY_DESC);
  });

  it("resolves routes from routes prop when DB fleetShifts is empty (dual-source resolution)", async () => {
    const mockRegionalRoutes: Partial<RegionalRouteItem>[] = [
      {
        id: 87,
        routeCode: "JAK.87",
        routeName: "Rawamangun - Manggarai",
        operatorName: "PT. LSG",
        renopsShift1: 15,
        realopsShift1: 13,
        defaultRenops: 15,
        fleetStatusShift1: [
          {
            unit: "LSG 230043",
            note: "BA.02 PROGRAM KEUR",
            isOff: false,
          },
          {
            unit: "LSG 230045",
            note: "BA.02 PROGRAM KEUR",
            isOff: false,
          },
        ],
      },
      {
        id: 15,
        routeCode: "JAK.15",
        routeName: "Tanjung Priok - Bulak Turi",
        operatorName: "PT. Kencana",
        renopsShift1: 10,
        realopsShift1: 10,
        defaultRenops: 10,
        fleetStatusShift1: [],
      },
    ];

    await act(async () => {
      root.render(
        <MonitoringFleetStatusTab
          selectedDate="2026-10-27"
          fleetShifts={[]}
          routes={mockRegionalRoutes as RegionalRouteItem[]}
        />
      );
    });

    // JAK.87 should show up with its troubled units from spreadsheet fallback
    expect(container.textContent).toContain("JAK.87");
    expect(container.textContent).toContain("LSG 230043");
    expect(container.textContent).toContain("LSG 230045");
    expect(container.textContent).toContain("BA.02");

    // JAK.15 should show up in normal routes
    expect(container.textContent).toContain("JAK.15");
    expect(container.textContent).toContain(TEXT_MONITORING.FLEET_TAB.NORMAL_ROUTES_TITLE);
  });

  it("correctly infers status code and styling with inferStatusCode helper", () => {
    expect(inferStatusCode("Jadwal Libur", true).code).toBe("OFF");
    expect(inferStatusCode("OFF").code).toBe("OFF");
    expect(inferStatusCode("TO EVDAL").code).toBe("TO EVDAL");
    expect(inferStatusCode("T.O Radiator").code).toBe("T.O");
    expect(inferStatusCode("BA.02 PROGRAM KEUR").code).toBe("BA.02");
    expect(inferStatusCode("PROGRAM KEUR").code).toBe("KEUR");
    expect(inferStatusCode("PERBAIKAN UNIT").code).toBe("TEKNIS");
    expect(inferStatusCode("OKB").code).toBe("OKB");
    expect(inferStatusCode("RENOP").code).toBe("RENOP");
  });
});
