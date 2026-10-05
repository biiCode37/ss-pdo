// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  showBulkTripModal,
  showBulkCopyKmModal,
  showFormatSheetConfirm,
} from "./bulkModals";
import { pdoSwal } from "@/utils/swalBase";

vi.mock("@/utils/swalBase", () => ({
  pdoSwal: {
    fire: vi.fn(),
    showValidationMessage: vi.fn(),
    getPopup: vi.fn().mockReturnValue(null),
  },
}));

describe("bulkModals Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("showBulkTripModal", () => {
    it("fires SweetAlert and returns parsed trip data on confirm", async () => {
      vi.mocked(pdoSwal.fire).mockResolvedValue({
        isConfirmed: true,
        value: { tripPergi: "2", tripPulang: "2" },
      } as any);

      const result = await showBulkTripModal({
        currentPergi: "1",
        currentPulang: "1",
        unitCount: 15,
      });

      expect(pdoSwal.fire).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ tripPergi: "2", tripPulang: "2" });
    });

    it("returns null when user cancels bulk trip modal", async () => {
      vi.mocked(pdoSwal.fire).mockResolvedValue({
        isConfirmed: false,
        value: undefined,
      } as any);

      const result = await showBulkTripModal({
        currentPergi: "1",
        currentPulang: "1",
        unitCount: 15,
      });

      expect(result).toBeNull();
    });
  });

  describe("showBulkCopyKmModal", () => {
    it("fires SweetAlert and returns selected copy mode", async () => {
      vi.mocked(pdoSwal.fire).mockResolvedValue({
        isConfirmed: true,
        value: "only_empty",
      } as any);

      const result = await showBulkCopyKmModal({
        totalUnitsWithKmS1: 12,
        emptyKmAwal2Count: 4,
        skippedWithNotesCount: 2,
      });

      expect(pdoSwal.fire).toHaveBeenCalledTimes(1);
      expect(result).toBe("only_empty");
    });

    it("returns null when user cancels bulk copy km modal", async () => {
      vi.mocked(pdoSwal.fire).mockResolvedValue({
        isConfirmed: false,
      } as any);

      const result = await showBulkCopyKmModal({
        totalUnitsWithKmS1: 12,
        emptyKmAwal2Count: 0,
      });

      expect(result).toBeNull();
    });
  });

  describe("showFormatSheetConfirm", () => {
    it("returns true when user confirms format sheet", async () => {
      vi.mocked(pdoSwal.fire).mockResolvedValue({
        isConfirmed: true,
      } as any);

      const result = await showFormatSheetConfirm("Tgl 9");

      expect(pdoSwal.fire).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it("returns false when user cancels format sheet", async () => {
      vi.mocked(pdoSwal.fire).mockResolvedValue({
        isConfirmed: false,
      } as any);

      const result = await showFormatSheetConfirm("Tgl 9");

      expect(result).toBe(false);
    });
  });
});
