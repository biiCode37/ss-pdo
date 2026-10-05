// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  usePreviousDayOdometer,
  clearMemoryKmCache,
  type UsePreviousDayOdometerProps,
  type UsePreviousDayOdometerReturn,
} from "../usePreviousDayOdometer";
import * as core from "@/services/googleSheets/core";
import * as cacheUtils from "@/utils/cacheUtils";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/services/googleSheets/core", () => ({
  getBusData: vi.fn(),
}));

let latestHookResult: UsePreviousDayOdometerReturn | null = null;

function OdometerTestComponent(props: UsePreviousDayOdometerProps) {
  const result = usePreviousDayOdometer(props);
  latestHookResult = result;
  return <div id="odometer-test-node">{Object.keys(result.previousDayKmMap).length}</div>;
}

describe("usePreviousDayOdometer", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    clearMemoryKmCache();
    localStorage.clear();
    latestHookResult = null;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("returns empty map when tabName is AKUMULASI or invalid", () => {
    act(() => {
      root.render(
        <OdometerTestComponent
          sheetId="sheet-1"
          currentTabName="AKUMULASI"
          activeMonth={9}
          activeYear={2026}
        />,
      );
    });

    expect(latestHookResult?.previousDayKmMap).toEqual({});
    expect(core.getBusData).not.toHaveBeenCalled();
  });

  it("fetches previous day tab (day - 1) in the same spreadsheet when currentDay > 1", async () => {
    const mockData = {
      data: [
        {
          rowIndex: 2,
          unit: "MYS-17001",
          kmAkhir1: "125300",
          kmAkhir2: "125450",
        },
        {
          rowIndex: 3,
          unit: "MYS-17002",
          kmAkhir1: "140200",
          kmAkhir2: "", // Shift 2 tidak beroperasi
        },
      ],
      headerMap: {} as any,
      missingColumns: [],
      sheetSummary: {},
    };

    vi.mocked(core.getBusData).mockResolvedValueOnce(mockData as any);

    await act(async () => {
      root.render(
        <OdometerTestComponent
          sheetId="sheet-1"
          currentTabName="15"
          activeMonth={9}
          activeYear={2026}
        />,
      );
    });

    expect(core.getBusData).toHaveBeenCalledWith("sheet-1", "14");
    expect(latestHookResult?.previousDayKmMap["MYS-17001"]).toBe("125450");
    // Fallback ke kmAkhir1 jika kmAkhir2 kosong
    expect(latestHookResult?.previousDayKmMap["MYS-17002"]).toBe("140200");
  });

  it("fetches previous month's sheet when currentDay === 1", async () => {
    const mockRoutes = [
      {
        id: 1,
        uuid: "r-1",
        route_code: "JAK.01",
        route_name: "Rute 1",
        is_active: true,
        created_at: "",
        updated_at: "",
        route_sheets: [
          {
            id: 10,
            uuid: "s-10",
            route_id: 1,
            year: 2026,
            month: 8,
            spreadsheet_id: "sheet-august",
            sheet_url: "",
            tab_name: "",
            created_at: "",
            updated_at: "",
          },
          {
            id: 11,
            uuid: "s-11",
            route_id: 1,
            year: 2026,
            month: 9,
            spreadsheet_id: "sheet-september",
            sheet_url: "",
            tab_name: "",
            created_at: "",
            updated_at: "",
          },
        ],
      },
    ];

    vi.spyOn(cacheUtils, "getRoutesFromCache").mockReturnValue(mockRoutes as any);

    const mockAugustData = {
      data: [
        {
          rowIndex: 2,
          unit: "MYS-17001",
          kmAkhir2: "124990",
        },
      ],
      headerMap: {} as any,
      missingColumns: [],
      sheetSummary: {},
    };

    vi.mocked(core.getBusData).mockResolvedValueOnce(mockAugustData as any);

    await act(async () => {
      root.render(
        <OdometerTestComponent
          sheetId="sheet-september"
          currentTabName="1"
          activeMonth={9}
          activeYear={2026}
          routeCode="JAK.01"
        />,
      );
    });

    // Bulan 8 (Agustus) memiliki 31 hari
    expect(core.getBusData).toHaveBeenCalledWith("sheet-august", "31");
    expect(latestHookResult?.previousDayKmMap["MYS-17001"]).toBe("124990");
    expect(latestHookResult?.previousDayRefMap["MYS-17001"]?.dateLabel).toBe("Tgl 31/8");
  });

  it("performs smart lookback to H-2 when an active unit was OFF in H-1", async () => {
    // Day 14 (H-1): Unit MYS-17001 ada KM, tapi MYS-17002 OFF / kosong
    const mockDay14 = {
      data: [
        { rowIndex: 2, unit: "MYS-17001", kmAkhir2: "125450" },
        { rowIndex: 3, unit: "MYS-17002", kmAkhir1: "", kmAkhir2: "" }, // OFF kemarin
      ],
    };

    // Day 13 (H-2): Unit MYS-17002 terakhir kali dinas di sini
    const mockDay13 = {
      data: [
        { rowIndex: 2, unit: "MYS-17001", kmAkhir2: "125300" },
        { rowIndex: 3, unit: "MYS-17002", kmAkhir2: "140100" },
      ],
    };

    vi.mocked(core.getBusData)
      .mockResolvedValueOnce(mockDay14 as any)
      .mockResolvedValueOnce(mockDay13 as any);

    await act(async () => {
      root.render(
        <OdometerTestComponent
          sheetId="sheet-1"
          currentTabName="15"
          activeMonth={9}
          activeYear={2026}
          activeUnits={["MYS-17001", "MYS-17002"]}
        />,
      );
    });

    // Harus fetch Day 14 (H-1) lalu Day 13 (H-2)
    expect(core.getBusData).toHaveBeenCalledWith("sheet-1", "14");
    expect(core.getBusData).toHaveBeenCalledWith("sheet-1", "13");

    // MYS-17001 dari Kemarin (Day 14)
    expect(latestHookResult?.previousDayKmMap["MYS-17001"]).toBe("125450");
    expect(latestHookResult?.previousDayRefMap["MYS-17001"]?.dateLabel).toBe("Kemarin");

    // MYS-17002 dari Tgl 13 (Day 13)
    expect(latestHookResult?.previousDayKmMap["MYS-17002"]).toBe("140100");
    expect(latestHookResult?.previousDayRefMap["MYS-17002"]?.dateLabel).toBe("Tgl 13");
  });

  it("falls back to local storage registry if unit is not found in sheets lookback", async () => {
    localStorage.setItem(
      "pdo_last_known_odometers",
      JSON.stringify({
        "MYS-17003": { km: "119800", dateLabel: "Tgl 10", timestamp: Date.now() },
      }),
    );

    const mockDay14 = {
      data: [
        { rowIndex: 2, unit: "MYS-17001", kmAkhir2: "125450" },
      ],
    };

    vi.mocked(core.getBusData).mockResolvedValue(mockDay14 as any);

    await act(async () => {
      root.render(
        <OdometerTestComponent
          sheetId="sheet-1"
          currentTabName="15"
          activeMonth={9}
          activeYear={2026}
          activeUnits={["MYS-17001", "MYS-17003"]}
          maxLookbackDays={2}
        />,
      );
    });

    expect(latestHookResult?.previousDayKmMap["MYS-17003"]).toBe("119800");
    expect(latestHookResult?.previousDayRefMap["MYS-17003"]?.dateLabel).toBe("Tgl 10");
  });
});
