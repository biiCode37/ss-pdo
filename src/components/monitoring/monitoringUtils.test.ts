import { describe, it, expect } from "vitest";
import {
  inferStatusCode,
  formatUnitNote,
  extractRouteTroubledUnits,
  formatNumber,
  formatDecimal,
} from "./monitoringUtils";
import type { RegionalRouteItem } from "@/services/allRouteMonitoringService";
import type { DailyFleetShiftWithUnits } from "@/types/supabase";

describe("monitoringUtils - Fleet Extraction & Formatting", () => {
  describe("inferStatusCode", () => {
    it("identifies OFF status correctly with yellow warning theme", () => {
      const res = inferStatusCode("Jadwal Libur", true);
      expect(res.code).toBe("OFF");
      expect(res.color).toBe("var(--color-warning-fg)");
      expect(res.bg).toBe("var(--color-warning-bg)");
      expect(inferStatusCode("Pramudi OFF").code).toBe("OFF");
      expect(inferStatusCode("", false, "OFF").code).toBe("OFF");
    });

    it("identifies TO and TO EVDAL status with red error theme", () => {
      const resTo = inferStatusCode("T.O Radiator Panas");
      expect(resTo.code).toBe("T.O");
      expect(resTo.color).toBe("var(--color-error-fg)");
      expect(resTo.bg).toBe("var(--color-error-bg)");
      expect(inferStatusCode("TO EVDAL").code).toBe("TO EVDAL");
      expect(inferStatusCode("Evdal mogok").code).toBe("TO EVDAL");
    });

    it("identifies SO status", () => {
      expect(inferStatusCode("Stop Operasi Ban").code).toBe("SO");
      expect(inferStatusCode("SO Mesin").code).toBe("SO");
    });

    it("identifies BA codes", () => {
      expect(inferStatusCode("BA.02 Kecelakaan").code).toBe("BA.02");
      expect(inferStatusCode("BA 01 Sakit").code).toBe("BA.01");
      const baRes = inferStatusCode("BA.02 Kecelakaan");
      expect(baRes.color).toBe("var(--color-badge-ba-fg)");
      expect(baRes.bg).toBe("var(--color-badge-ba-bg)");
      expect(baRes.border).toBe("var(--color-badge-ba-border)");
      // Verifikasi bahwa BA berbeda jelas dengan OFF (OFF tetap kuning)
      const offRes = inferStatusCode("OFF");
      expect(offRes.color).toBe("var(--color-warning-fg)");
      expect(baRes.color).not.toBe(offRes.color);
    });

    it("identifies KEUR, TEKNIS, OKB, and RENOP", () => {
      expect(inferStatusCode("Program Keur Berkala").code).toBe("KEUR");
      expect(inferStatusCode("Perbaikan Ac Panas").code).toBe("TEKNIS");
      expect(inferStatusCode("Mogok di jalan").code).toBe("TEKNIS");
      expect(inferStatusCode("OKB Armada").code).toBe("OKB");
      expect(inferStatusCode("Renop").code).toBe("RENOP");
    });
  });

  describe("formatUnitNote", () => {
    it("strips redundant S1: or S2: prefix", () => {
      expect(formatUnitNote("S1: Radiator Bocor")).toBe("Radiator Bocor");
      expect(formatUnitNote("S2: Pramudi Libur")).toBe("Pramudi Libur");
      expect(formatUnitNote("")).toBe("-");
    });
  });

  describe("extractRouteTroubledUnits", () => {
    const baseRoute: RegionalRouteItem = {
      id: 1,
      reportId: 101,
      routeCode: "JAK.01",
      routeName: "Tanjung Priok - Plumpang",
      operatorName: "Mayasari",
      isLooping: false,
      kmBaku: 18,
      targetHk: 2000,
      bestRecord: 2500,
      supervisorName: "Ranto Lumban Toruan",
      defaultRenops: 10,
      renopsShift1: 10,
      realopsShift1: 10,
      renopsShift2: 10,
      realopsShift2: 10,
      totalRenops: 10,
      totalRealops: 10,
      headwayFastest: 3,
      headwaySlowest: 8,
      trafficJamSpots: [],
      operationalIssues: "",
      todayPassengers: 1000,
      yesterdayPassengers: 950,
      lastWeekPassengers: 900,
      totalKm: 500,
      achievementKm: 50,
      status: "submitted",
      toaShift1: 500,
      manualShift1: 0,
      totalShift1: 500,
      toaShift2: 500,
      manualShift2: 0,
      totalShift2: 500,
    };

    it("extracts non-SGO units from fleetShifts and merges duplicates across shifts", () => {
      const mockFleetShifts: DailyFleetShiftWithUnits[] = [
        {
          id: 1,
          route_id: 1,
          route_code: "JAK.01",
          date: "2026-10-30",
          shift: 1,
          target_renops: 10,
          realops: 8,
          total_units: 10,
          sgo_count: 8,
          to_count: 1,
          off_count: 1,
          so_count: 0,
          other_count: 0,
          is_confirmed: true,
          non_sgo_units: [
            {
              id: 1,
              fleet_shift_id: 1,
              unit_body: "KWK 222177",
              status_id: 2,
              status_code: "TO",
              note: "Radiator Panas",
            },
            {
              id: 2,
              fleet_shift_id: 1,
              unit_body: "KWK 222178",
              status_id: 3,
              status_code: "OFF",
              note: "Libur Pramudi",
            },
          ],
        },
        {
          id: 2,
          route_id: 1,
          route_code: "JAK.01",
          date: "2026-10-30",
          shift: 2,
          target_renops: 10,
          realops: 8,
          total_units: 10,
          sgo_count: 8,
          to_count: 1,
          off_count: 1,
          so_count: 0,
          other_count: 0,
          is_confirmed: true,
          non_sgo_units: [
            // KWK 222177 appears in shift 2 as well
            {
              id: 3,
              fleet_shift_id: 2,
              unit_body: "KWK 222177",
              status_id: 2,
              status_code: "TO",
              note: "Radiator Panas (Bengkel)",
            },
          ],
        },
      ];

      const units = extractRouteTroubledUnits(baseRoute, mockFleetShifts);
      expect(units).toHaveLength(2);

      const unit177 = units.find((u) => u.unit === "KWK 222177");
      expect(unit177).toBeDefined();
      expect(unit177?.shifts).toEqual([1, 2]);
      expect(unit177?.statusCode).toBe("T.O");
      expect(unit177?.note).toContain("Radiator Panas");

      const unit178 = units.find((u) => u.unit === "KWK 222178");
      expect(unit178).toBeDefined();
      expect(unit178?.shifts).toEqual([1]);
      expect(unit178?.statusCode).toBe("OFF");
    });

    it("falls back to route fleetStatusShift1 and fleetStatusShift2 when no fleetShifts given", () => {
      const routeWithSheetUnits: RegionalRouteItem = {
        ...baseRoute,
        fleetStatusShift1: [
          {
            unit: "BMP 210001",
            note: "BA.02 Kecelakaan",
            isOff: false,
          },
        ],
        fleetStatusShift2: [
          {
            unit: "BMP 210002",
            note: "Program Keur",
            isOff: false,
          },
        ],
      };

      const units = extractRouteTroubledUnits(routeWithSheetUnits);
      expect(units).toHaveLength(2);
      expect(units[0].unit).toBe("BMP 210001");
      expect(units[0].statusCode).toBe("BA.02");
      expect(units[0].shifts).toEqual([1]);

      expect(units[1].unit).toBe("BMP 210002");
      expect(units[1].statusCode).toBe("KEUR");
      expect(units[1].shifts).toEqual([2]);
    });

    it("returns empty array if no troubled units exist", () => {
      const cleanRoute: RegionalRouteItem = {
        ...baseRoute,
        fleetStatusShift1: [],
        fleetStatusShift2: [],
      };
      const units = extractRouteTroubledUnits(cleanRoute);
      expect(units).toEqual([]);
    });
  });

  describe("number and date formatting", () => {
    it("formats numbers and decimals correctly", () => {
      expect(formatNumber(1250.4)).toBe("1.250");
      expect(formatDecimal(1.56, 1)).toBe("1,6");
    });
  });
});
