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

  it("applies smart preset ritase 7.5 for Start Point A (sets Pergi: 8, Pulang: 7)", () => {
    const setTripPergi = vi.fn();
    const setTripPulang = vi.fn();

    const mockForm = {
      tripPergiInputRef: { current: null },
      tripPergi: "0",
      setTripPergi,
      tripPulang: "0",
      setTripPulang,
      handleInputFocus: vi.fn(),
      handleInputKeyDown: vi.fn(),
    } as unknown as BusInputFormReturn;

    act(() => {
      root.render(
        <BusInputModalTrip
          form={mockForm}
          tripPergiLabel="Trip Pergi"
          tripPulangLabel="Trip Pulang"
          plottingItem={{
            unit: "TJ-01",
            order: 1,
            start_point: "A",
            target_ritase: 7.5,
            status: "READY",
          }}
          endpointAName="Priok"
          endpointBName="IGI"
        />,
      );
    });

    // Cari tombol preset 7.5 Rit
    const buttons = Array.from(container.querySelectorAll("button"));
    const presetBtn = buttons.find((b) => b.textContent?.includes("7.5 Rit"));
    expect(presetBtn).toBeDefined();

    act(() => {
      presetBtn?.click();
    });

    expect(setTripPergi).toHaveBeenCalledWith("8");
    expect(setTripPulang).toHaveBeenCalledWith("7");
  });

  it("displays warning banner when trip difference > 1 (physical anomaly)", () => {
    const mockForm = {
      tripPergiInputRef: { current: null },
      tripPergi: "8",
      setTripPergi: vi.fn(),
      tripPulang: "6", // selisih 2
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
          plottingItem={{
            unit: "TJ-01",
            order: 1,
            start_point: "A",
            target_ritase: 7.0,
            status: "READY",
          }}
        />,
      );
    });

    const warning = container.querySelector('[data-testid="trip-physical-warning"]');
    expect(warning).not.toBeNull();
    expect(warning?.textContent).toContain("tidak boleh lebih dari 1 trip");
  });
});
