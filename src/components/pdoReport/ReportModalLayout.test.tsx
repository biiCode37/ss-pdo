// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { ReportModalLayout } from "./ReportModalLayout";
import { TEXT_PDO_FORM } from "@/constants/texts";
import { _resetModalStackForTest } from "@/utils/modalStackCoordinator";
import {
  _resetScrollLockCoordinatorForTest,
  getActiveScrollLockCount,
} from "@/utils/scrollLockCoordinator";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("ReportModalLayout Component", () => {
  let container: HTMLDivElement;
  let root: Root;

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
    // Bersihkan portal nodes yang mungkin tersisa di document.body
    document.querySelectorAll(".modal-shell-backdrop").forEach((el) => el.remove());
    _resetModalStackForTest();
    _resetScrollLockCoordinatorForTest();
    document.body.style.overflow = "";
  });

  it("renders modal header, subtitle, status badge, and children in portal when isOpen is true", async () => {
    await act(async () => {
      root.render(
        <ReportModalLayout
          isOpen={true}
          onClose={vi.fn()}
          routeCode="4E"
          status="submitted"
        >
          <div id="report-form-body">Isi Form Laporan</div>
        </ReportModalLayout>,
      );
    });

    const backdrop = document.body.querySelector(".modal-shell-backdrop") as HTMLDivElement;
    expect(backdrop).not.toBeNull();
    expect(backdrop.style.display).toBe("flex");
    expect(backdrop.textContent).toContain(TEXT_PDO_FORM.CARD_TITLE);
    expect(backdrop.textContent).toContain(TEXT_PDO_FORM.CARD_SUBTITLE("4E"));
    expect(backdrop.textContent).toContain(TEXT_PDO_FORM.BADGES.SUBMITTED);
    expect(document.body.querySelector("#report-form-body")).not.toBeNull();
    expect(getActiveScrollLockCount()).toBe(1);
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("R95-01: preserves child DOM input value and React local state across open -> edit -> close -> reopen production portal transitions", async () => {
    function ChildForm() {
      const [count, setCount] = useState(0);
      return (
        <div>
          <input id="persistent-text-input" defaultValue="Catatan Awal" />
          <span id="persistent-count">{count}</span>
          <button id="persistent-inc-btn" onClick={() => setCount((c) => c + 1)}>
            Tambah
          </button>
        </div>
      );
    }

    function TransitionHarness({ isOpen }: { isOpen: boolean }) {
      return (
        <ReportModalLayout
          isOpen={isOpen}
          onClose={vi.fn()}
          routeCode="4E"
          status="draft"
        >
          <ChildForm />
        </ReportModalLayout>
      );
    }

    // 1. Buka pertama kali
    await act(async () => {
      root.render(<TransitionHarness isOpen={true} />);
    });

    const backdrop = document.body.querySelector(".modal-shell-backdrop") as HTMLDivElement;
    expect(backdrop).not.toBeNull();
    expect(backdrop.style.display).toBe("flex");

    const input = document.body.querySelector("#persistent-text-input") as HTMLInputElement;
    expect(input.value).toBe("Catatan Awal");

    // 2. Modifikasi nilai input DOM dan state React anak
    await act(async () => {
      input.value = "Laporan operasional modifikasi pengawas";
      const incBtn = document.body.querySelector("#persistent-inc-btn") as HTMLButtonElement;
      incBtn.click();
    });

    expect(document.body.querySelector("#persistent-count")?.textContent).toBe("1");
    expect(input.value).toBe("Laporan operasional modifikasi pengawas");

    // 3. Tutup dialog (isOpen: false) - jalur produksi dengan portal stabil
    await act(async () => {
      root.render(<TransitionHarness isOpen={false} />);
    });

    // Modal disembunyikan menggunakan display: none & aria-hidden, portal tetap di document.body
    expect(backdrop.style.display).toBe("none");
    expect(backdrop.getAttribute("aria-hidden")).toBe("true");
    expect(getActiveScrollLockCount()).toBe(0);
    expect(document.body.style.overflow).toBe("");

    // 4. Buka kembali dialog (isOpen: true)
    await act(async () => {
      root.render(<TransitionHarness isOpen={true} />);
    });

    expect(backdrop.style.display).toBe("flex");
    expect(backdrop.getAttribute("aria-hidden")).toBeNull();
    expect(getActiveScrollLockCount()).toBe(1);
    expect(document.body.style.overflow).toBe("hidden");

    // BUKTI R95-01: Nilai input DOM dan state lokal anak TETAP UTUH tanpa reset!
    const reopenedInput = document.body.querySelector("#persistent-text-input") as HTMLInputElement;
    expect(reopenedInput).toBe(input); // Referensi DOM node sama persis (tidak di-remount)
    expect(reopenedInput.value).toBe("Laporan operasional modifikasi pengawas");
    expect(document.body.querySelector("#persistent-count")?.textContent).toBe("1");
  });

  it("clicking the close button invokes onClose callback", async () => {
    const handleClose = vi.fn();

    await act(async () => {
      root.render(
        <ReportModalLayout
          isOpen={true}
          onClose={handleClose}
          routeCode="4E"
          status="draft"
        >
          <div>Isi</div>
        </ReportModalLayout>,
      );
    });

    const closeBtn = document.body.querySelector('button[title="Tutup"]') as HTMLButtonElement;
    expect(closeBtn).not.toBeNull();

    await act(async () => {
      closeBtn.click();
    });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("pressing Escape invokes onClose callback", async () => {
    const handleClose = vi.fn();

    await act(async () => {
      root.render(
        <ReportModalLayout
          isOpen={true}
          onClose={handleClose}
          routeCode="4E"
          status="draft"
        >
          <div>Isi</div>
        </ReportModalLayout>,
      );
    });

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("handles optional onClose safely without crashing", async () => {
    await act(async () => {
      root.render(
        <ReportModalLayout
          isOpen={true}
          routeCode="4E"
          status="draft"
        >
          <div>Isi Readonly</div>
        </ReportModalLayout>,
      );
    });

    const backdrop = document.body.querySelector(".modal-shell-backdrop") as HTMLDivElement;
    expect(() => {
      backdrop.click();
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    }).not.toThrow();
  });
});
