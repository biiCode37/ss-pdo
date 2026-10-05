// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  acquireScrollLock,
  getActiveScrollLockCount,
  _resetScrollLockCoordinatorForTest,
} from "./scrollLockCoordinator";

describe("scrollLockCoordinator", () => {
  beforeEach(() => {
    _resetScrollLockCoordinatorForTest();
    document.body.style.overflow = "";
  });

  afterEach(() => {
    _resetScrollLockCoordinatorForTest();
    document.body.style.overflow = "";
  });

  it("acquires lock and restores original empty overflow when released", () => {
    expect(getActiveScrollLockCount()).toBe(0);
    expect(document.body.style.overflow).toBe("");

    const release = acquireScrollLock();
    expect(getActiveScrollLockCount()).toBe(1);
    expect(document.body.style.overflow).toBe("hidden");

    release();
    expect(getActiveScrollLockCount()).toBe(0);
    expect(document.body.style.overflow).toBe("");
  });

  it("preserves and restores non-empty initial overflow value (e.g. 'auto' or 'scroll')", () => {
    document.body.style.overflow = "scroll";

    const release = acquireScrollLock();
    expect(document.body.style.overflow).toBe("hidden");

    release();
    expect(document.body.style.overflow).toBe("scroll");
  });

  it("release function is idempotent and does not decrement counter below zero", () => {
    const release = acquireScrollLock();
    expect(getActiveScrollLockCount()).toBe(1);

    release();
    expect(getActiveScrollLockCount()).toBe(0);

    // Repeated calls
    release();
    release();
    expect(getActiveScrollLockCount()).toBe(0);
    expect(document.body.style.overflow).toBe("");
  });

  it("Order 1: A open -> B open -> B close -> A close maintains lock until last release", () => {
    document.body.style.overflow = "auto";

    const releaseA = acquireScrollLock();
    expect(getActiveScrollLockCount()).toBe(1);
    expect(document.body.style.overflow).toBe("hidden");

    const releaseB = acquireScrollLock();
    expect(getActiveScrollLockCount()).toBe(2);
    expect(document.body.style.overflow).toBe("hidden");

    // Close B first
    releaseB();
    expect(getActiveScrollLockCount()).toBe(1);
    expect(document.body.style.overflow).toBe("hidden"); // Still locked by A!

    // Close A second
    releaseA();
    expect(getActiveScrollLockCount()).toBe(0);
    expect(document.body.style.overflow).toBe("auto"); // Restored!
  });

  it("Order 2: A open -> B open -> A close -> B close prevents premature scroll unlock leak", () => {
    document.body.style.overflow = "scroll";

    const releaseA = acquireScrollLock();
    expect(getActiveScrollLockCount()).toBe(1);
    expect(document.body.style.overflow).toBe("hidden");

    const releaseB = acquireScrollLock();
    expect(getActiveScrollLockCount()).toBe(2);
    expect(document.body.style.overflow).toBe("hidden");

    // Close A first (reversed order)
    releaseA();
    expect(getActiveScrollLockCount()).toBe(1);
    expect(document.body.style.overflow).toBe("hidden"); // Still locked by B!

    // Close B second
    releaseB();
    expect(getActiveScrollLockCount()).toBe(0);
    expect(document.body.style.overflow).toBe("scroll"); // Restored!
  });
});
