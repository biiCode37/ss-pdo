// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { ModalShell } from "./ModalShell";
import {
  _resetModalStackForTest,
  getActiveModalStackCount,
} from "@/utils/modalStackCoordinator";
import {
  _resetScrollLockCoordinatorForTest,
  getActiveScrollLockCount,
} from "@/utils/scrollLockCoordinator";

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("ModalShell Component", () => {
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
    _resetModalStackForTest();
    _resetScrollLockCoordinatorForTest();
    document.body.style.overflow = "";
  });

  it("renders accessible dialog attributes and content when isOpen is true", async () => {
    await act(async () => {
      root.render(
        <ModalShell
          isOpen={true}
          title="Uji Dialog Baku"
          id="test-modal-1"
          disablePortal={true}
        >
          <p id="dialog-content">Konten Modal</p>
        </ModalShell>,
      );
    });

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute("aria-modal")).toBe("true");
    expect(dialog?.getAttribute("aria-label")).toBe("Uji Dialog Baku");

    const content = container.querySelector("#dialog-content");
    expect(content?.textContent).toBe("Konten Modal");
  });

  it("returns null when isOpen is false and keepMounted is false", async () => {
    await act(async () => {
      root.render(
        <ModalShell
          isOpen={false}
          title="Tertutup"
          keepMounted={false}
          disablePortal={true}
        >
          <div id="hidden-content">Tidak Terlihat</div>
        </ModalShell>,
      );
    });

    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(container.querySelector("#hidden-content")).toBeNull();
  });

  it("renders with display: none when isOpen is false and keepMounted is true", async () => {
    await act(async () => {
      root.render(
        <ModalShell
          isOpen={false}
          title="Keep Mounted Dialog"
          keepMounted={true}
          disablePortal={true}
        >
          <div id="preserved-content">Tetap Terpasang</div>
        </ModalShell>,
      );
    });

    const backdrop = container.querySelector(".modal-shell-backdrop") as HTMLDivElement;
    expect(backdrop).not.toBeNull();
    expect(backdrop.style.display).toBe("none");
    expect(backdrop.getAttribute("aria-hidden")).toBe("true");

    const content = container.querySelector("#preserved-content");
    expect(content).not.toBeNull();
  });

  it("calls onClose on backdrop click, but NOT when clicking inside content", async () => {
    const handleClose = vi.fn();

    await act(async () => {
      root.render(
        <ModalShell
          isOpen={true}
          onClose={handleClose}
          title="Backdrop Test"
          disablePortal={true}
        >
          <button id="inside-btn">Tombol Dalam</button>
        </ModalShell>,
      );
    });

    // Klik konten dalam dialog -> stopPropagation, TIDAK menutup
    const insideBtn = container.querySelector("#inside-btn") as HTMLButtonElement;
    await act(async () => {
      insideBtn.click();
    });
    expect(handleClose).not.toHaveBeenCalled();

    // Klik backdrop luar dialog -> memanggil onClose
    const backdrop = container.querySelector(".modal-shell-backdrop") as HTMLDivElement;
    await act(async () => {
      backdrop.click();
    });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("manages initial focus and restores focus to trigger element when closed", async () => {
    // 1. Buat elemen pemicu fokus sebelum modal dibuka
    const triggerBtn = document.createElement("button");
    triggerBtn.id = "open-trigger-btn";
    document.body.appendChild(triggerBtn);
    triggerBtn.focus();
    expect(document.activeElement).toBe(triggerBtn);

    function FocusHarness({ isOpen }: { isOpen: boolean }) {
      return (
        <ModalShell
          isOpen={isOpen}
          title="Focus Management"
          disablePortal={true}
        >
          <input id="modal-input" placeholder="Input Pertama" />
        </ModalShell>
      );
    }

    // 2. Buka modal
    await act(async () => {
      root.render(<FocusHarness isOpen={true} />);
    });

    // Tunggu requestAnimationFrame fokus
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const modalInput = container.querySelector("#modal-input") as HTMLInputElement;
    expect(document.activeElement).toBe(modalInput);

    // 3. Tutup modal
    await act(async () => {
      root.render(<FocusHarness isOpen={false} />);
    });

    // Fokus harus dikembalikan ke triggerBtn
    expect(document.activeElement).toBe(triggerBtn);
    triggerBtn.remove();
  });

  it("Topmost dismissal: Escape closes ONLY topmost dialog in nested modal stack", async () => {
    const onCloseA = vi.fn();
    const onCloseB = vi.fn();

    function NestedModalHarness() {
      const [isOpenB, setIsOpenB] = useState(true);

      return (
        <>
          <ModalShell
            isOpen={true}
            onClose={onCloseA}
            id="modal-A"
            title="Modal A"
            disablePortal={true}
          >
            <div>Konten Modal A</div>
          </ModalShell>
          <ModalShell
            isOpen={isOpenB}
            onClose={() => {
              onCloseB();
              setIsOpenB(false);
            }}
            id="modal-B"
            title="Modal B"
            disablePortal={true}
          >
            <div>Konten Modal B (Topmost)</div>
          </ModalShell>
        </>
      );
    }

    await act(async () => {
      root.render(<NestedModalHarness />);
    });

    expect(getActiveModalStackCount()).toBe(2);

    // 1. Tekan tombol Escape saat Modal B di atas Modal A
    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });

    // Hanya Modal B yang dipanggil onClose-nya, Modal A TIDAK terpanggil!
    expect(onCloseB).toHaveBeenCalledTimes(1);
    expect(onCloseA).not.toHaveBeenCalled();

    // Sekarang stack berkurang menjadi 1 (hanya Modal A)
    expect(getActiveModalStackCount()).toBe(1);

    // 2. Tekan Escape kedua kalinya -> sekarang giliran Modal A ditutup
    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });

    expect(onCloseA).toHaveBeenCalledTimes(1);
  });

  it("Scroll Lock Order 1: A buka -> B buka -> B tutup -> A tutup mempertahankan kunci hingga A selesai", async () => {
    document.body.style.overflow = "scroll";

    function NestedScrollHarness({
      openA,
      openB,
    }: {
      openA: boolean;
      openB: boolean;
    }) {
      return (
        <>
          <ModalShell
            isOpen={openA}
            id="modal-scroll-A"
            title="Modal A"
            disablePortal={true}
          >
            <div>A</div>
          </ModalShell>
          <ModalShell
            isOpen={openB}
            id="modal-scroll-B"
            title="Modal B"
            disablePortal={true}
          >
            <div>B</div>
          </ModalShell>
        </>
      );
    }

    // A dan B buka
    await act(async () => {
      root.render(<NestedScrollHarness openA={true} openB={true} />);
    });
    expect(getActiveScrollLockCount()).toBe(2);
    expect(document.body.style.overflow).toBe("hidden");

    // B tutup lebih dulu
    await act(async () => {
      root.render(<NestedScrollHarness openA={true} openB={false} />);
    });
    expect(getActiveScrollLockCount()).toBe(1);
    expect(document.body.style.overflow).toBe("hidden"); // Masih terkunci oleh A!

    // A tutup
    await act(async () => {
      root.render(<NestedScrollHarness openA={false} openB={false} />);
    });
    expect(getActiveScrollLockCount()).toBe(0);
    expect(document.body.style.overflow).toBe("scroll"); // Nilai asli dipulihkan!
  });

  it("Scroll Lock Order 2: A buka -> B buka -> A tutup -> B tetap terkunci tanpa kebocoran scroll", async () => {
    document.body.style.overflow = "auto";

    function NestedScrollHarness({
      openA,
      openB,
    }: {
      openA: boolean;
      openB: boolean;
    }) {
      return (
        <>
          <ModalShell
            isOpen={openA}
            id="modal-scroll-A"
            title="Modal A"
            disablePortal={true}
          >
            <div>A</div>
          </ModalShell>
          <ModalShell
            isOpen={openB}
            id="modal-scroll-B"
            title="Modal B"
            disablePortal={true}
          >
            <div>B</div>
          </ModalShell>
        </>
      );
    }

    // A dan B buka
    await act(async () => {
      root.render(<NestedScrollHarness openA={true} openB={true} />);
    });
    expect(getActiveScrollLockCount()).toBe(2);
    expect(document.body.style.overflow).toBe("hidden");

    // A tutup lebih dulu (urutan terbalik)
    await act(async () => {
      root.render(<NestedScrollHarness openA={false} openB={true} />);
    });
    expect(getActiveScrollLockCount()).toBe(1);
    expect(document.body.style.overflow).toBe("hidden"); // B masih aktif, body tetap terkunci!

    // B tutup
    await act(async () => {
      root.render(<NestedScrollHarness openA={false} openB={false} />);
    });
    expect(getActiveScrollLockCount()).toBe(0);
    expect(document.body.style.overflow).toBe("auto"); // Nilai awal 'auto' dipulihkan!
  });

  it("traps keyboard focus with Tab and Shift+Tab inside active dialog", async () => {
    function TrapHarness() {
      return (
        <ModalShell
          isOpen={true}
          title="Trap Test"
          disablePortal={true}
          id="trap-dialog"
        >
          <input id="input-1" placeholder="Input Satu" />
          <button id="btn-2">Tombol Dua</button>
        </ModalShell>
      );
    }

    await act(async () => {
      root.render(<TrapHarness />);
    });

    const input1 = container.querySelector("#input-1") as HTMLInputElement;
    const btn2 = container.querySelector("#btn-2") as HTMLButtonElement;

    // Fokus awal di elemen pertama
    input1.focus();
    expect(document.activeElement).toBe(input1);

    // Tekan Shift+Tab dari input pertama -> harus melompat ke elemen terakhir (btn2)
    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Tab",
          shiftKey: true,
          bubbles: true,
        }),
      );
    });
    expect(document.activeElement).toBe(btn2);

    // Tekan Tab dari elemen terakhir (btn2) -> harus melompat kembali ke elemen pertama (input1)
    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Tab",
          shiftKey: false,
          bubbles: true,
        }),
      );
    });
    expect(document.activeElement).toBe(input1);
  });

  it("Stacked focus protection (R95-03): closing bottom modal A does NOT steal focus away from active modal B", async () => {
    const triggerOutside = document.createElement("button");
    triggerOutside.id = "outside-trigger";
    document.body.appendChild(triggerOutside);
    triggerOutside.focus();

    function StackedFocusHarness({
      openA,
      openB,
    }: {
      openA: boolean;
      openB: boolean;
    }) {
      return (
        <>
          <ModalShell
            isOpen={openA}
            id="modal-under-A"
            title="Modal Bawah A"
            disablePortal={true}
          >
            <input id="input-A" placeholder="Input A" />
          </ModalShell>
          <ModalShell
            isOpen={openB}
            id="modal-top-B"
            title="Modal Atas B"
            disablePortal={true}
          >
            <input id="input-B" placeholder="Input B" />
          </ModalShell>
        </>
      );
    }

    // 1. Buka Modal A lalu Modal B
    await act(async () => {
      root.render(<StackedFocusHarness openA={true} openB={true} />);
    });

    const inputB = container.querySelector("#input-B") as HTMLInputElement;
    inputB.focus();
    expect(document.activeElement).toBe(inputB);

    // 2. Tutup Modal A (modal di bawah) sementara Modal B masih aktif
    await act(async () => {
      root.render(<StackedFocusHarness openA={false} openB={true} />);
    });

    // MITIGASI R95-03: Fokus TIDAK boleh ditarik keluar ke triggerOutside, harus tetap di inputB modal B!
    expect(document.activeElement).toBe(inputB);

    // 3. Sekarang tutup Modal B (dialog terakhir)
    await act(async () => {
      root.render(<StackedFocusHarness openA={false} openB={false} />);
    });

    // Sekarang seluruh modal telah ditutup, fokus baru kembali ke elemen pemicu luar
    expect(document.activeElement).toBe(triggerOutside);
    triggerOutside.remove();
  });

  it("Dynamic Z-Index stacking: elevates z-index of newly opened modal above existing ones", async () => {
    function ZIndexHarness({ openSecond }: { openSecond: boolean }) {
      return (
        <>
          <ModalShell
            isOpen={true}
            id="modal-high"
            title="High Z-Index Modal"
            zIndex={99999}
            disablePortal={true}
          >
            <div>High</div>
          </ModalShell>
          {openSecond && (
            <ModalShell
              isOpen={true}
              id="modal-second"
              title="Second Modal"
              zIndex={100}
              disablePortal={true}
            >
              <div>Second</div>
            </ModalShell>
          )}
        </>
      );
    }

    // Buka modal pertama dengan zIndex 99999
    await act(async () => {
      root.render(<ZIndexHarness openSecond={false} />);
    });

    const modalHigh = container.querySelector("#modal-high") as HTMLDivElement;
    expect(modalHigh.style.zIndex).toBe("99999");

    // Buka modal kedua dengan base zIndex 100 di atas modal pertama
    await act(async () => {
      root.render(<ZIndexHarness openSecond={true} />);
    });

    const modalSecond = container.querySelector("#modal-second") as HTMLDivElement;
    // z-index modal kedua harus diangkat di atas 99999 agar secara visual berada di depan
    const zSecond = parseInt(modalSecond.style.zIndex, 10);
    expect(zSecond).toBeGreaterThan(99999);
  });
});

