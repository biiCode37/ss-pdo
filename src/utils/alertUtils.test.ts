// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCurrentTheme,
  showToast,
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  showConfirmDialog,
  showLogoutConfirm,
  showDeleteQueueConfirm,
  showErrorAlert,
  showAuthExpiredAlert,
  showQueueConflictDialog,
  showBusInputModal,
  pdoSwal,
  pdoToast,
} from "./alertUtils";

describe("alertUtils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCurrentTheme", () => {
    it("returns dark by default if attribute not set", () => {
      document.documentElement.removeAttribute("data-theme");
      expect(getCurrentTheme()).toBe("dark");
    });

    it("returns light when data-theme is set to light", () => {
      document.documentElement.setAttribute("data-theme", "light");
      expect(getCurrentTheme()).toBe("light");
      document.documentElement.setAttribute("data-theme", "dark");
    });
  });

  describe("Toast Notifications", () => {
    it("calls pdoToast.fire with correct default parameters", async () => {
      const toastSpy = vi.spyOn(pdoToast, "fire").mockResolvedValue({} as any);

      await showToast({ title: "Notifikasi Test" });

      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Notifikasi Test",
          icon: "info",
          timer: 3000,
          position: "top",
        }),
      );
    });

    it("showSuccessToast invokes toast with success icon", async () => {
      const toastSpy = vi.spyOn(pdoToast, "fire").mockResolvedValue({} as any);

      await showSuccessToast("Berhasil disimpan");

      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Berhasil disimpan",
          icon: "success",
        }),
      );
    });

    it("showErrorToast invokes toast with error icon", async () => {
      const toastSpy = vi.spyOn(pdoToast, "fire").mockResolvedValue({} as any);

      await showErrorToast("Gagal memproses");

      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Gagal memproses",
          icon: "error",
        }),
      );
    });

    it("showWarningToast invokes toast with warning icon", async () => {
      const toastSpy = vi.spyOn(pdoToast, "fire").mockResolvedValue({} as any);

      await showWarningToast("Periksa kembali data");

      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Periksa kembali data",
          icon: "warning",
        }),
      );
    });

    it("showInfoToast invokes toast with info icon", async () => {
      const toastSpy = vi.spyOn(pdoToast, "fire").mockResolvedValue({} as any);

      await showInfoToast("Mode offline aktif");

      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Mode offline aktif",
          icon: "info",
        }),
      );
    });
  });

  describe("Confirm Dialogs", () => {
    it("showConfirmDialog returns true when confirmed", async () => {
      vi.spyOn(pdoSwal, "fire").mockResolvedValue({ isConfirmed: true } as any);

      const result = await showConfirmDialog({
        title: "Konfirmasi",
        text: "Apakah ingin melanjutkan?",
      });

      expect(result).toBe(true);
    });

    it("showConfirmDialog returns false when cancelled", async () => {
      vi.spyOn(pdoSwal, "fire").mockResolvedValue({
        isConfirmed: false,
      } as any);

      const result = await showConfirmDialog({
        title: "Konfirmasi",
        text: "Apakah ingin melanjutkan?",
      });

      expect(result).toBe(false);
    });

    it("showLogoutConfirm triggers danger confirm dialog", async () => {
      const swalSpy = vi
        .spyOn(pdoSwal, "fire")
        .mockResolvedValue({ isConfirmed: true } as any);

      const result = await showLogoutConfirm();

      expect(result).toBe(true);
      expect(swalSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Yakin Ingin Logout?",
          confirmButtonText: "Ya, Keluar",
          cancelButtonText: "Batal",
        }),
      );
    });

    it("showDeleteQueueConfirm triggers delete confirmation", async () => {
      const swalSpy = vi
        .spyOn(pdoSwal, "fire")
        .mockResolvedValue({ isConfirmed: true } as any);

      const result = await showDeleteQueueConfirm();

      expect(result).toBe(true);
      expect(swalSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Hapus Antrean",
          confirmButtonText: "Hapus",
        }),
      );
    });
  });

  describe("Error and Auth Alerts", () => {
    it("showErrorAlert does nothing if message is null or empty", async () => {
      const swalSpy = vi.spyOn(pdoSwal, "fire");

      await showErrorAlert("Error Title", null);

      expect(swalSpy).not.toHaveBeenCalled();
    });

    it("showErrorAlert fires dialog if message is provided", async () => {
      const swalSpy = vi.spyOn(pdoSwal, "fire").mockResolvedValue({} as any);

      await showErrorAlert("Terjadi Kesalahan", "Gagal memuat data sheet");

      expect(swalSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Terjadi Kesalahan",
          text: "Gagal memuat data sheet",
          icon: "error",
        }),
      );
    });

    it("showAuthExpiredAlert calls onReauth callback when confirmed", async () => {
      vi.spyOn(pdoSwal, "fire").mockResolvedValue({ isConfirmed: true } as any);
      const reauthMock = vi.fn();

      await showAuthExpiredAlert(reauthMock);

      expect(reauthMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("showQueueConflictDialog", () => {
    it("calls onForceSave when confirm button is clicked", async () => {
      vi.spyOn(pdoSwal, "fire").mockResolvedValue({ isConfirmed: true } as any);
      const onServer = vi.fn();
      const onForce = vi.fn();

      await showQueueConflictDialog({
        unitName: "MB-01",
        onUseServer: onServer,
        onForceSave: onForce,
      });

      expect(onForce).toHaveBeenCalledTimes(1);
      expect(onServer).not.toHaveBeenCalled();
    });

    it("calls onUseServer when deny button is clicked", async () => {
      vi.spyOn(pdoSwal, "fire").mockResolvedValue({ isDenied: true } as any);
      const onServer = vi.fn();
      const onForce = vi.fn();

      await showQueueConflictDialog({
        unitName: "MB-01",
        onUseServer: onServer,
        onForceSave: onForce,
      });

      expect(onServer).toHaveBeenCalledTimes(1);
      expect(onForce).not.toHaveBeenCalled();
    });
  });

  describe("showBusInputModal", () => {
    const mockBus = {
      unit: "MB-01",
      toaShift1: "100",
      manualShift1: "10",
      manualShift2: "5",
      totalToa: "200",
      kmAwal1: "1000",
      kmAkhir1: "1100",
      kmAwal2: "1100",
      kmAkhir2: "1200",
      keterangan: "Unit aman",
      toaShift2: "",
      rowIndex: 2,
      originalRow: [],
    };

    it("returns null when user cancels dialog", async () => {
      vi.spyOn(pdoSwal, "fire").mockResolvedValue({ isConfirmed: false } as any);

      const result = await showBusInputModal({
        bus: mockBus,
        activeCategory: "toaShift1",
        tabName: "01-08-2026",
      });

      expect(result).toBeNull();
    });

    it("returns updated data when user confirms single category", async () => {
      const mockResultValue = { toaShift1: "150", keterangan: "Updated note" };
      vi.spyOn(pdoSwal, "fire").mockResolvedValue({
        isConfirmed: true,
        value: mockResultValue,
      } as any);

      const result = await showBusInputModal({
        bus: mockBus,
        activeCategory: "toaShift1",
        tabName: "01-08-2026",
      });

      expect(result).toEqual(mockResultValue);
    });

    it("renders TOA Shift 1 and Manual Shift 1 when activeCategory is toaShift1", async () => {
      const swalSpy = vi.spyOn(pdoSwal, "fire").mockResolvedValue({
        isConfirmed: false,
      } as any);

      await showBusInputModal({
        bus: mockBus,
        activeCategory: "toaShift1",
        tabName: "01-08-2026",
      });

      expect(swalSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "MB-01",
          html: expect.stringContaining("swal-input-manualShift1"),
        }),
      );
    });

    it("renders Total TOA and Manual Shift 2 when activeCategory is totalToa", async () => {
      const swalSpy = vi.spyOn(pdoSwal, "fire").mockResolvedValue({
        isConfirmed: false,
      } as any);

      await showBusInputModal({
        bus: mockBus,
        activeCategory: "totalToa",
        tabName: "01-08-2026",
      });

      expect(swalSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "MB-01",
          html: expect.stringContaining("swal-input-manualShift2"),
        }),
      );
    });

    it("renders progressive disclosure chips when optional fields are empty", async () => {
      const emptyBus = {
        ...mockBus,
        manualShift1: "",
        keterangan: "",
      };

      const swalSpy = vi.spyOn(pdoSwal, "fire").mockResolvedValue({
        isConfirmed: false,
      } as any);

      await showBusInputModal({
        bus: emptyBus,
        activeCategory: "toaShift1",
        tabName: "01-08-2026",
      });

      expect(swalSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "MB-01",
          html: expect.stringContaining("swal-chip-manualShift1"),
        }),
      );
      expect(swalSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("swal-chip-keterangan"),
        }),
      );
    });

    it("renders direct input without chip when optional field already has value", async () => {
      const filledBus = {
        ...mockBus,
        manualShift1: "25",
        keterangan: "Ada catatan",
      };

      const swalSpy = vi.spyOn(pdoSwal, "fire").mockResolvedValue({
        isConfirmed: false,
      } as any);

      await showBusInputModal({
        bus: filledBus,
        activeCategory: "toaShift1",
        tabName: "01-08-2026",
      });

      expect(swalSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "MB-01",
          html: expect.stringContaining('style="display: block;"'),
        }),
      );
    });

    it("renders ALL categories form when activeCategory is ALL", async () => {
      const swalSpy = vi.spyOn(pdoSwal, "fire").mockResolvedValue({
        isConfirmed: false,
      } as any);

      await showBusInputModal({
        bus: mockBus,
        activeCategory: "ALL",
        tabName: "01-08-2026",
      });

      expect(swalSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "MB-01",
          customClass: expect.objectContaining({
            popup: expect.stringContaining("pdo-swal-popup-wide"),
          }),
        }),
      );
    });
  });
});

