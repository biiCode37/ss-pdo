// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { DailyToaTrendCard } from "./DailyToaTrendCard";
import * as googleSheetsService from "@/services/googleSheets";
import { TEXT_DASHBOARD } from "@/constants/texts";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("DailyToaTrendCard", () => {
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

  it("renders error state when fetching monthly trend data fails", async () => {
    vi.spyOn(googleSheetsService, "getMonthlyToaTrend").mockRejectedValue(
      new Error("Network Error"),
    );

    await act(async () => {
      root.render(
        <DailyToaTrendCard
          sheetId="sheet-123"
          selectedTab="10"
          monthLabel="Maret 2026"
        />,
      );
    });

    expect(container.textContent).toContain(
      TEXT_DASHBOARD.TOA_TREND.ERROR_MESSAGE,
    );
    expect(container.textContent).toContain("Maret 2026");
  });

  it("renders trend metrics, executive stats, and bars when data is loaded", async () => {
    const mockTrendData = [
      { day: "1", totalToa: 100 },
      { day: "2", totalToa: 150 },
      { day: "3", totalToa: 80 },
    ];

    vi.spyOn(googleSheetsService, "getMonthlyToaTrend").mockResolvedValue(
      mockTrendData,
    );

    const onSelectTab = vi.fn();

    await act(async () => {
      root.render(
        <DailyToaTrendCard
          sheetId="sheet-123"
          selectedTab="2"
          monthLabel="September 2026"
          unitFilter="TJ-001"
          onSelectTab={onSelectTab}
        />,
      );
    });

    // Verify Title & Subtitle
    expect(container.textContent).toContain(TEXT_DASHBOARD.TOA_TREND.TITLE);
    expect(container.textContent).toContain("September 2026");
    expect(container.textContent).toContain("TJ-001");

    // Verify Executive Stats
    expect(container.textContent).toContain(TEXT_DASHBOARD.TOA_TREND.PEAK_LABEL);
    expect(container.textContent).toContain("150"); // Peak
    expect(container.textContent).toContain(
      TEXT_DASHBOARD.TOA_TREND.LOWEST_LABEL,
    );
    expect(container.textContent).toContain("80"); // Lowest
    expect(container.textContent).toContain(TEXT_DASHBOARD.TOA_TREND.AVG_LABEL);
    expect(container.textContent).toContain("110"); // Avg: (100+150+80)/3 = 110

    // Verify Legend
    expect(container.textContent).toContain(TEXT_DASHBOARD.TOA_TREND.LEGEND_UP);
    expect(container.textContent).toContain(
      TEXT_DASHBOARD.TOA_TREND.LEGEND_SLIGHT_DOWN,
    );
    expect(container.textContent).toContain(
      TEXT_DASHBOARD.TOA_TREND.LEGEND_DRASTIC_DOWN,
    );

    // Verify SVG rect bars
    const rects = container.querySelectorAll(".trend-bar-rect");
    expect(rects.length).toBe(3);
  });
});
