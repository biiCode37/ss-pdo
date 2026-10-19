// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { BusInputModalTrip } from "./BusInputModalTrip";
import type { BusInputFormReturn } from "./useBusInputForm";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("BusInputModalTrip Component", () => {
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

  it("calculates and displays normalized PP ritase correctly", () => {
    const mockForm = {
      tripPergiInputRef: { current: null },
      tripPergi: "3",
      setTripPergi: vi.fn(),
      tripPulang: "3",
      setTripPulang: vi.fn(),
      handleInputFocus: vi.fn(),
      handleInputKeyDown: vi.fn(),
    } as unknown as BusInputFormReturn;

    act(() => {
      root.render(
        <BusInputModalTrip
          form={mockForm}
          tripPergiLabel="Trip Pergi"
          tripPulangLabel="Trip Pulang"
        />,
      );
    });

    // 3 pergi + 3 pulang = 6 trip = 3.0 ritase PP
    expect(container.textContent).toContain("3");
    expect(container.textContent).toContain("(PP)");

    const inputs = container.querySelectorAll("input");
    expect(inputs.length).toBe(2);
    expect(inputs[0].value).toBe("3");
    expect(inputs[1].value).toBe("3");
  });

  it("handles fractional PP ritase (e.g. 1 trip = 0.5 ritase PP)", () => {
    const mockForm = {
      tripPergiInputRef: { current: null },
      tripPergi: "1",
      setTripPergi: vi.fn(),
      tripPulang: "0",
      setTripPulang: vi.fn(),
      handleInputFocus: vi.fn(),
      handleInputKeyDown: vi.fn(),
    } as unknown as BusInputFormReturn;

    act(() => {
      root.render(
        <BusInputModalTrip
          form={mockForm}
          tripPergiLabel="Trip Pergi"
          tripPulangLabel="Trip Pulang"
        />,
      );
    });

    // 1 pergi + 0 pulang = 1 trip = 0.5 ritase PP
    expect(container.textContent).toContain("0.5");
  });
});
