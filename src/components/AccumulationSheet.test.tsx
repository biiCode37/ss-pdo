// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { AccumulationSheet } from "./AccumulationSheet";
import { TEXT_DASHBOARD } from "@/constants/texts";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/services/routeService", () => ({
  fetchRoutesWithSheets: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/utils/cacheUtils", () => ({
  getRoutesFromCache: vi.fn().mockReturnValue([]),
}));

describe("AccumulationSheet", () => {
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

  it("renders null when isOpen is false", async () => {
    await act(async () => {
      root.render(
        <AccumulationSheet
          isOpen={false}
          onClose={vi.fn()}
          onApply={vi.fn()}
        />,
      );
    });

    expect(
      document.body.querySelector(".accumulation-sheet-overlay"),
    ).toBeNull();
  });

  it("renders period options and controls when isOpen is true", async () => {
    await act(async () => {
      root.render(
        <AccumulationSheet
          isOpen={true}
          onClose={vi.fn()}
          onApply={vi.fn()}
          currentMonth={9}
          currentYear={2026}
        />,
      );
    });

    const overlay = document.body.querySelector(".accumulation-sheet-overlay");
    expect(overlay).toBeTruthy();
    expect(overlay?.textContent).toContain(
      TEXT_DASHBOARD.ACCUMULATION_SHEET.TITLE,
    );
    expect(overlay?.textContent).toContain(
      TEXT_DASHBOARD.ACCUMULATION_SHEET.FROM_LABEL,
    );
    expect(overlay?.textContent).toContain(
      TEXT_DASHBOARD.ACCUMULATION_SHEET.TO_LABEL,
    );
    expect(overlay?.textContent).toContain("Rentang:");
    expect(overlay?.textContent).toContain(
      TEXT_DASHBOARD.ACCUMULATION_SHEET.APPLY_BTN,
    );
  });

  it("shows reset button when isAccumulationActive is true", async () => {
    const onResetAccumulation = vi.fn();

    await act(async () => {
      root.render(
        <AccumulationSheet
          isOpen={true}
          onClose={vi.fn()}
          onApply={vi.fn()}
          currentMonth={9}
          currentYear={2026}
          isAccumulationActive={true}
          onResetAccumulation={onResetAccumulation}
        />,
      );
    });

    const overlay = document.body.querySelector(".accumulation-sheet-overlay");
    expect(overlay?.textContent).toContain(
      TEXT_DASHBOARD.ACCUMULATION_SHEET.RESET_BTN,
    );
  });
});
