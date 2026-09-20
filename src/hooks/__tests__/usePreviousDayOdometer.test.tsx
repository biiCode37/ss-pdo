// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  usePreviousDayOdometer,
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
  });
});
