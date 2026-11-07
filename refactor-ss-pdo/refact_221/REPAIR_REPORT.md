# REPAIR REPORT: REFACTOR 221
**Modul:** Kontras status aktif, ritme jarak, dan penghapusan hijau warisan
**Tanggal:** 07 November 2026
**Status:** Selesai — 4 quality gate lulus

---

## 1. Implementasi Perbaikan

### A. Token & kontrak (`semantic.css`, `color-contract.test.ts`)
- Token baru (2 tema): `--color-state-active-bg` (blue-700 / blue-300), `--color-state-active-fg` (putih / blue-950), `--color-dock-bg` (putih / ink-800), `--color-dock-border` (slate-300 / slate-600).
- Kontrak baru: `state-active-fg` di atas `state-active-bg` ≥ 4,5:1; `state-active-bg` vs 4 permukaan + dock ≥ 3:1; `text-primary`/`text-secondary` di atas dock ≥ 4,5:1 (158 → 174 kontrak).

### B. Dock & pil (`index.css`, `actions.css`)
- `.bottom-nav`: latar `--color-dock-bg`, border `--color-dock-border`, bayangan token; `backdrop-filter` dan `rgba` dihapus.
- `.bottom-nav-item`: teks `--color-text-secondary`, tinggi 44px; `.active` → `--color-state-active-*`.
- `.ui-chip-btn--accent` (pil rute): latar permukaan + garis tepi `--color-state-active-bg` + teks `--color-link`.
- `.swal-segment-btn.active`, `.swal-note-chip.active`, `.pdo-satset-toggle.active` → `--color-state-active-*`; chip BA aktif → `--color-danger-*`.

### C. Penanda aktif inline (skrip sekali pakai)
- 103 properti di 14 file: cabang aktif `background`/`color`/`border`/`borderColor` yang bersyarat aktif/terpilih diganti `--color-state-active-*`. Dikecualikan: status semantik (error/warning/success), merah validasi, `busCard/modal/*` (tahap berikutnya), baris grafik TOA, kartu halaman.

### D. Warna teks & badge
- `UnitCard.tsx`: 5 salinan badge status → `.ui-status[data-tone]` (success/warning/neutral).
- 69 `color` mentah berwarna di 26 file → token semantik.

### E. Hijau warisan (skrip sekali pakai)
- `var(--accent-color, …)` → `--color-action-primary-bg` (latar/garis) atau `--color-link` (teks); `#3ECF8E/#24B47E/#00C573` solid → token aksi/link; `rgba(62, 207, 142, a)` → `--color-action-secondary-bg` (latar), `--color-border-subtle` (garis), `--color-shadow` (bayangan); emerald → `--color-success-*`; fallback hijau di dalam `var()` dibuang. Definisi `--accent-color` dihapus dari `index.css` dan `legacy.css`.

### F. Ritme jarak
- `.sticky-top-block` margin bawah 14 → 12px; `.bus-list` padding atas 6 → 0; `.analytics-container` gap 16 → 12, padding atas 16 → 0; Armada: pembungkus `paddingTop` & `.search-container` (sticky + padding 16) diganti `.page-search` (margin bawah 12px).
- `.app-container` padding bawah `76px + safe-area` → `88px + safe-area` (±20px di atas dock).

### G. Penjaga (`ui-debt-ratchet.test.ts`) & aturan
- Metrik baru: `weakActiveState` (baseline 12, sisa modal input bus dkk.) dan `rawTextColor` (baseline 37, sisa putih/hitam di atas latar solid). Diuji: file sementara dengan `background: isActive ? "var(--color-selection-bg)" : …` → `weakActiveState` naik 12 → 13 → gagal.
- Baseline turun: `legacyAccentColor` 231 → **0**, `rawHexColor` 769 → 506, `rgbHslFunction` 904 → 799, `inlineStyleObject` 1962 → 1948, `backdropFilter` 33 → 29.
- `.agents/rules/ui-consistency.md` (bagian 4 & 8) dan `AGENTS.md` poin 9: aturan status aktif, warna teks token, ritme 12px.

### H. Test yang diperbarui
- `KeteranganPresetBar.test.tsx`: ekspektasi warna `#10b981/#eab308/#ef4444` → token sukses/peringatan/error.

## 2. Before vs After

| Aspek | Before | After |
|---|---|---|
| Kapsul aktif dock vs dock | 1,23:1 gelap / 1,15:1 terang | 9,04:1 / 5,93:1 |
| Garis pil rute vs header | Tint menyatu | 9,04:1 / 5,93:1 |
| Badge "Hanya Shift 1" (terang) | 1,96:1 | Token peringatan (lolos kontrak ≥ 4,5:1) |
| Penanda aktif inline | ±45 gaya tint/hijau/biru berbeda | Satu pasangan token `state-active` |
| Jarak header → konten | 42 / 20 / 28px (Armada/Input/Dashboard) | 12px semua |
| Antarkartu | 12 / 16px | 12px |
| Konten terakhir → dock | ±8px | 20px |
| Hijau warisan | 193 | 0 (dikunci) |

## 3. Case: Skenario Lapangan

### Case BUG-CONTRAST-221-01: Mengetahui tab aktif di dock
- **Situasi:** PDO berpindah Input SS ↔ Armada di bawah sinar matahari.
- **Before:** Kapsul aktif hampir tak terlihat; harus menebak dari label.
- **After:** Kapsul biru tegas dengan teks kontras tinggi di kedua tema.

### Case BUG-CONTRAST-221-02: Memilih filter/segmen di halaman lain
- **Situasi:** Korwil memilih filter status armada atau format laporan WA.
- **Before:** Pilihan aktif hanya tint tipis atau hijau berbeda-beda.
- **After:** Pilihan aktif seragam (biru `state-active`) dan jelas.

### Case BUG-CONTRAST-221-03: Membaca status shift di Armada
- **Situasi:** PDO memeriksa unit yang baru terisi shift 1 pada mode terang.
- **Before:** Teks "Hanya Shift 1" 1,96:1, nyaris tidak terbaca.
- **After:** Badge memakai pasangan token peringatan yang lolos kontrak.

### Case BUG-SPACE-221-04: Menggulir sampai unit terakhir
- **Situasi:** PDO menggulir ke unit ke-21.
- **Before:** Kartu terakhir menempel dock; di Armada ada ruang kosong 42px di atas kolom cari.
- **After:** Jarak 12px seragam di atas konten; kartu terakhir berhenti 20px di atas dock.

### Case BUG-COLOR-221-05: Konsistensi warna aksen
- **Situasi:** Admin berpindah antara halaman login, monitoring, dan manajemen pengguna.
- **Before:** Aksen hijau Supabase muncul di beberapa tempat.
- **After:** Aksen biru token di seluruh aplikasi.

## 4. Verifikasi

1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` — **174/174 lulus**.
2. `pnpm vitest run src/` — **142 file, 1376/1376 lulus**.
3. `pnpm run build` — **exit 0** (`tsc -b` 0 error).
4. `graphify update .` — 8108 node, 13673 edge, 640 komunitas.

Verifikasi visual & audit otomatis (`localhost:5173`, login role PDO, 375×812, Input SS / Dashboard / Armada × gelap / terang; tanpa menyimpan data):
- Audit kontras teks semua elemen terlihat: **0 teks < 4,5:1** di 6 kombinasi setelah perbaikan (sebelumnya 5 badge "Hanya Shift 1" 1,96:1 di Armada terang).
- Kapsul aktif vs dock: 9,04:1 (gelap), 5,93:1 (terang); garis pil rute: 9,04:1 / 5,93:1.
- Jarak terukur: header→konten 12px dan antarkartu 12px di ketiga tab; konten terakhir 20px di atas dock.
- Belum dilihat: halaman monitoring, manajemen pengguna, laporan WA/A2 (role PDO tidak punya akses) — perubahan di sana hanya penggantian token.
