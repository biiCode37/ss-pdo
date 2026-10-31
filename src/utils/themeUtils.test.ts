// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import { syncThemeChrome } from "./themeUtils";

describe("themeUtils - syncThemeChrome", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
  });

  it("creates meta#app-theme-color when not present and sets dark color", () => {
    syncThemeChrome("dark");
    const meta = document.querySelector<HTMLMetaElement>("meta#app-theme-color");
    expect(meta).not.toBeNull();
    expect(meta?.getAttribute("content")).toBe("#0b0f19");
  });

  it("updates meta#app-theme-color to light color when theme is light", () => {
    syncThemeChrome("dark");
    syncThemeChrome("light");
    const meta = document.querySelector<HTMLMetaElement>("meta#app-theme-color");
    expect(meta?.getAttribute("content")).toBe("#f8fafc");
  });
});

