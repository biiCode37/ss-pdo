// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { QueueModal } from "@/components/dashboard/QueueModal";
import { ReportModalLayout } from "@/components/pdoReport/ReportModalLayout";
import type { SyncItem } from "@/hooks/useOfflineSync";
import { _resetModalStackForTest, isTopmostModal } from "@/utils/modalStackCoordinator";
import {
  _resetScrollLockCoordinatorForTest,
  getActiveScrollLockCount,
} from "@/utils/scrollLockCoordinator";
import {
  initHistoryNavigation,
  _resetHistoryNavigationForTest,
} from "@/utils/historyNavigation";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("QueueModal & ReportModalLayout Integration (Pilot Batch 2.3)", () => {
  let container: HTMLDivElement;
  let root: Root;

  const mockCallbacks = {
    onRetry: vi.fn(),
    onDelete: vi.fn(),
    onResolveConflict: vi.fn(),
    onForceConflict: vi.fn(),
    onProcessQueue: vi.fn(),
  };

  const mockQueue: SyncItem[] = [
    {
      id: "q-1",
      sheetId: "sheet-1",
      tabName: "01",
      rowIndex: 5,
      updates: { totalToa: "200" },
      headerMap: {} as any,
      status: "pending",
      retryCount: 0,
    },
  ];

  beforeEach(() => {
    _resetModalStackForTest();
    _resetScrollLockCoordinatorForTest();
    _resetHistoryNavigationForTest();
    initHistoryNavigation();
    document.body.style.overflow = "";

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    document.querySelectorAll(".modal-shell-backdrop").forEach((el) => el.remove());
    _resetModalStackForTest();
    _resetScrollLockCoordinatorForTest();
    _resetHistoryNavigationForTest();
    document.body.style.overflow = "";
  });

  it("Solo visual layers: preserves individual base z-index when opened alone", async () => {
    // 1. QueueModal sendirian -> zIndex 100
    await act(async () => {
      root.render(
        <QueueModal
          isOpen={true}
          onClose={vi.fn()}
          queue={mockQueue}
          {...mockCallbacks}
        />,
      );
    });

    const queueBackdrop = document.body.querySelector("#queue-modal") as HTMLDivElement;
    expect(queueBackdrop).not.toBeNull();
    expect(queueBackdrop.style.zIndex).toBe("100");

    // 2. Tutup Queue, buka ReportModalLayout sendirian -> zIndex 99999
    await act(async () => {
      root.render(
        <ReportModalLayout
          isOpen={true}
          onClose={vi.fn()}
          routeCode="1A"
          status="draft"
        >
          <div>Laporan</div>
        </ReportModalLayout>,
      );
    });

    const reportBackdrop = document.body.querySelector("#route-operational-report-modal") as HTMLDivElement;
    expect(reportBackdrop).not.toBeNull();
    expect(reportBackdrop.style.zIndex).toBe("99999");
  });

  it("MITIGASI R97-01 & R97-02: Staggered Order 1 (Queue opened on render 1 -> parent re-renders with fresh callbacks & Report opened on render 2)", async () => {
    let queueCloseCount = 0;
    let reportCloseCount = 0;

    function Harness({
      openQueue,
      openReport,
      renderId,
    }: {
      openQueue: boolean;
      openReport: boolean;
      renderId: number;
    }) {
      // Meniru inline callback baru setiap kali parent re-render (seperti di Dashboard.tsx)
      return (
        <>
          <ReportModalLayout
            isOpen={openReport}
            onClose={() => {
              reportCloseCount += renderId;
            }}
            routeCode="1A"
            status="draft"
          >
            <div>Laporan</div>
          </ReportModalLayout>
          <QueueModal
            isOpen={openQueue}
            onClose={() => {
              queueCloseCount += renderId;
            }}
            queue={mockQueue}
            {...mockCallbacks}
          />
        </>
      );
    }

    // Render 1: Queue buka terlebih dahulu, Report tertutup
    await act(async () => {
      root.render(<Harness openQueue={true} openReport={false} renderId={10} />);
    });

    const queueEl1 = document.body.querySelector("#queue-modal") as HTMLDivElement;
    expect(queueEl1).not.toBeNull();
    expect(queueEl1.style.zIndex).toBe("100");
    expect(getActiveScrollLockCount()).toBe(1);

    // Render 2: Parent me-render ulang dengan callback baru (renderId=20) dan Report DIBUKA
    await act(async () => {
      root.render(<Harness openQueue={true} openReport={true} renderId={20} />);
    });

    const queueEl2 = document.body.querySelector("#queue-modal") as HTMLDivElement;
    const reportEl2 = document.body.querySelector("#route-operational-report-modal") as HTMLDivElement;

    // Visual: Report (99999) harus berada di atas Queue (100)
    expect(Number(reportEl2.style.zIndex)).toBeGreaterThan(Number(queueEl2.style.zIndex));
    expect(getActiveScrollLockCount()).toBe(2);

    // Stack dismiss: Report HARUS menjadi topmost modal, Queue TIDAK BOLEH melompati Report!
    // (Membuktikan kegagalan probe R97-01 kini telah teratasi 100%)
    expect(document.getElementById("route-operational-report-modal")).not.toBeNull();
    expect(Number(reportEl2.style.zIndex)).toBe(99999);
    expect(Number(queueEl2.style.zIndex)).toBe(100);
    expect(isTopmostModal("route-operational-report-modal")).toBe(true);
    expect(isTopmostModal("queue-modal")).toBe(false);

    // Tekan Escape: Hanya dialog visual teratas (Report) yang ditutup! Menggunakan callback render terbaru (20).
    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });

    expect(reportCloseCount).toBe(20);
    expect(queueCloseCount).toBe(0);

    // Render 3: Report tertutup, Queue masih terbuka
    await act(async () => {
      root.render(<Harness openQueue={true} openReport={false} renderId={30} />);
    });

    expect(getActiveScrollLockCount()).toBe(1);
    expect(document.body.style.overflow).toBe("hidden");

    // Tekan Escape kedua: Sekarang Queue yang ditutup dengan callback render terbaru (30).
    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });

    expect(queueCloseCount).toBe(30);
  });

  it("MITIGASI R97-01: Staggered Order 1 with Hardware Back Button (popstate)", async () => {
    let queueBackCount = 0;
    let reportBackCount = 0;

    function Harness({
      openQueue,
      openReport,
      renderId,
    }: {
      openQueue: boolean;
      openReport: boolean;
      renderId: number;
    }) {
      return (
        <>
          <ReportModalLayout
            isOpen={openReport}
            onClose={() => {
              reportBackCount += renderId;
            }}
            routeCode="1A"
            status="draft"
          >
            <div>Laporan</div>
          </ReportModalLayout>
          <QueueModal
            isOpen={openQueue}
            onClose={() => {
              queueBackCount += renderId;
            }}
            queue={mockQueue}
            {...mockCallbacks}
          />
        </>
      );
    }

    // Render 1: Queue buka terlebih dahulu
    await act(async () => {
      root.render(<Harness openQueue={true} openReport={false} renderId={100} />);
    });

    // Render 2: Report buka di atas Queue dengan callback baru
    await act(async () => {
      root.render(<Harness openQueue={true} openReport={true} renderId={200} />);
    });

    // Pemicuan hardware back button (popstate event)
    await act(async () => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    // Hanya dialog teratas (Report) yang menerima callback Back (nilai 200)!
    expect(reportBackCount).toBe(200);
    expect(queueBackCount).toBe(0);

    // Render 3: Report tertutup
    await act(async () => {
      root.render(<Harness openQueue={true} openReport={false} renderId={300} />);
    });

    // Pemicuan hardware back button kedua
    await act(async () => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    // Sekarang Queue yang menerima callback Back (nilai 300)!
    expect(queueBackCount).toBe(300);
  });

  it("MITIGASI R97-01 & R97-02: Staggered Order 2 (Report opened on render 1 -> parent re-renders with fresh callbacks & Queue opened on render 2)", async () => {
    let queueCloseCount = 0;
    let reportCloseCount = 0;

    function Harness({
      openReport,
      openQueue,
      renderId,
    }: {
      openReport: boolean;
      openQueue: boolean;
      renderId: number;
    }) {
      return (
        <>
          <ReportModalLayout
            isOpen={openReport}
            onClose={() => {
              reportCloseCount += renderId;
            }}
            routeCode="1A"
            status="draft"
          >
            <div>Laporan</div>
          </ReportModalLayout>
          <QueueModal
            isOpen={openQueue}
            onClose={() => {
              queueCloseCount += renderId;
            }}
            queue={mockQueue}
            {...mockCallbacks}
          />
        </>
      );
    }

    // Render 1: Report buka terlebih dahulu (base zIndex: 99999)
    await act(async () => {
      root.render(<Harness openReport={true} openQueue={false} renderId={10} />);
    });

    const reportEl1 = document.body.querySelector("#route-operational-report-modal") as HTMLDivElement;
    expect(reportEl1.style.zIndex).toBe("99999");

    // Render 2: Queue dibuka di atas Report dengan callback baru (renderId=20)
    await act(async () => {
      root.render(<Harness openReport={true} openQueue={true} renderId={20} />);
    });

    const reportEl2 = document.body.querySelector("#route-operational-report-modal") as HTMLDivElement;
    const queueEl2 = document.body.querySelector("#queue-modal") as HTMLDivElement;

    // Lapisan visual: Queue dinaikkan di atas Report (100009 > 99999)
    expect(Number(queueEl2.style.zIndex)).toBeGreaterThan(Number(reportEl2.style.zIndex));
    expect(getActiveScrollLockCount()).toBe(2);
    expect(isTopmostModal("queue-modal")).toBe(true);
    expect(isTopmostModal("route-operational-report-modal")).toBe(false);

    // Tekan Escape: Hanya dialog teratas (Queue) yang ditutup! Tepat 1 callback (20).
    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });

    expect(queueCloseCount).toBe(20);
    expect(reportCloseCount).toBe(0);

    // Render 3: Queue tertutup, Report masih terbuka
    await act(async () => {
      root.render(<Harness openReport={true} openQueue={false} renderId={30} />);
    });

    expect(getActiveScrollLockCount()).toBe(1);
    expect(document.body.style.overflow).toBe("hidden");

    // Tekan Escape kedua: Sekarang Report yang ditutup!
    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });

    expect(reportCloseCount).toBe(30);
  });

  it("MITIGASI R97-01: Staggered Order 2 with Hardware Back Button (popstate)", async () => {
    let queueBackCount = 0;
    let reportBackCount = 0;

    function Harness({
      openReport,
      openQueue,
      renderId,
    }: {
      openReport: boolean;
      openQueue: boolean;
      renderId: number;
    }) {
      return (
        <>
          <ReportModalLayout
            isOpen={openReport}
            onClose={() => {
              reportBackCount += renderId;
            }}
            routeCode="1A"
            status="draft"
          >
            <div>Laporan</div>
          </ReportModalLayout>
          <QueueModal
            isOpen={openQueue}
            onClose={() => {
              queueBackCount += renderId;
            }}
            queue={mockQueue}
            {...mockCallbacks}
          />
        </>
      );
    }

    // Render 1: Report buka terlebih dahulu
    await act(async () => {
      root.render(<Harness openReport={true} openQueue={false} renderId={50} />);
    });

    // Render 2: Queue buka di atas Report
    await act(async () => {
      root.render(<Harness openReport={true} openQueue={true} renderId={60} />);
    });

    // Pemicuan hardware back button (popstate event)
    await act(async () => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    // Hanya dialog teratas (Queue) yang menerima callback Back (nilai 60)!
    expect(queueBackCount).toBe(60);
    expect(reportBackCount).toBe(0);

    // Render 3: Queue tertutup
    await act(async () => {
      root.render(<Harness openReport={true} openQueue={false} renderId={70} />);
    });

    // Pemicuan hardware back button kedua
    await act(async () => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    // Sekarang Report yang menerima callback Back (nilai 70)!
    expect(reportBackCount).toBe(70);
  });

  it("Simultaneous opening in a single render aligns visual layer and dismiss stack", async () => {
    const handleCloseQueue = vi.fn();
    const handleCloseReport = vi.fn();

    await act(async () => {
      root.render(
        <>
          <ReportModalLayout
            isOpen={true}
            onClose={handleCloseReport}
            routeCode="1A"
            status="draft"
          >
            <div>Laporan</div>
          </ReportModalLayout>
          <QueueModal
            isOpen={true}
            onClose={handleCloseQueue}
            queue={mockQueue}
            {...mockCallbacks}
          />
        </>,
      );
    });

    const reportEl = document.body.querySelector("#route-operational-report-modal") as HTMLDivElement;
    const queueEl = document.body.querySelector("#queue-modal") as HTMLDivElement;

    // Keduanya terbuka serentak: lapisan visual dan stack dismiss harus selaras
    const zReport = parseInt(reportEl.style.zIndex, 10);
    const zQueue = parseInt(queueEl.style.zIndex, 10);
    expect(zQueue).toBeGreaterThan(zReport);

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });

    expect(handleCloseQueue).toHaveBeenCalledTimes(1);
    expect(handleCloseReport).not.toHaveBeenCalled();
  });

  it("Parent re-renders multiple times with new callback identities without altering modal order", async () => {
    let closeQueueTriggeredWith = 0;
    let closeReportTriggeredWith = 0;

    function RerenderHarness({ counter }: { counter: number }) {
      return (
        <>
          <QueueModal
            isOpen={true}
            onClose={() => {
              closeQueueTriggeredWith = counter;
            }}
            queue={mockQueue}
            {...mockCallbacks}
          />
          <ReportModalLayout
            isOpen={true}
            onClose={() => {
              closeReportTriggeredWith = counter;
            }}
            routeCode="1A"
            status="draft"
          >
            <div>Laporan</div>
          </ReportModalLayout>
        </>
      );
    }

    // Render awal
    await act(async () => {
      root.render(<RerenderHarness counter={1} />);
    });

    // Re-render berulang kali dengan callback baru
    await act(async () => {
      root.render(<RerenderHarness counter={2} />);
    });
    await act(async () => {
      root.render(<RerenderHarness counter={3} />);
    });
    await act(async () => {
      root.render(<RerenderHarness counter={4} />);
    });

    const reportEl = document.body.querySelector("#route-operational-report-modal") as HTMLDivElement;
    const queueEl = document.body.querySelector("#queue-modal") as HTMLDivElement;
    expect(parseInt(reportEl.style.zIndex, 10)).toBeGreaterThan(parseInt(queueEl.style.zIndex, 10));

    // Escape harus tetap menutup dialog teratas (Report) menggunakan callback render terakhir (4)
    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });

    expect(closeReportTriggeredWith).toBe(4);
    expect(closeQueueTriggeredWith).toBe(0);
  });

  it("Closing lower modal first keeps top modal intact and topmost", async () => {
    const handleCloseQueue = vi.fn();
    const handleCloseReport = vi.fn();

    function BottomCloseHarness({ openQueue }: { openQueue: boolean }) {
      return (
        <>
          <QueueModal
            isOpen={openQueue}
            onClose={handleCloseQueue}
            queue={mockQueue}
            {...mockCallbacks}
          />
          <ReportModalLayout
            isOpen={true}
            onClose={handleCloseReport}
            routeCode="1A"
            status="draft"
          >
            <div>Laporan</div>
          </ReportModalLayout>
        </>
      );
    }

    // Kedua modal dibuka (Queue di bawah, Report di atas)
    await act(async () => {
      root.render(<BottomCloseHarness openQueue={true} />);
    });

    expect(getActiveScrollLockCount()).toBe(2);

    // Parent menutup modal bawah (Queue) terlebih dahulu
    await act(async () => {
      root.render(<BottomCloseHarness openQueue={false} />);
    });

    expect(getActiveScrollLockCount()).toBe(1);
    expect(document.body.style.overflow).toBe("hidden"); // Report masih terbuka!

    // Escape harus menutup Report yang masih terbuka di layar
    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });

    expect(handleCloseReport).toHaveBeenCalledTimes(1);
    expect(handleCloseQueue).not.toHaveBeenCalled();
  });
});
