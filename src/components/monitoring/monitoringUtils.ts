import { TEXT_MONITORING } from "@/constants/texts";

export const SUPERVISOR_TABS = [
  { id: "ALL", label: TEXT_MONITORING.TABS.ALL_LABEL, keyword: "" },
  { id: "RANTO", label: "Ranto Lumban Toruan", keyword: "RANTO" },
  { id: "ABDUL", label: "Abdul Manan", keyword: "ABDUL" },
  { id: "MOAMAR", label: "Moamar Z.A. Mahu", keyword: "MOAMAR" },
] as const;

export function matchesSupervisorTab(
  supervisorName: string,
  tabId: string,
): boolean {
  if (tabId === "ALL") return true;
  const upper = (supervisorName || "").toUpperCase();
  if (tabId === "RANTO") return upper.includes("RANTO");
  if (tabId === "ABDUL") return upper.includes("ABDUL");
  if (tabId === "MOAMAR") return upper.includes("MOAMAR");
  return true;
}

export function formatIndonesianDateLabel(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const days = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    return `${days[date.getDay()]}, ${d} ${months[m - 1]} ${y}`;
  } catch {
    return dateStr;
  }
}

/**
 * Memformat tanggal YYYY-MM-DD menjadi format Hari, DD/MM/YYYY
 * Contoh: "2026-09-01" -> "Selasa, 01/09/2026"
 */
export function formatIndonesianDaySlashDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const days = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const dayName = days[date.getDay()] || "";
    const dd = String(d).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    return `${dayName}, ${dd}/${mm}/${y}`;
  } catch {
    return dateStr;
  }
}

export function formatNumber(num: number): string {
  return Math.round(num).toLocaleString("id-ID");
}

export function formatDecimal(num: number, digits: number = 1): string {
  return Number(num.toFixed(digits)).toLocaleString("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
