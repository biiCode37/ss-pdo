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

export const INDONESIAN_MONTH_NAMES = [
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
] as const;

export function formatIndonesianMonthYear(dateOrYearMonth: string): string {
  try {
    if (!dateOrYearMonth) return "";
    const cleanStr = dateOrYearMonth.includes(" s.d. ")
      ? dateOrYearMonth.split(" s.d. ")[0]
      : dateOrYearMonth;
    const parts = cleanStr.split("-");
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
      return `${INDONESIAN_MONTH_NAMES[m - 1]} ${y}`;
    }
    return dateOrYearMonth;
  } catch {
    return dateOrYearMonth;
  }
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
    return `${days[date.getDay()]}, ${d} ${INDONESIAN_MONTH_NAMES[m - 1]} ${y}`;
  } catch {
    return dateStr;
  }
}

/**
 * Memformat tanggal YYYY-MM-DD menjadi format Hari, DD/MM/YYYY
 * Contoh: "2026-09-01" -> "Selasa, 01/09/2026"
 * Juga menangani rentang tanggal periode atau format bulan tanpa NaN.
 */
export function formatIndonesianDaySlashDate(dateStr: string): string {
  try {
    if (!dateStr) return "";

    // Tangani rentang "YYYY-MM-DD s.d. YYYY-MM-DD"
    if (dateStr.includes(" s.d. ")) {
      const [startStr, endStr] = dateStr.split(" s.d. ");
      const [y1, m1, d1] = startStr.split("-").map(Number);
      const [y2, m2, d2] = endStr.split("-").map(Number);

      // Jika rentang mencakup 1 bulan penuh (dari tgl 1 s.d. akhir bulan)
      if (y1 === y2 && m1 === m2 && d1 === 1 && d2 >= 28) {
        return formatIndonesianMonthYear(startStr);
      }
      return `${String(d1).padStart(2, "0")}/${String(m1).padStart(2, "0")} - ${String(d2).padStart(2, "0")}/${String(m2).padStart(2, "0")}/${y2}`;
    }

    // Tangani format hanya bulan "YYYY-MM"
    const parts = dateStr.split("-");
    if (parts.length === 2) {
      return formatIndonesianMonthYear(dateStr);
    }

    const [y, m, d] = parts.map(Number);
    if (isNaN(d) || isNaN(m) || isNaN(y)) {
      return formatIndonesianMonthYear(dateStr);
    }

    const date = new Date(y, m - 1, d);
    if (isNaN(date.getTime())) {
      return dateStr;
    }
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
