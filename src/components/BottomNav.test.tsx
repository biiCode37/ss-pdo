// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { BottomNav } from "./BottomNav";
import { TEXT_DASHBOARD } from "../constants/texts";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("BottomNav Component", () => {
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

  it("renders 4 tabs correctly and highlights active tab", () => {
    act(() => {
      root.render(
        <BottomNav
          activeTab="input"
          onSelectTab={() => {}}
          onOpenMore={() => {}}
        />
      );
    });

    const inputBtn = container.querySelector('[data-testid="bottom-nav-input"]');
    const analyticsBtn = container.querySelector('[data-testid="bottom-nav-analytics"]');
    const unitsBtn = container.querySelector('[data-testid="bottom-nav-units"]');
    const moreBtn = container.querySelector('[data-testid="bottom-nav-more"]');

    expect(inputBtn).not.toBeNull();
    expect(analyticsBtn).not.toBeNull();
    expect(unitsBtn).not.toBeNull();
    expect(moreBtn).not.toBeNull();

    expect(inputBtn?.classList.contains("active")).toBe(true);
    expect(analyticsBtn?.classList.contains("active")).toBe(false);
    expect(unitsBtn?.classList.contains("active")).toBe(false);

    expect(inputBtn?.textContent).toContain(TEXT_DASHBOARD.TABS.INPUT_SHORT);
    expect(analyticsBtn?.textContent).toContain(TEXT_DASHBOARD.TABS.DASHBOARD_SHORT);
    expect(unitsBtn?.textContent).toContain(TEXT_DASHBOARD.TABS.UNIT_SHORT);
    expect(moreBtn?.textContent).toContain(TEXT_DASHBOARD.TABS.MORE_SHORT);
  });

  it("calls onSelectTab when an inactive tab is clicked", () => {
    const handleSelectTab = vi.fn();
    act(() => {
      root.render(
        <BottomNav
          activeTab="input"
          onSelectTab={handleSelectTab}
          onOpenMore={() => {}}
        />
      );
    });

    const analyticsBtn = container.querySelector('[data-testid="bottom-nav-analytics"]') as HTMLButtonElement;
    act(() => {
      analyticsBtn.click();
    });

    expect(handleSelectTab).toHaveBeenCalledWith("analytics");
  });

  it("does not call onSelectTab when active tab is clicked", () => {
    const handleSelectTab = vi.fn();
    act(() => {
      root.render(
        <BottomNav
          activeTab="input"
          onSelectTab={handleSelectTab}
          onOpenMore={() => {}}
        />
      );
    });

    const inputBtn = container.querySelector('[data-testid="bottom-nav-input"]') as HTMLButtonElement;
    act(() => {
      inputBtn.click();
    });

    expect(handleSelectTab).not.toHaveBeenCalled();
  });

  it("calls onOpenMore when more tab is clicked", () => {
    const handleOpenMore = vi.fn();
    act(() => {
      root.render(
        <BottomNav
          activeTab="input"
          onSelectTab={() => {}}
          onOpenMore={handleOpenMore}
        />
      );
    });

    const moreBtn = container.querySelector('[data-testid="bottom-nav-more"]') as HTMLButtonElement;
    act(() => {
      moreBtn.click();
    });

    expect(handleOpenMore).toHaveBeenCalledTimes(1);
  });

  it("displays pendingQueueCount badge when count > 0", () => {
    act(() => {
      root.render(
        <BottomNav
          activeTab="input"
          onSelectTab={() => {}}
          onOpenMore={() => {}}
          pendingQueueCount={5}
        />
      );
    });

    const badge = container.querySelector(".bottom-nav-badge");
    expect(badge).not.toBeNull();
    expect(badge?.textContent).toBe("5");
  });

  it("does not display pendingQueueCount badge when count is 0", () => {
    act(() => {
      root.render(
        <BottomNav
          activeTab="input"
          onSelectTab={() => {}}
          onOpenMore={() => {}}
          pendingQueueCount={0}
        />
      );
    });

    const badge = container.querySelector(".bottom-nav-badge");
    expect(badge).toBeNull();
  });
});
