import { describe, it, expect } from "vitest";
import {
  extractLeading3Digits,
  computeRealtimeDistance,
  computeLiveToaShift2,
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
});
