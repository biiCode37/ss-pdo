// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LoginInfoModal } from "./LoginInfoModal";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("LoginInfoModal Component", () => {
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

  it("does not render content when isOpen is false", async () => {
    await act(async () => {
      root.render(<LoginInfoModal isOpen={false} onClose={vi.fn()} />);
    });

    expect(container.textContent).toBe("");
  });

  it("renders header, about section, comparison, and permissions when isOpen is true", async () => {
    await act(async () => {
      root.render(<LoginInfoModal isOpen={true} onClose={vi.fn()} />);
    });

    expect(container.textContent).toContain("Tentang Aplikasi & Izin Akses");
    expect(container.textContent).toContain("Tentang PUSM");
    expect(container.textContent).toContain("Spreadsheet vs PUSM");
    expect(container.textContent).toContain("PUSM Perlu Izin Akun Google");
  });

  it("toggles Google OAuth scope details when button is clicked", async () => {
    await act(async () => {
      root.render(<LoginInfoModal isOpen={true} onClose={vi.fn()} />);
    });

    const toggleBtn = container.querySelector('[data-testid="toggle-scope-details-btn"]') as HTMLButtonElement;
    expect(toggleBtn).toBeDefined();

    // Initially details box is hidden
    expect(container.querySelector('[data-testid="scope-details-box"]')).toBeNull();

    // Click to open
    await act(async () => {
      toggleBtn.click();
    });
    expect(container.querySelector('[data-testid="scope-details-box"]')).not.toBeNull();
    expect(container.textContent).toContain("Cakupan izin OAuth yang digunakan:");

    // Click to close
    await act(async () => {
      toggleBtn.click();
    });
    expect(container.querySelector('[data-testid="scope-details-box"]')).toBeNull();
  });

  it("calls onClose when header close button or footer close button is clicked", async () => {
    const onCloseMock = vi.fn();

    await act(async () => {
      root.render(<LoginInfoModal isOpen={true} onClose={onCloseMock} />);
    });

    const headerCloseBtn = container.querySelector('[data-testid="close-info-modal-btn"]') as HTMLButtonElement;
    expect(headerCloseBtn).toBeDefined();

    await act(async () => {
      headerCloseBtn.click();
    });
    expect(onCloseMock).toHaveBeenCalledTimes(1);

    const footerCloseBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Tutup & Kembali")
    );
    expect(footerCloseBtn).toBeDefined();

    await act(async () => {
      footerCloseBtn?.click();
    });
    expect(onCloseMock).toHaveBeenCalledTimes(2);
  });
});
