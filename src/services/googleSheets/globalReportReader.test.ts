import { describe, it, expect } from "vitest";
import {
  parseGlobalSheetDateBlock,
  normalizeRouteCode,
} from "./globalReportReader";

describe("Global Spreadsheet Reader (globalReportReader)", () => {
  describe("normalizeRouteCode", () => {
    it("normalizes various route code formats to canonical JAK.XX", () => {
      expect(normalizeRouteCode("JAK 01")).toBe("JAK.01");
      expect(normalizeRouteCode("JAK 05")).toBe("JAK.05");
      expect(normalizeRouteCode("JAK.15")).toBe("JAK.15");
      expect(normalizeRouteCode("JAK 110A")).toBe("JAK.110A");
      expect(normalizeRouteCode("JAK 110 A")).toBe("JAK.110A");
      expect(normalizeRouteCode("JAK-120")).toBe("JAK.120");
    });
  });

  describe("parseGlobalSheetDateBlock", () => {
    // Simulasi struktur raw 2D array dari Google Sheets API (values)
    const createMockSpreadsheetRows = () => {
      const rows: any[][] = [];
      // Buat 100 baris kosong
      for (let i = 0; i < 60; i++) {
        rows.push(new Array(45).fill(""));
      }

      // Day 2 ada di baris 29 (index 28)
      // Header row
      rows[28][0] = "2026-09-02";
      rows[28][1] = "NO";
      rows[28][2] = "RUTE";
      rows[28][3] = "RENOPS";
      rows[28][4] = "REALOPS";
      rows[28][5] = "KM TEMPUH";
      rows[28][6] = "TOA SHIFT 1";
      rows[28][7] = "MANUAL SHIFT 1";
      rows[28][8] = "TOTAL SHIFT 1";
      rows[28][9] = "TOA SHIFT 2";
      rows[28][10] = "MANUAL SHIFT 2";
      rows[28][11] = "TOTAL SHIFT 2";
      rows[28][12] = "TOTAL PELANGGAN";
      rows[28][13] = "KILOMETER / BUS";
      rows[28][14] = "TARGET PELANGGAN";
      rows[28][19] = "TOTAL RITASE";

      // Data rute Day 2 dimulai dari baris index 32 (Row 33)
      // JAK 01
      rows[32][1] = "1";
      rows[32][2] = "JAK 01";
      rows[32][3] = "20";
      rows[32][4] = "20";
      rows[32][5] = "3.560,964";
      rows[32][6] = "1.873";
      rows[32][7] = "0";
      rows[32][8] = "1.873";
      rows[32][9] = "3.204";
      rows[32][10] = "0";
      rows[32][11] = "3.204";
      rows[32][12] = "5.077";
      rows[32][13] = "178,05";
      rows[32][14] = "5.161";
      rows[32][19] = "247";

      // JAK 05
      rows[33][1] = "2";
      rows[33][2] = "JAK 05";
      rows[33][3] = "33";
      rows[33][4] = "33";
      rows[33][5] = "6.528,833";
      rows[33][6] = "2.700";
      rows[33][7] = "104";
      rows[33][8] = "2.804";
      rows[33][9] = "3.205";
      rows[33][10] = "102";
      rows[33][11] = "3.307";
      rows[33][12] = "6.111";
      rows[33][13] = "197,84";
      rows[33][14] = "7.315";
      rows[33][19] = "310";

      return rows;
    };

    it("parses 18 routes correctly for target day", () => {
      const mockRows = createMockSpreadsheetRows();
      const resultMap = parseGlobalSheetDateBlock(mockRows, 2);

      expect(resultMap.size).toBeGreaterThanOrEqual(2);

      const jak01 = resultMap.get("JAK.01");
      expect(jak01).toBeDefined();
      expect(jak01?.routeCode).toBe("JAK.01");
      expect(jak01?.renops).toBe(20);
      expect(jak01?.realops).toBe(20);
      expect(jak01?.kmTempuh).toBeCloseTo(3560.964);
      expect(jak01?.toaShift1).toBe(1873);
      expect(jak01?.manualShift1).toBe(0);
      expect(jak01?.totalShift1).toBe(1873);
      expect(jak01?.toaShift2).toBe(3204);
      expect(jak01?.manualShift2).toBe(0);
      expect(jak01?.totalShift2).toBe(3204);
      expect(jak01?.totalPassengers).toBe(5077);
      expect(jak01?.targetPassengers).toBe(5161);

      const jak05 = resultMap.get("JAK.05");
      expect(jak05).toBeDefined();
      expect(jak05?.toaShift1).toBe(2700);
      expect(jak05?.manualShift1).toBe(104);
      expect(jak05?.totalShift1).toBe(2804);
      expect(jak05?.toaShift2).toBe(3205);
      expect(jak05?.manualShift2).toBe(102);
      expect(jak05?.totalShift2).toBe(3307);
      expect(jak05?.totalPassengers).toBe(6111);
    });

    it("returns empty map if target day block is not found", () => {
      const mockRows = createMockSpreadsheetRows();
      // Minta day 25 yang tidak ada di 60 baris
      const resultMap = parseGlobalSheetDateBlock(mockRows, 25);
      expect(resultMap.size).toBe(0);
    });

    it("handles shifted column index when leading empty cells are stripped", () => {
      const rows: any[][] = [];
      for (let i = 0; i < 40; i++) rows.push([]);

      // Day 1: Baris 0 adalah Header, Baris 4 adalah Data tanpa leading cell (Kolom B jadi index 0, RUTE jadi index 1)
      rows[1] = ["2026-09-01", "NO", "RUTE", "RENOPS", "REALOPS", "KM", "TOA1", "MAN1", "TOT1", "TOA2", "MAN2", "TOT2", "TOTAL"];
      rows[5] = ["1", "JAK 110A", "30", "30", "6034.9", "1876", "79", "1955", "2967", "116", "3083", "5062"];

      const resultMap = parseGlobalSheetDateBlock(rows, 1);
      expect(resultMap.size).toBe(1);
      const jak110a = resultMap.get("JAK.110A");
      expect(jak110a).toBeDefined();
      expect(jak110a?.renops).toBe(30);
      expect(jak110a?.toaShift1).toBe(1876);
      expect(jak110a?.toaShift2).toBe(2967);
      expect(jak110a?.totalPassengers).toBe(5062);
    });
  });
});
