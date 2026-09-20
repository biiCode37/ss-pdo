// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useVisualViewport, type VisualViewportInfo } from "../useVisualViewport";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let latestInfo: VisualViewportInfo | null = null;

function ViewportTestComponent() {
  const info = useVisualViewport();
  latestInfo = info;
  return <div id="viewport-test-node">{info.viewportHeight}</div>;
}

describe("useVisualViewport", () => {
  let container: HTMLDivElement;
  let root: Root;
  const originalVisualViewport = window.visualViewport;

  beforeEach(() => {
    vi.clearAllMocks();
    latestInfo = null;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    Object.defineProperty(window, "visualViewport", {
      writable: true,
      configurable: true,
      value: originalVisualViewport,
    });
  });

  it("returns fallback window dimensions when visualViewport is undefined", () => {
    Object.defineProperty(window, "visualViewport", {
      writable: true,
      configurable: true,
      value: undefined,
    });

    act(() => {
      root.render(<ViewportTestComponent />);
    });

    expect(latestInfo).not.toBeNull();
    expect(latestInfo?.viewportHeight).toBe(window.innerHeight);
    expect(latestInfo?.isKeyboardOpen).toBe(false);
    expect(latestInfo?.keyboardHeight).toBe(0);
  });

  it("tracks visualViewport dimensions and keyboard state when resized", () => {
    let resizeCallback: (() => void) | null = null;

    const mockVisualViewport = {
      height: 400,
      width: 375,
      addEventListener: vi.fn((event, cb) => {
        if (event === "resize") resizeCallback = cb;
      }),
      removeEventListener: vi.fn(),
    };

    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 800,
    });

    Object.defineProperty(window, "visualViewport", {
      writable: true,
      configurable: true,
      value: mockVisualViewport,
    });

    act(() => {
      root.render(<ViewportTestComponent />);
    });

    expect(latestInfo?.viewportHeight).toBe(400);
    expect(latestInfo?.isKeyboardOpen).toBe(true);
    expect(latestInfo?.keyboardHeight).toBe(400);

    // Simulate keyboard closing: height returns to 800
    act(() => {
      mockVisualViewport.height = 800;
      if (resizeCallback) resizeCallback();
    });

    expect(latestInfo?.viewportHeight).toBe(800);
    expect(latestInfo?.isKeyboardOpen).toBe(false);
    expect(latestInfo?.keyboardHeight).toBe(0);
  });
});
