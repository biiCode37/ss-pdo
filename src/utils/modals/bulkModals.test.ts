// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  showBulkTripModal,
  showBulkCopyKmModal,
  showFormatSheetConfirm,
} from "./bulkModals";
import { pdoSwal } from "@/utils/swalBase";
import { TEXT_ALERTS } from "@/constants/texts";

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

    describe("mode aktivasi (Aktifkan Input 1 unit)", () => {
      const runPreConfirm = async (pergi: string, pulang: string) => {
        vi.mocked(pdoSwal.fire).mockResolvedValue({ isConfirmed: false } as any);
        await showBulkTripModal({ unitCount: 1, isActivation: true });
        const opts = vi.mocked(pdoSwal.fire).mock.calls[0][0] as any;
        document.body.innerHTML = opts.html;
        (document.getElementById("swal-bulk-tripPergi") as HTMLInputElement).value = pergi;
        (document.getElementById("swal-bulk-tripPulang") as HTMLInputElement).value = pulang;
        const out = opts.preConfirm();
        document.body.innerHTML = "";
        return { opts, out };
      };

      it("judul & deskripsi aktivasi, tanpa petunjuk kosongkan trip", async () => {
        const { opts } = await runPreConfirm("4", "3");
        expect(opts.title).toBe(TEXT_ALERTS.BUS_INPUT_MODAL.ACTIVATE_INPUT_PROMPT_TITLE);
        expect(opts.html).toContain("Trip Pergi");
        expect(opts.html).not.toContain(TEXT_ALERTS.BULK_TRIP.CLEAR_HINT);
      });

      it("trip pergi & pulang valid dikembalikan apa adanya", async () => {
        const { out } = await runPreConfirm("4", "3");
        expect(out).toEqual({ tripPergi: "4", tripPulang: "3" });
      });

      it.each([
        ["", ""],
        ["4", ""],
        ["0", "0"],
      ])("menolak pergi=%j pulang=%j (unit tidak bisa aktif tanpa trip)", async (p, q) => {
        const { out } = await runPreConfirm(p, q);
        expect(out).toBe(false);
        expect(pdoSwal.showValidationMessage).toHaveBeenCalledWith(
          TEXT_ALERTS.BUS_INPUT_MODAL.ACTIVATE_INPUT_INVALID_RITASE,
        );
      });
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
