import { describe, it, expect } from "vitest";
import {
  buildBusInputPayload,
  computeEffectiveTotalToa,
  type BuildBusInputPayloadParams,
} from "./busInputPayload";
import type { BusData } from "@/services/googleSheets";

describe("busInputPayload - Pure Payload Module", () => {
  const mockBus: BusData = {
    rowIndex: 3,
    unit: "TJ-0567",
    tripPergi: "2",
    tripPulang: "2",
    kmAwal1: "200100",
    kmAkhir1: "200200",
    kmAwal2: "200200",
    kmAkhir2: "200300",
    toaShift1: "120",
    toaShift2: "130",
    totalToa: "250",
    manualShift1: "",
    manualShift2: "",
    keterangan: "Awal",
    originalRow: [],
  };

  const createBaseParams = (
    overrides: Partial<BuildBusInputPayloadParams> = {},
  ): BuildBusInputPayloadParams => ({
    isSingleMode: false,
    effectiveCategory: "all",
    tripPergi: "5",
    tripPulang: "5",
    toaShift1: "150",
    toaShift2: "150",
    totalToa: "300",
    manualShift1: "10",
    manualShift2: "20",
    showManual1: true,
    showManual2: true,
    kmAwal1: "200100",
    kmAkhir1: "200200",
    kmAwal2: "200200",
    kmAkhir2: "200300",
    isKmAwal1Valid: true,
    isKmAwal2Valid: true,
    isKmAwal2Locked: false,
    showKmAkhir1InSingle: false,
    showKmAkhir2InSingle: false,
    keterangan: "Catatan baru",
    showKeterangan: false,
    bus: mockBus,
    previousDayKmAkhir2: "200050",
    ...overrides,
  });

  describe("computeEffectiveTotalToa", () => {
    it("langsung mengembalikan totalToa yang diinput pengguna", () => {
      const res = computeEffectiveTotalToa("150", "150", "300", false, "all");
      expect(res).toBe("300");
    });

    it("mempertahankan totalToa manual", () => {
      const res = computeEffectiveTotalToa("", "", "500", false, "all");
      expect(res).toBe("500");
    });

    it("pada mode single kategori totalToa, langsung mengembalikan totalToa", () => {
      const res = computeEffectiveTotalToa("100", "100", "450", true, "totalToa");
      expect(res).toBe("450");
    });
  });

  describe("Single Focus Mode Scoped Updates", () => {
    it("kategori trip: HANYA mengirimkan tripPergi dan tripPulang", () => {
      const params = createBaseParams({
        isSingleMode: true,
        effectiveCategory: "trip",
        tripPergi: "6",
        tripPulang: "6",
      });
      const payload = buildBusInputPayload(params);
      expect(payload).toEqual({
        tripPergi: "6",
        tripPulang: "6",
      });
      // Pastikan field lain TIDAK ADA di payload (tidak menimpa)
      expect(payload.kmAwal1).toBeUndefined();
      expect(payload.toaShift1).toBeUndefined();
      expect(payload.keterangan).toBeUndefined();
    });

    it("kategori toaShift1: HANYA mengirim toaShift1 (dan manualShift1 jika showManual1)", () => {
      const paramsWithoutManual = createBaseParams({
        isSingleMode: true,
        effectiveCategory: "toaShift1",
        toaShift1: "180",
        showManual1: false,
      });
      const payload1 = buildBusInputPayload(paramsWithoutManual);
      expect(payload1).toEqual({ toaShift1: "180" });

      const paramsWithManual = createBaseParams({
        isSingleMode: true,
        effectiveCategory: "toaShift1",
        toaShift1: "180",
        manualShift1: "25",
        showManual1: true,
      });
      const payload2 = buildBusInputPayload(paramsWithManual);
      expect(payload2).toEqual({
        toaShift1: "180",
        manualShift1: "25",
      });
    });

    it("kategori totalToa: HANYA mengirim totalToa (dan manualShift2 jika showManual2)", () => {
      const params = createBaseParams({
        isSingleMode: true,
        effectiveCategory: "totalToa",
        totalToa: "350",
        manualShift2: "30",
        showManual2: true,
      });
      const payload = buildBusInputPayload(params);
      expect(payload).toEqual({
        totalToa: "350",
        manualShift2: "30",
      });
    });

    it("kategori kmAwal1: mengirim kmAwal1 tersanitasi; menyertakan kmAkhir1 HANYA jika showKmAkhir1InSingle dan valid", () => {
      const paramsOnlyAwal = createBaseParams({
        isSingleMode: true,
        effectiveCategory: "kmAwal1",
        kmAwal1: "200150",
        showKmAkhir1InSingle: false,
      });
      const payload1 = buildBusInputPayload(paramsOnlyAwal);
      expect(payload1).toEqual({ kmAwal1: "200150" });

      const paramsWithAkhir = createBaseParams({
        isSingleMode: true,
        effectiveCategory: "kmAwal1",
        kmAwal1: "200150",
        kmAkhir1: "200250",
        showKmAkhir1InSingle: true,
        isKmAwal1Valid: true,
      });
      const payload2 = buildBusInputPayload(paramsWithAkhir);
      expect(payload2).toEqual({
        kmAwal1: "200150",
        kmAkhir1: "200250",
      });
    });

    it("kategori kmAwal2: tidak mengirim kmAwal2 jika terkunci (isKmAwal2Locked)", () => {
      const paramsLocked = createBaseParams({
        isSingleMode: true,
        effectiveCategory: "kmAwal2",
        kmAwal2: "200250",
        isKmAwal2Locked: true,
      });
      const payload = buildBusInputPayload(paramsLocked);
      expect(payload.kmAwal2).toBeUndefined();
    });

    it("kategori keterangan: HANYA mengirim keterangan", () => {
      const params = createBaseParams({
        isSingleMode: true,
        effectiveCategory: "keterangan",
        keterangan: "Dinas malam lancar",
      });
      const payload = buildBusInputPayload(params);
      expect(payload).toEqual({ keterangan: "Dinas malam lancar" });
    });

    it("menyertakan keterangan pada kategori single apa pun jika showKeterangan aktif", () => {
      const params = createBaseParams({
        isSingleMode: true,
        effectiveCategory: "trip",
        tripPergi: "3",
        tripPulang: "3",
        keterangan: "Ada catatan tambahan",
        showKeterangan: true,
      });
      const payload = buildBusInputPayload(params);
      expect(payload).toEqual({
        tripPergi: "3",
        tripPulang: "3",
        keterangan: "Ada catatan tambahan",
      });
    });
  });

  describe("Mode All Scoped Updates", () => {
    it("mengirimkan seluruh field yang memenuhi syarat dan TIDAK mengirimkan toaShift2 (mencegah menimpa rumus SS)", () => {
      const params = createBaseParams();
      const payload = buildBusInputPayload(params);
      expect(payload).toEqual({
        tripPergi: "5",
        tripPulang: "5",
        toaShift1: "150",
        manualShift1: "10",
        kmAwal1: "200100",
        kmAkhir1: "200200",
        manualShift2: "20",
        kmAwal2: "200200",
        kmAkhir2: "200300",
        totalToa: "300",
        keterangan: "Catatan baru",
      });
      expect(payload.toaShift2).toBeUndefined();
    });

    it("mengosongkan field manual jika showManual1 dan showManual2 nonaktif", () => {
      const params = createBaseParams({
        showManual1: false,
        showManual2: false,
      });
      const payload = buildBusInputPayload(params);
      expect(payload.manualShift1).toBe("");
      expect(payload.manualShift2).toBe("");
    });

    it("mengosongkan kmAkhir1 jika isKmAwal1Valid false", () => {
      const params = createBaseParams({
        isKmAwal1Valid: false,
      });
      const payload = buildBusInputPayload(params);
      expect(payload.kmAkhir1).toBe("");
    });

    it("mengosongkan kmAwal2 jika isKmAwal2Locked true", () => {
      const params = createBaseParams({
        isKmAwal2Locked: true,
      });
      const payload = buildBusInputPayload(params);
      expect(payload.kmAwal2).toBe("");
    });
  });
});
