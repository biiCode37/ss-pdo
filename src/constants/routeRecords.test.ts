import { describe, it, expect } from "vitest";
import { ROUTE_MASTER_PEAK_RECORDS, getRoutePeakRecord } from "./routeRecords";

describe("Route Peak Records SSOT", () => {
  it("contains all 18 routes with peak numbers and dates", () => {
    expect(Object.keys(ROUTE_MASTER_PEAK_RECORDS)).toHaveLength(18);
    expect(ROUTE_MASTER_PEAK_RECORDS["JAK.60"].peak).toBe(5297);
    expect(ROUTE_MASTER_PEAK_RECORDS["JAK.60"].date).toBe("Kamis, 01 Oktober 2026");
    expect(ROUTE_MASTER_PEAK_RECORDS["JAK.01"].date).toBe("Senin, 19 Oktober 2026");
  });

  it("resolves route peak records with both dot and space formats", () => {
    const r1 = getRoutePeakRecord("JAK.60");
    const r2 = getRoutePeakRecord("JAK 60");
    expect(r1).toBeDefined();
    expect(r2).toBeDefined();
    expect(r1?.peak).toBe(5297);
    expect(r2?.peak).toBe(5297);
    expect(r2?.date).toBe("Kamis, 01 Oktober 2026");
  });
});
