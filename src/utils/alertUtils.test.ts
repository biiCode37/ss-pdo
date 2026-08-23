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
  showFormatSheetConfirm,
  pdoSwal,
  pdoToast,
} from "./alertUtils";
import { getKeteranganColor, getRowEndCol } from "./sheetColorUtils";

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

    it("preConfirm correctly extracts toaShift1 and manualShift1 from DOM", async () => {
      let capturedOptions: any = null;
      vi.spyOn(pdoSwal, "fire").mockImplementation((options: any) => {
        capturedOptions = options;
        return Promise.resolve({ isConfirmed: false } as any);
      });

      await showBusInputModal({
        bus: mockBus,
        activeCategory: "toaShift1",
        tabName: "01-08-2026",
      });

      expect(capturedOptions).not.toBeNull();
      const popupDiv = document.createElement("div");
      popupDiv.innerHTML = capturedOptions.html;
      document.body.appendChild(popupDiv);

      vi.spyOn(pdoSwal, "getPopup").mockReturnValue(popupDiv as any);

      // Set input value
      const toaInput = popupDiv.querySelector<HTMLInputElement>("#swal-input-toaShift1");
      expect(toaInput).not.toBeNull();
      if (toaInput) toaInput.value = "175";

      const updates = capturedOptions.preConfirm();
      expect(updates).toEqual(
        expect.objectContaining({
          toaShift1: "175",
        }),
      );

      document.body.removeChild(popupDiv);
    });

    it("preConfirm correctly extracts totalToa and manualShift2 from DOM", async () => {
      let capturedOptions: any = null;
      vi.spyOn(pdoSwal, "fire").mockImplementation((options: any) => {
        capturedOptions = options;
        return Promise.resolve({ isConfirmed: false } as any);
      });

      await showBusInputModal({
        bus: mockBus,
        activeCategory: "totalToa",
        tabName: "01-08-2026",
      });

      expect(capturedOptions).not.toBeNull();
      const popupDiv = document.createElement("div");
      popupDiv.innerHTML = capturedOptions.html;
      document.body.appendChild(popupDiv);

      vi.spyOn(pdoSwal, "getPopup").mockReturnValue(popupDiv as any);

      const totalToaInput = popupDiv.querySelector<HTMLInputElement>("#swal-input-totalToa");
      expect(totalToaInput).not.toBeNull();
      if (totalToaInput) totalToaInput.value = "280";

      const updates = capturedOptions.preConfirm();
      expect(updates).toEqual(
        expect.objectContaining({
          totalToa: "280",
        }),
      );

      document.body.removeChild(popupDiv);
    });

    it("preConfirm correctly extracts KM single input from DOM", async () => {
      let capturedOptions: any = null;
      vi.spyOn(pdoSwal, "fire").mockImplementation((options: any) => {
        capturedOptions = options;
        return Promise.resolve({ isConfirmed: false } as any);
      });

      await showBusInputModal({
        bus: mockBus,
        activeCategory: "kmAwal1",
        tabName: "01-08-2026",
      });

      expect(capturedOptions).not.toBeNull();
      const popupDiv = document.createElement("div");
      popupDiv.innerHTML = capturedOptions.html;
      document.body.appendChild(popupDiv);

      vi.spyOn(pdoSwal, "getPopup").mockReturnValue(popupDiv as any);

      const kmInput = popupDiv.querySelector<HTMLInputElement>("#swal-input-single");
      expect(kmInput).not.toBeNull();
      if (kmInput) kmInput.value = "150000";

      const updates = capturedOptions.preConfirm();
      expect(updates).toEqual(
        expect.objectContaining({
          kmAwal1: "150000",
        }),
      );

      document.body.removeChild(popupDiv);
    });

    it("renders KM Awal S1 reference banner when activeCategory is kmAkhir1", async () => {
      const swalSpy = vi.spyOn(pdoSwal, "fire").mockResolvedValue({
        isConfirmed: false,
      } as any);

      await showBusInputModal({
        bus: { ...mockBus, kmAwal1: "123456" },
        activeCategory: "kmAkhir1",
        tabName: "01-08-2026",
      });

      expect(swalSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("KM Awal S1 (Acuan):"),
        }),
      );
      expect(swalSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("123456"),
        }),
      );
    });

    it("renders KM Awal S2 reference banner when activeCategory is kmAkhir2", async () => {
      const swalSpy = vi.spyOn(pdoSwal, "fire").mockResolvedValue({
        isConfirmed: false,
      } as any);

      await showBusInputModal({
        bus: { ...mockBus, kmAwal2: "654321" },
        activeCategory: "kmAkhir2",
        tabName: "01-08-2026",
      });

      expect(swalSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("KM Awal S2 (Acuan):"),
        }),
      );
      expect(swalSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("654321"),
        }),
      );
    });
  });

  describe("getKeteranganColor", () => {
    it("returns skyblue for BA (1-4), NP1, and NP2", () => {
      const skyblue = { red: 0.53, green: 0.81, blue: 0.98 };

      expect(getKeteranganColor("BA.01 RADIATOR BOCOR")).toEqual(skyblue);
      expect(getKeteranganColor("BA.02 AC PANAS")).toEqual(skyblue);
      expect(getKeteranganColor("BA.03 SPION PATAH")).toEqual(skyblue);
      expect(getKeteranganColor("BA.04 TERHAMBAT BANJIR")).toEqual(skyblue);
      expect(getKeteranganColor("NP1")).toEqual(skyblue);
      expect(getKeteranganColor("NP2")).toEqual(skyblue);
    });

    it("returns yellow for OFF", () => {
      const yellow = { red: 1.0, green: 0.95, blue: 0.3 };

      expect(getKeteranganColor("OFF")).toEqual(yellow);
      expect(getKeteranganColor("OFF (LIBUR)")).toEqual(yellow);
    });

    it("returns red for TO EVDAL", () => {
      const red = { red: 0.95, green: 0.35, blue: 0.35 };

      expect(getKeteranganColor("TO EVDAL")).toEqual(red);
      expect(getKeteranganColor("TO-EVDAL")).toEqual(red);
    });

    it("returns light green for other non-empty notes", () => {
      const lightGreen = { red: 0.56, green: 0.93, blue: 0.56 };

      expect(getKeteranganColor("GANTI BAN SERAP")).toEqual(lightGreen);
      expect(getKeteranganColor("TUKAR BUS DI TERMINAL")).toEqual(lightGreen);
      expect(getKeteranganColor("AC KURANG DINGIN")).toEqual(lightGreen);
    });

    it("returns null only for empty string or whitespace", () => {
      expect(getKeteranganColor("")).toBeNull();
      expect(getKeteranganColor("   ")).toBeNull();
    });
  });

  describe("showFormatSheetConfirm", () => {
    it("returns true when confirmed", async () => {
      const swalSpy = vi
        .spyOn(pdoSwal, "fire")
        .mockResolvedValue({ isConfirmed: true } as any);

      const result = await showFormatSheetConfirm("01-08-2026");

      expect(swalSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Rapikan & Format Spreadsheet?",
          html: expect.stringContaining("01-08-2026"),
          icon: "question",
        }),
      );
      expect(result).toBe(true);
    });

    it("returns false when dismissed", async () => {
      vi.spyOn(pdoSwal, "fire").mockResolvedValue({ isConfirmed: false } as any);

      const result = await showFormatSheetConfirm("01-08-2026");
      expect(result).toBe(false);
    });
  });

  describe("getRowEndCol", () => {
    it("returns totalKmShift2 + 1 when totalKmShift2 is present", () => {
      const headerMap = {
        unit: 2,
        kmAkhir2: 20,
        totalKmShift1: 21,
        totalKmShift2: 22,
      };
      expect(getRowEndCol(headerMap)).toBe(23);
    });

    it("returns totalKmShift1 + 2 when totalKmShift2 is missing", () => {
      const headerMap = {
        unit: 2,
        kmAkhir2: 20,
        totalKmShift1: 21,
      };
      expect(getRowEndCol(headerMap)).toBe(23);
    });

    it("returns kmAkhir2 + 3 when both total KM columns are missing from map", () => {
      const headerMap = {
        unit: 2,
        kmAkhir2: 20,
      };
      expect(getRowEndCol(headerMap)).toBe(23);
    });
  });
});

