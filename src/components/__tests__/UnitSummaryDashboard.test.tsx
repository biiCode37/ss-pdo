// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { UnitSummaryDashboard } from "../UnitSummaryDashboard";
import type { BusData } from "@/services/googleSheets";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("UnitSummaryDashboard Component", () => {
  let container: HTMLDivElement;
  let root: Root;

  const mockBusData: BusData[] = [
    {
      rowIndex: 2,
      unit: "KWK 222158",
      toaShift1: "100",
      toaShift2: "110",
      manualShift1: "5",
      manualShift2: "5",
      totalToa: "210",
      kmAwal1: "100",
      kmAkhir1: "200",
      kmAwal2: "200",
      kmAkhir2: "300",
      tripPergi: "7",
      tripPulang: "7",
      keterangan: "",
      originalRow: [],
    },
  ];

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

  it("renders UnitCardSkeleton when isLoading is true even if busData is present", () => {
    act(() => {
      root.render(
        <UnitSummaryDashboard
          busData={mockBusData}
          isLoading={true}
          sheetId="sheet-123"
          selectedTab="18"
        />,
      );
    });

    const skeletonBoxes = container.querySelectorAll(".skeleton-box");
    expect(skeletonBoxes.length).toBeGreaterThan(0);
    // Kartu unit sebenarnya tidak boleh muncul saat loading
    expect(container.textContent).not.toContain("KWK 222158");
  });

  it("renders UnitCardSkeleton when busData is null", () => {
    act(() => {
      root.render(
        <UnitSummaryDashboard
          busData={null}
          isLoading={false}
          sheetId="sheet-123"
          selectedTab="18"
        />,
      );
    });

    const skeletonBoxes = container.querySelectorAll(".skeleton-box");
    expect(skeletonBoxes.length).toBeGreaterThan(0);
  });

  it("renders unit cards when isLoading is false and busData is available", () => {
    act(() => {
      root.render(
        <UnitSummaryDashboard
          busData={mockBusData}
          isLoading={false}
          sheetId="sheet-123"
          selectedTab="18"
        />,
      );
    });

    expect(container.textContent).toContain("KWK 222158");
  });
});
