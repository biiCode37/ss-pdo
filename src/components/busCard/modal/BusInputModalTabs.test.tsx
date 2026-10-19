// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { BusInputModalTabs } from "./BusInputModalTabs";
import { TEXT_ALERTS } from "@/constants/texts";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("BusInputModalTabs Component", () => {
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

  it("renders all 4 tabs with correct localized texts", () => {
    const onSelectTab = vi.fn();
    act(() => {
      root.render(
        <BusInputModalTabs activeTab="shift1" onSelectTab={onSelectTab} />,
      );
    });

    const buttons = container.querySelectorAll("button[role='tab']");
    expect(buttons.length).toBe(4);

    expect(buttons[0].textContent).toContain(
      TEXT_ALERTS.BUS_INPUT_MODAL.TAB_SHIFT_1,
    );
    expect(buttons[1].textContent).toContain(
      TEXT_ALERTS.BUS_INPUT_MODAL.TAB_SHIFT_2,
    );
    expect(buttons[2].textContent).toContain(
      TEXT_ALERTS.BUS_INPUT_MODAL.TAB_RITASE,
    );
    expect(buttons[3].textContent).toContain(
      TEXT_ALERTS.BUS_INPUT_MODAL.TAB_KET,
    );
  });

  it("sets aria-selected correctly on active tab", () => {
    const onSelectTab = vi.fn();
    act(() => {
      root.render(
        <BusInputModalTabs activeTab="shift1" onSelectTab={onSelectTab} />,
      );
    });

    const buttons = container.querySelectorAll("button[role='tab']");
    expect(buttons[0].getAttribute("aria-selected")).toBe("true");
    expect(buttons[1].getAttribute("aria-selected")).toBe("false");

    act(() => {
      root.render(
        <BusInputModalTabs activeTab="shift2" onSelectTab={onSelectTab} />,
      );
    });

    expect(buttons[0].getAttribute("aria-selected")).toBe("false");
    expect(buttons[1].getAttribute("aria-selected")).toBe("true");
  });

  it("triggers onSelectTab callback when another tab is clicked", () => {
    const onSelectTab = vi.fn();
    act(() => {
      root.render(
        <BusInputModalTabs activeTab="shift1" onSelectTab={onSelectTab} />,
      );
    });

    const tripTab = container.querySelectorAll("button[role='tab']")[2];
    act(() => {
      tripTab.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onSelectTab).toHaveBeenCalledWith("trip");
  });
});
