// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { QueueModal } from "./QueueModal";
import type { SyncItem } from "@/hooks/useOfflineSync";
import { TEXT_ALERTS } from "@/constants/texts";
import { _resetModalStackForTest } from "@/utils/modalStackCoordinator";
import { _resetScrollLockCoordinatorForTest } from "@/utils/scrollLockCoordinator";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("QueueModal Component", () => {
  let container: HTMLDivElement;
  let root: Root;

  const mockQueue: SyncItem[] = [
    {
      id: "item-1",
      sheetId: "sheet-1",
      tabName: "01",
      rowIndex: 5,
      updates: { totalToa: "250" },
      headerMap: {} as any,
      status: "pending",
      retryCount: 0,
    },
    {
      id: "item-2",
      sheetId: "sheet-1",
      tabName: "02",
      rowIndex: 7,
      updates: { totalToa: "280" },
      headerMap: {} as any,
      status: "conflict",
      retryCount: 1,
    },
  ];

  beforeEach(() => {
    _resetModalStackForTest();
    _resetScrollLockCoordinatorForTest();
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
    _resetModalStackForTest();
    _resetScrollLockCoordinatorForTest();
    document.body.style.overflow = "";
  });

  it("renders queue items, title, and buttons when isOpen is true", async () => {
    await act(async () => {
      root.render(
        <QueueModal
          isOpen={true}
          onClose={vi.fn()}
          queue={mockQueue}
          onRetry={vi.fn()}
          onDelete={vi.fn()}
          onResolveConflict={vi.fn()}
          onForceConflict={vi.fn()}
          onProcessQueue={vi.fn()}
        />,
      );
    });

    const titleEl = document.body.querySelector("h2");
    expect(titleEl?.textContent).toBe(TEXT_ALERTS.QUEUE_MODAL.TITLE);

    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute("aria-modal")).toBe("true");

    // Menampilkan item queue
    expect(document.body.textContent).toContain("Tab 01 - Baris 5");
    expect(document.body.textContent).toContain("Tab 02 - Baris 7");
  });

  it("calls onClose when backdrop is clicked, but NOT when content is clicked", async () => {
    const handleClose = vi.fn();

    await act(async () => {
      root.render(
        <QueueModal
          isOpen={true}
          onClose={handleClose}
          queue={mockQueue}
          onRetry={vi.fn()}
          onDelete={vi.fn()}
          onResolveConflict={vi.fn()}
          onForceConflict={vi.fn()}
          onProcessQueue={vi.fn()}
        />,
      );
    });

    // Klik konten item queue -> tidak memanggil onClose
    const h2El = document.body.querySelector("h2") as HTMLHeadingElement;
    await act(async () => {
      h2El.click();
    });
    expect(handleClose).not.toHaveBeenCalled();

    // Klik backdrop -> memanggil onClose
    const backdrop = document.body.querySelector(".modal-shell-backdrop") as HTMLDivElement;
    await act(async () => {
      backdrop.click();
    });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape key is pressed", async () => {
    const handleClose = vi.fn();

    await act(async () => {
      root.render(
        <QueueModal
          isOpen={true}
          onClose={handleClose}
          queue={mockQueue}
          onRetry={vi.fn()}
          onDelete={vi.fn()}
          onResolveConflict={vi.fn()}
          onForceConflict={vi.fn()}
          onProcessQueue={vi.fn()}
        />,
      );
    });

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
