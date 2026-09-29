import { describe, it, expect } from "vitest";
import {
  extractLeading3Digits,
  computeRealtimeDistance,
  computeLiveToaShift2,
  sanitizeKmAwal,
  sanitizeKmAkhir,
} from "./busModalOdometer";
import { TEXT_ALERTS } from "@/constants/texts";

describe("busModalOdometer", () => {
  describe("extractLeading3Digits", () => {
    it("returns first 3 digits for formatted numbers", () => {
      expect(extractLeading3Digits("145.820")).toBe("145");
      expect(extractLeading3Digits("145,820")).toBe("145");
      expect(extractLeading3Digits("145820")).toBe("145");
    });

    it("handles short numbers under 3 digits", () => {
      expect(extractLeading3Digits("98")).toBe("98");
      expect(extractLeading3Digits("5")).toBe("5");
    });

    it("returns empty string for null, undefined, or empty strings", () => {
      expect(extractLeading3Digits(null)).toBe("");
      expect(extractLeading3Digits(undefined)).toBe("");
      expect(extractLeading3Digits("")).toBe("");
      expect(extractLeading3Digits("   ")).toBe("");
    });
  });

  describe("computeRealtimeDistance", () => {
    it("returns normal status and positive formatted text when Akhir > Awal", () => {
      const res = computeRealtimeDistance("145.800", "145.920");
      expect(res.diff).toBe(120);
      expect(res.status).toBe("normal");
      expect(res.formattedText).toBe(TEXT_ALERTS.BUS_INPUT_MODAL.DIFF_NORMAL(120));
    });

    it("returns negative status when Akhir < Awal", () => {
      const res = computeRealtimeDistance("145.800", "145.750");
      expect(res.diff).toBe(-50);
      expect(res.status).toBe("negative");
      expect(res.formattedText).toBe(TEXT_ALERTS.BUS_INPUT_MODAL.DIFF_NEGATIVE(-50));
    });

    it("returns extreme status when diff exceeds MAX_SHIFT_DISTANCE_KM", () => {
      const res = computeRealtimeDistance("145.800", "146.300");
      expect(res.diff).toBe(500);
      expect(res.status).toBe("extreme");
      expect(res.formattedText).toBe(
        TEXT_ALERTS.BUS_INPUT_MODAL.DIFF_EXTREME(500, 230),
      );
    });

    it("returns empty status when either input is empty or invalid", () => {
      expect(computeRealtimeDistance("", "145.920").status).toBe("empty");
      expect(computeRealtimeDistance("145.800", "").status).toBe("empty");
      expect(computeRealtimeDistance("abc", "145.920").status).toBe("empty");
    });
  });

  describe("computeLiveToaShift2", () => {
    it("computes valid S2 passengers from Total TOA and TOA S1", () => {
      const res = computeLiveToaShift2("250", "150");
      expect(res.s2).toBe(100);
      expect(res.status).toBe("valid");
      expect(res.formattedText).toBe(TEXT_ALERTS.BUS_INPUT_MODAL.LIVE_TOA_S2_RESULT(250, 150, 100));
    });

    it("returns invalid status when Total TOA is less than TOA S1", () => {
      const res = computeLiveToaShift2("120", "150");
      expect(res.s2).toBe(-30);
      expect(res.status).toBe("invalid");
      expect(res.formattedText).toBe(TEXT_ALERTS.BUS_INPUT_MODAL.LIVE_TOA_S2_INVALID(120, 150));
    });

    it("returns empty status when either input is missing", () => {
      expect(computeLiveToaShift2("", "150").status).toBe("empty");
      expect(computeLiveToaShift2("250", "").status).toBe("empty");
    });
  });

  describe("sanitizeKmAwal", () => {
    it("returns empty string for empty or whitespace-only inputs (batas kosong)", () => {
      expect(sanitizeKmAwal("")).toBe("");
      expect(sanitizeKmAwal("   ")).toBe("");
      expect(sanitizeKmAwal("", "1000", "292000")).toBe("");
    });

    it("clears phantom 3-digit draft matching previous day leading digits", () => {
      // previous day is 292990 -> leading 3 digits is 292
      expect(sanitizeKmAwal("292", undefined, "292990")).toBe("");
      expect(sanitizeKmAwal("292", "", "292990")).toBe("");
      // formatted previous day 292.990
      expect(sanitizeKmAwal("292", undefined, "292.990")).toBe("");
    });

    it("retains 3-digit input if it does NOT match previous day draft", () => {
      expect(sanitizeKmAwal("123", undefined, "292990")).toBe("123");
    });

    it("respects existing saved value even if it is 3 digits or matches previous day draft", () => {
      // Kontrak lama: nilai tersimpan eksisting dihormati
      expect(sanitizeKmAwal("292", "292", "292990")).toBe("292");
      expect(sanitizeKmAwal("100", "100", "100500")).toBe("100");
    });

    it("preserves full KM inputs without alteration", () => {
      expect(sanitizeKmAwal("292003", undefined, "292990")).toBe("292003");
      expect(sanitizeKmAwal("145.820", "145.800", "145.800")).toBe("145.820");
      expect(sanitizeKmAwal("  293000  ", undefined, "292990")).toBe("293000");
    });
  });

  describe("sanitizeKmAkhir", () => {
    it("returns empty string for empty or whitespace-only inputs (batas kosong)", () => {
      expect(sanitizeKmAkhir("", "292000")).toBe("");
      expect(sanitizeKmAkhir("   ", "292000")).toBe("");
      expect(sanitizeKmAkhir("", "", "1050")).toBe("");
    });

    it("clears phantom 3-digit draft prefix of kmAwal", () => {
      // kmAwal is 292000, draft kmAkhir is "292"
      expect(sanitizeKmAkhir("292", "292000")).toBe("");
      expect(sanitizeKmAkhir("145", "145820")).toBe("");
    });

    it("retains 3-digit input if it is not a prefix of kmAwal", () => {
      expect(sanitizeKmAkhir("300", "292000")).toBe("300");
    });

    it("respects existing saved value even if 3 digits and prefix of kmAwal", () => {
      expect(sanitizeKmAkhir("292", "292000", "292")).toBe("292");
    });

    it("preserves full KM inputs without alteration", () => {
      expect(sanitizeKmAkhir("292150", "292000")).toBe("292150");
      expect(sanitizeKmAkhir("145.920", "145.800")).toBe("145.920");
      expect(sanitizeKmAkhir("  292100  ", "292000")).toBe("292100");
    });
  });
});
