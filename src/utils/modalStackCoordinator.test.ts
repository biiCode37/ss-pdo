// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import {
  registerModalDismiss,
  isTopmostModal,
  getTopmostModal,
  getHighestActiveZIndex,
  getActiveModalStackCount,
  _resetModalStackForTest,
} from "./modalStackCoordinator";

describe("modalStackCoordinator", () => {
  beforeEach(() => {
    _resetModalStackForTest();
  });

  it("registers modals and tracks topmost modal in LIFO order", () => {
    expect(getActiveModalStackCount()).toBe(0);
    expect(isTopmostModal("modal-1")).toBe(false);

    const unreg1 = registerModalDismiss({
      id: "modal-1",
      onDismiss: () => {},
      zIndex: 100,
    });

    expect(getActiveModalStackCount()).toBe(1);
    expect(isTopmostModal("modal-1")).toBe(true);
    expect(getTopmostModal()?.id).toBe("modal-1");

    const unreg2 = registerModalDismiss({
      id: "modal-2",
      onDismiss: () => {},
      zIndex: 200,
    });

    expect(getActiveModalStackCount()).toBe(2);
    expect(isTopmostModal("modal-1")).toBe(false);
    expect(isTopmostModal("modal-2")).toBe(true);
    expect(getTopmostModal()?.id).toBe("modal-2");

    // Unregister topmost (modal-2)
    unreg2();
    expect(getActiveModalStackCount()).toBe(1);
    expect(isTopmostModal("modal-1")).toBe(true);
    expect(getTopmostModal()?.id).toBe("modal-1");

    unreg1();
    expect(getActiveModalStackCount()).toBe(0);
    expect(getTopmostModal()).toBeUndefined();
  });

  it("calculates highest active z-index correctly", () => {
    expect(getHighestActiveZIndex()).toBe(0);

    const unreg1 = registerModalDismiss({
      id: "modal-a",
      onDismiss: () => {},
      zIndex: 100,
    });
    expect(getHighestActiveZIndex()).toBe(100);

    const unreg2 = registerModalDismiss({
      id: "modal-b",
      onDismiss: () => {},
      zIndex: 99999,
    });
    expect(getHighestActiveZIndex()).toBe(99999);

    const unreg3 = registerModalDismiss({
      id: "modal-c",
      onDismiss: () => {},
      zIndex: 500,
    });
    // Modal C memiliki zIndex 500, tertinggi tetap 99999
    expect(getHighestActiveZIndex()).toBe(99999);

    unreg2(); // Hapus modal B (99999)
    // Sekarang tertinggi adalah modal C (500)
    expect(getHighestActiveZIndex()).toBe(500);

    unreg3();
    expect(getHighestActiveZIndex()).toBe(100);

    unreg1();
    expect(getHighestActiveZIndex()).toBe(0);
  });

  it("handles duplicate unregistration idempotently", () => {
    const unreg = registerModalDismiss({
      id: "modal-x",
      onDismiss: () => {},
      zIndex: 10,
    });
    expect(getActiveModalStackCount()).toBe(1);

    unreg();
    expect(getActiveModalStackCount()).toBe(0);

    // Call again - should not error or reduce below 0
    unreg();
    expect(getActiveModalStackCount()).toBe(0);
  });

  it("MITIGASI R97-01: updates callback in-place without altering stack order when re-registering existing id", () => {
    let callbackAInvocation = 0;
    let callbackBInvocation = 0;
    let callbackA2Invocation = 0;

    // 1. Daftarkan modal-1 (bawah)
    const unreg1 = registerModalDismiss({
      id: "modal-1",
      onDismiss: () => {
        callbackAInvocation++;
      },
      zIndex: 100,
    });

    // 2. Daftarkan modal-2 (atas)
    const unreg2 = registerModalDismiss({
      id: "modal-2",
      onDismiss: () => {
        callbackBInvocation++;
      },
      zIndex: 200,
    });

    expect(getActiveModalStackCount()).toBe(2);
    expect(isTopmostModal("modal-1")).toBe(false);
    expect(isTopmostModal("modal-2")).toBe(true);

    // 3. Modal-1 didaftarkan ulang dengan callback baru (simulasi re-render parent dengan inline arrow function)
    const unreg1Updated = registerModalDismiss({
      id: "modal-1",
      onDismiss: () => {
        callbackA2Invocation++;
      },
      zIndex: 100,
    });

    // POSISI STACK TIDAK BOLEH BERUBAH: modal-2 tetap topmost!
    expect(getActiveModalStackCount()).toBe(2);
    expect(isTopmostModal("modal-2")).toBe(true);
    expect(isTopmostModal("modal-1")).toBe(false);

    // 4. Modal-2 ditutup
    unreg2();
    expect(getActiveModalStackCount()).toBe(1);
    expect(isTopmostModal("modal-1")).toBe(true);

    // 5. Callback modal-1 sekarang adalah callback yang sudah diperbarui (A2), bukan yang lama (A)
    const topmost = getTopmostModal();
    topmost?.onDismiss();
    expect(callbackAInvocation).toBe(0);
    expect(callbackBInvocation).toBe(0);
    expect(callbackA2Invocation).toBe(1);

    unreg1Updated();
    unreg1(); // Idempotent cleanup call
    expect(getActiveModalStackCount()).toBe(0);
  });
});
