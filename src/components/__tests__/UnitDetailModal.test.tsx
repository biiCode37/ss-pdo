// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { UnitDetailModal } from "../UnitDetailModal";
import type { BusData } from "@/services/googleSheets";
import { TEXT_UNIT_DETAIL } from "@/constants/texts";

// Mock DailyToaTrendCard to isolate unit detail modal logic
vi.mock("../DailyToaTrendCard", () => ({
  DailyToaTrendCard: () => <div data-testid="mock-daily-toa-trend">Trend Chart</div>,
}));

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("UnitDetailModal Component", () => {
  let container: HTMLDivElement;
  let root: Root;

  const sampleBusData: BusData[] = [
    {
      rowIndex: 2,
      unit: "TS.01",
      kmAwal1: "1000",
      kmAkhir1: "1050",
      toaShift1: "120",
      toaShift2: "140",
      manualShift1: "10",
      kmAwal2: "1050",
      kmAkhir2: "1110",
      totalToa: "260",
      manualShift2: "5",
      tripPergi: "2",
      tripPulang: "2",
      keterangan: "BA.02 - AC Kurang Dingin",
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

  it("renders modal header with unit number and localized title", () => {
    const onClose = vi.fn();
    act(() => {
      root.render(
        <UnitDetailModal
          unit="TS.01"
          busData={sampleBusData}
          sheetId="sheet-123"
          selectedTab="18"
          onClose={onClose}
        />,
      );
    });

    const titleEl = document.getElementById("unit-detail-modal-title");
    expect(titleEl).not.toBeNull();
    expect(titleEl?.textContent).toBe("TS.01");
    expect(document.body.textContent).toContain(TEXT_UNIT_DETAIL.TITLE);
  });

  it("renders Shift 1 and Shift 2 metrics correctly", () => {
    const onClose = vi.fn();
    act(() => {
      root.render(
        <UnitDetailModal
          unit="TS.01"
          busData={sampleBusData}
          sheetId="sheet-123"
          selectedTab="18"
          onClose={onClose}
        />,
      );
    });

    expect(document.body.textContent).toContain(TEXT_UNIT_DETAIL.SHIFT_1_TITLE);
    expect(document.body.textContent).toContain(TEXT_UNIT_DETAIL.SHIFT_2_TITLE);
    expect(document.body.textContent).toContain("50");
    expect(document.body.textContent).toContain("60");
  });

  it("renders 3-column glanceable strip for total accumulation", () => {
    const onClose = vi.fn();
    act(() => {
      root.render(
        <UnitDetailModal
          unit="TS.01"
          busData={sampleBusData}
          targetTrip={{ pergi: 2, pulang: 2 }}
          sheetId="sheet-123"
          selectedTab="18"
          onClose={onClose}
        />,
      );
    });

    expect(document.body.textContent).toContain(TEXT_UNIT_DETAIL.STRIP_RITASE);
    expect(document.body.textContent).toContain(TEXT_UNIT_DETAIL.STRIP_TOTAL_KM);
    expect(document.body.textContent).toContain(TEXT_UNIT_DETAIL.STRIP_PASSENGERS);
    expect(document.body.textContent).toContain("2/2");
    expect(document.body.textContent).toContain(TEXT_UNIT_DETAIL.TARGET_ACHIEVED);
  });

  it("renders notes and operational remarks", () => {
    const onClose = vi.fn();
    act(() => {
      root.render(
        <UnitDetailModal
          unit="TS.01"
          busData={sampleBusData}
          sheetId="sheet-123"
          selectedTab="18"
          onClose={onClose}
        />,
      );
    });

    expect(document.body.textContent).toContain(TEXT_UNIT_DETAIL.NOTES_SECTION_TITLE);
    expect(document.body.textContent).toContain("BA.02 - AC Kurang Dingin");
  });

  it("triggers onClose callback when dismiss button is clicked", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    act(() => {
      root.render(
        <UnitDetailModal
          unit="TS.01"
          busData={sampleBusData}
          sheetId="sheet-123"
          selectedTab="18"
          onClose={onClose}
        />,
      );
    });

    const closeBtn = document.querySelector(
      `button[aria-label="${TEXT_UNIT_DETAIL.MODAL_CLOSE_ARIA}"]`,
    );
    expect(closeBtn).not.toBeNull();

    act(() => {
      closeBtn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      vi.advanceTimersByTime(250);
    });

    expect(onClose).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
