// Modul murni (tanpa API Deno/DOM): dipakai sheet-sync-webhook dan route-confirmation, diuji lewat Vitest.
// Aturan: docs/superpowers/specs/2026-11-07-kelengkapan-siap-kirim-design.md §2.

export type UnitCompletenessStatus = 'LENGKAP' | 'DIKECUALIKAN' | 'BELUM_DIISI' | 'JANGGAL' | 'SEBAGIAN';
export type RequiredField = 'tripPergi' | 'tripPulang' | 'toaShift1' | 'totalToa';
export type AnomalyReason = 'RITASE_TANPA_TOA' | 'TOA_TANPA_RITASE' | 'TOTAL_TOA_KURANG';

export interface UnitIssue {
  unit: string;
  status: 'BELUM_DIISI' | 'JANGGAL' | 'SEBAGIAN';
  missing?: RequiredField[];
  reason?: AnomalyReason;
}

export interface RouteCompleteness {
  v: 1;
  computedAt: string;
  status: 'ok' | 'header_not_found';
  counts: Record<UnitCompletenessStatus, number>;
  issues: UnitIssue[];
  fingerprint: string;
}

export interface UnitCells {
  tripPergi: unknown;
  tripPulang: unknown;
  toaShift1: unknown;
  totalToa: unknown;
  keterangan?: unknown;
}

// Selaras dengan HEADER_KEYWORDS & findColumnIndex di src/services/googleSheets/core.ts (parser frontend yang sudah teruji)
const HEADER_KEYWORDS = {
  unit: ['nobody', 'unit', 'bus', 'body'],
  toaShift1: ['toashift1', 'toashifti', 'toas1', 'toasi'],
  totalToa: ['totaltoa', 'total'],
  keterangan: ['keterangan', 'ket', 'notes', 'catatan'],
};

const REQUIRED_FIELDS: RequiredField[] = ['tripPergi', 'tripPulang', 'toaShift1', 'totalToa'];

const normalizeString = (str: string): string => (str ? str.toLowerCase().replace(/[^a-z0-9]/g, '') : '');

function findColumnIndex(headers: unknown[], keywords: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const header = normalizeString(headers[i] === undefined || headers[i] === null ? '' : String(headers[i]));
    if (keywords.some((kw) => header.includes(kw))) return i;
  }
  return -1;
}

interface CompletenessHeader {
  dataStart: number;
  unit: number;
  tripPergi: number;
  tripPulang: number;
  toaShift1: number;
  totalToa: number;
  keterangan: number;
}

// Port dari detectHeaderRowAndBuildComposite (core.ts): baris header ≥50% teks, dukung subheader dua baris
function detectHeader(rows: unknown[][]): CompletenessHeader | null {
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const r = rows[i];
    if (!r) continue;
    if (findColumnIndex(r, HEADER_KEYWORDS.unit) !== -1) {
      const nonEmpty = r.filter((c) => c !== undefined && c !== null && String(c).trim() !== '');
      const textCells = nonEmpty.filter((c) => isNaN(Number(String(c).trim())));
      if (nonEmpty.length === 0 || textCells.length / nonEmpty.length >= 0.5) {
        headerRowIndex = i;
        break;
      }
    }
  }
  if (headerRowIndex === -1) return null;

  const headerRow = rows[headerRowIndex];
  let isSubHeader = false;
  if (headerRowIndex + 1 < rows.length) {
    const nextRow = rows[headerRowIndex + 1];
    const unitColIdx = findColumnIndex(headerRow, HEADER_KEYWORDS.unit);
    const unitNextVal = nextRow && nextRow[unitColIdx] ? String(nextRow[unitColIdx]).trim() : '';
    if (unitNextVal === '') isSubHeader = true;
  }

  const subRow = isSubHeader ? rows[headerRowIndex + 1] : undefined;
  const maxCols = Math.max(headerRow.length, subRow ? subRow.length : 0);
  const composite: string[] = [];
  let lastMain = '';
  for (let j = 0; j < maxCols; j++) {
    let main = headerRow[j] ? String(headerRow[j]).trim() : '';
    if (main !== '') lastMain = main;
    else main = lastMain;
    let text = main;
    if (subRow && subRow[j]) {
      const sub = String(subRow[j]).trim();
      if (sub !== '') text += ' ' + sub;
    }
    composite[j] = text;
  }

  const unit = findColumnIndex(composite, HEADER_KEYWORDS.unit);
  const tripPergi =
    unit !== -1 && composite[unit + 1] && !composite[unit + 1].toLowerCase().includes('toa') ? unit + 1 : -1;
  const tripPulang =
    unit !== -1 && composite[unit + 2] && !composite[unit + 2].toLowerCase().includes('toa') ? unit + 2 : -1;
  const toaShift1 = findColumnIndex(composite, HEADER_KEYWORDS.toaShift1);
  const totalToa = findColumnIndex(composite, HEADER_KEYWORDS.totalToa);
  const keterangan = findColumnIndex(composite, HEADER_KEYWORDS.keterangan);
  if ([unit, tripPergi, tripPulang, toaShift1, totalToa].some((idx) => idx === -1)) return null;

  return {
    dataStart: isSubHeader ? headerRowIndex + 2 : headerRowIndex + 1,
    unit,
    tripPergi,
    tripPulang,
    toaShift1,
    totalToa,
    keterangan,
  };
}

export function isBlankCell(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  const s = String(v).trim();
  return s === '' || s === '-';
}

// Port parseIndonesianNumber (src/utils/numberUtils.ts) dengan fallback NaN
function parseCellNumber(v: unknown): number {
  if (typeof v === 'number') return v;
  let str = String(v ?? '').trim();
  if (str === '' || str === '-' || str.startsWith('#')) return NaN;
  if (str.includes('.') && str.includes(',')) str = str.replace(/\./g, '').replace(',', '.');
  else if (str.includes(',')) str = str.replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(str)) str = str.replace(/\./g, '');
  return Number(str);
}

// NORMAL menurut classifyUnitKeterangan = kosong / SO / SGO (opsional berprefiks S1:/S2:). "-" dan "0" juga dianggap tanpa keterangan.
const NON_EXEMPT_KETERANGAN_PART = /^(?:S[12]\s*[:.-]\s*)?(?:SO|SGO|-|0)?$/i;

export function isExemptingKeterangan(raw: unknown): boolean {
  if (raw === undefined || raw === null) return false;
  const s = String(raw).trim();
  if (!s) return false;
  return s.split('|').some((part) => !NON_EXEMPT_KETERANGAN_PART.test(part.trim()));
}

export function classifyUnitRow(cells: UnitCells): {
  status: UnitCompletenessStatus;
  missing?: RequiredField[];
  reason?: AnomalyReason;
} {
  const filled: Record<RequiredField, boolean> = {
    tripPergi: !isBlankCell(cells.tripPergi),
    tripPulang: !isBlankCell(cells.tripPulang),
    toaShift1: !isBlankCell(cells.toaShift1),
    totalToa: !isBlankCell(cells.totalToa),
  };
  const anyTrip = filled.tripPergi || filled.tripPulang;
  const anyToa = filled.toaShift1 || filled.totalToa;

  if (!anyTrip && !anyToa) {
    return { status: isExemptingKeterangan(cells.keterangan) ? 'DIKECUALIKAN' : 'BELUM_DIISI' };
  }
  if (anyTrip && !anyToa) return { status: 'JANGGAL', reason: 'RITASE_TANPA_TOA' };
  if (anyToa && !anyTrip) return { status: 'JANGGAL', reason: 'TOA_TANPA_RITASE' };
  if (filled.toaShift1 && filled.totalToa) {
    const toa1 = parseCellNumber(cells.toaShift1);
    const total = parseCellNumber(cells.totalToa);
    if (!isNaN(toa1) && !isNaN(total) && total < toa1) return { status: 'JANGGAL', reason: 'TOTAL_TOA_KURANG' };
  }
  const missing = REQUIRED_FIELDS.filter((f) => !filled[f]);
  if (missing.length === 0) return { status: 'LENGKAP' };
  return { status: 'SEBAGIAN', missing };
}

function fingerprintValue(v: unknown): string {
  if (isBlankCell(v)) return '';
  const num = parseCellNumber(v);
  return isNaN(num) ? String(v).trim() : String(num);
}

function fnv1a(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function emptyCounts(): Record<UnitCompletenessStatus, number> {
  return { LENGKAP: 0, DIKECUALIKAN: 0, BELUM_DIISI: 0, JANGGAL: 0, SEBAGIAN: 0 };
}

export function computeRouteCompleteness(rows: unknown[][], now: Date = new Date()): RouteCompleteness {
  const counts = emptyCounts();
  const issues: UnitIssue[] = [];
  const header = detectHeader(rows);
  if (!header) {
    return { v: 1, computedAt: now.toISOString(), status: 'header_not_found', counts, issues, fingerprint: '' };
  }

  const fpParts: string[] = [];
  for (let i = header.dataStart; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0) continue;
    const unitVal = r[header.unit];
    if (!unitVal || String(unitVal).trim() === '') continue; // baris rangkuman/kosong (sama dengan parser frontend)
    const unit = String(unitVal).trim();
    const cells: UnitCells = {
      tripPergi: r[header.tripPergi],
      tripPulang: r[header.tripPulang],
      toaShift1: r[header.toaShift1],
      totalToa: r[header.totalToa],
      keterangan: header.keterangan === -1 ? '' : r[header.keterangan],
    };
    const result = classifyUnitRow(cells);
    counts[result.status] += 1;
    if (result.status === 'BELUM_DIISI' || result.status === 'JANGGAL' || result.status === 'SEBAGIAN') {
      const issue: UnitIssue = { unit, status: result.status };
      if (result.missing) issue.missing = result.missing;
      if (result.reason) issue.reason = result.reason;
      issues.push(issue);
    }
    fpParts.push(
      [
        unit,
        fingerprintValue(cells.tripPergi),
        fingerprintValue(cells.tripPulang),
        fingerprintValue(cells.toaShift1),
        fingerprintValue(cells.totalToa),
        String(cells.keterangan ?? '').trim(),
      ].join('\u001f'),
    );
  }
  fpParts.sort();
  return {
    v: 1,
    computedAt: now.toISOString(),
    status: 'ok',
    counts,
    issues,
    fingerprint: fnv1a(fpParts.join('\u001e')),
  };
}

export function countCompletenessIssues(c: RouteCompleteness | null | undefined): number {
  if (!c || c.status !== 'ok') return 1;
  return c.counts.BELUM_DIISI + c.counts.JANGGAL + c.counts.SEBAGIAN;
}
