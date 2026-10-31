# AUDIT BUGS — Refactor 180: Diferensiasi Warna Badge BA (Berita Acara) vs Badge OFF (Libur)

**Tanggal:** 31 Oktober 2026  
**Basis Repositori:** branch `devmode`  
**Ruang Lingkup:** `src/styles/tokens/semantic.css`, `src/styles/tokens/color-contract.test.ts`, `src/components/monitoring/monitoringUtils.ts`, `src/components/monitoring/monitoringUtils.test.ts`, `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx`, `src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx`, `src/index.css`.

---

## Daftar Temuan Masalah

| ID | Keparahan | Lokasi Kode | Deskripsi Masalah | Dampak Pengguna | Status Perbaikan |
|---|---|---|---|---|---|
| **BUG-180-01** | P2 (Sedang - Ambiguitas Visual & Aksesibilitas Warna) | `src/components/monitoring/monitoringUtils.ts:198–206`, `src/index.css:2072–2084` | Badge status `BA.01` s.d. `BA.06` (Berita Acara kendala operasional) dan badge status `OFF` (armada libur terencana) keduanya menggunakan warna kuning/amber yang identik (`var(--color-warning-fg)` dan `var(--color-warning-bg)`). Pada daftar armada unit kendala di modal detail rute dan tab Status Armada, pengguna tidak dapat membedakan secara visual antara unit yang libur normal (`OFF`) dengan unit yang mengalami kejadian Berita Acara / insiden operasional (`BA.02`). | Pengawas rute, Korwil, dan operator di lapangan mengalami kebingungan kognitif (*cognitive load*) karena harus membaca teks status satu per satu secara teliti alih-alih mengandalkan pemindaian visual cepat (*preattentive visual scanning*). Risiko kelalaian penanganan kendala fisik unit di jalan meningkat karena tersamar dengan unit yang memang sedang libur. | **TERATASI (Resolved)** — Menetapkan token warna semantik adaptif baru untuk Berita Acara: `--color-badge-ba-fg`, `--color-badge-ba-bg`, dan `--color-badge-ba-border` bernuansa Oranye (*warm operational orange*). Status `OFF` tetap dipertahankan berwarna Kuning/Amber (`var(--color-warning-*)`), sedangkan seluruh badge Berita Acara (`BA.01` s/d `BA.06`) beralih ke warna Oranye tegas dengan border penegas, menghasilkan pembeda visual yang kontras, tajam, dan lolos standar WCAG AA (rasio kontras 6.83:1 Light / 8.6:1 Dark). |

---

## Analisis Akar Masalah (Root Cause Analysis)

Pada implementasi fungsi `inferStatusCode` sebelumnya di `src/components/monitoring/monitoringUtils.ts`:
```ts
// 1. OFF (Libur)
if (isOff || hint === "OFF" || /\bOFF\b/i.test(note)) {
  return {
    code: "OFF",
    color: "var(--color-warning-fg)", // Kuning / Amber
    bg: "var(--color-warning-bg)",
  };
}

// 4. BA Code (Berita Acara / Laka / Sakit / Kendala Operasi)
const baMatch = note.match(/\bBA[\s.]?0?([1-6])\b/i);
if (baMatch) {
  return {
    code: `BA.0${baMatch[1]}`,
    color: "var(--color-warning-fg)", // KUNING / AMBER YANG SAMA!
    bg: "var(--color-warning-bg)",
  };
}
```
Kedua status tersebut dipetakan ke token peringatan umum (`warning`). Padahal dalam taksonomi operasional armada Transjakarta:
1. `OFF` adalah status istirahat terjadwal (rencana libur normal tanpa insiden).
2. `BA` adalah Berita Acara resmi akibat insiden lapangan (laka lantas, mogok, service berkala tak terduga, perbaikan radiator, banjir, dll.).
3. Kesamaan warna kuning antara `OFF` dan `BA` meniadakan diferensiasi visual yang sangat krusial di lapangan.

---

## Mitigasi & Validasi Perbaikan

1. **Definisi Token Warna Semantik Oranye:**
   - Menambahkan CSS Variables baru di `src/styles/tokens/semantic.css`:
     * Light Mode: `--color-badge-ba-bg: var(--p-orange-50)`, `--color-badge-ba-fg: var(--p-orange-800)`, `--color-badge-ba-border: var(--p-orange-200)`.
     * Dark Mode: `--color-badge-ba-bg: var(--p-orange-950)`, `--color-badge-ba-fg: var(--p-orange-300)`, `--color-badge-ba-border: var(--p-orange-800)`.
2. **Penyempurnaan `inferStatusCode` & Hirarki Badge:**
   - Memetakan seluruh deteksi pola `BA.01` s/d `BA.06` serta hint Berita Acara ke token `--color-badge-ba-*`.
   - Mengembalikan properti `border` pada seluruh kode status agar badge memiliki garis tepi kontras yang rapi di layar ponsel.
   - Memastikan `OFF` tetap 100% menggunakan warna Kuning/Amber (`var(--color-warning-*)`).
3. **Penyelarasan Kartu Catatan Global (`src/index.css`):**
   - Memigrasikan `.note-badge-ba` dari hardcoded rgba merah lama ke token semantik `--color-badge-ba-*` sehingga konsisten di seluruh halaman aplikasi.
4. **Verifikasi Kontrak Warna Otomatis (WCAG AA/AAA):**
   - Menambahkan pasangan token `["badge-ba-fg", "badge-ba-bg"]` ke `color-contract.test.ts`. Uji vitest membuktikan rasio kontras mencapai 6.83:1 (Light) dan 8.6:1 (Dark), keduanya jauh melampaui batas minimum WCAG AA (4.5:1).

