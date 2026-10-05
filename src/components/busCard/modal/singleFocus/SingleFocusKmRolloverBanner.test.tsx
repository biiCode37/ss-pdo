// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SingleFocusKmRolloverBanner } from "./SingleFocusKmRolloverBanner";
import { TEXT_ALERTS } from "@/constants/texts";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("SingleFocusKmRolloverBanner Component", () => {
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
  });

  it("merender judul banner, teks saran rollover, dan tombol terapkan saran dengan token kontras tinggi", () => {
    const onApply = vi.fn();
    const suggestion = {
      suggestedKm: "293003",
      diff: 13,
    };

    act(() => {
      root.render(
        <SingleFocusKmRolloverBanner suggestion={suggestion} onApply={onApply} />,
      );
    });

    const banner = container.firstElementChild as HTMLElement;
    expect(banner).not.toBeNull();
    // 1. Verifikasi Judul
    expect(container.textContent).toContain(
      TEXT_ALERTS.BUS_INPUT_MODAL.ROLLOVER_DETECTED_TITLE,
    );
    const titleElement = banner.children[0] as HTMLElement;
    expect(titleElement).not.toBeNull();
    expect(titleElement.textContent).toContain(
      TEXT_ALERTS.BUS_INPUT_MODAL.ROLLOVER_DETECTED_TITLE,
    );

    // 2. Verifikasi Teks Saran
    expect(container.textContent).toContain(
      TEXT_ALERTS.BUS_INPUT_MODAL.ROLLOVER_SUGGESTION_TEXT("293003", 13),
    );
    const bodyElement = banner.children[1] as HTMLElement;
    expect(bodyElement).not.toBeNull();
    expect(bodyElement.textContent).toBe(
      TEXT_ALERTS.BUS_INPUT_MODAL.ROLLOVER_SUGGESTION_TEXT("293003", 13),
    );

    // 3. Verifikasi Tombol dan Aksi Klik
    const button = banner.querySelector("button") as HTMLButtonElement;
    expect(button).not.toBeNull();
    expect(button.textContent).toContain(
      TEXT_ALERTS.BUS_INPUT_MODAL.ROLLOVER_APPLY_BTN("293003"),
    );

    // Klik tombol memicu callback onApply
    act(() => {
      button.click();
    });
    expect(onApply).toHaveBeenCalledTimes(1);
  });
});
