# Kelengkapan Data & Konfirmasi "Siap Kirim" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membuat korlap/PJ bisa melihat unit mana yang belum lengkap atau janggal di setiap rute, lalu mengonfirmasi "Siap Dikirim" per rute, dengan biaya kuota Supabase cukup rendah sehingga halaman Monitoring aman dibuka untuk korlap.

**Architecture:** `sheet-sync-webhook` (yang sudah membaca semua baris unit setiap kali sheet diedit) menghitung kelengkapan dengan fungsi murni bersama, lalu menyimpannya sebagai JSON kecil di `daily_route_reports.completeness`. Konfirmasi disimpan di tabel baru `route_submission_confirmations` lewat Edge Function `route-confirmation` yang memverifikasi sesi proxy dan hak akses halaman. Klien membaca ±3 request saat tab dibuka, lalu memperbarui tampilan dari payload Realtime tanpa request tambahan.

**Tech Stack:** React 19 + Vite + TypeScript strict, Vitest (happy-dom), Supabase (PostgREST, Realtime, Edge Functions Deno), Google Sheets API (service account).

**Spec:** `docs/superpowers/specs/2026-11-07-kelengkapan-siap-kirim-design.md`

## Global Constraints

- Branch kerja wajib `devmode`. Commit sendiri setelah tiap task terverifikasi. **Jangan push** tanpa perintah "PD"/"PA" dari pengguna.
- Kolom wajib: Trip Pergi, Trip Pulang, TOA S1, Total TOA. Kolom opsional: Manual S1, Manual S2, Keterangan. KM tidak diperiksa.
- Sel kosong (`undefined`, `null`, `""`, spasi saja, atau `"-"`) = **belum diisi**. Angka `0` = **terisi**.
- Ritase terisi = Trip Pergi **dan** Trip Pulang keduanya terisi.
- Keterangan hanya membebaskan baris yang keempat kolom wajibnya kosong. Keterangan dianggap membebaskan bila **bukan NORMAL** menurut `classifyUnitKeterangan` (`src/utils/keteranganUtils.ts`); "SO", "SGO", "-", "0", dan kosong = NORMAL.
- Semua teks UI di `src/constants/texts/text_monitoring.ts` + uji di `src/constants/texts/texts.test.ts`. Tanpa hardcoded string di `.tsx`.
- Warna hanya token semantik `var(--color-*)`. **Tanpa `style={{}}` statis baru** (metrik `inlineStyleObject` di `src/styles/ui-debt-ratchet.test.ts` tidak boleh naik). Ukuran font px dari skala 12/13/14/16/18/20/24; jarak dari skala 0–64 genap (termasuk 6, 10, 14); radius 8/12/16/999px/50%; ikon lucide 16/20/24 hanya untuk navigasi/tombol ikon/status bertopang teks.
- Pakai ulang kelas yang ada: `.ui-button` (+`--primary`/`--secondary`), `.ui-segmented` + `.ui-segmented-btn[aria-pressed]`, `.ui-option-btn[aria-pressed]`, `.ui-status[data-tone]`, `.ui-tone-panel[data-tone]`, `.ui-input`, `ModalShell`, `alertUtils`.
- Realtime: debounce ≥ 3000 ms, cleanup `clearTimeout` + `supabase.removeChannel`. In-flight guard pada setiap loader.
- Jangan menulis kolom berumus Sheets. Fitur ini **hanya membaca** sheet.
- `activity_logs`: 1 baris per aksi konfirmasi.
- `deno check` setiap Edge Function yang disentuh; **jangan commit `deno.lock`** (hapus bila terbentuk).
- Migrasi ke produksi hanya setelah pengguna menyetujui. Jalur yang dipakai: `supabase db query --linked -f <file>`, lalu catat ke `supabase_migrations.schema_migrations` (lihat Task 10). MCP Supabase bersifat read-only.
- Hemat Log Query: jangan memakai `query_logs` MCP untuk verifikasi bila ada bukti yang lebih murah (REST probe, `execute_sql`).
- Quality gate wajib sebelum selesai: `pnpm vitest run src/styles/tokens/color-contract.test.ts`, `pnpm vitest run src/`, `pnpm run build`, `graphify update .`.
- Dokumentasi: `refactor-ss-pdo/refact_N` berikutnya (N = angka terbesar + 1; per 07 Nov 2026 terbesar 222, cek ulang saat eksekusi) berisi `AUDIT_BUGS.md` dan `REPAIR_REPORT.md` (skill `refact-doc`).

## File Structure

| File | Tanggung jawab |
|---|---|
| `supabase/functions/_shared/completeness.ts` (baru) | Fungsi murni: deteksi header, klasifikasi baris, agregasi rute, fingerprint, hitung masalah |
| `supabase/functions/_shared/submissionRules.ts` (baru) | Fungsi murni: tanggal WIB, validasi tanggal konfirmasi, sanitasi alasan |
| `supabase/functions/_shared/pageAccess.ts` (baru) | Fungsi murni: evaluasi hak akses halaman (dipakai server **dan** `PageAccessContext`) |
| `supabase/functions/_shared/cors.ts` (baru) | CORS bersama (dipindah dari `sheets-proxy`) |
| `supabase/functions/_shared/proxySession.ts` (baru) | Sesi proxy refact_205 (dipindah dari `sheets-proxy`) |
| `supabase/functions/sheets-proxy/index.ts` | Memakai `_shared/cors.ts` + `_shared/proxySession.ts`; perilaku tidak berubah |
| `supabase/functions/sheet-sync-webhook/index.ts` | Menghitung dan menyimpan `completeness` |
| `supabase/functions/route-confirmation/index.ts` (baru) | Edge Function konfirmasi siap kirim |
| `supabase/migrations/20261107000001_submission_readiness.sql` (baru) | Kolom `completeness`, tabel konfirmasi, RLS, Realtime |
| `src/context/PageAccessContext.tsx` | `canAccessPage` mendelegasikan ke `evaluatePageAccess` |
| `src/services/submissionReadinessService.ts` (baru) | Akses data + konfirmasi lewat Edge Function |
| `src/components/monitoring/readiness/readinessModel.ts` (baru) | Model murni: status rute, urutan, ringkasan, tunggakan, tanggal default, filter pantauan |
| `src/components/monitoring/readiness/useSubmissionReadiness.ts` (baru) | Hook data + Realtime (tanpa muat ulang) |
| `src/components/monitoring/readiness/SubmissionReadinessTab.tsx` (baru) | Tab Siap Kirim (segmen Kelengkapan/Armada) |
| `src/components/monitoring/readiness/ReadinessRouteCard.tsx` (baru) | Kartu rute |
| `src/components/monitoring/readiness/ReadinessRouteDetailModal.tsx` (baru) | Detail unit bermasalah, Cek ulang, Konfirmasi |
| `src/components/monitoring/readiness/ReadinessBacklogBanner.tsx` (baru) | Pita tunggakan 7 hari |
| `src/components/monitoring/readiness/WatchlistModal.tsx` (baru) | Pemilih rute pantauan |
| `src/components/monitoring/PendingUpdateBanner.tsx` (baru) | Banner "Ada pembaruan data" untuk tab capaian |
| `src/styles/components/submission.css` (baru) + `src/index.css` | Kelas tampilan fitur ini |
| `src/constants/texts/text_monitoring.ts` + `texts.test.ts` | Teks UI |
| `src/components/monitoring/MonitoringBottomNav.tsx` | Item `fleet_status` → `siap_kirim` |
| `src/components/monitoring/AllRouteMonitoringPage.tsx` | Tab default, muat data capaian secara malas, banner menggantikan muat ulang otomatis |

---

### Task 1: Modul murni kelengkapan (`_shared/completeness.ts`)

**Files:**
- Create: `supabase/functions/_shared/completeness.ts`
- Test: `src/services/submission/completeness.test.ts`

**Interfaces:**
- Produces:
  - `type UnitCompletenessStatus = 'LENGKAP' | 'DIKECUALIKAN' | 'BELUM_DIISI' | 'JANGGAL' | 'SEBAGIAN'`
  - `type RequiredField = 'tripPergi' | 'tripPulang' | 'toaShift1' | 'totalToa'`
  - `type AnomalyReason = 'RITASE_TANPA_TOA' | 'TOA_TANPA_RITASE' | 'TOTAL_TOA_KURANG'`
  - `interface UnitIssue { unit: string; status: 'BELUM_DIISI' | 'JANGGAL' | 'SEBAGIAN'; missing?: RequiredField[]; reason?: AnomalyReason }`
  - `interface RouteCompleteness { v: 1; computedAt: string; status: 'ok' | 'header_not_found'; counts: Record<UnitCompletenessStatus, number>; issues: UnitIssue[]; fingerprint: string }`
  - `isBlankCell(v: unknown): boolean`
  - `isExemptingKeterangan(raw: unknown): boolean`
  - `classifyUnitRow(cells: UnitCells): { status: UnitCompletenessStatus; missing?: RequiredField[]; reason?: AnomalyReason }`
  - `computeRouteCompleteness(rows: unknown[][], now?: Date): RouteCompleteness`
  - `countCompletenessIssues(c: RouteCompleteness | null | undefined): number` (null/format error = 1)

- [ ] **Step 1: Tulis test yang gagal**

```ts
// src/services/submission/completeness.test.ts
import { describe, it, expect } from 'vitest';
import {
  classifyUnitRow,
  computeRouteCompleteness,
  countCompletenessIssues,
  isBlankCell,
  isExemptingKeterangan,
} from '../../../supabase/functions/_shared/completeness.ts';
import { classifyUnitKeterangan, normalizeKeterangan } from '@/utils/keteranganUtils';

const HEADER = ['NO', 'NO BODY', 'TRIP PERGI', 'TRIP PULANG', 'TOA SHIFT 1', 'MANUAL SHIFT 1',
  'TOA SHIFT 2', 'MANUAL SHIFT 2', 'TOTAL TOA', 'KM AWAL SHIFT 1', 'KETERANGAN'];
// kolom: 0 NO,1 UNIT,2 TP,3 TPL,4 TOA1,5 MAN1,6 TOA2,7 MAN2,8 TOTAL,9 KM,10 KET
const row = (unit: string, tp: unknown, tpl: unknown, toa1: unknown, total: unknown, ket = '', km: unknown = '') =>
  ['1', unit, tp, tpl, toa1, '', '', '', total, km, ket];

describe('isBlankCell', () => {
  it('menganggap kosong, spasi, dan "-" sebagai belum diisi; 0 sebagai terisi', () => {
    expect(isBlankCell(undefined)).toBe(true);
    expect(isBlankCell(null)).toBe(true);
    expect(isBlankCell('')).toBe(true);
    expect(isBlankCell('  ')).toBe(true);
    expect(isBlankCell('-')).toBe(true);
    expect(isBlankCell(0)).toBe(false);
    expect(isBlankCell('0')).toBe(false);
  });
});

describe('classifyUnitRow', () => {
  const base = { tripPergi: 5, tripPulang: 5, toaShift1: 100, totalToa: 180, keterangan: '' };
  it('LENGKAP bila keempat kolom wajib terisi, termasuk angka 0', () => {
    expect(classifyUnitRow(base).status).toBe('LENGKAP');
    expect(classifyUnitRow({ tripPergi: 0, tripPulang: 0, toaShift1: 0, totalToa: 0, keterangan: '' }).status).toBe('LENGKAP');
  });
  it('BELUM_DIISI bila semua kosong dan keterangan NORMAL', () => {
    const empty = { tripPergi: '', tripPulang: '', toaShift1: '', totalToa: '' };
    expect(classifyUnitRow({ ...empty, keterangan: '' }).status).toBe('BELUM_DIISI');
    expect(classifyUnitRow({ ...empty, keterangan: 'SO' }).status).toBe('BELUM_DIISI');
    expect(classifyUnitRow({ ...empty, keterangan: '-' }).status).toBe('BELUM_DIISI');
  });
  it('DIKECUALIKAN bila semua kosong dan keterangan bukan NORMAL', () => {
    const empty = { tripPergi: '', tripPulang: '', toaShift1: '', totalToa: '' };
    expect(classifyUnitRow({ ...empty, keterangan: 'OFF' }).status).toBe('DIKECUALIKAN');
    expect(classifyUnitRow({ ...empty, keterangan: 'S1: MOGOK | S2: OFF' }).status).toBe('DIKECUALIKAN');
  });
  it('JANGGAL: ritase terisi tapi TOA S1 dan Total TOA kosong', () => {
    const r = classifyUnitRow({ ...base, toaShift1: '', totalToa: '' });
    expect(r).toEqual({ status: 'JANGGAL', reason: 'RITASE_TANPA_TOA' });
  });
  it('JANGGAL: TOA terisi tapi kedua trip kosong', () => {
    const r = classifyUnitRow({ ...base, tripPergi: '', tripPulang: '' });
    expect(r).toEqual({ status: 'JANGGAL', reason: 'TOA_TANPA_RITASE' });
  });
  it('JANGGAL: Total TOA lebih kecil dari TOA S1 (format angka Indonesia)', () => {
    expect(classifyUnitRow({ ...base, toaShift1: '1.100', totalToa: '1.050' }))
      .toEqual({ status: 'JANGGAL', reason: 'TOTAL_TOA_KURANG' });
    expect(classifyUnitRow({ ...base, toaShift1: '1.100', totalToa: '1.200' }).status).toBe('LENGKAP');
  });
  it('SEBAGIAN mencantumkan kolom yang kosong', () => {
    expect(classifyUnitRow({ ...base, tripPulang: '' })).toEqual({ status: 'SEBAGIAN', missing: ['tripPulang'] });
    expect(classifyUnitRow({ ...base, totalToa: '-' })).toEqual({ status: 'SEBAGIAN', missing: ['totalToa'] });
  });
  it('keterangan tidak membebaskan baris yang sudah berisi data', () => {
    expect(classifyUnitRow({ ...base, toaShift1: '', totalToa: '', keterangan: 'MOGOK' }).status).toBe('JANGGAL');
  });
});

describe('computeRouteCompleteness', () => {
  const now = new Date('2026-11-07T14:00:00Z');
  it('menghitung jumlah per status dan hanya mencantumkan unit bermasalah', () => {
    const rows = [
      HEADER,
      row('KLM 540', 5, 5, 100, 180),
      row('KLM 541', 5, '', 100, 180),
      row('KLM 542', '', '', '', '', 'OFF'),
      row('KLM 543', '', '', '', ''),
      row('KLM 544', 5, 5, '', ''),
      ['', '', '', '', '', '', '', '', 999, '', ''], // baris rangkuman tanpa unit: dilewati
    ];
    const c = computeRouteCompleteness(rows, now);
    expect(c.status).toBe('ok');
    expect(c.computedAt).toBe('2026-11-07T14:00:00.000Z');
    expect(c.counts).toEqual({ LENGKAP: 1, DIKECUALIKAN: 1, BELUM_DIISI: 1, JANGGAL: 1, SEBAGIAN: 1 });
    expect(c.issues).toEqual([
      { unit: 'KLM 541', status: 'SEBAGIAN', missing: ['tripPulang'] },
      { unit: 'KLM 543', status: 'BELUM_DIISI' },
      { unit: 'KLM 544', status: 'JANGGAL', reason: 'RITASE_TANPA_TOA' },
    ]);
    expect(countCompletenessIssues(c)).toBe(3);
  });

  it('mendukung header dua baris (header utama + subheader)', () => {
    const rows = [
      ['NO BODY', 'TRIP', '', 'TOA', '', 'TOTAL TOA', 'KETERANGAN'],
      ['', 'PERGI', 'PULANG', 'SHIFT 1', 'SHIFT 2', '', ''],
      ['KLM 540', 4, 4, 90, '', 170, ''],
    ];
    const c = computeRouteCompleteness(rows, now);
    expect(c.status).toBe('ok');
    expect(c.counts.LENGKAP).toBe(1);
  });

  it('header_not_found bila kolom wajib tidak ditemukan', () => {
    const c = computeRouteCompleteness([['A', 'B'], ['1', '2']], now);
    expect(c.status).toBe('header_not_found');
    expect(c.fingerprint).toBe('');
    expect(countCompletenessIssues(c)).toBe(1);
  });

  it('fingerprint tetap saat hanya KM berubah, berubah saat TOA/keterangan berubah, tidak bergantung urutan', () => {
    const a = computeRouteCompleteness([HEADER, row('KLM 540', 5, 5, 100, 180, '', 1000), row('KLM 541', 4, 4, 90, 170)], now);
    const kmOnly = computeRouteCompleteness([HEADER, row('KLM 540', 5, 5, 100, 180, '', 2000), row('KLM 541', 4, 4, 90, 170)], now);
    const reordered = computeRouteCompleteness([HEADER, row('KLM 541', 4, 4, 90, 170), row('KLM 540', 5, 5, 100, 180, '', 1000)], now);
    const toaChanged = computeRouteCompleteness([HEADER, row('KLM 540', 5, 5, 101, 180, '', 1000), row('KLM 541', 4, 4, 90, 170)], now);
    const ketChanged = computeRouteCompleteness([HEADER, row('KLM 540', 5, 5, 100, 180, 'BA02', 1000), row('KLM 541', 4, 4, 90, 170)], now);
    expect(a.fingerprint).toMatch(/^[0-9a-f]{8}$/);
    expect(kmOnly.fingerprint).toBe(a.fingerprint);
    expect(reordered.fingerprint).toBe(a.fingerprint);
    expect(toaChanged.fingerprint).not.toBe(a.fingerprint);
    expect(ketChanged.fingerprint).not.toBe(a.fingerprint);
  });

  it('countCompletenessIssues menganggap data kosong sebagai 1 masalah', () => {
    expect(countCompletenessIssues(null)).toBe(1);
    expect(countCompletenessIssues(undefined)).toBe(1);
  });
});

describe('paritas isExemptingKeterangan vs classifyUnitKeterangan', () => {
  const FIXTURES = ['', 'OFF', 'LIBUR', 'S1: OFF', 'S2: BA02 Service', 'T.O', 'TO EVDAL', 'MOGOK', 'SO', 'SGO',
    'S1: SO', 'BA.02 NP1', 'OFF | SGO', 'Rusak radiator', 'NP2', 'OKB', 'Renop', 'S1: NP1 | S2: T.O', 'SGO | SGO'];
  it.each(FIXTURES)('"%s" sama dengan (classifyUnitKeterangan !== NORMAL)', (k) => {
    const expected = classifyUnitKeterangan(k) !== 'NORMAL';
    expect(isExemptingKeterangan(k)).toBe(expected);
    expect(isExemptingKeterangan(normalizeKeterangan(k))).toBe(classifyUnitKeterangan(normalizeKeterangan(k)) !== 'NORMAL');
  });
  it('pengecualian terdokumentasi: "-" dan "0" dianggap NORMAL (tanpa keterangan)', () => {
    expect(isExemptingKeterangan('-')).toBe(false);
    expect(isExemptingKeterangan('0')).toBe(false);
  });
});
```

- [ ] **Step 2: Jalankan test dan pastikan gagal**

Run: `pnpm vitest run src/services/submission/completeness.test.ts`
Expected: FAIL, "Failed to resolve import ... _shared/completeness.ts".

- [ ] **Step 3: Implementasi**

```ts
// supabase/functions/_shared/completeness.ts
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
  const tripPergi = unit !== -1 && composite[unit + 1] && !composite[unit + 1].toLowerCase().includes('toa') ? unit + 1 : -1;
  const tripPulang = unit !== -1 && composite[unit + 2] && !composite[unit + 2].toLowerCase().includes('toa') ? unit + 2 : -1;
  const toaShift1 = findColumnIndex(composite, HEADER_KEYWORDS.toaShift1);
  const totalToa = findColumnIndex(composite, HEADER_KEYWORDS.totalToa);
  const keterangan = findColumnIndex(composite, HEADER_KEYWORDS.keterangan);
  if ([unit, tripPergi, tripPulang, toaShift1, totalToa].some((idx) => idx === -1)) return null;

  return { dataStart: isSubHeader ? headerRowIndex + 2 : headerRowIndex + 1, unit, tripPergi, tripPulang, toaShift1, totalToa, keterangan };
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
      [unit, fingerprintValue(cells.tripPergi), fingerprintValue(cells.tripPulang), fingerprintValue(cells.toaShift1),
        fingerprintValue(cells.totalToa), String(cells.keterangan ?? '').trim()].join('\u001f'),
    );
  }
  fpParts.sort();
  return { v: 1, computedAt: now.toISOString(), status: 'ok', counts, issues, fingerprint: fnv1a(fpParts.join('\u001e')) };
}

export function countCompletenessIssues(c: RouteCompleteness | null | undefined): number {
  if (!c || c.status !== 'ok') return 1;
  return c.counts.BELUM_DIISI + c.counts.JANGGAL + c.counts.SEBAGIAN;
}
```

- [ ] **Step 4: Jalankan test dan pastikan lulus**

Run: `pnpm vitest run src/services/submission/completeness.test.ts`
Expected: PASS semua. Jika ada kasus paritas yang gagal, perbaiki `NON_EXEMPT_KETERANGAN_PART` (jangan ubah fixture). Kalau perbedaan itu disengaja, dokumentasikan di test "pengecualian terdokumentasi".

- [ ] **Step 5: Pastikan `tsc -b` menerima import dari luar `src`**

Run: `pnpm run build`
Expected: exit 0. Bila `tsc` menolak (misalnya karena `rootDir`), pindahkan test ke pola import relatif yang diterima, lalu laporkan, tanpa mengubah `tsconfig` secara diam-diam.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/_shared/completeness.ts src/services/submission/completeness.test.ts
git commit -m "feat(submission): aturan kelengkapan unit sebagai modul murni bersama"
```

---

### Task 2: Modul bersama server (aturan konfirmasi, akses halaman, CORS, sesi proxy) + refactor `sheets-proxy`

**Files:**
- Create: `supabase/functions/_shared/submissionRules.ts`, `supabase/functions/_shared/pageAccess.ts`, `supabase/functions/_shared/cors.ts`, `supabase/functions/_shared/proxySession.ts`
- Modify: `supabase/functions/sheets-proxy/index.ts`, `src/context/PageAccessContext.tsx:99-160`
- Test: `src/services/submission/submissionRules.test.ts`, `src/services/submission/pageAccess.test.ts`

**Interfaces:**
- Produces:
  - `wibTodayString(now?: Date): string` (YYYY-MM-DD, Asia/Jakarta)
  - `shiftDateString(date: string, days: number): string`
  - `validateConfirmationDate(date: string, todayWib: string, maxBackDays?: number): 'ok' | 'invalid' | 'future' | 'too_old'` (default 7)
  - `sanitizeReason(raw: unknown): string` (maks. 300 karakter)
  - `REASON_MIN_LENGTH = 5`
  - `interface PageAccessSettingLike { is_enabled: boolean; allowed_roles?: string[] | null; allowed_user_emails?: string[] | null; denied_user_emails?: string[] | null }`
  - `evaluatePageAccess(pageKey: string, setting: PageAccessSettingLike | null | undefined, userRole?: string | null, userEmail?: string | null): boolean`
  - `getCorsHeaders(req: Request): Record<string, string>`
  - `signProxySession(email)`, `verifyProxySession(token)`, `verifyGoogleUserEmail(token)`, `isActiveUser(supabase, email)` (Deno)

- [ ] **Step 1: Tulis test yang gagal**

```ts
// src/services/submission/submissionRules.test.ts
import { describe, it, expect } from 'vitest';
import {
  sanitizeReason,
  shiftDateString,
  validateConfirmationDate,
  wibTodayString,
} from '../../../supabase/functions/_shared/submissionRules.ts';

describe('submissionRules', () => {
  it('wibTodayString memakai zona Asia/Jakarta', () => {
    expect(wibTodayString(new Date('2026-11-07T18:30:00Z'))).toBe('2026-11-08');
    expect(wibTodayString(new Date('2026-11-07T16:59:00Z'))).toBe('2026-11-07');
  });
  it('shiftDateString melintasi bulan', () => {
    expect(shiftDateString('2026-11-01', -1)).toBe('2026-10-31');
    expect(shiftDateString('2026-10-31', 1)).toBe('2026-11-01');
  });
  it('validateConfirmationDate membatasi masa depan dan maks. 7 hari ke belakang', () => {
    expect(validateConfirmationDate('2026-11-07', '2026-11-07')).toBe('ok');
    expect(validateConfirmationDate('2026-10-31', '2026-11-07')).toBe('ok');
    expect(validateConfirmationDate('2026-10-30', '2026-11-07')).toBe('too_old');
    expect(validateConfirmationDate('2026-11-08', '2026-11-07')).toBe('future');
    expect(validateConfirmationDate('07-11-2026', '2026-11-07')).toBe('invalid');
  });
  it('sanitizeReason membuang karakter kontrol, merapikan spasi, dan memotong 300 karakter', () => {
    expect(sanitizeReason('  TOA\u0000 rusak \n\n  dilaporkan ')).toBe('TOA rusak dilaporkan');
    expect(sanitizeReason(undefined)).toBe('');
    expect(sanitizeReason('x'.repeat(400))).toHaveLength(300);
  });
});
```

```ts
// src/services/submission/pageAccess.test.ts
import { describe, it, expect } from 'vitest';
import { evaluatePageAccess } from '../../../supabase/functions/_shared/pageAccess.ts';

const base = { is_enabled: true, allowed_roles: ['superadmin', 'korlap'], allowed_user_emails: ['pj@x.id'], denied_user_emails: ['blok@x.id'] };

describe('evaluatePageAccess (cermin canAccessPage)', () => {
  it('superadmin selalu boleh, termasuk saat halaman nonaktif', () => {
    expect(evaluatePageAccess('regional_monitoring', { ...base, is_enabled: false }, 'superadmin', 'a@x.id')).toBe(true);
  });
  it('halaman nonaktif menolak selain superadmin', () => {
    expect(evaluatePageAccess('regional_monitoring', { ...base, is_enabled: false }, 'korlap', 'k@x.id')).toBe(false);
  });
  it('blacklist mengalahkan role, whitelist mengalahkan role', () => {
    expect(evaluatePageAccess('regional_monitoring', base, 'korlap', 'BLOK@x.id')).toBe(false);
    expect(evaluatePageAccess('regional_monitoring', base, 'pdo', 'pj@x.id')).toBe(true);
  });
  it('role baseline, termasuk normalisasi petugas → pdo', () => {
    expect(evaluatePageAccess('regional_monitoring', base, 'korlap', 'k@x.id')).toBe(true);
    expect(evaluatePageAccess('regional_monitoring', base, 'pdo', 'p@x.id')).toBe(false);
    expect(evaluatePageAccess('x', { is_enabled: true, allowed_roles: ['pdo'] }, 'petugas', 'p@x.id')).toBe(true);
  });
  it('tanpa setting = boleh; tanpa allowed_roles memakai legacy guard pdo', () => {
    expect(evaluatePageAccess('regional_monitoring', null, 'pdo', 'p@x.id')).toBe(true);
    expect(evaluatePageAccess('regional_monitoring', { is_enabled: true, allowed_roles: [] }, 'pdo', 'p@x.id')).toBe(false);
    expect(evaluatePageAccess('other_page', { is_enabled: true, allowed_roles: [] }, 'pdo', 'p@x.id')).toBe(true);
  });
});
```

- [ ] **Step 2: Jalankan test dan pastikan gagal**

Run: `pnpm vitest run src/services/submission/submissionRules.test.ts src/services/submission/pageAccess.test.ts`
Expected: FAIL (modul belum ada).

- [ ] **Step 3: Implementasi modul murni**

```ts
// supabase/functions/_shared/submissionRules.ts
// Modul murni: aturan validasi konfirmasi "Siap Dikirim" (dipakai route-confirmation, diuji Vitest).

export const REASON_MIN_LENGTH = 5;
export const REASON_MAX_LENGTH = 300;
export const MAX_CONFIRM_BACK_DAYS = 7;

export function wibTodayString(now: Date = new Date()): string {
  // en-CA menghasilkan format YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function shiftDateString(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function validateConfirmationDate(
  date: string,
  todayWib: string,
  maxBackDays: number = MAX_CONFIRM_BACK_DAYS,
): 'ok' | 'invalid' | 'future' | 'too_old' {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(`${date}T00:00:00Z`))) return 'invalid';
  if (date > todayWib) return 'future';
  if (date < shiftDateString(todayWib, -maxBackDays)) return 'too_old';
  return 'ok';
}

export function sanitizeReason(raw: unknown): string {
  return String(raw ?? '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, REASON_MAX_LENGTH);
}
```

```ts
// supabase/functions/_shared/pageAccess.ts
// Satu sumber aturan akses halaman: dipakai PageAccessContext (klien) dan Edge Function (server).

export interface PageAccessSettingLike {
  is_enabled: boolean;
  allowed_roles?: string[] | null;
  allowed_user_emails?: string[] | null;
  denied_user_emails?: string[] | null;
}

const LEGACY_PDO_BLOCKED_PAGES = new Set(['regional_monitoring', 'regional_summary', 'regional_wa_report']);

export function evaluatePageAccess(
  pageKey: string,
  setting: PageAccessSettingLike | null | undefined,
  userRole?: string | null,
  userEmail?: string | null,
): boolean {
  const role = userRole ? userRole.toLowerCase().trim() : null;
  if (role === 'superadmin') return true;
  if (!setting) return true;
  if (!setting.is_enabled) return false;

  const email = (userEmail || '').toLowerCase().trim();
  const denied = Array.isArray(setting.denied_user_emails) ? setting.denied_user_emails : [];
  if (email && denied.some((e) => e.toLowerCase().trim() === email)) return false;

  const allowed = Array.isArray(setting.allowed_user_emails) ? setting.allowed_user_emails : [];
  if (email && allowed.some((e) => e.toLowerCase().trim() === email)) return true;

  if (Array.isArray(setting.allowed_roles) && setting.allowed_roles.length > 0) {
    if (!role) return false;
    const normalizedRole = role === 'petugas' ? 'pdo' : role;
    return setting.allowed_roles.some((r) => r.toLowerCase().trim() === normalizedRole);
  }

  if (LEGACY_PDO_BLOCKED_PAGES.has(pageKey) && (role === 'pdo' || role === 'petugas')) return false;
  return true;
}
```

- [ ] **Step 4: Delegasikan `canAccessPage` ke modul bersama**

Di `src/context/PageAccessContext.tsx`, tambah import di blok import:

```ts
import { evaluatePageAccess } from '../../supabase/functions/_shared/pageAccess.ts';
```

Ganti seluruh isi callback `canAccessPage` (baris 99–160) dengan:

```ts
  const canAccessPage = useCallback(
    (pageKey: PageKey, userRole?: string | null, userEmail?: string | null): boolean => {
      const rawEmail =
        userEmail ||
        (typeof localStorage !== 'undefined' ? localStorage.getItem('PDO_USER_EMAIL') : null) ||
        '';
      return evaluatePageAccess(pageKey, settingsMap[pageKey], userRole, rawEmail);
    },
    [settingsMap]
  );
```

- [ ] **Step 5: Jalankan test akses halaman yang sudah ada + test baru**

Run: `pnpm vitest run src/services/submission src/context`
Expected: PASS semua. Test `PageAccessContext` yang lama harus tetap lulus tanpa diubah; itulah bukti paritasnya.

- [ ] **Step 6: Pindahkan CORS dan sesi proxy ke `_shared`**

Buat `supabase/functions/_shared/cors.ts`, isinya fungsi `getCorsHeaders` dari `sheets-proxy/index.ts` (baris 4–27 saat ini) dengan `export`:

```ts
// supabase/functions/_shared/cors.ts
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:4173",
  ];

  const isAllowed =
    !origin ||
    allowedOrigins.includes(origin) ||
    origin.endsWith(".vercel.app") ||
    origin.endsWith(".supabase.co") ||
    (Deno.env.get("ALLOWED_ORIGIN") && origin === Deno.env.get("ALLOWED_ORIGIN"));

  return {
    "Access-Control-Allow-Origin": isAllowed ? (origin || "*") : "https://sspdo.vercel.app",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-google-token, x-proxy-session",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
```

Buat `supabase/functions/_shared/proxySession.ts` dengan memindahkan blok "Otorisasi Pemanggil (BUG-SEC-205-01)" dari `sheets-proxy/index.ts`. Blok itu berisi konstanta `PROXY_SESSION_TTL_SEC`, `ACTIVE_USER_CACHE_TTL_MS`, `GOOGLE_TOKEN_CACHE_TTL_MS`, kedua `Map` cache, `base64UrlDecode`, `getSessionKey`, `signProxySession`, `verifyProxySession`, `verifyGoogleUserEmail`, dan `isActiveUser`. Tiga perubahan:
1. Tambahkan `export` pada `signProxySession`, `verifyProxySession`, `verifyGoogleUserEmail`, `isActiveUser`.
2. Salin fungsi `base64UrlEncode(data: Uint8Array | string): string` dari `sheets-proxy/index.ts` (baris 117–132) ke modul ini sebagai fungsi lokal (tidak diekspor). `sheets-proxy` tetap memiliki salinannya sendiri untuk JWT service account.
3. Ubah signature `isActiveUser` agar menerima klien:

```ts
// deno-lint-ignore no-explicit-any
export async function isActiveUser(supabase: { from: (table: string) => any } | null, email: string): Promise<boolean> {
  const now = Date.now();
  const cached = activeUserCache.get(email);
  if (cached && now - cached.at < ACTIVE_USER_CACHE_TTL_MS) return cached.active;
  if (!supabase) return false;
  // Email user_profiles tersimpan lowercase (diverifikasi 6 Nov 2026), jadi eq presisi tanpa wildcard ilike
  const { data, error } = await supabase.from("user_profiles").select("is_active").eq("email", email).maybeSingle();
  if (error) return false;
  const active = Boolean(data?.is_active);
  if (activeUserCache.size > 500) activeUserCache.clear();
  activeUserCache.set(email, { active, at: now });
  return active;
}
```

Di `sheets-proxy/index.ts`:
- Hapus fungsi lokal `getCorsHeaders` dan seluruh blok "Otorisasi Pemanggil" yang sudah dipindah. **Pertahankan** `ALLOWED_BATCH_UPDATE_REQUESTS` dan `jsonResponse` di file ini.
- Tambah import di bawah import `createClient`:

```ts
import { getCorsHeaders } from "../_shared/cors.ts";
import { signProxySession, verifyGoogleUserEmail, verifyProxySession, isActiveUser } from "../_shared/proxySession.ts";
```

- Ganti dua pemanggilan `isActiveUser(email)` / `isActiveUser(sessionEmail)` menjadi `isActiveUser(getSupabaseAdmin(), email)` / `isActiveUser(getSupabaseAdmin(), sessionEmail)`.

- [ ] **Step 7: `deno check` (perilaku `sheets-proxy` harus identik)**

Run: `cd supabase/functions/sheets-proxy && deno check index.ts; cd ../../.. && rm -f supabase/functions/sheets-proxy/deno.lock`
Expected: `Check index.ts` tanpa error. Pastikan `git status` tidak menampilkan `deno.lock`.

- [ ] **Step 8: Commit**

```bash
git add supabase/functions/_shared src/services/submission src/context/PageAccessContext.tsx supabase/functions/sheets-proxy/index.ts
git commit -m "refactor(edge): modul bersama aturan akses, sesi proxy, CORS, dan aturan konfirmasi"
```

---

### Task 3: Migrasi database

**Files:**
- Create: `supabase/migrations/20261107000001_submission_readiness.sql`

**Interfaces:**
- Produces: kolom `daily_route_reports.completeness jsonb`; tabel `route_submission_confirmations(id, route_id bigint, route_code text, date date, confirmed_by text, confirmed_at timestamptz, issues_at_confirm int, reason text, fingerprint_at_confirm text)` unik pada `(route_id, date)`; anon/authenticated hanya `SELECT`; tabel masuk publikasi `supabase_realtime`.

- [ ] **Step 1: Tulis migrasi**

```sql
-- ============================================================================
-- Migrasi: Kelengkapan Data & Konfirmasi "Siap Dikirim" (Refactor N)
-- File: supabase/migrations/20261107000001_submission_readiness.sql
-- Spec: docs/superpowers/specs/2026-11-07-kelengkapan-siap-kirim-design.md
--
-- 1. daily_route_reports.completeness: ringkasan kelengkapan per rute/tanggal,
--    HANYA ditulis oleh sheet-sync-webhook (service_role).
-- 2. route_submission_confirmations: konfirmasi siap kirim per rute/tanggal.
--    Anon/authenticated hanya boleh MEMBACA; tulis hanya lewat Edge Function
--    route-confirmation (service_role).
-- ============================================================================

ALTER TABLE public.daily_route_reports
  ADD COLUMN IF NOT EXISTS completeness jsonb;

CREATE TABLE IF NOT EXISTS public.route_submission_confirmations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  route_id bigint NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  route_code text NOT NULL,
  date date NOT NULL,
  confirmed_by text NOT NULL,
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  issues_at_confirm integer NOT NULL DEFAULT 0 CHECK (issues_at_confirm >= 0),
  reason text CHECK (reason IS NULL OR char_length(reason) <= 300),
  fingerprint_at_confirm text,
  CONSTRAINT route_submission_confirmations_route_date_key UNIQUE (route_id, date),
  CONSTRAINT route_submission_confirmations_reason_required
    CHECK (issues_at_confirm = 0 OR (reason IS NOT NULL AND char_length(btrim(reason)) >= 5))
);

CREATE INDEX IF NOT EXISTS idx_route_submission_confirmations_date
  ON public.route_submission_confirmations (date);

ALTER TABLE public.route_submission_confirmations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read route_submission_confirmations" ON public.route_submission_confirmations;
CREATE POLICY "Allow read route_submission_confirmations"
  ON public.route_submission_confirmations
  FOR SELECT TO anon, authenticated
  USING (true);

-- Default privileges Supabase memberi hak penuh ke anon/authenticated pada tabel baru: persempit ke SELECT saja
REVOKE ALL ON TABLE public.route_submission_confirmations FROM anon, authenticated;
GRANT SELECT ON TABLE public.route_submission_confirmations TO anon, authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.route_submission_confirmations;

NOTIFY pgrst, 'reload schema';
```

- [ ] **Step 2: Commit (BELUM diterapkan ke produksi; diterapkan di Task 10 setelah izin pengguna)**

```bash
git add supabase/migrations/20261107000001_submission_readiness.sql
git commit -m "feat(db): kolom completeness dan tabel konfirmasi siap kirim (belum diterapkan)"
```

---

### Task 4: `sheet-sync-webhook` menghitung kelengkapan

**Files:**
- Modify: `supabase/functions/sheet-sync-webhook/index.ts` (blok import paling atas; setelah validasi `rows.length < 2` ±baris 464; payload upsert ±baris 708–734)

**Interfaces:**
- Consumes: `computeRouteCompleteness`, `type RouteCompleteness` (Task 1)
- Produces: `daily_route_reports.completeness` terisi setiap webhook sukses membaca sheet

- [ ] **Step 1: Tambah import**

Di bawah baris import `createClient` di `sheet-sync-webhook/index.ts`:

```ts
import { computeRouteCompleteness, type RouteCompleteness } from "../_shared/completeness.ts";
```

- [ ] **Step 2: Hitung kelengkapan dari `rows` yang sudah dibaca**

Tepat setelah blok `if (rows.length < 2) { ... }` (sebelum `const normalizeString = ...`):

```ts
    // Kelengkapan "Siap Kirim": dihitung dari baris yang sama (tanpa baca Sheets tambahan).
    // Kegagalan di sini tidak boleh menggagalkan penyimpanan angka capaian.
    let completeness: RouteCompleteness | null = null;
    try {
      completeness = computeRouteCompleteness(rows);
    } catch (err) {
      console.warn("[SheetSyncWebhook] Gagal menghitung kelengkapan:", err);
    }
```

- [ ] **Step 3: Sertakan di payload upsert**

Di objek `payload` (sebelum `last_synced_at`):

```ts
      ...(completeness ? { completeness } : {}),
```

- [ ] **Step 4: Pastikan penulis lain tidak menimpa `completeness`**

Run: `git grep -n "daily_route_reports" -- src scripts supabase/functions | grep -v "\.test\." | grep -i "upsert\|update\|insert"`
Kemudian buka setiap baris hasilnya dan pastikan payload **tidak** berasal dari `select('*')` yang dikirim ulang utuh (kalau begitu, kolom `completeness` lama akan ditulis balik dengan nilai basi). Bila ada pola seperti itu, buang field `completeness` dari objek tersebut sebelum upsert dan tambahkan test. Catat hasil pemeriksaan ini di `REPAIR_REPORT.md`.
Expected: semua penulis memakai payload eksplisit tanpa `completeness`.

- [ ] **Step 5: `deno check`**

Run: `cd supabase/functions/sheet-sync-webhook && deno check index.ts; cd ../../.. && rm -f supabase/functions/sheet-sync-webhook/deno.lock`
Expected: tanpa error, tanpa `deno.lock` tersisa.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/sheet-sync-webhook/index.ts
git commit -m "feat(webhook): simpan ringkasan kelengkapan per rute saat sheet diedit"
```

---

### Task 5: Edge Function `route-confirmation`

**Files:**
- Create: `supabase/functions/route-confirmation/index.ts`

**Interfaces:**
- Consumes: `getCorsHeaders` (Task 2), `verifyProxySession`, `isActiveUser` (Task 2), `evaluatePageAccess` (Task 2), `validateConfirmationDate`, `sanitizeReason`, `wibTodayString`, `REASON_MIN_LENGTH` (Task 2), `countCompletenessIssues`, `RouteCompleteness` (Task 1)
- Produces: `POST /functions/v1/route-confirmation` body `{ routeId: number; date: string; reason?: string }`, header `x-proxy-session`.
  - Sukses `200 { ok: true, confirmation: SubmissionConfirmation }`.
  - Gagal `{ error, code }` dengan code ∈ `PROXY_SESSION_INVALID`(401) | `ACCESS_DENIED`(403) | `INVALID_ROUTE`(400) | `INVALID_DATE`(400) | `ROUTE_NOT_FOUND`(404) | `REASON_REQUIRED`(400) | `FAILED`(500).

- [ ] **Step 1: Implementasi**

```ts
// supabase/functions/route-confirmation/index.ts
// Konfirmasi "Siap Dikirim" per rute/tanggal. Tulis hanya lewat fungsi ini (service_role);
// nilai audit (jumlah masalah, fingerprint) diambil server, bukan dari klien.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { getCorsHeaders } from "../_shared/cors.ts";
import { isActiveUser, verifyProxySession } from "../_shared/proxySession.ts";
import { evaluatePageAccess } from "../_shared/pageAccess.ts";
import { REASON_MIN_LENGTH, sanitizeReason, validateConfirmationDate, wibTodayString } from "../_shared/submissionRules.ts";
import { countCompletenessIssues, type RouteCompleteness } from "../_shared/completeness.ts";

function json(body: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Hanya metode POST yang didukung", code: "FAILED" }, 405, cors);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseUrl || !serviceKey) return json({ error: "Konfigurasi server belum lengkap", code: "FAILED" }, 500, cors);
    const supabase = createClient(supabaseUrl, serviceKey);

    const email = await verifyProxySession(req.headers.get("x-proxy-session") || "");
    if (!email || !(await isActiveUser(supabase, email))) {
      return json({ error: "Sesi akses tidak valid atau kedaluwarsa.", code: "PROXY_SESSION_INVALID" }, 401, cors);
    }

    const { data: profile } = await supabase.from("user_profiles").select("roles(code)").eq("email", email).maybeSingle();
    // deno-lint-ignore no-explicit-any
    const role: string | null = (profile as any)?.roles?.code ?? null;
    const { data: setting } = await supabase
      .from("app_page_settings")
      .select("is_enabled, allowed_roles, allowed_user_emails, denied_user_emails")
      .eq("page_key", "regional_monitoring")
      .maybeSingle();
    if (!evaluatePageAccess("regional_monitoring", setting, role, email)) {
      return json({ error: "Tidak memiliki akses konfirmasi.", code: "ACCESS_DENIED" }, 403, cors);
    }

    const body = await req.json().catch(() => ({}));
    const routeId = Number(body?.routeId);
    const date = String(body?.date ?? "");
    if (!Number.isInteger(routeId) || routeId <= 0) return json({ error: "Rute tidak valid.", code: "INVALID_ROUTE" }, 400, cors);
    if (validateConfirmationDate(date, wibTodayString()) !== "ok") {
      return json({ error: "Tanggal di luar rentang konfirmasi.", code: "INVALID_DATE" }, 400, cors);
    }

    const { data: route } = await supabase.from("routes").select("id, route_code").eq("id", routeId).maybeSingle();
    if (!route) return json({ error: "Rute tidak terdaftar.", code: "ROUTE_NOT_FOUND" }, 404, cors);

    const { data: report } = await supabase
      .from("daily_route_reports")
      .select("completeness")
      .eq("route_id", routeId)
      .eq("date", date)
      .maybeSingle();
    const completeness = (report?.completeness ?? null) as RouteCompleteness | null;
    const issues = countCompletenessIssues(completeness);
    const reason = sanitizeReason(body?.reason);
    if (issues > 0 && reason.length < REASON_MIN_LENGTH) {
      return json({ error: "Alasan wajib diisi.", code: "REASON_REQUIRED" }, 400, cors);
    }

    const row = {
      route_id: route.id,
      route_code: route.route_code,
      date,
      confirmed_by: email,
      confirmed_at: new Date().toISOString(),
      issues_at_confirm: issues,
      reason: reason || null,
      fingerprint_at_confirm: completeness?.fingerprint || null,
    };
    const { data: saved, error: saveError } = await supabase
      .from("route_submission_confirmations")
      .upsert(row, { onConflict: "route_id,date" })
      .select("route_id, route_code, date, confirmed_by, confirmed_at, issues_at_confirm, reason, fingerprint_at_confirm")
      .single();
    if (saveError || !saved) {
      console.error("[RouteConfirmation] Gagal menyimpan:", saveError?.message);
      return json({ error: "Konfirmasi gagal disimpan.", code: "FAILED" }, 500, cors);
    }

    // 1 baris log per aksi (AGENTS.md: agregasi activity_logs)
    const { error: logError } = await supabase.from("activity_logs").insert([{
      user_email: email,
      action: "CONFIRM_SUBMISSION",
      route_code: route.route_code,
      details: { date, issues, reason: row.reason },
    }]);
    if (logError) console.warn("[RouteConfirmation] Gagal menulis activity_logs:", logError.message);

    return json({ ok: true, confirmation: saved }, 200, cors);
  } catch (err) {
    console.error("[RouteConfirmation] Unhandled:", err instanceof Error ? err.message : err);
    return json({ error: "Terjadi kesalahan server.", code: "FAILED" }, 500, cors);
  }
});
```

- [ ] **Step 2: `deno check`**

Run: `cd supabase/functions/route-confirmation && deno check index.ts; cd ../../.. && rm -f supabase/functions/route-confirmation/deno.lock`
Expected: tanpa error.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/route-confirmation/index.ts
git commit -m "feat(edge): route-confirmation untuk konfirmasi siap kirim terverifikasi"
```

---

### Task 6: Service data + model murni

**Files:**
- Create: `src/services/submissionReadinessService.ts`, `src/components/monitoring/readiness/readinessModel.ts`
- Test: `src/services/submissionReadinessService.test.ts`, `src/components/monitoring/readiness/readinessModel.test.ts`

**Interfaces:**
- Consumes: `RouteCompleteness`, `countCompletenessIssues` (Task 1); `getProxySession`, `clearProxySession` (`src/services/googleSheets/transport.ts`); `shiftDateString` (Task 2)
- Produces (service):
  - `interface ActiveRoute { id: number; route_code: string }`
  - `interface RouteReadinessRow { route_id: number; route_code: string; completeness: RouteCompleteness | null; last_synced_at: string | null }`
  - `interface SubmissionConfirmation { route_id: number; route_code: string; date: string; confirmed_by: string; confirmed_at: string; issues_at_confirm: number; reason: string | null; fingerprint_at_confirm: string | null }`
  - `fetchActiveRoutes(): Promise<ActiveRoute[]>`
  - `fetchReadinessByDate(date: string): Promise<RouteReadinessRow[]>`
  - `fetchConfirmationsInRange(start: string, end: string): Promise<SubmissionConfirmation[]>`
  - `class ConfirmSubmissionError extends Error { code: string }`
  - `confirmRouteSubmission(input: { routeId: number; date: string; reason?: string }): Promise<SubmissionConfirmation>`
- Produces (model):
  - `SUBMISSION_FEATURE_START_DATE: string`
  - `type RouteReadinessState = 'JANGGAL' | 'BELUM_DIISI' | 'NO_DATA' | 'FORMAT_ERROR' | 'SEBAGIAN' | 'CHANGED_AFTER_CONFIRM' | 'READY_UNCONFIRMED' | 'CONFIRMED'`
  - `interface RouteReadinessView { routeId: number; routeCode: string; completeness: RouteCompleteness | null; lastSyncedAt: string | null; confirmation: SubmissionConfirmation | null; state: RouteReadinessState; issueCount: number }`
  - `deriveRouteState(c, confirmation): RouteReadinessState`
  - `buildReadinessViews(routes, rows, confirmations, date): RouteReadinessView[]` (terurut)
  - `summarizeViews(views): { total: number; confirmed: number; janggal: number; belumDiisi: number; sebagian: number; changed: number }`
  - `computeBacklog({ routes, confirmations, todayWib, startDate, days }): Array<{ date: string; routeId: number; routeCode: string }>`
  - `pickDefaultDate({ todayWib, startDate, routes, confirmations, watchlistYesterday }): string`
  - `readWatchlist(date: string): number[]`, `writeWatchlist(date: string, routeIds: number[]): void`

- [ ] **Step 1: Tulis test model yang gagal**

```ts
// src/components/monitoring/readiness/readinessModel.test.ts
// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildReadinessViews,
  computeBacklog,
  deriveRouteState,
  pickDefaultDate,
  readWatchlist,
  summarizeViews,
  writeWatchlist,
} from './readinessModel';
import type { RouteCompleteness } from '../../../../supabase/functions/_shared/completeness.ts';
import type { SubmissionConfirmation } from '@/services/submissionReadinessService';

const comp = (over: Partial<RouteCompleteness['counts']> = {}, fingerprint = 'aaaa0001'): RouteCompleteness => ({
  v: 1, computedAt: '2026-11-07T14:00:00.000Z', status: 'ok',
  counts: { LENGKAP: 10, DIKECUALIKAN: 0, BELUM_DIISI: 0, JANGGAL: 0, SEBAGIAN: 0, ...over },
  issues: [], fingerprint,
});
const conf = (routeId: number, date: string, fingerprint: string | null = 'aaaa0001'): SubmissionConfirmation => ({
  route_id: routeId, route_code: `JAK.${routeId}`, date, confirmed_by: 'k@x.id',
  confirmed_at: '2026-11-07T14:30:00Z', issues_at_confirm: 0, reason: null, fingerprint_at_confirm: fingerprint,
});

describe('deriveRouteState', () => {
  it('memetakan setiap kondisi', () => {
    expect(deriveRouteState(null, null)).toBe('NO_DATA');
    expect(deriveRouteState({ ...comp(), status: 'header_not_found' }, null)).toBe('FORMAT_ERROR');
    expect(deriveRouteState(comp({ JANGGAL: 1, BELUM_DIISI: 1 }), null)).toBe('JANGGAL');
    expect(deriveRouteState(comp({ BELUM_DIISI: 2 }), null)).toBe('BELUM_DIISI');
    expect(deriveRouteState(comp({ SEBAGIAN: 1 }), null)).toBe('SEBAGIAN');
    expect(deriveRouteState(comp(), null)).toBe('READY_UNCONFIRMED');
    expect(deriveRouteState(comp(), conf(1, '2026-11-07'))).toBe('CONFIRMED');
    expect(deriveRouteState(comp({}, 'bbbb0002'), conf(1, '2026-11-07'))).toBe('CHANGED_AFTER_CONFIRM');
    expect(deriveRouteState(null, conf(1, '2026-11-07', null))).toBe('CONFIRMED');
  });
});

describe('buildReadinessViews & summarizeViews', () => {
  it('menyertakan rute tanpa data dan mengurutkan dari yang paling butuh perhatian', () => {
    const routes = [{ id: 1, route_code: 'JAK.01' }, { id: 2, route_code: 'JAK.02' }, { id: 3, route_code: 'JAK.10' }];
    const rows = [
      { route_id: 1, route_code: 'JAK.01', completeness: comp(), last_synced_at: null },
      { route_id: 3, route_code: 'JAK.10', completeness: comp({ JANGGAL: 1 }), last_synced_at: null },
    ];
    const views = buildReadinessViews(routes, rows, [conf(1, '2026-11-07'), conf(2, '2026-11-06')], '2026-11-07');
    expect(views.map((v) => [v.routeCode, v.state])).toEqual([
      ['JAK.10', 'JANGGAL'], ['JAK.02', 'NO_DATA'], ['JAK.01', 'CONFIRMED'],
    ]);
    expect(views.find((v) => v.routeCode === 'JAK.02')?.issueCount).toBe(1);
    expect(summarizeViews(views)).toEqual({ total: 3, confirmed: 1, janggal: 1, belumDiisi: 1, sebagian: 0, changed: 0 });
  });
});

describe('computeBacklog', () => {
  it('hanya tanggal sebelum hari ini, dalam 7 hari, dan tidak sebelum tanggal fitur aktif', () => {
    const routes = [{ id: 1, route_code: 'JAK.01' }, { id: 2, route_code: 'JAK.02' }];
    const backlog = computeBacklog({
      routes, todayWib: '2026-11-10', startDate: '2026-11-08', days: 7,
      confirmations: [conf(1, '2026-11-09'), conf(1, '2026-11-08'), conf(2, '2026-11-08')],
    });
    expect(backlog).toEqual([{ date: '2026-11-09', routeId: 2, routeCode: 'JAK.02' }]);
  });
});

describe('pickDefaultDate', () => {
  const routes = [{ id: 1, route_code: 'JAK.01' }, { id: 2, route_code: 'JAK.02' }];
  it('kemarin bila rute (pantauan atau semua) kemarin belum seluruhnya dikonfirmasi', () => {
    expect(pickDefaultDate({ todayWib: '2026-11-10', startDate: '2026-11-01', routes, confirmations: [conf(1, '2026-11-09')], watchlistYesterday: [] }))
      .toBe('2026-11-09');
    expect(pickDefaultDate({ todayWib: '2026-11-10', startDate: '2026-11-01', routes, confirmations: [conf(1, '2026-11-09')], watchlistYesterday: [1] }))
      .toBe('2026-11-10');
  });
  it('hari ini bila kemarin sebelum tanggal fitur aktif', () => {
    expect(pickDefaultDate({ todayWib: '2026-11-08', startDate: '2026-11-08', routes, confirmations: [], watchlistYesterday: [] }))
      .toBe('2026-11-08');
  });
});

describe('watchlist', () => {
  beforeEach(() => localStorage.clear());
  it('menyimpan per tanggal dan tahan data rusak', () => {
    writeWatchlist('2026-11-07', [3, 1]);
    expect(readWatchlist('2026-11-07')).toEqual([3, 1]);
    expect(readWatchlist('2026-11-08')).toEqual([]);
    localStorage.setItem('SS_SUBMISSION_WATCHLIST_2026-11-09', '{rusak');
    expect(readWatchlist('2026-11-09')).toEqual([]);
  });
});
```

- [ ] **Step 2: Jalankan dan pastikan gagal**

Run: `pnpm vitest run src/components/monitoring/readiness/readinessModel.test.ts`
Expected: FAIL (modul belum ada).

- [ ] **Step 3: Implementasi service**

```ts
// src/services/submissionReadinessService.ts
import { supabase, isSupabaseConfigured } from './supabase';
import { clearProxySession, getProxySession } from './googleSheets/transport';
import type { RouteCompleteness } from '../../supabase/functions/_shared/completeness.ts';

export interface ActiveRoute { id: number; route_code: string }
export interface RouteReadinessRow {
  route_id: number;
  route_code: string;
  completeness: RouteCompleteness | null;
  last_synced_at: string | null;
}
export interface SubmissionConfirmation {
  route_id: number;
  route_code: string;
  date: string;
  confirmed_by: string;
  confirmed_at: string;
  issues_at_confirm: number;
  reason: string | null;
  fingerprint_at_confirm: string | null;
}

const CONFIRMATION_COLUMNS =
  'route_id, route_code, date, confirmed_by, confirmed_at, issues_at_confirm, reason, fingerprint_at_confirm';

export async function fetchActiveRoutes(): Promise<ActiveRoute[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('routes').select('id, route_code').eq('is_active', true).order('route_code');
  if (error) throw error;
  return (data || []) as ActiveRoute[];
}

export async function fetchReadinessByDate(date: string): Promise<RouteReadinessRow[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('daily_route_reports')
    .select('route_id, route_code, completeness, last_synced_at')
    .eq('date', date);
  if (error) throw error;
  return (data || []) as RouteReadinessRow[];
}

export async function fetchConfirmationsInRange(start: string, end: string): Promise<SubmissionConfirmation[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('route_submission_confirmations')
    .select(CONFIRMATION_COLUMNS)
    .gte('date', start)
    .lte('date', end);
  if (error) throw error;
  return (data || []) as SubmissionConfirmation[];
}

export class ConfirmSubmissionError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

async function readErrorCode(error: unknown): Promise<string> {
  try {
    const body = await (error as { context?: Response })?.context?.json?.();
    return typeof body?.code === 'string' ? body.code : 'FAILED';
  } catch {
    return 'FAILED';
  }
}

export async function confirmRouteSubmission(input: {
  routeId: number;
  date: string;
  reason?: string;
}): Promise<SubmissionConfirmation> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new ConfirmSubmissionError('OFFLINE');

  let session = await getProxySession();
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data, error } = await supabase.functions.invoke('route-confirmation', {
      body: input,
      headers: session ? { 'x-proxy-session': session } : undefined,
    });
    if (!error && data?.confirmation) return data.confirmation as SubmissionConfirmation;

    const code = error ? await readErrorCode(error) : 'FAILED';
    if (code === 'PROXY_SESSION_INVALID' && attempt === 0) {
      clearProxySession();
      session = await getProxySession(true);
      if (session) continue;
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('google-auth-expired'));
    }
    throw new ConfirmSubmissionError(code);
  }
  throw new ConfirmSubmissionError('FAILED');
}
```

- [ ] **Step 4: Implementasi model**

```ts
// src/components/monitoring/readiness/readinessModel.ts
import { countCompletenessIssues, type RouteCompleteness } from '../../../../supabase/functions/_shared/completeness.ts';
import { shiftDateString } from '../../../../supabase/functions/_shared/submissionRules.ts';
import type { ActiveRoute, RouteReadinessRow, SubmissionConfirmation } from '@/services/submissionReadinessService';

// Tanggal fitur aktif di produksi (WIB). Tunggakan & tanggal default tidak menilai tanggal sebelumnya.
// Diisi ulang dengan tanggal deploy produksi di Task 10.
export const SUBMISSION_FEATURE_START_DATE = '2026-11-08';
export const BACKLOG_DAYS = 7;
const WATCHLIST_KEY_PREFIX = 'SS_SUBMISSION_WATCHLIST_';

export type RouteReadinessState =
  | 'JANGGAL' | 'BELUM_DIISI' | 'NO_DATA' | 'FORMAT_ERROR' | 'SEBAGIAN'
  | 'CHANGED_AFTER_CONFIRM' | 'READY_UNCONFIRMED' | 'CONFIRMED';

export interface RouteReadinessView {
  routeId: number;
  routeCode: string;
  completeness: RouteCompleteness | null;
  lastSyncedAt: string | null;
  confirmation: SubmissionConfirmation | null;
  state: RouteReadinessState;
  issueCount: number;
}

const STATE_ORDER: Record<RouteReadinessState, number> = {
  JANGGAL: 0, BELUM_DIISI: 1, NO_DATA: 1, FORMAT_ERROR: 1, SEBAGIAN: 2,
  CHANGED_AFTER_CONFIRM: 3, READY_UNCONFIRMED: 4, CONFIRMED: 5,
};

export function deriveRouteState(
  c: RouteCompleteness | null,
  confirmation: SubmissionConfirmation | null,
): RouteReadinessState {
  if (confirmation) {
    const current = c?.fingerprint || null;
    return current !== (confirmation.fingerprint_at_confirm || null) ? 'CHANGED_AFTER_CONFIRM' : 'CONFIRMED';
  }
  if (!c) return 'NO_DATA';
  if (c.status !== 'ok') return 'FORMAT_ERROR';
  if (c.counts.JANGGAL > 0) return 'JANGGAL';
  if (c.counts.BELUM_DIISI > 0) return 'BELUM_DIISI';
  if (c.counts.SEBAGIAN > 0) return 'SEBAGIAN';
  return 'READY_UNCONFIRMED';
}

export function buildReadinessViews(
  routes: ActiveRoute[],
  rows: RouteReadinessRow[],
  confirmations: SubmissionConfirmation[],
  date: string,
): RouteReadinessView[] {
  const rowByRoute = new Map(rows.map((r) => [r.route_id, r]));
  const confByRoute = new Map(confirmations.filter((c) => c.date === date).map((c) => [c.route_id, c]));
  return routes
    .map((route) => {
      const row = rowByRoute.get(route.id);
      const completeness = row?.completeness ?? null;
      const confirmation = confByRoute.get(route.id) ?? null;
      return {
        routeId: route.id,
        routeCode: route.route_code,
        completeness,
        lastSyncedAt: row?.last_synced_at ?? null,
        confirmation,
        state: deriveRouteState(completeness, confirmation),
        issueCount: countCompletenessIssues(completeness),
      };
    })
    .sort((a, b) =>
      STATE_ORDER[a.state] - STATE_ORDER[b.state] ||
      a.routeCode.localeCompare(b.routeCode, 'id', { numeric: true }),
    );
}

export function summarizeViews(views: RouteReadinessView[]) {
  return {
    total: views.length,
    confirmed: views.filter((v) => v.state === 'CONFIRMED').length,
    janggal: views.filter((v) => v.state === 'JANGGAL').length,
    belumDiisi: views.filter((v) => v.state === 'BELUM_DIISI' || v.state === 'NO_DATA' || v.state === 'FORMAT_ERROR').length,
    sebagian: views.filter((v) => v.state === 'SEBAGIAN').length,
    changed: views.filter((v) => v.state === 'CHANGED_AFTER_CONFIRM').length,
  };
}

export function computeBacklog(params: {
  routes: ActiveRoute[];
  confirmations: SubmissionConfirmation[];
  todayWib: string;
  startDate: string;
  days: number;
}): Array<{ date: string; routeId: number; routeCode: string }> {
  const confirmed = new Set(params.confirmations.map((c) => `${c.date}#${c.route_id}`));
  const items: Array<{ date: string; routeId: number; routeCode: string }> = [];
  for (let i = 1; i <= params.days; i++) {
    const date = shiftDateString(params.todayWib, -i);
    if (date < params.startDate) break;
    for (const route of params.routes) {
      if (!confirmed.has(`${date}#${route.id}`)) items.push({ date, routeId: route.id, routeCode: route.route_code });
    }
  }
  return items;
}

export function pickDefaultDate(params: {
  todayWib: string;
  startDate: string;
  routes: ActiveRoute[];
  confirmations: SubmissionConfirmation[];
  watchlistYesterday: number[];
}): string {
  const yesterday = shiftDateString(params.todayWib, -1);
  if (yesterday < params.startDate) return params.todayWib;
  const targetIds = params.watchlistYesterday.length > 0 ? params.watchlistYesterday : params.routes.map((r) => r.id);
  const confirmed = new Set(params.confirmations.filter((c) => c.date === yesterday).map((c) => c.route_id));
  return targetIds.some((id) => !confirmed.has(id)) ? yesterday : params.todayWib;
}

export function readWatchlist(date: string): number[] {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY_PREFIX + date);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((n) => Number.isInteger(n)) : [];
  } catch {
    return [];
  }
}

export function writeWatchlist(date: string, routeIds: number[]): void {
  try {
    localStorage.setItem(WATCHLIST_KEY_PREFIX + date, JSON.stringify(routeIds));
  } catch {
    // storage diblokir: filter pantauan hanya berlaku di sesi ini
  }
}
```

- [ ] **Step 5: Tulis test service**

```ts
// src/services/submissionReadinessService.test.ts
// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';

const invoke = vi.fn();
const builder = { select: vi.fn(), eq: vi.fn(), gte: vi.fn(), lte: vi.fn(), order: vi.fn() };
vi.mock('./supabase', () => ({
  isSupabaseConfigured: true,
  supabase: { from: vi.fn(() => builder), functions: { invoke: (...a: unknown[]) => invoke(...a) } },
}));
vi.mock('./googleSheets/transport', () => ({
  getProxySession: vi.fn(async (force?: boolean) => (force ? 'NEW' : 'OLD')),
  clearProxySession: vi.fn(),
}));

import { confirmRouteSubmission, ConfirmSubmissionError, fetchConfirmationsInRange } from './submissionReadinessService';
import { supabase } from './supabase';

describe('submissionReadinessService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    builder.select.mockReturnValue(builder);
    builder.gte.mockReturnValue(builder);
    builder.lte.mockResolvedValue({ data: [{ route_id: 1 }], error: null });
  });

  it('fetchConfirmationsInRange memakai 1 request dengan rentang tanggal', async () => {
    const rows = await fetchConfirmationsInRange('2026-10-31', '2026-11-07');
    expect(supabase.from).toHaveBeenCalledTimes(1);
    expect(supabase.from).toHaveBeenCalledWith('route_submission_confirmations');
    expect(builder.gte).toHaveBeenCalledWith('date', '2026-10-31');
    expect(builder.lte).toHaveBeenCalledWith('date', '2026-11-07');
    expect(rows).toEqual([{ route_id: 1 }]);
  });

  it('mengirim sesi proxy dan mengembalikan konfirmasi', async () => {
    invoke.mockResolvedValueOnce({ data: { ok: true, confirmation: { route_id: 1 } }, error: null });
    const c = await confirmRouteSubmission({ routeId: 1, date: '2026-11-07' });
    expect(c).toEqual({ route_id: 1 });
    expect(invoke).toHaveBeenCalledWith('route-confirmation', {
      body: { routeId: 1, date: '2026-11-07' },
      headers: { 'x-proxy-session': 'OLD' },
    });
  });

  it('memperbarui sesi sekali saat PROXY_SESSION_INVALID lalu mengulang', async () => {
    const err401 = { context: { json: async () => ({ code: 'PROXY_SESSION_INVALID' }) } };
    invoke
      .mockResolvedValueOnce({ data: null, error: err401 })
      .mockResolvedValueOnce({ data: { ok: true, confirmation: { route_id: 2 } }, error: null });
    const c = await confirmRouteSubmission({ routeId: 2, date: '2026-11-07' });
    expect(c).toEqual({ route_id: 2 });
    expect(invoke.mock.calls[1][1].headers).toEqual({ 'x-proxy-session': 'NEW' });
  });

  it('melempar kode error dari server', async () => {
    invoke.mockResolvedValueOnce({ data: null, error: { context: { json: async () => ({ code: 'REASON_REQUIRED' }) } } });
    await expect(confirmRouteSubmission({ routeId: 1, date: '2026-11-07' })).rejects.toMatchObject({ code: 'REASON_REQUIRED' });
  });

  it('menolak saat offline tanpa memanggil server', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    try {
      await expect(confirmRouteSubmission({ routeId: 1, date: '2026-11-07' })).rejects.toBeInstanceOf(ConfirmSubmissionError);
      expect(invoke).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    }
  });
});
```

- [ ] **Step 6: Jalankan test dan pastikan lulus**

Run: `pnpm vitest run src/components/monitoring/readiness/readinessModel.test.ts src/services/submissionReadinessService.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/services/submissionReadinessService.ts src/services/submissionReadinessService.test.ts src/components/monitoring/readiness/readinessModel.ts src/components/monitoring/readiness/readinessModel.test.ts
git commit -m "feat(submission): service data dan model murni kelengkapan siap kirim"
```

---

### Task 7: Hook `useSubmissionReadiness` (data + Realtime tanpa muat ulang)

**Files:**
- Create: `src/components/monitoring/readiness/useSubmissionReadiness.ts`
- Test: `src/components/monitoring/readiness/useSubmissionReadiness.test.tsx`

**Interfaces:**
- Consumes: service (Task 6), `getWibTodayString` (`src/services/regionalIngestionService.ts`), `shiftDateString` (Task 2), `BACKLOG_DAYS` (Task 6)
- Produces: `useSubmissionReadiness(selectedDate: string, enabled: boolean): { routes: ActiveRoute[]; rows: RouteReadinessRow[]; confirmations: SubmissionConfirmation[]; todayWib: string; loading: boolean; error: boolean; reload: () => Promise<void>; applyConfirmation: (c: SubmissionConfirmation) => void }`; ekspor `READINESS_REALTIME_DEBOUNCE_MS = 3000`

- [ ] **Step 1: Tulis test yang gagal**

```tsx
// src/components/monitoring/readiness/useSubmissionReadiness.test.tsx
// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

// @ts-expect-error flag React act
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const handlers: Array<(p: { new: Record<string, unknown> }) => void> = [];
const mockChannel = {
  on: vi.fn((_e: string, _f: unknown, cb: (p: { new: Record<string, unknown> }) => void) => { handlers.push(cb); return mockChannel; }),
  subscribe: vi.fn(() => mockChannel),
};
vi.mock('@/services/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: { channel: vi.fn(() => mockChannel), removeChannel: vi.fn() },
}));
vi.mock('@/services/submissionReadinessService', () => ({
  fetchActiveRoutes: vi.fn().mockResolvedValue([{ id: 1, route_code: 'JAK.01' }]),
  fetchReadinessByDate: vi.fn().mockResolvedValue([]),
  fetchConfirmationsInRange: vi.fn().mockResolvedValue([]),
}));
vi.mock('@/services/regionalIngestionService', () => ({ getWibTodayString: () => '2026-11-07' }));

import { useSubmissionReadiness, READINESS_REALTIME_DEBOUNCE_MS } from './useSubmissionReadiness';
import * as svc from '@/services/submissionReadinessService';
import { supabase } from '@/services/supabase';

let latest: ReturnType<typeof useSubmissionReadiness> | null = null;
function Probe({ date, enabled }: { date: string; enabled: boolean }) {
  latest = useSubmissionReadiness(date, enabled);
  return null;
}

describe('useSubmissionReadiness', () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    handlers.length = 0;
    container = document.createElement('div');
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    vi.useRealTimers();
  });

  it('tepat 3 request saat mount (rute, kelengkapan, konfirmasi)', async () => {
    await act(async () => { root.render(<Probe date="2026-11-07" enabled />); });
    expect(svc.fetchActiveRoutes).toHaveBeenCalledTimes(1);
    expect(svc.fetchReadinessByDate).toHaveBeenCalledTimes(1);
    expect(svc.fetchConfirmationsInRange).toHaveBeenCalledTimes(1);
    expect(svc.fetchConfirmationsInRange).toHaveBeenCalledWith('2026-10-31', '2026-11-07');
  });

  it('tidak memuat apa pun saat disabled', async () => {
    await act(async () => { root.render(<Probe date="2026-11-07" enabled={false} />); });
    expect(svc.fetchReadinessByDate).not.toHaveBeenCalled();
    expect(supabase.channel).not.toHaveBeenCalled();
  });

  it('pesan Realtime beruntun diredam 3 detik dan diterapkan tanpa request tambahan', async () => {
    await act(async () => { root.render(<Probe date="2026-11-07" enabled />); });
    const completeness = { v: 1, status: 'ok', fingerprint: 'x', counts: {}, issues: [], computedAt: '' };
    await act(async () => {
      for (let i = 0; i < 5; i++) handlers[0]({ new: { route_id: 1, route_code: 'JAK.01', date: '2026-11-07', completeness, last_synced_at: `t${i}` } });
    });
    expect(latest?.rows).toEqual([]);
    await act(async () => { vi.advanceTimersByTime(READINESS_REALTIME_DEBOUNCE_MS); });
    expect(latest?.rows).toEqual([{ route_id: 1, route_code: 'JAK.01', completeness, last_synced_at: 't4' }]);
    expect(svc.fetchReadinessByDate).toHaveBeenCalledTimes(1);
  });

  it('membersihkan channel saat unmount', async () => {
    await act(async () => { root.render(<Probe date="2026-11-07" enabled />); });
    act(() => root.unmount());
    expect(supabase.removeChannel).toHaveBeenCalledTimes(1);
    root = createRoot(container);
  });
});
```

- [ ] **Step 2: Jalankan dan pastikan gagal**

Run: `pnpm vitest run src/components/monitoring/readiness/useSubmissionReadiness.test.tsx`
Expected: FAIL (hook belum ada).

- [ ] **Step 3: Implementasi**

```ts
// src/components/monitoring/readiness/useSubmissionReadiness.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/services/supabase';
import { getWibTodayString } from '@/services/regionalIngestionService';
import {
  fetchActiveRoutes,
  fetchConfirmationsInRange,
  fetchReadinessByDate,
  type ActiveRoute,
  type RouteReadinessRow,
  type SubmissionConfirmation,
} from '@/services/submissionReadinessService';
import { shiftDateString } from '../../../../supabase/functions/_shared/submissionRules.ts';
import { BACKLOG_DAYS } from './readinessModel';

export const READINESS_REALTIME_DEBOUNCE_MS = 3000;

export function useSubmissionReadiness(selectedDate: string, enabled: boolean) {
  const [routes, setRoutes] = useState<ActiveRoute[]>([]);
  const [rows, setRows] = useState<RouteReadinessRow[]>([]);
  const [confirmations, setConfirmations] = useState<SubmissionConfirmation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const todayWib = getWibTodayString();
  const rangeStart = [shiftDateString(todayWib, -BACKLOG_DAYS), selectedDate].sort()[0];
  const rangeEnd = [todayWib, selectedDate].sort()[1];
  const isFetchingRef = useRef(false);

  const reload = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const [r, rr, cc] = await Promise.all([
        fetchActiveRoutes(),
        fetchReadinessByDate(selectedDate),
        fetchConfirmationsInRange(rangeStart, rangeEnd),
      ]);
      setRoutes(r);
      setRows(rr);
      setConfirmations(cc);
      setError(false);
    } catch (err) {
      console.warn('[SubmissionReadiness] Gagal memuat:', err);
      setError(true);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [selectedDate, rangeStart, rangeEnd]);

  const reloadRef = useRef(reload);
  useEffect(() => {
    reloadRef.current = reload;
  }, [reload]);

  useEffect(() => {
    if (enabled) reloadRef.current();
  }, [enabled, reload]);

  // Realtime: payload sudah membawa nilai terbaru, sehingga diterapkan di tempat tanpa request.
  useEffect(() => {
    if (!enabled) return;
    const pendingRows = new Map<number, RouteReadinessRow>();
    const pendingConfs = new Map<number, SubmissionConfirmation>();
    let timer: ReturnType<typeof setTimeout> | null = null;
    let hadDisconnect = false;

    const flush = () => {
      timer = null;
      if (pendingRows.size > 0) {
        const updates = new Map(pendingRows);
        pendingRows.clear();
        setRows((prev) => {
          const next = prev.filter((r) => !updates.has(r.route_id));
          return [...next, ...updates.values()];
        });
      }
      if (pendingConfs.size > 0) {
        const updates = new Map(pendingConfs);
        pendingConfs.clear();
        setConfirmations((prev) => [
          ...prev.filter((c) => !(c.date === selectedDate && updates.has(c.route_id))),
          ...updates.values(),
        ]);
      }
    };
    const schedule = () => {
      if (!timer) timer = setTimeout(flush, READINESS_REALTIME_DEBOUNCE_MS);
    };

    const channel = supabase
      .channel(`submission-readiness-${selectedDate}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_route_reports', filter: `date=eq.${selectedDate}` },
        (payload: { new: Record<string, unknown> }) => {
          const n = payload.new;
          if (!n || typeof n.route_id !== 'number') return;
          pendingRows.set(n.route_id, {
            route_id: n.route_id,
            route_code: String(n.route_code ?? ''),
            completeness: (n.completeness ?? null) as RouteReadinessRow['completeness'],
            last_synced_at: (n.last_synced_at ?? null) as string | null,
          });
          schedule();
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'route_submission_confirmations', filter: `date=eq.${selectedDate}` },
        (payload: { new: Record<string, unknown> }) => {
          const n = payload.new as unknown as SubmissionConfirmation;
          if (!n || typeof n.route_id !== 'number') return;
          pendingConfs.set(n.route_id, n);
          schedule();
        })
      .subscribe((status: string) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') hadDisconnect = true;
        else if (status === 'SUBSCRIBED' && hadDisconnect) {
          hadDisconnect = false;
          reloadRef.current(); // tersambung lagi: muat ulang sekali agar tidak ada event yang terlewat
        }
      });

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [enabled, selectedDate]);

  const applyConfirmation = useCallback((c: SubmissionConfirmation) => {
    setConfirmations((prev) => [...prev.filter((x) => !(x.date === c.date && x.route_id === c.route_id)), c]);
  }, []);

  return { routes, rows, confirmations, todayWib, loading, error, reload, applyConfirmation };
}
```

- [ ] **Step 4: Jalankan test dan pastikan lulus**

Run: `pnpm vitest run src/components/monitoring/readiness/useSubmissionReadiness.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/monitoring/readiness/useSubmissionReadiness.ts src/components/monitoring/readiness/useSubmissionReadiness.test.tsx
git commit -m "feat(submission): hook kelengkapan dengan realtime in-place tanpa muat ulang"
```

---

### Task 8: Teks, CSS, dan komponen tab Siap Kirim

**Files:**
- Modify: `src/constants/texts/text_monitoring.ts`, `src/constants/texts/texts.test.ts`, `src/index.css`
- Create: `src/styles/components/submission.css`, `src/components/monitoring/readiness/SubmissionReadinessTab.tsx`, `ReadinessRouteCard.tsx`, `ReadinessRouteDetailModal.tsx`, `ReadinessBacklogBanner.tsx`, `WatchlistModal.tsx`, `src/components/monitoring/PendingUpdateBanner.tsx`
- Test: `src/components/monitoring/readiness/SubmissionReadinessTab.test.tsx`

**Interfaces:**
- Consumes: hook (Task 7), model (Task 6), `confirmRouteSubmission`, `ConfirmSubmissionError` (Task 6), `triggerRealtimeSheetSync(routeCode, date)` (`src/services/realtimeSyncService.ts`), `ModalShell`, `showSuccessToast`, `showErrorToast`, `showInfoToast` (`src/utils/alertUtils.ts`)
- Produces:
  - `type ReadinessSegment = 'kelengkapan' | 'armada'`
  - `SubmissionReadinessTab` props `{ selectedDate: string; onSelectDate: (date: string) => void; segment: ReadinessSegment; onSegmentChange: (s: ReadinessSegment) => void; armadaContent: React.ReactNode; onRegisterReload?: (fn: () => void) => void }`
  - `PendingUpdateBanner` props `{ visible: boolean; onReload: () => void }`

- [ ] **Step 1: Tambah teks (di dalam objek `TEXT_MONITORING`, `src/constants/texts/text_monitoring.ts`)**

Di blok `NAV` tambahkan `SUBMISSION: "Siap Kirim",`. Lalu tambahkan dua blok baru sebelum `}` penutup objek:

```ts
  PENDING_UPDATE: {
    MESSAGE: "Ada pembaruan data",
    RELOAD: "Muat ulang",
  },
  SUBMISSION: {
    SEGMENT_COMPLETENESS: "Kelengkapan",
    SEGMENT_FLEET: "Armada",
    SUMMARY: (confirmed: number, total: number) => `Siap kirim ${confirmed}/${total}`,
    SUMMARY_JANGGAL: (n: number) => `Janggal ${n}`,
    SUMMARY_BELUM: (n: number) => `Belum diisi ${n}`,
    SUMMARY_CHANGED: (n: number) => `Berubah ${n}`,
    FILTER_ALL: "Semua rute",
    FILTER_WATCHLIST: (n: number) => `Pantauan saya (${n})`,
    PICK_ROUTES: "Pilih rute",
    WATCHLIST_TITLE: "Rute pantauan",
    WATCHLIST_SAVE: "Simpan",
    EMPTY_WATCHLIST: "Belum ada rute pantauan. Semua rute ditampilkan.",
    STATE: {
      JANGGAL: "Janggal",
      BELUM_DIISI: "Belum diisi",
      NO_DATA: "Belum ada data",
      FORMAT_ERROR: "Format sheet tidak dikenali",
      SEBAGIAN: "Sebagian",
      CHANGED_AFTER_CONFIRM: "Berubah setelah dikonfirmasi",
      READY_UNCONFIRMED: "Lengkap, belum dikonfirmasi",
      CONFIRMED: "Siap dikirim",
    },
    UNIT_COUNTS: (lengkap: number, total: number) => `${lengkap}/${total} unit lengkap`,
    UPDATED_AT: (time: string) => `Diperbarui ${time}`,
    CONFIRMED_BY: (by: string, time: string) => `Dikonfirmasi ${by} pukul ${time}`,
    FIELD: {
      tripPergi: "Trip pergi",
      tripPulang: "Trip pulang",
      toaShift1: "TOA S1",
      totalToa: "Total TOA",
    },
    ISSUE_MISSING: (fields: string) => `${fields} kosong`,
    ISSUE_EMPTY: "Belum diisi sama sekali",
    ISSUE_REASON: {
      RITASE_TANPA_TOA: "Ritase terisi, TOA kosong",
      TOA_TANPA_RITASE: "TOA terisi, ritase kosong",
      TOTAL_TOA_KURANG: "Total TOA lebih kecil dari TOA S1",
    },
    DETAIL_TITLE: (code: string) => `Kelengkapan ${code}`,
    DETAIL_NO_ISSUES: "Semua unit lengkap.",
    DETAIL_NO_DATA: "Belum ada data kelengkapan. Tekan Cek ulang untuk membaca sheet.",
    DETAIL_FORMAT_ERROR: "Kolom unit, trip, TOA S1, atau Total TOA tidak ditemukan di sheet.",
    BTN_RECHECK: "Cek ulang",
    BTN_CONFIRM: "Konfirmasi",
    BTN_CLOSE: "Tutup",
    REASON_LABEL: "Alasan tetap dikirim",
    REASON_PLACEHOLDER: "Contoh: TOA unit KLM 540 rusak, sudah dilaporkan",
    REASON_HINT: (n: number) => `Masih ada ${n} masalah. Alasan wajib diisi.`,
    CONFIRM_SUCCESS: (code: string) => `${code} siap dikirim`,
    RECHECK_SENT: (code: string) => `Membaca ulang ${code}`,
    BACKLOG_TITLE: (n: number) => `${n} rute belum dikonfirmasi (7 hari terakhir)`,
    BACKLOG_SHOW: "Lihat",
    BACKLOG_HIDE: "Tutup",
    BACKLOG_ITEM: (code: string, date: string) => `${code} · ${date}`,
    LOAD_FAILED: "Gagal memuat status kelengkapan.",
    ERRORS: {
      OFFLINE: "Tidak ada koneksi. Konfirmasi butuh internet.",
      REASON_REQUIRED: "Alasan wajib diisi minimal 5 huruf.",
      ACCESS_DENIED: "Anda tidak memiliki akses konfirmasi.",
      INVALID_DATE: "Tanggal di luar rentang konfirmasi (maks. 7 hari ke belakang).",
      PROXY_SESSION_INVALID: "Sesi berakhir. Silakan masuk ulang.",
      FAILED: "Konfirmasi gagal. Coba lagi.",
    } as Record<string, string>,
  },
```

Tambahkan test di `src/constants/texts/texts.test.ts`:

```ts
  it('exports TEXT_MONITORING.SUBMISSION untuk fitur siap kirim', () => {
    expect(TEXT_MONITORING.NAV.SUBMISSION).toBe('Siap Kirim');
    expect(TEXT_MONITORING.SUBMISSION.SUMMARY(12, 18)).toBe('Siap kirim 12/18');
    expect(TEXT_MONITORING.SUBMISSION.ISSUE_MISSING('Trip pulang')).toBe('Trip pulang kosong');
    expect(TEXT_MONITORING.SUBMISSION.CONFIRMED_BY('Budi', '21.40')).toBe('Dikonfirmasi Budi pukul 21.40');
    expect(TEXT_MONITORING.SUBMISSION.BACKLOG_TITLE(3)).toContain('3 rute belum dikonfirmasi');
    expect(TEXT_MONITORING.SUBMISSION.ERRORS.REASON_REQUIRED).toBeTruthy();
    expect(TEXT_MONITORING.PENDING_UPDATE.RELOAD).toBe('Muat ulang');
  });
```

- [ ] **Step 2: CSS (`src/styles/components/submission.css`) dan import**

```css
/* Tab Siap Kirim: kelengkapan data & konfirmasi (spec 2026-11-07). Hanya token semantik, skala jarak/radius/font AGENTS. */
.submission-tab { display: flex; flex-direction: column; gap: 12px; padding: 12px 16px; }
.submission-summary { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 14px; color: var(--color-text-secondary); font-variant-numeric: tabular-nums; }
.submission-summary__primary { font-size: 16px; font-weight: 600; color: var(--color-text-primary); }
.submission-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.submission-list { display: flex; flex-direction: column; gap: 12px; margin: 0; padding: 0; list-style: none; }
.submission-card { display: flex; flex-direction: column; gap: 6px; width: 100%; min-height: 44px; padding: 12px 16px; border: 1px solid var(--color-border-subtle); border-radius: 12px; background: var(--color-surface-default); color: var(--color-text-primary); font: inherit; text-align: left; cursor: pointer; }
.submission-card__head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.submission-card__code { font-size: 16px; font-weight: 600; }
.submission-card__meta { font-size: 13px; color: var(--color-text-secondary); font-variant-numeric: tabular-nums; }
.submission-modal-backdrop { background: var(--color-overlay); padding: 16px; }
.submission-modal { display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 480px; max-height: min(80dvh, 640px); overflow-y: auto; padding: 20px; border: 1px solid var(--color-border-subtle); border-radius: 16px; background: var(--color-surface-raised); color: var(--color-text-primary); }
.submission-modal__title { margin: 0; font-size: 18px; font-weight: 600; }
.submission-modal__text { margin: 0; font-size: 14px; color: var(--color-text-secondary); }
.submission-issues { display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none; }
.submission-issue { display: flex; justify-content: space-between; gap: 8px; padding: 8px 0; border-bottom: 1px solid var(--color-border-subtle); font-size: 14px; }
.submission-issue__unit { font-weight: 600; font-variant-numeric: tabular-nums; }
.submission-reason { display: flex; flex-direction: column; gap: 6px; font-size: 14px; }
.submission-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
.submission-backlog-list { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; list-style: none; }
.submission-watchlist { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; }
.submission-update-banner { margin: 12px 16px 0; flex-direction: row; align-items: center; justify-content: space-between; }
```

Di `src/index.css`, setelah `@import "./styles/components/charts.css";`:

```css
@import "./styles/components/submission.css";
```

- [ ] **Step 3: Komponen kecil**

```tsx
// src/components/monitoring/PendingUpdateBanner.tsx
import { TEXT_MONITORING } from "@/constants/texts";

export function PendingUpdateBanner({ visible, onReload }: { visible: boolean; onReload: () => void }) {
  if (!visible) return null;
  return (
    <div className="ui-tone-panel submission-update-banner" role="status">
      <span>{TEXT_MONITORING.PENDING_UPDATE.MESSAGE}</span>
      <button type="button" className="ui-button ui-button--secondary" onClick={onReload}>
        {TEXT_MONITORING.PENDING_UPDATE.RELOAD}
      </button>
    </div>
  );
}
```

```tsx
// src/components/monitoring/readiness/ReadinessRouteCard.tsx
import { TEXT_MONITORING } from "@/constants/texts";
import type { RouteReadinessState, RouteReadinessView } from "./readinessModel";

const T = TEXT_MONITORING.SUBMISSION;
export const STATE_TONE: Record<RouteReadinessState, "error" | "warning" | "info" | "success" | "neutral"> = {
  JANGGAL: "error", BELUM_DIISI: "error", NO_DATA: "neutral", FORMAT_ERROR: "error",
  SEBAGIAN: "warning", CHANGED_AFTER_CONFIRM: "warning", READY_UNCONFIRMED: "info", CONFIRMED: "success",
};

export function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
}

export function ReadinessRouteCard({ view, onOpen }: { view: RouteReadinessView; onOpen: (v: RouteReadinessView) => void }) {
  const c = view.completeness;
  const total = c ? Object.values(c.counts).reduce((a, b) => a + b, 0) : 0;
  const lengkap = c ? c.counts.LENGKAP + c.counts.DIKECUALIKAN : 0;
  return (
    <li>
      <button type="button" className="submission-card" onClick={() => onOpen(view)}>
        <span className="submission-card__head">
          <span className="submission-card__code">{view.routeCode}</span>
          <span className="ui-status" data-tone={STATE_TONE[view.state]}>{T.STATE[view.state]}</span>
        </span>
        {c && c.status === "ok" && <span className="submission-card__meta">{T.UNIT_COUNTS(lengkap, total)}</span>}
        {view.lastSyncedAt && <span className="submission-card__meta">{T.UPDATED_AT(formatTime(view.lastSyncedAt))}</span>}
        {view.confirmation && (
          <span className="submission-card__meta">
            {T.CONFIRMED_BY(view.confirmation.confirmed_by.split("@")[0], formatTime(view.confirmation.confirmed_at))}
          </span>
        )}
      </button>
    </li>
  );
}
```

```tsx
// src/components/monitoring/readiness/ReadinessBacklogBanner.tsx
import { useState } from "react";
import { TEXT_MONITORING } from "@/constants/texts";

const T = TEXT_MONITORING.SUBMISSION;

export function ReadinessBacklogBanner({
  items,
  onJump,
}: {
  items: Array<{ date: string; routeId: number; routeCode: string }>;
  onJump: (date: string) => void;
}) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  return (
    <section className="ui-tone-panel" data-tone="warning" aria-live="polite">
      <div className="submission-toolbar">
        <span>{T.BACKLOG_TITLE(items.length)}</span>
        <button type="button" className="ui-button ui-button--secondary" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? T.BACKLOG_HIDE : T.BACKLOG_SHOW}
        </button>
      </div>
      {open && (
        <ul className="submission-backlog-list">
          {items.map((it) => (
            <li key={`${it.date}-${it.routeId}`}>
              <button type="button" className="ui-option-btn" onClick={() => onJump(it.date)}>
                {T.BACKLOG_ITEM(it.routeCode, it.date)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

```tsx
// src/components/monitoring/readiness/WatchlistModal.tsx
import { useEffect, useState } from "react";
import { ModalShell } from "@/components/ui/ModalShell";
import { TEXT_MONITORING } from "@/constants/texts";
import type { ActiveRoute } from "@/services/submissionReadinessService";

const T = TEXT_MONITORING.SUBMISSION;

export function WatchlistModal({
  isOpen, routes, selected, onClose, onSave,
}: {
  isOpen: boolean;
  routes: ActiveRoute[];
  selected: number[];
  onClose: () => void;
  onSave: (ids: number[]) => void;
}) {
  const [draft, setDraft] = useState<number[]>(selected);
  useEffect(() => { if (isOpen) setDraft(selected); }, [isOpen, selected]);
  const toggle = (id: number) => setDraft((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={T.WATCHLIST_TITLE} id="submission-watchlist" backHandlerId="submission_watchlist"
      backdropClassName="modal-overlay submission-modal-backdrop" contentClassName="submission-modal">
      <h2 className="submission-modal__title">{T.WATCHLIST_TITLE}</h2>
      <div className="submission-watchlist">
        {routes.map((r) => (
          <button key={r.id} type="button" className="ui-option-btn" aria-pressed={draft.includes(r.id)} onClick={() => toggle(r.id)}>
            {r.route_code}
          </button>
        ))}
      </div>
      <div className="submission-actions">
        <button type="button" className="ui-button ui-button--secondary" onClick={onClose}>{T.BTN_CLOSE}</button>
        <button type="button" className="ui-button ui-button--primary" onClick={() => { onSave(draft); onClose(); }}>{T.WATCHLIST_SAVE}</button>
      </div>
    </ModalShell>
  );
}
```

```tsx
// src/components/monitoring/readiness/ReadinessRouteDetailModal.tsx
import { useEffect, useState } from "react";
import { ModalShell } from "@/components/ui/ModalShell";
import { TEXT_MONITORING } from "@/constants/texts";
import { showErrorToast, showInfoToast, showSuccessToast } from "@/utils/alertUtils";
import { triggerRealtimeSheetSync } from "@/services/realtimeSyncService";
import {
  confirmRouteSubmission,
  ConfirmSubmissionError,
  type SubmissionConfirmation,
} from "@/services/submissionReadinessService";
import { REASON_MIN_LENGTH } from "../../../../supabase/functions/_shared/submissionRules.ts";
import type { RouteReadinessView } from "./readinessModel";

const T = TEXT_MONITORING.SUBMISSION;

export function ReadinessRouteDetailModal({
  view, date, onClose, onConfirmed,
}: {
  view: RouteReadinessView | null;
  date: string;
  onClose: () => void;
  onConfirmed: (c: SubmissionConfirmation) => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setReason(""); }, [view?.routeId, date]);
  if (!view) return null;

  const c = view.completeness;
  const needsReason = view.issueCount > 0;
  const canConfirm = !busy && (!needsReason || reason.trim().length >= REASON_MIN_LENGTH);

  const handleRecheck = () => {
    showInfoToast(T.RECHECK_SENT(view.routeCode));
    triggerRealtimeSheetSync(view.routeCode, date);
  };

  const handleConfirm = async () => {
    setBusy(true);
    try {
      const saved = await confirmRouteSubmission({ routeId: view.routeId, date, reason: needsReason ? reason : undefined });
      onConfirmed(saved);
      showSuccessToast(T.CONFIRM_SUCCESS(view.routeCode));
      onClose();
    } catch (err) {
      const code = err instanceof ConfirmSubmissionError ? err.code : "FAILED";
      showErrorToast(T.ERRORS[code] || T.ERRORS.FAILED);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell isOpen onClose={onClose} title={T.DETAIL_TITLE(view.routeCode)} id="submission-detail" backHandlerId="submission_detail"
      backdropClassName="modal-overlay submission-modal-backdrop" contentClassName="submission-modal">
      <h2 className="submission-modal__title">{T.DETAIL_TITLE(view.routeCode)}</h2>
      {!c && <p className="submission-modal__text">{T.DETAIL_NO_DATA}</p>}
      {c && c.status !== "ok" && <p className="submission-modal__text">{T.DETAIL_FORMAT_ERROR}</p>}
      {c && c.status === "ok" && c.issues.length === 0 && <p className="submission-modal__text">{T.DETAIL_NO_ISSUES}</p>}
      {c && c.status === "ok" && c.issues.length > 0 && (
        <ul className="submission-issues">
          {c.issues.map((issue) => (
            <li key={issue.unit} className="submission-issue">
              <span className="submission-issue__unit">{issue.unit}</span>
              <span className="ui-status" data-tone={issue.status === "SEBAGIAN" ? "warning" : "error"}>
                {issue.reason
                  ? T.ISSUE_REASON[issue.reason]
                  : issue.missing
                    ? T.ISSUE_MISSING(issue.missing.map((f) => T.FIELD[f]).join(", "))
                    : T.ISSUE_EMPTY}
              </span>
            </li>
          ))}
        </ul>
      )}
      {needsReason && (
        <label className="submission-reason">
          <span>{T.REASON_LABEL}</span>
          <textarea className="ui-input" rows={3} maxLength={300} value={reason} placeholder={T.REASON_PLACEHOLDER}
            onChange={(e) => setReason(e.target.value)} />
          <span className="submission-modal__text">{T.REASON_HINT(view.issueCount)}</span>
        </label>
      )}
      <div className="submission-actions">
        <button type="button" className="ui-button ui-button--secondary" onClick={handleRecheck}>{T.BTN_RECHECK}</button>
        <button type="button" className="ui-button ui-button--primary" disabled={!canConfirm} onClick={handleConfirm}>{T.BTN_CONFIRM}</button>
      </div>
    </ModalShell>
  );
}
```

- [ ] **Step 4: Komponen tab**

```tsx
// src/components/monitoring/readiness/SubmissionReadinessTab.tsx
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { TEXT_MONITORING } from "@/constants/texts";
import { useSubmissionReadiness } from "./useSubmissionReadiness";
import {
  BACKLOG_DAYS, SUBMISSION_FEATURE_START_DATE, buildReadinessViews, computeBacklog, pickDefaultDate,
  readWatchlist, summarizeViews, writeWatchlist, type RouteReadinessView,
} from "./readinessModel";
import { shiftDateString } from "../../../../supabase/functions/_shared/submissionRules.ts";
import { ReadinessRouteCard } from "./ReadinessRouteCard";
import { ReadinessRouteDetailModal } from "./ReadinessRouteDetailModal";
import { ReadinessBacklogBanner } from "./ReadinessBacklogBanner";
import { WatchlistModal } from "./WatchlistModal";

const T = TEXT_MONITORING.SUBMISSION;
export type ReadinessSegment = "kelengkapan" | "armada";

export function SubmissionReadinessTab({
  selectedDate, onSelectDate, segment, onSegmentChange, armadaContent, onRegisterReload,
}: {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  segment: ReadinessSegment;
  onSegmentChange: (s: ReadinessSegment) => void;
  armadaContent: ReactNode;
  onRegisterReload?: (fn: () => void) => void;
}) {
  const readiness = useSubmissionReadiness(selectedDate, segment === "kelengkapan");
  const [watchlist, setWatchlist] = useState<number[]>(() => readWatchlist(selectedDate));
  const [onlyWatchlist, setOnlyWatchlist] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [detail, setDetail] = useState<RouteReadinessView | null>(null);
  const defaultAppliedRef = useRef(false);

  useEffect(() => { setWatchlist(readWatchlist(selectedDate)); }, [selectedDate]);
  useEffect(() => { onRegisterReload?.(() => { void readiness.reload(); }); }, [onRegisterReload, readiness.reload]);

  // Tanggal default (sekali per mount): kemarin bila rute pantauan/semua rute kemarin belum tuntas
  useEffect(() => {
    if (defaultAppliedRef.current || readiness.loading || readiness.routes.length === 0) return;
    defaultAppliedRef.current = true;
    if (selectedDate !== readiness.todayWib) return;
    const target = pickDefaultDate({
      todayWib: readiness.todayWib,
      startDate: SUBMISSION_FEATURE_START_DATE,
      routes: readiness.routes,
      confirmations: readiness.confirmations,
      watchlistYesterday: readWatchlist(shiftDateString(readiness.todayWib, -1)),
    });
    if (target !== selectedDate) onSelectDate(target);
  }, [readiness.loading, readiness.routes, readiness.confirmations, readiness.todayWib, selectedDate, onSelectDate]);

  const views = useMemo(
    () => buildReadinessViews(readiness.routes, readiness.rows, readiness.confirmations, selectedDate),
    [readiness.routes, readiness.rows, readiness.confirmations, selectedDate],
  );
  const visibleViews = onlyWatchlist && watchlist.length > 0 ? views.filter((v) => watchlist.includes(v.routeId)) : views;
  const summary = summarizeViews(views);
  const backlog = useMemo(
    () => computeBacklog({
      routes: readiness.routes, confirmations: readiness.confirmations, todayWib: readiness.todayWib,
      startDate: SUBMISSION_FEATURE_START_DATE, days: BACKLOG_DAYS,
    }),
    [readiness.routes, readiness.confirmations, readiness.todayWib],
  );

  return (
    <div className="submission-tab">
      <div className="ui-segmented" role="tablist">
        <button type="button" className="ui-segmented-btn" aria-pressed={segment === "kelengkapan"} onClick={() => onSegmentChange("kelengkapan")}>
          {T.SEGMENT_COMPLETENESS}
        </button>
        <button type="button" className="ui-segmented-btn" aria-pressed={segment === "armada"} onClick={() => onSegmentChange("armada")}>
          {T.SEGMENT_FLEET}
        </button>
      </div>

      {segment === "armada" ? armadaContent : (
        <>
          <ReadinessBacklogBanner items={backlog} onJump={onSelectDate} />
          {readiness.error && <p className="ui-tone-panel" data-tone="error" role="alert">{T.LOAD_FAILED}</p>}
          <div className="submission-summary">
            <span className="submission-summary__primary">{T.SUMMARY(summary.confirmed, summary.total)}</span>
            {summary.janggal > 0 && <span className="ui-status" data-tone="error">{T.SUMMARY_JANGGAL(summary.janggal)}</span>}
            {summary.belumDiisi > 0 && <span className="ui-status" data-tone="error">{T.SUMMARY_BELUM(summary.belumDiisi)}</span>}
            {summary.changed > 0 && <span className="ui-status" data-tone="warning">{T.SUMMARY_CHANGED(summary.changed)}</span>}
          </div>
          <div className="submission-toolbar">
            <div className="ui-segmented ui-segmented--inline">
              <button type="button" className="ui-segmented-btn" aria-pressed={!onlyWatchlist} onClick={() => setOnlyWatchlist(false)}>{T.FILTER_ALL}</button>
              <button type="button" className="ui-segmented-btn" aria-pressed={onlyWatchlist} onClick={() => setOnlyWatchlist(true)}>{T.FILTER_WATCHLIST(watchlist.length)}</button>
            </div>
            <button type="button" className="ui-button ui-button--secondary" onClick={() => setPickerOpen(true)}>{T.PICK_ROUTES}</button>
          </div>
          {onlyWatchlist && watchlist.length === 0 && <p className="submission-modal__text">{T.EMPTY_WATCHLIST}</p>}
          <ul className="submission-list">
            {visibleViews.map((v) => <ReadinessRouteCard key={v.routeId} view={v} onOpen={setDetail} />)}
          </ul>
          <WatchlistModal isOpen={pickerOpen} routes={readiness.routes} selected={watchlist} onClose={() => setPickerOpen(false)}
            onSave={(ids) => { setWatchlist(ids); writeWatchlist(selectedDate, ids); }} />
          <ReadinessRouteDetailModal
            view={detail ? views.find((v) => v.routeId === detail.routeId) ?? detail : null}
            date={selectedDate}
            onClose={() => setDetail(null)}
            onConfirmed={readiness.applyConfirmation}
          />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Test komponen**

```tsx
// src/components/monitoring/readiness/SubmissionReadinessTab.test.tsx
// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TEXT_MONITORING } from '@/constants/texts';

// @ts-expect-error flag React act
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const state = {
  routes: [{ id: 1, route_code: 'JAK.01' }, { id: 2, route_code: 'JAK.02' }],
  rows: [{ route_id: 1, route_code: 'JAK.01', last_synced_at: null, completeness: {
    v: 1, computedAt: '', status: 'ok', fingerprint: 'f',
    counts: { LENGKAP: 9, DIKECUALIKAN: 0, BELUM_DIISI: 0, JANGGAL: 1, SEBAGIAN: 0 },
    issues: [{ unit: 'KLM 540', status: 'JANGGAL', reason: 'RITASE_TANPA_TOA' }] } }],
  confirmations: [], todayWib: '2026-11-07', loading: false, error: false,
  reload: vi.fn(), applyConfirmation: vi.fn(),
};
vi.mock('./useSubmissionReadiness', () => ({ useSubmissionReadiness: () => state }));
vi.mock('@/services/submissionReadinessService', () => ({ confirmRouteSubmission: vi.fn(), ConfirmSubmissionError: class extends Error {} }));
vi.mock('@/services/realtimeSyncService', () => ({ triggerRealtimeSheetSync: vi.fn() }));
vi.mock('@/utils/alertUtils', () => ({ showErrorToast: vi.fn(), showInfoToast: vi.fn(), showSuccessToast: vi.fn() }));

import { SubmissionReadinessTab } from './SubmissionReadinessTab';

describe('SubmissionReadinessTab', () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  it('menampilkan ringkasan dan mengurutkan rute janggal paling atas', async () => {
    await act(async () => {
      root.render(<SubmissionReadinessTab selectedDate="2026-11-07" onSelectDate={vi.fn()} segment="kelengkapan" onSegmentChange={vi.fn()} armadaContent={null} />);
    });
    expect(container.textContent).toContain(TEXT_MONITORING.SUBMISSION.SUMMARY(0, 2));
    const codes = [...container.querySelectorAll('.submission-card__code')].map((n) => n.textContent);
    expect(codes).toEqual(['JAK.01', 'JAK.02']);
    expect(container.textContent).toContain(TEXT_MONITORING.SUBMISSION.STATE.JANGGAL);
  });

  it('menampilkan konten armada saat segmen armada', async () => {
    await act(async () => {
      root.render(<SubmissionReadinessTab selectedDate="2026-11-07" onSelectDate={vi.fn()} segment="armada" onSegmentChange={vi.fn()} armadaContent={<p>ARMADA</p>} />);
    });
    expect(container.textContent).toContain('ARMADA');
    expect(container.querySelector('.submission-card')).toBeNull();
  });
});
```

- [ ] **Step 6: Jalankan test + ratchet UI**

Run: `pnpm vitest run src/components/monitoring/readiness src/constants/texts/texts.test.ts src/styles/ui-debt-ratchet.test.ts src/styles/components/focus-ring.test.ts`
Expected: PASS. Ratchet tidak boleh naik. Kalau naik, perbaiki kodenya; jangan ubah `BASELINE`.

- [ ] **Step 7: Commit**

```bash
git add src/constants/texts src/styles/components/submission.css src/index.css src/components/monitoring/readiness src/components/monitoring/PendingUpdateBanner.tsx
git commit -m "feat(ui): tab Siap Kirim — kelengkapan, tunggakan, pantauan, dan konfirmasi"
```

---

### Task 9: Integrasi halaman Monitoring

**Files:**
- Modify: `src/components/monitoring/MonitoringBottomNav.tsx`, `src/components/monitoring/AllRouteMonitoringPage.tsx`, `src/components/monitoring/AllRouteMonitoringPage.test.tsx`, `src/components/monitoring/MonitoringBottomNav.test.tsx`

**Interfaces:**
- Consumes: `SubmissionReadinessTab`, `ReadinessSegment` (Task 8), `PendingUpdateBanner` (Task 8), `getWibTodayString`
- Produces: `MonitoringTab = "dashboard" | "routes" | "siap_kirim" | "wa_report" | "korwil"`; default tab `siap_kirim`

- [ ] **Step 1: Bottom nav**

Di `MonitoringBottomNav.tsx`:
- Ganti import ikon `Bus` menjadi `ClipboardCheck`.
- Ubah tipe: `export type MonitoringTab = "dashboard" | "routes" | "siap_kirim" | "wa_report" | "korwil";`
- Ganti item kedua menjadi:

```ts
  {
    id: "siap_kirim",
    label: TEXT_MONITORING.NAV.SUBMISSION,
    icon: ClipboardCheck,
  },
```

Perbarui `MonitoringBottomNav.test.tsx`: setiap ekspektasi `fleet_status` / `TEXT_MONITORING.NAV.FLEET_STATUS` diganti `siap_kirim` / `TEXT_MONITORING.NAV.SUBMISSION`. Jumlah tab tetap 5, dan Dashboard tetap di slot 3.

- [ ] **Step 2: State tab, segmen, dan tanggal WIB di `AllRouteMonitoringPage.tsx`**

- Tambah import:

```ts
import { getWibTodayString } from "@/services/regionalIngestionService";
import { SubmissionReadinessTab, type ReadinessSegment } from "./readiness/SubmissionReadinessTab";
import { PendingUpdateBanner } from "./PendingUpdateBanner";
```

  `ingestRegionalRouteSummaries` dkk. sudah diimpor dari modul yang sama; gabungkan `getWibTodayString` ke import yang sudah ada.
- Daftar tab valid di inisialisasi `activeTab` menjadi `["dashboard", "routes", "siap_kirim", "wa_report", "korwil"]`. Nilai lama `"fleet_status"` di sessionStorage dipetakan ke `"siap_kirim"`, dan default `return "siap_kirim";`:

```ts
      const saved = sessionStorage.getItem("SS_MONITORING_ACTIVE_TAB");
      const mapped = saved === "fleet_status" ? "siap_kirim" : saved;
      if (mapped && ["dashboard", "routes", "siap_kirim", "wa_report", "korwil"].includes(mapped)) {
        return mapped as MonitoringTab;
      }
```

- Ganti `const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);` dengan `const todayStr = useMemo(() => getWibTodayString(), []);` (tanggal operasional WIB, bukan UTC).
- Tambah state segmen dan pendaftar reload:

```ts
  const [readinessSegment, setReadinessSegment] = useState<ReadinessSegment>("kelengkapan");
  const readinessReloadRef = useRef<() => void>(() => {});
  const registerReadinessReload = useCallback((fn: () => void) => { readinessReloadRef.current = fn; }, []);
  // Data capaian hanya dimuat bila tab yang terbuka memerlukannya (hemat request saat tab Siap Kirim dibuka)
  const needsRegionalData = activeTab !== "siap_kirim" || readinessSegment === "armada";
```

- [ ] **Step 3: Muat data capaian secara malas**

Ganti efek mount:

```ts
  useEffect(() => {
    loadData();
  }, [loadData]);
```

dengan:

```ts
  const loadedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!needsRegionalData) return;
    const key = `${currentPeriod.mode}:${currentPeriod.startDate}:${currentPeriod.endDate}:${selectedDate}`;
    if (loadedKeyRef.current === key) return;
    loadedKeyRef.current = key;
    loadData();
  }, [loadData, needsRegionalData, currentPeriod, selectedDate]);
```

- [ ] **Step 4: Ganti muat ulang otomatis Realtime dengan banner**

- Hapus konstanta `REALTIME_MIN_INTERVAL_MS`, `lastSilentLoadAtRef`, `runSilentLoad`, dan logika `pendingWhileHidden`. Pertahankan `REALTIME_MIN_DEBOUNCE_MS = 3000` dan ubah komentar `ponytail`-nya menjadi:
  `// ponytail: tab capaian tidak lagi memuat ulang otomatis; event realtime hanya memunculkan banner (hemat Log Ingestion 1 GB), muat ulang atas ketukan pengguna`
- Tambah state `const [hasPendingUpdate, setHasPendingUpdate] = useState(false);`
- Ganti seluruh efek Realtime "4b" dengan:

```ts
  const realtimeDateFilter = currentPeriod.mode === "daily" ? currentPeriod.date : null;

  useEffect(() => {
    if (!needsRegionalData) return;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const channel = supabase
      .channel(`monitoring-realtime-reports-${realtimeDateFilter ?? "period"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "daily_route_reports",
          ...(realtimeDateFilter ? { filter: `date=eq.${realtimeDateFilter}` } : {}),
        },
        () => {
          if (debounceTimer) return;
          debounceTimer = setTimeout(() => {
            debounceTimer = null;
            setHasPendingUpdate(true);
          }, REALTIME_MIN_DEBOUNCE_MS);
        }
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [realtimeDateFilter, needsRegionalData]);

  const handleReloadPending = () => {
    setHasPendingUpdate(false);
    loadData(true);
  };
```

- Di `loadData`, setelah `setData(regionalRes);` tambahkan `setHasPendingUpdate(false);`.

- [ ] **Step 5: Render tab Siap Kirim di luar gating data capaian**

- Pada `MonitoringHeader`, ganti `onRefresh={() => loadData(true)}` dengan:

```tsx
        onRefresh={() =>
          activeTab === "siap_kirim" && readinessSegment === "kelengkapan"
            ? readinessReloadRef.current()
            : loadData(true)
        }
```

- Di dalam `<main>`, tepat sebelum `<MonitoringStates`, tambahkan:

```tsx
        {needsRegionalData && <PendingUpdateBanner visible={hasPendingUpdate} onReload={handleReloadPending} />}

        {activeTab === "siap_kirim" && (
          <SubmissionReadinessTab
            selectedDate={selectedDate}
            onSelectDate={(d) => { setSelectedDate(d); onDateChange?.(d); }}
            segment={readinessSegment}
            onSegmentChange={setReadinessSegment}
            onRegisterReload={registerReadinessReload}
            armadaContent={
              data ? (
                <MonitoringFleetStatusTab
                  selectedDate={selectedDate}
                  fleetShifts={fleetShifts}
                  routes={data.routes}
                  onRefresh={() => loadData(true)}
                />
              ) : (
                <MonitoringStates loading={loading} errorMessage={errorMessage} onRetry={() => loadData("initial")} />
              )
            }
          />
        )}
```

- Bungkus `<MonitoringStates ... />` dan blok `{(!loading || data) && !errorMessage && data && (...)}` yang sudah ada dengan `{activeTab !== "siap_kirim" && (<>...</>)}`, lalu **hapus** blok `{activeTab === "fleet_status" && (...)}` di dalamnya.
- Periksa bahwa `currentPeriod.mode !== "daily"` tetap aman: tab Siap Kirim selalu memakai `selectedDate`.

- [ ] **Step 6: Perbarui test halaman**

Di `AllRouteMonitoringPage.test.tsx`:
- Tambah mock tab agar test lama fokus pada tab capaian:

```ts
vi.mock('./readiness/SubmissionReadinessTab', () => ({
  SubmissionReadinessTab: ({ armadaContent, segment }: { armadaContent: React.ReactNode; segment: string }) =>
    segment === 'armada' ? armadaContent : <div data-testid="readiness-tab" />,
}));
vi.mock('@/services/regionalIngestionService', async (orig) => ({
  ...(await orig<typeof import('@/services/regionalIngestionService')>()),
  ingestRegionalRouteSummaries: vi.fn(),
  ingestRegionalRouteSummariesForRange: vi.fn().mockResolvedValue({ success: true, syncedFromSheet: 5, skippedFromApp: 1, errors: [] }),
  ingestSingleRouteSummary: vi.fn(),
  ingestSingleRouteSummaryForRange: vi.fn().mockResolvedValue({ success: true, syncedDays: 7, errors: [] }),
  getWibTodayString: () => '2026-09-02',
}));
```

  (gantikan mock `regionalIngestionService` yang lama).
- Di `beforeEach`, tambahkan `sessionStorage.setItem('SS_MONITORING_ACTIVE_TAB', 'dashboard');` agar test lama yang mengasumsikan Dashboard tetap valid. Ubah judul test "renders executive dashboard tab by default" menjadi "renders executive dashboard tab when it is the saved tab".
- Hapus import `REALTIME_MIN_INTERVAL_MS`. Ganti test `debounces rapid realtime events ...` dan seluruh `describe('BUG-QUOTA-200 ...')` yang menguji muat ulang otomatis dengan:

```ts
  it('event realtime beruntun hanya memunculkan banner sekali tanpa request tambahan', async () => {
    vi.useFakeTimers();
    await act(async () => { root.render(<AllRouteMonitoringPage currentDate="2026-09-02" />); });
    const callsAfterMount = vi.mocked(regionalService.fetchRegionalMonitoringData).mock.calls.length;
    await act(async () => { for (let i = 0; i < 10; i++) realtimeCallback?.(); });
    await act(async () => { vi.advanceTimersByTime(REALTIME_MIN_DEBOUNCE_MS); });
    expect(vi.mocked(regionalService.fetchRegionalMonitoringData).mock.calls.length).toBe(callsAfterMount);
    expect(container.textContent).toContain(TEXT_MONITORING.PENDING_UPDATE.MESSAGE);
    vi.useRealTimers();
  });

  it('tab Siap Kirim (default) tidak memuat data capaian saat dibuka', async () => {
    sessionStorage.removeItem('SS_MONITORING_ACTIVE_TAB');
    await act(async () => { root.render(<AllRouteMonitoringPage currentDate="2026-09-02" />); });
    expect(container.querySelector('[data-testid="readiness-tab"]')).not.toBeNull();
    expect(regionalService.fetchRegionalMonitoringData).not.toHaveBeenCalled();
  });

  it('memetakan tab tersimpan lama fleet_status ke siap_kirim', async () => {
    sessionStorage.setItem('SS_MONITORING_ACTIVE_TAB', 'fleet_status');
    await act(async () => { root.render(<AllRouteMonitoringPage currentDate="2026-09-02" />); });
    expect(container.querySelector('[data-testid="readiness-tab"]')).not.toBeNull();
  });
```

  Pertahankan test `memfilter realtime ke tanggal yang sedang dilihat` dan `memakai armada shift dari hasil regional tanpa request fleet shift ganda` (sesuaikan bila perlu, dengan menyetel tab tersimpan ke `dashboard`). Hapus test `membatasi muat ulang hening maksimal 1 kali per 60 detik` dan `tidak memuat ulang saat tab tersembunyi ...` karena perilakunya sudah diganti banner.

- [ ] **Step 7: Jalankan test Monitoring**

Run: `pnpm vitest run src/components/monitoring`
Expected: PASS semua.

- [ ] **Step 8: Commit**

```bash
git add src/components/monitoring
git commit -m "feat(monitoring): tab Siap Kirim default, data capaian dimuat malas, banner menggantikan muat ulang otomatis"
```

---

### Task 10: Verifikasi, dokumentasi, dan peluncuran bertahap

**Files:**
- Create: `refactor-ss-pdo/refact_N/AUDIT_BUGS.md`, `refactor-ss-pdo/refact_N/REPAIR_REPORT.md`
- Modify: `src/components/monitoring/readiness/readinessModel.ts` (`SUBMISSION_FEATURE_START_DATE`)

- [ ] **Step 1: Quality gate lokal**

Run berurutan:
```bash
pnpm vitest run src/styles/tokens/color-contract.test.ts
pnpm vitest run src/
pnpm run build
graphify update .
```
Expected: semua lulus. Tulis jumlah test yang sebenarnya ke REPAIR_REPORT.

- [ ] **Step 2: Verifikasi browser (dev server, light & dark, lebar 375 px)**

Jalankan dev server lewat `preview_start` (konfigurasi `.claude/launch.json` yang ada). Login memerlukan pengguna. Lalu periksa:
- Tab Siap Kirim adalah tab default, dan pada mount hanya ada 3 request ke `/rest/v1/routes`, `/rest/v1/daily_route_reports?…completeness…`, `/rest/v1/route_submission_confirmations` (cek dengan `read_network_requests`).
- Label nav "Siap Kirim" tidak terpotong; segmen Kelengkapan/Armada dan kartu rapi di light & dark (screenshot).
- Segmen Armada menampilkan Status Armada lama.
- Tab Dashboard: event realtime memunculkan banner, bukan muat ulang otomatis.
Catatan: sebelum migrasi (Step 4) diterapkan, request konfirmasi akan gagal. Itu normal untuk tahap ini.

- [ ] **Step 3: Tetapkan tanggal fitur aktif**

Ubah `SUBMISSION_FEATURE_START_DATE` menjadi tanggal (WIB) saat fitur akan di-deploy ke produksi. Jalankan ulang test model, lalu commit.

- [ ] **Step 4: Terapkan migrasi ke produksi — WAJIB izin eksplisit pengguna dulu**

Setelah pengguna menyetujui:
```bash
unset SUPABASE_ACCESS_TOKEN
supabase db query --linked -f supabase/migrations/20261107000001_submission_readiness.sql
supabase db query --linked "INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('20261107000001', 'submission_readiness') ON CONFLICT (version) DO NOTHING;"
```
Verifikasi read-only lewat MCP `execute_sql`:
- kolom `daily_route_reports.completeness` ada;
- `relacl` tabel konfirmasi = `anon=r/…`, `authenticated=r/…`;
- tabel ada di `pg_publication_tables` `supabase_realtime`.

- [ ] **Step 5: Deploy Edge Function (oleh pengguna bila token agent ditolak) — urutan wajib**

```bash
supabase functions deploy sheet-sync-webhook --no-verify-jwt --project-ref znchudtormqsgpukibsn
supabase functions deploy route-confirmation --no-verify-jwt --project-ref znchudtormqsgpukibsn
supabase functions deploy sheets-proxy --no-verify-jwt --project-ref znchudtormqsgpukibsn
```
Pastikan bundel menyertakan `_shared/*` (deploy sukses, dan `list_edge_functions` menunjukkan versi baru).

- [ ] **Step 6: Probe produksi (tanpa mengubah data)**

- `POST /rest/v1/route_submission_confirmations` sebagai anon → harus ditolak (401/403, `42501`).
- `POST /functions/v1/route-confirmation` dengan `x-proxy-session` palsu → `401 PROXY_SESSION_INVALID`.
- `POST /functions/v1/sheets-proxy` dengan header palsu → tetap `401` (regresi refact_205).
- Minta pengguna mengedit satu sel di sheet satu rute, lalu cek lewat `execute_sql` bahwa `daily_route_reports.completeness` untuk rute/tanggal itu terisi dan `counts` masuk akal dibanding isi sheet.

- [ ] **Step 7: Deploy frontend**

Hanya atas perintah "PA" dari pengguna, dan setelah Step 4–6 berhasil (migrasi → fungsi → frontend). Cek bundel produksi memuat `route-confirmation` dan `submission-readiness`.

- [ ] **Step 8: Uji ujung-ke-ujung bersama pengguna**

Pengguna (atau PJ whitelist) membuka Monitoring dan melakukan rangkaian berikut:
1. Melihat status rute.
2. Mengonfirmasi satu rute lengkap (tanpa alasan) dan satu rute bermasalah (dengan alasan).
3. Mengedit sheet rute yang sudah dikonfirmasi; tanda "Berubah setelah dikonfirmasi" harus muncul tanpa muat ulang.

Verifikasi `activity_logs` berisi 1 baris `CONFIRM_SUBMISSION` per konfirmasi (lewat `execute_sql`).

- [ ] **Step 9: Dokumentasi `refact_N`**

Pakai skill `refact-doc`. `AUDIT_BUGS.md`: kebutuhan bisnis (data tidak lengkap/janggal sebelum pengiriman pukul 22.00), beban Monitoring ±300 request/jam per layar, dan halaman Monitoring yang masih ditutup. `REPAIR_REPORT.md`: implementasi per task, Before vs After (request saat buka tab, muat ulang otomatis vs banner, konfirmasi terverifikasi), Case Skenario Lapangan (korlap pukul 21.30 mengejar 18 rute; PJ dengan pantauan 5 rute; rute dikonfirmasi lalu diedit petugas), hasil 4 gate + probe produksi, dan **peluncuran bertahap**:
1. Aktifkan `regional_monitoring` untuk 1–2 korlap/PJ lewat whitelist.
2. Pantau Log Ingestion (< 0,2 GB/minggu) dan Egress di dashboard selama ±1 minggu.
3. Buka untuk semua bila aman.

Commit dokumentasi.

---

## Self-Review Checklist (sudah dijalankan saat menulis rencana)

- Cakupan spec: §2 aturan → Task 1; §3.1 webhook → Task 4; §3.2 tabel/RLS → Task 3; §3.3 Edge Function → Task 2+5; §3.4 alur klien → Task 6–7; §4 tampilan → Task 8–9; §5 kuota & peluncuran → Task 9–10; §6 penanganan kesalahan → Task 6 (offline, sesi), Task 7 (reconnect), Task 8 (no data/format), Task 5 (validasi); §7 pengujian → test di setiap task + Task 10.
- Penyimpangan kecil dari spec (sudah diselaraskan di spec): status `tab_not_found` tidak dipakai (sheet gagal dibaca = "Belum ada data"); `"-"` dianggap sel kosong; klasifikasi keterangan memakai aturan NORMAL vs bukan-NORMAL yang setara `classifyUnitKeterangan`, dijaga uji paritas.
- Nama yang dipakai lintas task konsisten: `computeRouteCompleteness`, `countCompletenessIssues`, `RouteCompleteness`, `evaluatePageAccess`, `verifyProxySession`, `isActiveUser(supabase, email)`, `getCorsHeaders`, `wibTodayString`, `shiftDateString`, `validateConfirmationDate`, `sanitizeReason`, `REASON_MIN_LENGTH`, `fetchActiveRoutes`, `fetchReadinessByDate`, `fetchConfirmationsInRange`, `confirmRouteSubmission`, `ConfirmSubmissionError`, `useSubmissionReadiness`, `READINESS_REALTIME_DEBOUNCE_MS`, `SubmissionReadinessTab`, `ReadinessSegment`, `PendingUpdateBanner`.
- Risiko yang diketahui: kolom `completeness` masih bisa ditulis anon karena policy `FOR ALL` lama di `daily_route_reports` (follow-up 6 tabel). Akibatnya angka masalah yang dicatat server bisa dimanipulasi oleh pihak yang memegang anon key, sampai follow-up itu selesai.
