// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { MonitoringFleetStatusTab } from "./MonitoringFleetStatusTab";
import type { DailyFleetShiftWithUnits } from "@/types/supabase";
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
        status_type: "TO",
        notes: "Perbaikan Radiator di Bengkel",
      },
      {
        id: 2,
        fleet_shift_id: 101,
        unit_body: "KWK 222178",
        status_type: "OFF",
        notes: "Jadwal Libur Pramudi",
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
        status_type: "SO",
        notes: "Kendala Transmisi",
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

  it("groups non-SGO units by route and hides 100% SGO routes", async () => {
    await act(async () => {
      root.render(
        <MonitoringFleetStatusTab
          selectedDate="2026-09-21"
          fleetShifts={mockFleetShifts}
        />
      );
    });

    // JAK.01 has non-SGO units -> should be visible
    expect(container.textContent).toContain("JAK.01");
    expect(container.textContent).toContain("KWK 222177");
    expect(container.textContent).toContain("Perbaikan Radiator di Bengkel");

    // JAK.03 has non-SGO units -> should be visible
    expect(container.textContent).toContain("JAK.03");
    expect(container.textContent).toContain("BMP 210123");

    // JAK.02 is 100% SGO -> should be hidden from problem routes list
    expect(container.textContent).not.toContain("JAK.02");
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
});
