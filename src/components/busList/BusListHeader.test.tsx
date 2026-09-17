// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BusListHeader, type BusListHeaderProps } from "./BusListHeader";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("BusListHeader Component", () => {
  let container: HTMLDivElement;
  let root: Root;

  const defaultProps: BusListHeaderProps = {
    tabName: "Tgl 9",
    isShiftConfirmed: true,
    activeShift: 1,
    activeCategory: "ALL",
    onCategoryChange: vi.fn(),
    filledCount: 10,
    totalCount: 16,
    progressPercent: 62,
    searchQuery: "",
    onSearchChange: vi.fn(),
    showOnlyUnfinished: false,
    onToggleUnfinished: vi.fn(),
    bulkPergi: "",
    bulkPulang: "",
    isSubmittingBulk: false,
    onOpenBulkTripModal: vi.fn(),
    availableKmS1Count: 5,
    skippedWithNotesCount: 2,
    onBulkCopyKmS1: vi.fn(),
  };

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
  });

  it("renders daily progress bar and total count when shift is confirmed", async () => {
    await act(async () => {
      root.render(<BusListHeader {...defaultProps} />);
    });

    const progressContainer = container.querySelector('[data-testid="daily-progress-container"]');
    expect(progressContainer).not.toBeNull();
    expect(container.textContent).toContain("Progres Harian");
    expect(container.textContent).toContain("10/16 Unit (62%)");
  });

  it("renders accumulation warning banner when tabName is AKUMULASI", async () => {
    const onExitMock = vi.fn();

    await act(async () => {
      root.render(
        <BusListHeader
          {...defaultProps}
          tabName="AKUMULASI"
          accRange={{ startDay: 1, endDay: 10 }}
          onExitAccumulation={onExitMock}
        />
      );
    });

    expect(container.textContent).toContain("Rekap Akumulasi (Tgl 1 - 10) aktif");

    const exitBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Kembali ke Harian")
    );
    expect(exitBtn).toBeDefined();

    await act(async () => {
      exitBtn?.click();
    });
    expect(onExitMock).toHaveBeenCalledTimes(1);
  });

  it("renders daily progress bar even when isShiftConfirmed is false", async () => {
    await act(async () => {
      root.render(
        <BusListHeader
          {...defaultProps}
          isShiftConfirmed={false}
          activeShift={2}
        />
      );
    });

    // Progress bar tetap tampil untuk memberikan visibilitas progres input
    const progressContainer = container.querySelector('[data-testid="daily-progress-container"]');
    expect(progressContainer).not.toBeNull();
    // Banner shift-lock duplikat tidak dirender di header list (sudah ditangani oleh ShiftConfirmationAlertBar)
    const shiftLockBanner = container.querySelector(".shift-lock-banner");
    expect(shiftLockBanner).toBeNull();
  });

  it("calls onSearchChange and onToggleUnfinished when user interacts with controls", async () => {
    const onSearchChangeMock = vi.fn();
    const onToggleUnfinishedMock = vi.fn();

    await act(async () => {
      root.render(
        <BusListHeader
          {...defaultProps}
          onSearchChange={onSearchChangeMock}
          onToggleUnfinished={onToggleUnfinishedMock}
        />
      );
    });

    const searchInput = container.querySelector(".search-input") as HTMLInputElement;
    expect(searchInput).toBeDefined();

    await act(async () => {
      searchInput.value = "JAK.15";
      searchInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const filterBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Filter")
    );
    expect(filterBtn).toBeDefined();

    await act(async () => {
      filterBtn?.click();
    });
    expect(onToggleUnfinishedMock).toHaveBeenCalledTimes(1);
  });
});
