// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useBusCardModal } from "./useBusCardModal";
import type { BusData } from "@/services/googleSheets";
import * as alertUtils from "@/utils/alertUtils";
import { TEXT_DASHBOARD } from "@/constants/texts";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/utils/alertUtils", () => ({
  showWarningToast: vi.fn(),
  escapeHtml: (str: string) => str,
  pdoSwal: {
    fire: vi.fn(),
  },
}));

const createMockBus = (partial: Partial<BusData> = {}): BusData => ({
  rowIndex: 5,
  unit: "JAK.15-05",
  tripPergi: "",
  tripPulang: "",
  toaShift1: "",
  toaShift2: "",
  manualShift1: "",
  manualShift2: "",
  totalToa: "",
  kmAwal1: "",
  kmAkhir1: "",
  kmAwal2: "",
  kmAkhir2: "",
  keterangan: "",
  originalRow: [],
  ...partial,
});

let latestHookResult: ReturnType<typeof useBusCardModal>;

function TestHookComponent({
  options,
}: {
  options: Parameters<typeof useBusCardModal>[0];
}) {
  latestHookResult = useBusCardModal(options);
  return <div id="hook-ready">Ready</div>;
}

describe("useBusCardModal Hook", () => {
  let container: HTMLDivElement;
  let root: Root;

  const defaultOptions = {
    bus: createMockBus(),
    formData: {},
    tabName: "Tgl 10",
    headerMap: {},
    activeCategory: "all",
    activeShift: 1 as const,
    isShiftConfirmed: true,
    onOpenFleetStatus: vi.fn(),
    handleSaveUpdates: vi.fn(),
  };

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

  it("initializes with modal closed and default shift 1 tab", async () => {
    await act(async () => {
      root.render(<TestHookComponent options={defaultOptions} />);
    });

    expect(latestHookResult.isModalOpen).toBe(false);
    expect(latestHookResult.modalInitialTab).toBe("shift1");
    expect(latestHookResult.isNonSgo).toBe(false);
  });

  it("blocks modal opening when tabName is AKUMULASI", async () => {
    await act(async () => {
      root.render(
        <TestHookComponent
          options={{
            ...defaultOptions,
            tabName: "AKUMULASI",
          }}
        />,
      );
    });

    await act(async () => {
      await latestHookResult.handleOpenModal();
    });

    expect(alertUtils.showWarningToast).toHaveBeenCalledWith(
      TEXT_DASHBOARD.BUS_LIST.ACCUMULATION_LOCKED,
    );
    expect(latestHookResult.isModalOpen).toBe(false);
  });

  it("allows modal opening even when isShiftConfirmed is false", async () => {
    const onOpenFleetStatusMock = vi.fn();
    await act(async () => {
      root.render(
        <TestHookComponent
          options={{
            ...defaultOptions,
            isShiftConfirmed: false,
            onOpenFleetStatus: onOpenFleetStatusMock,
          }}
        />,
      );
    });

    await act(async () => {
      await latestHookResult.handleOpenModal();
    });

    expect(alertUtils.showWarningToast).not.toHaveBeenCalled();
    expect(onOpenFleetStatusMock).not.toHaveBeenCalled();
    expect(latestHookResult.isModalOpen).toBe(true);
  });

  it("shows non-SGO confirmation alert when unit has OFF/TO status", async () => {
    const onOpenFleetStatusMock = vi.fn();
    (alertUtils.pdoSwal.fire as any).mockResolvedValue({ isConfirmed: true });

    await act(async () => {
      root.render(
        <TestHookComponent
          options={{
            ...defaultOptions,
            bus: createMockBus({ keterangan: "OFF" }),
            onOpenFleetStatus: onOpenFleetStatusMock,
          }}
        />,
      );
    });

    expect(latestHookResult.isNonSgo).toBe(true);

    await act(async () => {
      await latestHookResult.handleOpenModal();
    });

    expect(alertUtils.pdoSwal.fire).toHaveBeenCalled();
    expect(onOpenFleetStatusMock).toHaveBeenCalledTimes(1);
    expect(latestHookResult.isModalOpen).toBe(false);
  });

  it("opens modal and sets requested initial tab when conditions are met", async () => {
    await act(async () => {
      root.render(<TestHookComponent options={defaultOptions} />);
    });

    await act(async () => {
      await latestHookResult.handleOpenModal("trip");
    });

    expect(latestHookResult.isModalOpen).toBe(true);
    expect(latestHookResult.modalInitialTab).toBe("trip");

    // Close modal
    act(() => {
      latestHookResult.handleCloseModal();
    });

    expect(latestHookResult.isModalOpen).toBe(false);
  });

  it("delegates handleSaveModalUpdates to handleSaveUpdates", async () => {
    const handleSaveUpdatesMock = vi.fn().mockResolvedValue(undefined);
    await act(async () => {
      root.render(
        <TestHookComponent
          options={{
            ...defaultOptions,
            handleSaveUpdates: handleSaveUpdatesMock,
          }}
        />,
      );
    });

    const sampleUpdate = { toaShift1: "150" };
    await act(async () => {
      await latestHookResult.handleSaveModalUpdates(sampleUpdate);
    });

    expect(handleSaveUpdatesMock).toHaveBeenCalledWith(sampleUpdate);
  });
});
