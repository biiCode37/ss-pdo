import { describe, it, expect } from "vitest";
import { isUnitAllowedForInput, isBusFilled } from "./busListUtils";
import type { BusData } from "@/services/googleSheets";

const createMockBus = (partial: Partial<BusData> = {}): BusData => ({
  rowIndex: 2,
  unit: "JAK.15-01",
  tripPergi: "4",
  tripPulang: "4",
  totalToa: "120",
  toaShift1: "60",
  toaShift2: "60",
  manualShift1: "0",
  manualShift2: "0",
  kmAwal1: "1000",
  kmAkhir1: "1050",
  kmAwal2: "1050",
  kmAkhir2: "1100",
  keterangan: "",
  originalRow: [],
  ...partial,
});

describe("busListUtils - isUnitAllowedForInput", () => {
  describe("Exclusion of OFF and TO EVDAL units from progress bar target", () => {
    it("excludes pure OFF units from ALL and specific categories", () => {
      const offBus = createMockBus({ keterangan: "OFF" });
      expect(isUnitAllowedForInput(offBus, "ALL")).toBe(false);
      expect(isUnitAllowedForInput(offBus, "trip")).toBe(false);
      expect(isUnitAllowedForInput(offBus, "toaShift1")).toBe(false);
      expect(isUnitAllowedForInput(offBus, "kmAwal1")).toBe(false);
      expect(isUnitAllowedForInput(offBus, "totalToa")).toBe(false);
      expect(isUnitAllowedForInput(offBus, "kmAwal2")).toBe(false);
    });

    it("excludes pure TO EVDAL units from ALL and specific categories", () => {
      const toBus = createMockBus({ keterangan: "TO EVDAL" });
      expect(isUnitAllowedForInput(toBus, "ALL")).toBe(false);
      expect(isUnitAllowedForInput(toBus, "trip")).toBe(false);
      expect(isUnitAllowedForInput(toBus, "toaShift1")).toBe(false);
      expect(isUnitAllowedForInput(toBus, "kmAwal1")).toBe(false);
      expect(isUnitAllowedForInput(toBus, "totalToa")).toBe(false);
      expect(isUnitAllowedForInput(toBus, "kmAwal2")).toBe(false);
    });

    it("excludes units with shift-prefixed OFF (S1: OFF, S2: OFF)", () => {
      const s1OffBus = createMockBus({ keterangan: "S1: OFF" });
      expect(isUnitAllowedForInput(s1OffBus, "ALL")).toBe(false);
      expect(isUnitAllowedForInput(s1OffBus, "trip")).toBe(false);
      expect(isUnitAllowedForInput(s1OffBus, "toaShift1")).toBe(false);

      const s2OffBus = createMockBus({ keterangan: "S2: OFF" });
      expect(isUnitAllowedForInput(s2OffBus, "ALL")).toBe(false);
      expect(isUnitAllowedForInput(s2OffBus, "trip")).toBe(false);
      expect(isUnitAllowedForInput(s2OffBus, "totalToa")).toBe(false);
    });

    it("excludes units with shift-prefixed TO EVDAL (S1: TO EVDAL, S2: TO EVDAL)", () => {
      const s1ToBus = createMockBus({ keterangan: "S1: TO EVDAL" });
      expect(isUnitAllowedForInput(s1ToBus, "ALL")).toBe(false);
      expect(isUnitAllowedForInput(s1ToBus, "trip")).toBe(false);

      const s2ToBus = createMockBus({ keterangan: "S2: TO EVDAL" });
      expect(isUnitAllowedForInput(s2ToBus, "ALL")).toBe(false);
      expect(isUnitAllowedForInput(s2ToBus, "trip")).toBe(false);
    });

    it("excludes units with OFF accompanied by descriptions or parentheses", () => {
      const offDescBus = createMockBus({ keterangan: "OFF - BAN PECAH" });
      expect(isUnitAllowedForInput(offDescBus, "ALL")).toBe(false);

      const offSpareBus = createMockBus({ keterangan: "OFF (CADANGAN)" });
      expect(isUnitAllowedForInput(offSpareBus, "ALL")).toBe(false);
    });

    it("excludes units with TO EVDAL variations (TO-EVDAL, T.O EVDAL, T.O, TO)", () => {
      expect(isUnitAllowedForInput(createMockBus({ keterangan: "TO-EVDAL" }), "ALL")).toBe(false);
      expect(isUnitAllowedForInput(createMockBus({ keterangan: "T.O EVDAL" }), "ALL")).toBe(false);
      expect(isUnitAllowedForInput(createMockBus({ keterangan: "T.O" }), "ALL")).toBe(false);
      expect(isUnitAllowedForInput(createMockBus({ keterangan: "TO" }), "ALL")).toBe(false);
    });

    it("excludes multi-shift units if either shift is marked OFF or TO EVDAL", () => {
      const s1OffCombo = createMockBus({ keterangan: "S1: OFF | S2: BA.01 Bocor" });
      expect(isUnitAllowedForInput(s1OffCombo, "ALL")).toBe(false);

      const s2OffCombo = createMockBus({ keterangan: "S1: BA.01 Bocor | S2: OFF" });
      expect(isUnitAllowedForInput(s2OffCombo, "ALL")).toBe(false);

      const s2ToCombo = createMockBus({ keterangan: "S1: BA.01 Bocor | S2: TO EVDAL" });
      expect(isUnitAllowedForInput(s2ToCombo, "ALL")).toBe(false);
    });
  });

  describe("Allowed operating units", () => {
    it("allows clean SGO units in all categories", () => {
      const sgoBus = createMockBus({ keterangan: "" });
      expect(isUnitAllowedForInput(sgoBus, "ALL")).toBe(true);
      expect(isUnitAllowedForInput(sgoBus, "trip")).toBe(true);
      expect(isUnitAllowedForInput(sgoBus, "toaShift1")).toBe(true);
      expect(isUnitAllowedForInput(sgoBus, "totalToa")).toBe(true);
    });

    it("allows units with operational BA notes operating in at least one shift", () => {
      const s2BaBus = createMockBus({ keterangan: "S2: BA.01 Bocor" });
      expect(isUnitAllowedForInput(s2BaBus, "ALL")).toBe(true);
      expect(isUnitAllowedForInput(s2BaBus, "toaShift1")).toBe(true);
      expect(isUnitAllowedForInput(s2BaBus, "totalToa")).toBe(false); // S2 is non-SGO
    });

    it("allows units with OKB and Renop presets", () => {
      expect(isUnitAllowedForInput(createMockBus({ keterangan: "OKB" }), "ALL")).toBe(true);
      expect(isUnitAllowedForInput(createMockBus({ keterangan: "Renop" }), "ALL")).toBe(true);
    });
  });
});

describe("busListUtils - isBusFilled", () => {
  it("marks OFF and TO EVDAL units as filled (does not need input)", () => {
    expect(isBusFilled(createMockBus({ keterangan: "OFF" }), "ALL")).toBe(true);
    expect(isBusFilled(createMockBus({ keterangan: "TO EVDAL" }), "ALL")).toBe(true);
    expect(isBusFilled(createMockBus({ keterangan: "S1: OFF" }), "ALL")).toBe(true);
    expect(isBusFilled(createMockBus({ keterangan: "S2: TO EVDAL" }), "ALL")).toBe(true);
  });

  it("checks full completion for operating SGO units in ALL mode", () => {
    const fullBus = createMockBus({
      toaShift1: "60",
      kmAwal1: "1000",
      kmAkhir1: "1050",
      totalToa: "120",
      kmAwal2: "1050",
      kmAkhir2: "1100",
      keterangan: "",
    });
    expect(isBusFilled(fullBus, "ALL")).toBe(true);

    const missingS2 = createMockBus({
      toaShift1: "60",
      kmAwal1: "1000",
      kmAkhir1: "1050",
      totalToa: "",
      kmAwal2: "",
      kmAkhir2: "",
      keterangan: "",
    });
    expect(isBusFilled(missingS2, "ALL")).toBe(false);
  });
});
