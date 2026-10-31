import type { DailyFleetShiftWithUnits } from "@/types/supabase";
import type { RegionalRouteItem } from "@/services/allRouteMonitoringService";
import { normalizeRouteCode } from "@/services/googleSheets/globalReportReader";
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


export interface TroubledUnitItem {
  unit: string;
  note: string;
  statusCode: string;
  badgeBg: string;
  badgeColor: string;
  badgeBorder?: string;
  isOff: boolean;
  shifts: (1 | 2)[];
  routeCode: string;
}

/**
 * Infer status code dan styling badge dari teks kendala
 */
export function inferStatusCode(
  rawNote: string,
  isOff?: boolean,
  statusCodeHint?: string
): { code: string; color: string; bg: string; border?: string } {
  const note = (rawNote || "").trim();
  const hint = (statusCodeHint || "").toUpperCase().trim();

  // 1. OFF (Libur)
  if (isOff || hint === "OFF" || /\bOFF\b/i.test(note)) {
    return {
      code: "OFF",
      color: "var(--color-warning-fg)",
      bg: "var(--color-warning-bg)",
      border: "var(--color-warning-border)",
    };
  }

  // 2. TO / TO EVDAL
  if (
    hint === "TO" ||
    /\bT\.?O(?:\s*EVDAL)?\b/i.test(note) ||
    /EVDAL/i.test(note)
  ) {
    const isEvdal = /EVDAL/i.test(note);
    return {
      code: isEvdal ? "TO EVDAL" : "T.O",
      color: "var(--color-error-fg)",
      bg: "var(--color-error-bg)",
      border: "var(--color-error-border)",
    };
  }

  // 3. SO (Stop Operasi)
  if (hint === "SO" || /\bSO\b/i.test(note) || /STOP\s*OPS?/i.test(note)) {
    return {
      code: "SO",
      color: "var(--color-shift-2-fg)",
      bg: "var(--color-shift-2-bg)",
      border: "var(--color-shift-2-border)",
    };
  }

  // 4. BA Code (Berita Acara / Laka / Sakit / Kendala Operasi) - Oranye Khas Berita Acara
  const baMatch = note.match(/\bBA[\s.]?0?([1-6])\b/i);
  if (baMatch) {
    return {
      code: `BA.0${baMatch[1]}`,
      color: "var(--color-badge-ba-fg)",
      bg: "var(--color-badge-ba-bg)",
      border: "var(--color-badge-ba-border)",
    };
  }

  // 5. KEUR
  if (/PROGRAM\s*KEUR/i.test(note) || /\bKEUR\b/i.test(note)) {
    return {
      code: "KEUR",
      color: "var(--color-shift-1-fg)",
      bg: "var(--color-shift-1-bg)",
      border: "var(--color-shift-1-border)",
    };
  }

  // 6. TEKNIS / PERBAIKAN / BENGKEL
  if (/PERBAIKAN|BENGKEL|MOGOK|RADIATOR|AC\s*PANAS/i.test(note)) {
    return {
      code: "TEKNIS",
      color: "var(--color-shift-2-fg)",
      bg: "var(--color-shift-2-bg)",
      border: "var(--color-shift-2-border)",
    };
  }

  // 7. OKB
  if (/\bOKB\b/i.test(note)) {
    return {
      code: "OKB",
      color: "var(--color-info-fg)",
      bg: "var(--color-info-bg)",
      border: "var(--color-info-border)",
    };
  }

  // 8. RENOP
  if (/\bRENOP\b/i.test(note)) {
    return {
      code: "RENOP",
      color: "var(--color-success-fg)",
      bg: "var(--color-success-bg)",
      border: "var(--color-success-border)",
    };
  }

  // 9. Hint selain generic
  if (hint && hint !== "CATATAN" && hint !== "OTHER" && hint.length <= 8) {
    const isBaHint = /^BA[\s.]?0?[1-6]$/i.test(hint);
    return {
      code: hint,
      color: isBaHint ? "var(--color-badge-ba-fg)" : "var(--color-warning-fg)",
      bg: isBaHint ? "var(--color-badge-ba-bg)" : "var(--color-warning-bg)",
      border: isBaHint
        ? "var(--color-badge-ba-border)"
        : "var(--color-warning-border)",
    };
  }

  // 10. Fallback first word or KENDALA
  if (note) {
    const firstWord = note.split(/[\s:-]+/)[0].toUpperCase().slice(0, 8);
    if (firstWord && !["CATATAN", "KENDALA"].includes(firstWord)) {
      const isBaWord = /^BA[\s.]?0?[1-6]$/i.test(firstWord);
      return {
        code: firstWord,
        color: isBaWord ? "var(--color-badge-ba-fg)" : "var(--color-warning-fg)",
        bg: isBaWord ? "var(--color-badge-ba-bg)" : "var(--color-warning-bg)",
        border: isBaWord
          ? "var(--color-badge-ba-border)"
          : "var(--color-warning-border)",
      };
    }
  }

  return {
    code: "KENDALA",
    color: "var(--color-warning-fg)",
    bg: "var(--color-warning-bg)",
    border: "var(--color-warning-border)",
  };
}

/**
 * Format catatan agar bersih tanpa prefix shift redundan
 */
export function formatUnitNote(note: string): string {
  if (!note) return "-";
  return note.replace(/^S[12]:\s*/i, "").trim() || "-";
}

/**
 * Ekstraksi unit bermasalah per rute dari database Supabase dengan fallback ke data spreadsheet
 */
export function extractRouteTroubledUnits(
  route: RegionalRouteItem,
  fleetShifts?: DailyFleetShiftWithUnits[]
): TroubledUnitItem[] {
  const routeCode = route.routeCode;
  const unitMap = new Map<
    string,
    {
      unit: string;
      notes: string[];
      shifts: (1 | 2)[];
      statusCode: string;
      badgeBg: string;
      badgeColor: string;
      badgeBorder?: string;
      isOff: boolean;
    }
  >();

  const shiftsToInspect: (1 | 2)[] = [1, 2];

  for (const sh of shiftsToInspect) {
    const dbShift = fleetShifts?.find(
      (s) =>
        s.shift === sh &&
        (s.route_code === routeCode ||
          normalizeRouteCode(s.route_code) === normalizeRouteCode(routeCode))
    );

    const ssRawUnits =
      (sh === 1 ? route.fleetStatusShift1 : route.fleetStatusShift2) || [];

    if (dbShift && dbShift.non_sgo_units && dbShift.non_sgo_units.length > 0) {
      for (const u of dbShift.non_sgo_units) {
        const body = (u.unit_body || "").trim().toUpperCase();
        if (!body) continue;
        const parsed = inferStatusCode(
          u.note || "",
          u.status_code === "OFF",
          u.status_code
        );
        const formattedNote = formatUnitNote(u.note || u.status_code);

        if (unitMap.has(body)) {
          const existing = unitMap.get(body)!;
          if (!existing.shifts.includes(sh)) existing.shifts.push(sh);
          if (
            formattedNote !== "-" &&
            !existing.notes.includes(formattedNote)
          ) {
            existing.notes.push(formattedNote);
          }
        } else {
          unitMap.set(body, {
            unit: body,
            notes: formattedNote !== "-" ? [formattedNote] : [],
            shifts: [sh],
            statusCode: parsed.code,
            badgeBg: parsed.bg,
            badgeColor: parsed.color,
            badgeBorder: parsed.border,
            isOff: u.status_code === "OFF",
          });
        }
      }
    } else if (ssRawUnits.length > 0) {
      for (const u of ssRawUnits) {
        const body = (u.unit || "").trim().toUpperCase();
        if (!body) continue;
        const parsed = inferStatusCode(u.note || "", u.isOff);
        const formattedNote = formatUnitNote(u.note);

        if (unitMap.has(body)) {
          const existing = unitMap.get(body)!;
          if (!existing.shifts.includes(sh)) existing.shifts.push(sh);
          if (
            formattedNote !== "-" &&
            !existing.notes.includes(formattedNote)
          ) {
            existing.notes.push(formattedNote);
          }
        } else {
          unitMap.set(body, {
            unit: body,
            notes: formattedNote !== "-" ? [formattedNote] : [],
            shifts: [sh],
            statusCode: parsed.code,
            badgeBg: parsed.bg,
            badgeColor: parsed.color,
            badgeBorder: parsed.border,
            isOff: Boolean(u.isOff),
          });
        }
      }
    }
  }

  return Array.from(unitMap.values()).map((item) => ({
    unit: item.unit,
    note: item.notes.length > 0 ? item.notes.join(" • ") : "-",
    statusCode: item.statusCode,
    badgeBg: item.badgeBg,
    badgeColor: item.badgeColor,
    badgeBorder: item.badgeBorder,
    isOff: item.isOff,
    shifts: item.shifts,
    routeCode,
  }));
}
