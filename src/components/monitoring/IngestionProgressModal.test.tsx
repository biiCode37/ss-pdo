// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { IngestionProgressModal } from "./IngestionProgressModal";
import { TEXT_MONITORING } from "@/constants/texts";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("IngestionProgressModal Component", () => {
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

  it("does not render when isOpen is false", async () => {
    await act(async () => {
      root.render(<IngestionProgressModal isOpen={false} progress={null} />);
    });
    expect(container.querySelector('[data-testid="ingestion-progress-modal"]')).toBeNull();
  });

  it("renders animated modal and progress values when isOpen is true", async () => {
    await act(async () => {
      root.render(
        <IngestionProgressModal
          isOpen={true}
          progress={{
            currentRouteCode: "JAK.01",
            processedCount: 9,
            totalToSync: 18,
            percent: 50,
            stepMessage: "Mengambil data JAK.01...",
          }}
        />
      );
    });

    const modal = container.querySelector('[data-testid="ingestion-progress-modal"]');
    expect(modal).toBeTruthy();
    expect(container.textContent).toContain(TEXT_MONITORING.INGESTION.MODAL_TITLE);
    expect(container.textContent).toContain("9 / 18 Rute");
    expect(container.textContent).toContain("50%");
    expect(container.textContent).toContain("JAK.01");
    expect(container.textContent).toContain("Mengambil data JAK.01...");

    const barFill = container.querySelector<HTMLDivElement>('[data-testid="ingestion-progress-bar-fill"]');
    expect(barFill?.style.width).toBe("50%");
  });

  it("renders complete state and handles close button when percent is 100", async () => {
    const handleClose = vi.fn();

    await act(async () => {
      root.render(
        <IngestionProgressModal
          isOpen={true}
          progress={{
            processedCount: 18,
            totalToSync: 18,
            percent: 100,
            stepMessage: "Selesai!",
          }}
          onClose={handleClose}
        />
      );
    });

    expect(container.textContent).toContain("100%");
    expect(container.textContent).toContain("Selesai");

    const closeBtn = container.querySelector<HTMLButtonElement>("button");
    expect(closeBtn).toBeTruthy();
    expect(closeBtn?.textContent).toBe("Tutup");

    act(() => {
      closeBtn?.click();
    });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
