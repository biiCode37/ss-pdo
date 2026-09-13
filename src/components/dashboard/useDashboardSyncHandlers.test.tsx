// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDashboardSyncHandlers } from "./useDashboardSyncHandlers";
import * as alertUtils from "@/utils/alertUtils";
import * as googleSheets from "@/services/googleSheets";
import * as cacheUtils from "@/utils/cacheUtils";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/utils/alertUtils", () => ({
  showDeleteQueueConfirm: vi.fn(),
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
}));

vi.mock("@/services/googleSheets", () => ({
  reauthenticateSession: vi.fn(),
  formatWholeSheet: vi.fn(),
}));

vi.mock("@/utils/cacheUtils", () => ({
  getRoutesFromCache: vi.fn(),
}));

let latestHandlers: ReturnType<typeof useDashboardSyncHandlers>;

function TestHookComponent({
  options,
}: {
  options: Parameters<typeof useDashboardSyncHandlers>[0];
}) {
  latestHandlers = useDashboardSyncHandlers(options);
  return <div id="sync-handlers-ready">Ready</div>;
}

describe("useDashboardSyncHandlers Hook", () => {
  let container: HTMLDivElement;
  let root: Root;

  const removeItem = vi.fn();
  const processQueue = vi.fn().mockResolvedValue(undefined);
  const handleLoadData = vi.fn().mockResolvedValue(undefined);
  const handleSetSheetUrl = vi.fn();
  const handleSetSelectedTab = vi.fn();
  const setCurrentView = vi.fn();
  const setError = vi.fn();
  const setIsAuthExpired = vi.fn();
  const setIsReauthenticating = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
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

  const defaultProps = {
    removeItem,
    processQueue,
    currentSheetId: "sheet-123",
    currentTabName: "Tgl 9",
    busData: [{ unit: "MYS-01" }] as any,
    headerMap: { unit: 0 } as any,
    handleLoadData,
    handleSetSheetUrl,
    handleSetSelectedTab,
    setCurrentView,
    monitoringDate: "2026-09-09",
    setError,
    setIsAuthExpired,
    setIsReauthenticating,
  };

  it("handles queue item deletion when confirmed", async () => {
    vi.mocked(alertUtils.showDeleteQueueConfirm).mockResolvedValue(true);

    act(() => {
      root.render(<TestHookComponent options={defaultProps} />);
    });

    await act(async () => {
      await latestHandlers.handleDeleteQueueItem("queue-item-1");
    });

    expect(alertUtils.showDeleteQueueConfirm).toHaveBeenCalledTimes(1);
    expect(removeItem).toHaveBeenCalledWith("queue-item-1");
    expect(alertUtils.showSuccessToast).toHaveBeenCalled();
  });

  it("aborts queue item deletion when user cancels", async () => {
    vi.mocked(alertUtils.showDeleteQueueConfirm).mockResolvedValue(false);

    act(() => {
      root.render(<TestHookComponent options={defaultProps} />);
    });

    await act(async () => {
      await latestHandlers.handleDeleteQueueItem("queue-item-1");
    });

    expect(removeItem).not.toHaveBeenCalled();
    expect(alertUtils.showSuccessToast).not.toHaveBeenCalled();
  });

  it("handles successful reauthentication", async () => {
    vi.mocked(googleSheets.reauthenticateSession).mockResolvedValue(
      undefined as any,
    );

    act(() => {
      root.render(<TestHookComponent options={defaultProps} />);
    });

    await act(async () => {
      await latestHandlers.handleReauthenticate();
    });

    expect(setIsReauthenticating).toHaveBeenCalledWith(true);
    expect(googleSheets.reauthenticateSession).toHaveBeenCalledTimes(1);
    expect(setIsAuthExpired).toHaveBeenCalledWith(false);
    expect(setError).toHaveBeenCalledWith(null);
    expect(handleLoadData).toHaveBeenCalledWith(true, "Tgl 9");
    expect(processQueue).toHaveBeenCalledTimes(1);
    expect(alertUtils.showSuccessToast).toHaveBeenCalled();
    expect(setIsReauthenticating).toHaveBeenCalledWith(false);
  });

  it("selects monitoring route and switches to dashboard view", () => {
    vi.mocked(cacheUtils.getRoutesFromCache).mockReturnValue([
      {
        route_code: "4E",
        name: "Rute 4E",
        route_sheets: [
          { sheet_url: "https://docs.google.com/spreadsheets/d/abc" },
        ],
      } as any,
    ]);

    act(() => {
      root.render(<TestHookComponent options={defaultProps} />);
    });

    act(() => {
      latestHandlers.handleSelectMonitoringRoute("4E");
    });

    expect(handleSetSheetUrl).toHaveBeenCalledWith(
      "https://docs.google.com/spreadsheets/d/abc",
    );
    expect(handleSetSelectedTab).toHaveBeenCalledWith("9");
    expect(setCurrentView).toHaveBeenCalledWith("dashboard");
  });

  it("formats whole sheet successfully", async () => {
    vi.mocked(googleSheets.formatWholeSheet).mockResolvedValue(
      undefined as any,
    );

    act(() => {
      root.render(<TestHookComponent options={defaultProps} />);
    });

    await act(async () => {
      await latestHandlers.handleFormatWholeSheet();
    });

    expect(googleSheets.formatWholeSheet).toHaveBeenCalledWith(
      "sheet-123",
      "Tgl 9",
      defaultProps.busData,
      defaultProps.headerMap,
    );
  });
});
