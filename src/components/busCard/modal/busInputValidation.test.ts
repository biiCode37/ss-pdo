import { describe, it, expect } from "vitest";
import {
  validateBusInputForm,
  getCrossDayValidationErrors,
  type ValidateBusInputFormParams,
} from "./busInputValidation";
import type { BusData } from "@/services/googleSheets";
import { TEXT_ALERTS } from "@/constants/texts";

describe("busInputValidation - Pure Validation Module", () => {
  const mockBus: BusData = {
    rowIndex: 2,
    unit: "TJ-0123",
    tripPergi: "4",
    tripPulang: "4",
    kmAwal1: "300100",
    kmAkhir1: "300200",
    kmAwal2: "300200",
    kmAkhir2: "300300",
    toaShift1: "150",
    toaShift2: "150",
    totalToa: "300",
    manualShift1: "",
    manualShift2: "",
    keterangan: "",
    originalRow: [],
  };

  const createBaseParams = (
    overrides: Partial<ValidateBusInputFormParams> = {},
  ): ValidateBusInputFormParams => ({
    isSingleMode: false,
    effectiveCategory: "all",
    tripPergi: "4",
    tripPulang: "4",
    toaShift1: "100",
    toaShift2: "100",
    totalToa: "200",
    manualShift1: "",
    manualShift2: "",
    showManual1: false,
    showManual2: false,
    kmAwal1: "300100",
    kmAkhir1: "300200",
    kmAwal2: "300200",
    kmAkhir2: "300300",
    bus: mockBus,
    bypassOdometerReset: false,
    previousDayKmAkhir2: "300050",
    previousDayDateLabel: "Kemarin",
    ...overrides,
  });

  describe("getCrossDayValidationErrors", () => {
    it("menghasilkan error jika kmAwal1 lebih kecil dari KM Akhir Kemarin", () => {
      const params = createBaseParams({
        kmAwal1: "300000",
        previousDayKmAkhir2: "300050",
      });
      const errors = getCrossDayValidationErrors(params);
      expect(errors.length).toBe(1);
      expect(errors[0]).toContain(TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_SHIFT_1);
      expect(errors[0]).toContain("300000");
      expect(errors[0]).toContain("300050");
    });

    it("tidak menghasilkan error jika bypassOdometerReset aktif", () => {
      const params = createBaseParams({
        kmAwal1: "300000",
        previousDayKmAkhir2: "300050",
        bypassOdometerReset: true,
      });
      const errors = getCrossDayValidationErrors(params);
      expect(errors.length).toBe(0);
    });

    it("Skenario B: memvalidasi kmAwal2 terhadap hari kemarin jika Shift 1 kosong murni", () => {
      const busEmptyS1: BusData = { ...mockBus, kmAwal1: "", kmAkhir1: "" };
      const params = createBaseParams({
        bus: busEmptyS1,
        kmAwal1: "",
        kmAkhir1: "",
        kmAwal2: "300010",
        previousDayKmAkhir2: "300050",
      });
      const errors = getCrossDayValidationErrors(params);
      expect(errors.length).toBe(1);
      expect(errors[0]).toContain(TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_SHIFT_2);
      expect(errors[0]).toContain("300010");
    });
  });

  describe("Single Focus Mode Validation", () => {
    it("kategori toaShift1: memvalidasi TOA S1 dan manual S1 jika showManual1 aktif", () => {
      const params = createBaseParams({
        isSingleMode: true,
        effectiveCategory: "toaShift1",
        toaShift1: "-10",
        manualShift1: "abc",
        showManual1: true,
      });
      const errors = validateBusInputForm(params);
      expect(errors.length).toBe(2);
      expect(errors.some((e) => e.includes(TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TOA_S1))).toBe(true);
      expect(errors.some((e) => e.includes(TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_MANUAL_S1))).toBe(true);
    });

    it("kategori totalToa: memvalidasi totalToa dan toaPair", () => {
      const params = createBaseParams({
        isSingleMode: true,
        effectiveCategory: "totalToa",
        toaShift1: "200",
        totalToa: "100", // Total < Shift 1 -> tidak valid
      });
      const errors = validateBusInputForm(params);
      expect(errors.length).toBe(1);
      expect(errors[0]).toBe(
        TEXT_ALERTS.BUS_INPUT_MODAL.TOTAL_TOA_LESS_THAN_S1("100", "200"),
      );
    });

    it("kategori kmAwal1/kmAkhir1: memvalidasi kmPair dan crossDay", () => {
      const params = createBaseParams({
        isSingleMode: true,
        effectiveCategory: "kmAwal1",
        kmAwal1: "292003",
        kmAkhir1: "291900", // Akhir < Awal
        previousDayKmAkhir2: "292990", // Awal < Kemarin
      });
      const errors = validateBusInputForm(params);
      expect(errors.length).toBe(2);
      expect(errors.some((e) => e.includes("tidak boleh lebih kecil dari Kemarin"))).toBe(true);
      expect(errors.some((e) => e.includes("tidak boleh lebih kecil dari KM Awal"))).toBe(true);
    });

    it("kategori kmAwal2/kmAkhir2: memvalidasi kmPair shift 2", () => {
      const params = createBaseParams({
        isSingleMode: true,
        effectiveCategory: "kmAkhir2",
        kmAwal2: "300300",
        kmAkhir2: "300250", // Akhir < Awal
      });
      const errors = validateBusInputForm(params);
      expect(errors.length).toBe(1);
      expect(errors[0]).toContain(TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_SHIFT_2);
    });
  });

  describe("Mode All Validation", () => {
    it("mengembalikan array kosong jika seluruh field valid", () => {
      const params = createBaseParams();
      const errors = validateBusInputForm(params);
      expect(errors).toEqual([]);
    });

    it("memvalidasi trip count negatif atau non-numerik", () => {
      const params = createBaseParams({
        tripPergi: "-2",
        tripPulang: "abc",
      });
      const errors = validateBusInputForm(params);
      expect(errors.length).toBe(2);
    });

    it("menggunakan headerMap untuk custom trip labels", () => {
      const params = createBaseParams({
        tripPergi: "-1",
        headerMap: {
          tripPergiLabel: "Trip Pagi Arah 1",
          tripPulangLabel: "Trip Pagi Arah 2",
        } as any,
      });
      const errors = validateBusInputForm(params);
      expect(errors.some((e) => e.includes("Trip Pagi Arah 1"))).toBe(true);
    });

    it("memvalidasi format desimal/ribuan Indonesia via parseIndonesianNumber", () => {
      // 1. Desimal koma Indonesia yang valid (150,5) -> tidak menghasilkan error
      const paramsValidDecimal = createBaseParams({
        toaShift1: "150,5",
        toaShift2: "",
        totalToa: "150,5",
      });
      const errorsValid = validateBusInputForm(paramsValidDecimal);
      expect(errorsValid).toEqual([]);

      // 2. Format ribuan Indonesia yang melebihi batas TOA (1.200 -> 1200 > 999)
      const paramsExceed = createBaseParams({
        toaShift1: "1.200",
      });
      const errorsExceed = validateBusInputForm(paramsExceed);
      expect(errorsExceed.length).toBe(1);
      expect(errorsExceed[0]).toBe(
        TEXT_ALERTS.BUS_INPUT_MODAL.TOA_MAX_DIGITS(
          TEXT_ALERTS.BUS_INPUT_MODAL.LABEL_TOA_S1,
          999,
        ),
      );
    });

    it("memvalidasi ketidaksesuaian antarshift (cross shift): S1 dimulai tapi belum ditutup saat S2 diisi", () => {
      const params = createBaseParams({
        kmAwal1: "300100",
        kmAkhir1: "", // S1 belum ditutup
        kmAwal2: "300200", // S2 dicoba diisi
        kmAkhir2: "300300",
      });
      const errors = validateBusInputForm(params);
      expect(errors.length).toBe(1);
      expect(errors[0]).toBe(
        TEXT_ALERTS.BUS_INPUT_MODAL.VALIDATION_KM_S2_REQUIRES_S1_CLOSED,
      );
    });
  });
});
