/**
 * Master data rekor pelanggan tertinggi dan tanggal pencapaian
 * Sesuai data Single Source of Truth (SSOT) dari Spreadsheet Global Operasional Wilayah (Blok Pencapaian 3 Korwil Kolom AS & AT).
 */

export interface RoutePeakRecord {
  peak: number;
  date: string;
}

export const ROUTE_MASTER_PEAK_RECORDS: Record<string, RoutePeakRecord> = {
  "JAK.01": { peak: 5437, date: "Senin, 19 Oktober 2026" },
  "JAK.05": { peak: 6273, date: "Kamis, 01 Oktober 2026" },
  "JAK.15": { peak: 9740, date: "Jumat, 02 Oktober 2026" },
  "JAK.29": { peak: 11097, date: "Selasa, 06 Oktober 2026" },
  "JAK.58": { peak: 7777, date: "Selasa, 06 Oktober 2026" },
  "JAK.60": { peak: 5297, date: "Kamis, 01 Oktober 2026" },
  "JAK.76": { peak: 3096, date: "Kamis, 15 Oktober 2026" },
  "JAK.77": { peak: 6974, date: "Senin, 12 Oktober 2026" },
  "JAK.87": { peak: 4362, date: "Rabu, 14 Oktober 2026" },
  "JAK.88": { peak: 5868, date: "Selasa, 13 Oktober 2026" },
  "JAK.89": { peak: 3647, date: "Senin, 12 Oktober 2026" },
  "JAK.90": { peak: 3517, date: "Senin, 12 Oktober 2026" },
  "JAK.110A": { peak: 5688, date: "Selasa, 13 Oktober 2026" },
  "JAK.113": { peak: 6239, date: "Senin, 12 Oktober 2026" },
  "JAK.115": { peak: 7766, date: "Rabu, 14 Oktober 2026" },
  "JAK.117": { peak: 8058, date: "Senin, 12 Oktober 2026" },
  "JAK.118": { peak: 7235, date: "Selasa, 13 Oktober 2026" },
  "JAK.120": { peak: 2057, date: "Senin, 12 Oktober 2026" },
};

/**
 * Mengambil data rekor puncak rute dengan penanganan variasi penulisan ("JAK 60" atau "JAK.60")
 */
export function getRoutePeakRecord(routeCode: string): RoutePeakRecord | undefined {
  if (!routeCode) return undefined;
  const clean = routeCode.trim().toUpperCase();
  const dotted = clean.replace(/^JAK[\s]+(\d+)/i, "JAK.$1");
  return ROUTE_MASTER_PEAK_RECORDS[dotted] || ROUTE_MASTER_PEAK_RECORDS[clean];
}
