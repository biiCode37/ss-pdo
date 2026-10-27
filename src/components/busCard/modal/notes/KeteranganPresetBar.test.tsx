// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { KeteranganPresetBar } from "./KeteranganPresetBar";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("KeteranganPresetBar Component", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("renders preset buttons: BA, OFF, TO EVDAL, and Normal", () => {
    act(() => {
      root.render(<KeteranganPresetBar value="" onChange={vi.fn()} />);
    });
    expect(container.textContent).toContain("BA");
    expect(container.textContent).toContain("OFF");
    expect(container.textContent).toContain("TO EVDAL");
    expect(container.textContent).toContain("Normal (SGO)");
  });

  it("renders shiftLabel when provided", () => {
    act(() => {
      root.render(
        <KeteranganPresetBar
          value=""
          onChange={vi.fn()}
          shiftLabel="Catatan Shift 1"
        />
      );
    });
    expect(container.textContent).toContain("Catatan Shift 1");
  });

  it("activates dropdown Pilih Jenis BA when BA button is clicked", () => {
    const handleChange = vi.fn();
    act(() => {
      root.render(<KeteranganPresetBar value="" onChange={handleChange} />);
    });

    const baBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "BA"
    );
    expect(baBtn).toBeDefined();

    act(() => {
      baBtn!.click();
    });

    // Default onChange dipanggil dengan awalan BA.01
    expect(handleChange).toHaveBeenCalledWith("BA.01 ");
  });

  it("toggles off BA prefix when BA button is clicked while already active", () => {
    const handleChange = vi.fn();
    act(() => {
      root.render(<KeteranganPresetBar value="BA.01 Radiator bocor" onChange={handleChange} />);
    });

    const baBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "BA"
    );
    act(() => {
      baBtn!.click();
    });

    expect(handleChange).toHaveBeenCalledWith("Radiator bocor");
  });

  it("renders dropdown with options 01, 02, 03, 04 when value starts with BA", () => {
    act(() => {
      root.render(<KeteranganPresetBar value="BA.01 Radiator" onChange={vi.fn()} />);
    });

    const select = container.querySelector<HTMLSelectElement>("select");
    expect(select).not.toBeNull();
    expect(select?.value).toBe("01");
    expect(container.textContent).toContain("01 - Gangguan Kendaraan / Teknis");
  });

  it("renders NP1 and NP2 shortcut buttons when BA.02 is active", () => {
    const handleChange = vi.fn();
    act(() => {
      root.render(<KeteranganPresetBar value="BA.02 " onChange={handleChange} />);
    });

    const np1Btn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "NP1"
    );
    expect(np1Btn).toBeDefined();

    act(() => {
      np1Btn!.click();
    });
    expect(handleChange).toHaveBeenCalledWith("BA.02 NP1");

    const np2Btn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "NP2"
    );
    expect(np2Btn).toBeDefined();

    act(() => {
      np2Btn!.click();
    });
    expect(handleChange).toHaveBeenCalledWith("BA.02 NP2");
  });

  it("replaces BA prefix without removing the existing custom reason when dropdown changes", () => {
    const handleChange = vi.fn();
    act(() => {
      root.render(<KeteranganPresetBar value="BA.01 Radiator bocor" onChange={handleChange} />);
    });

    const select = container.querySelector<HTMLSelectElement>("select");
    expect(select).not.toBeNull();

    act(() => {
      select!.value = "03";
      select!.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(handleChange).toHaveBeenCalledWith("BA.03 Radiator bocor");
  });

  it("sets value to OFF when OFF button is clicked, and toggles off when clicked again", () => {
    const handleChange = vi.fn();
    act(() => {
      root.render(<KeteranganPresetBar value="" onChange={handleChange} />);
    });

    const offBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "OFF"
    );
    act(() => {
      offBtn!.click();
    });
    expect(handleChange).toHaveBeenCalledWith("OFF");

    // Toggle off
    act(() => {
      root.render(<KeteranganPresetBar value="OFF" onChange={handleChange} />);
    });
    const offBtnActive = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "OFF"
    );
    act(() => {
      offBtnActive!.click();
    });
    expect(handleChange).toHaveBeenCalledWith("");
  });

  it("sets value to TO EVDAL when TO EVDAL button is clicked, and toggles off when clicked again", () => {
    const handleChange = vi.fn();
    act(() => {
      root.render(<KeteranganPresetBar value="" onChange={handleChange} />);
    });

    const evdalBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "TO EVDAL"
    );
    act(() => {
      evdalBtn!.click();
    });
    expect(handleChange).toHaveBeenCalledWith("TO EVDAL");

    // Toggle off
    act(() => {
      root.render(<KeteranganPresetBar value="TO EVDAL" onChange={handleChange} />);
    });
    const evdalBtnActive = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "TO EVDAL"
    );
    act(() => {
      evdalBtnActive!.click();
    });
    expect(handleChange).toHaveBeenCalledWith("");
  });

  it("clears value to empty string when Normal button is clicked", () => {
    const handleChange = vi.fn();
    act(() => {
      root.render(<KeteranganPresetBar value="BA.01 Mogok" onChange={handleChange} />);
    });

    const clearBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Normal")
    );
    act(() => {
      clearBtn!.click();
    });
    expect(handleChange).toHaveBeenCalledWith("");
  });
});
