// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import {
  getAllStoredOdometers,
  getStoredOdometerForUnit,
  saveStoredOdometers,
  ODOMETER_REGISTRY_STORAGE_KEY,
} from "./odometerRegistry";

describe("odometerRegistry utility", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty object if no odometers are stored", () => {
    expect(getAllStoredOdometers()).toEqual({});
    expect(getStoredOdometerForUnit("JAK.15-09")).toBeNull();
  });

  it("saves and retrieves odometers by unit key case-insensitively", () => {
    saveStoredOdometers({
      "JAK.15-09": { km: "125430", dateLabel: "Tgl 18" },
      "JAK.15-10": { km: "98420", dateLabel: "Kemarin" },
    });

    const result1 = getStoredOdometerForUnit("JAK.15-09");
    expect(result1).not.toBeNull();
    expect(result1?.km).toBe("125430");
    expect(result1?.dateLabel).toBe("Tgl 18");

    // Case insensitive check
    const resultLowercase = getStoredOdometerForUnit("jak.15-09");
    expect(resultLowercase?.km).toBe("125430");

    const result2 = getStoredOdometerForUnit("JAK.15-10");
    expect(result2?.km).toBe("98420");
    expect(result2?.dateLabel).toBe("Kemarin");
  });

  it("ignores empty or invalid entries gracefully", () => {
    saveStoredOdometers({
      "": { km: "100", dateLabel: "Tgl 1" },
      "JAK.15-11": { km: "", dateLabel: "Tgl 1" },
    });

    expect(getAllStoredOdometers()).toEqual({});
  });

  it("handles corrupted localStorage data without throwing", () => {
    localStorage.setItem(ODOMETER_REGISTRY_STORAGE_KEY, "invalid-json-string");
    expect(getAllStoredOdometers()).toEqual({});
    expect(getStoredOdometerForUnit("JAK.15-09")).toBeNull();
  });
});
