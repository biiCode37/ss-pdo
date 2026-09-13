import type { BusData } from "@/services/googleSheets";
import { splitShiftKeterangan, cleanShiftNote } from "@/utils/keteranganUtils";
import { TEXT_DASHBOARD } from "@/constants/texts";

export const BUS_CATEGORIES = [
  { id: "ALL", label: TEXT_DASHBOARD.BUS_LIST.CATEGORIES.ALL },
  { id: "trip", label: TEXT_DASHBOARD.BUS_LIST.CATEGORIES.TRIP },
  { id: "toaShift1", label: TEXT_DASHBOARD.BUS_LIST.CATEGORIES.TOA_S1 },
  { id: "totalToa", label: TEXT_DASHBOARD.BUS_LIST.CATEGORIES.TOTAL_TOA },
  { id: "kmAwal1", label: TEXT_DASHBOARD.BUS_LIST.CATEGORIES.KM_AWAL_1 },
  { id: "kmAkhir1", label: TEXT_DASHBOARD.BUS_LIST.CATEGORIES.KM_AKHIR_1 },
  { id: "kmAwal2", label: TEXT_DASHBOARD.BUS_LIST.CATEGORIES.KM_AWAL_2 },
  { id: "kmAkhir2", label: TEXT_DASHBOARD.BUS_LIST.CATEGORIES.KM_AKHIR_2 },
];

/**
 * Menentukan apakah unit diperbolehkan untuk diinput datanya berdasarkan status armada (SGO)
 */
export function isUnitAllowedForInput(bus: BusData, activeCategory: string): boolean {
  const { s1, s2 } = splitShiftKeterangan(bus.keterangan);
  const isSgoS1 = !cleanShiftNote(s1);
  const isSgoS2 = !cleanShiftNote(s2);

  // Kategori khusus Shift 1: hanya unit yang berstatus SGO di Shift 1
  if (
    activeCategory === "toaShift1" ||
    activeCategory === "kmAwal1" ||
    activeCategory === "kmAkhir1"
  ) {
    return isSgoS1;
  }

  // Kategori khusus Shift 2: hanya unit yang berstatus SGO di Shift 2
  if (
    activeCategory === "toaShift2" ||
    activeCategory === "kmAwal2" ||
    activeCategory === "kmAkhir2"
  ) {
    return isSgoS2;
  }

  // Kategori Trip atau ALL (Progres Harian): unit yang beroperasi minimal di salah satu shift (S1 atau S2)
  return isSgoS1 || isSgoS2;
}

/**
 * Logic kelengkapan data unit bergantung pada kategori yang aktif dan status operasional unit
 */
export function isBusFilled(bus: BusData, activeCategory: string): boolean {
  const hasValue = (val: any) =>
    val !== undefined && val !== null && String(val).trim() !== "";

  const { s1, s2 } = splitShiftKeterangan(bus.keterangan);
  const isSgoS1 = !cleanShiftNote(s1);
  const isSgoS2 = !cleanShiftNote(s2);

  if (activeCategory === "ALL") {
    // Jika unit non-operasional di kedua shift, unit tidak perlu diisi
    if (!isSgoS1 && !isSgoS2) return true;

    const s1Filled =
      !isSgoS1 ||
      (hasValue(bus.toaShift1) &&
        hasValue(bus.kmAwal1) &&
        hasValue(bus.kmAkhir1));

    const s2Filled =
      !isSgoS2 ||
      (hasValue(bus.totalToa) &&
        hasValue(bus.kmAwal2) &&
        hasValue(bus.kmAkhir2));

    return s1Filled && s2Filled;
  } else if (activeCategory === "trip") {
    return hasValue(bus.tripPergi) || hasValue(bus.tripPulang);
  } else {
    return hasValue(bus[activeCategory as keyof BusData]);
  }
}
