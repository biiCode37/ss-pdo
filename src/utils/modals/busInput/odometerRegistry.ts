export interface StoredOdometerEntry {
  km: string;
  dateLabel: string;
  timestamp: number;
}

export const ODOMETER_REGISTRY_STORAGE_KEY = "pdo_last_known_odometers";

/**
 * Mendapatkan cache odometer lokal untuk seluruh rute/unit
 */
export function getAllStoredOdometers(): Record<string, StoredOdometerEntry> {
  try {
    if (typeof window === "undefined" || !window.localStorage) return {};
    const raw = localStorage.getItem(ODOMETER_REGISTRY_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Mendapatkan odometer terakhir yang terekam untuk unit tertentu
 */
export function getStoredOdometerForUnit(
  unit: string,
): StoredOdometerEntry | null {
  if (!unit) return null;
  const all = getAllStoredOdometers();
  const normalizedKey = unit.trim().toUpperCase();
  return all[normalizedKey] || all[unit.trim()] || null;
}

/**
 * Menyimpan atau memperbarui sekumpulan odometer ke localStorage
 */
export function saveStoredOdometers(
  entries: Record<string, { km: string; dateLabel: string }>,
): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    if (!entries || Object.keys(entries).length === 0) return;
    const current = getAllStoredOdometers();
    const now = Date.now();

    for (const [unit, data] of Object.entries(entries)) {
      if (!unit || !data.km || data.km.trim() === "") continue;
      const normalizedKey = unit.trim().toUpperCase();
      current[normalizedKey] = {
        km: data.km.trim(),
        dateLabel: data.dateLabel || "Riwayat",
        timestamp: now,
      };
    }

    localStorage.setItem(
      ODOMETER_REGISTRY_STORAGE_KEY,
      JSON.stringify(current),
    );
  } catch {
    // Abaikan kegagalan localStorage (misal: private browsing quota)
  }
}
