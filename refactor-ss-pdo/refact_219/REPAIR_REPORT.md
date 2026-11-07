# REPAIR REPORT: REFACTOR 219
**Modul:** Perapian layout kartu unit (Input SS & Armada)
**Tanggal:** 07 November 2026
**Status:** Selesai — 4 quality gate lulus

---

## 1. Implementasi Perbaikan

### A. Bingkai & status kartu (`src/index.css`)
- `.glass`: border `--color-border-control` → `--color-border-subtle` (berlaku untuk semua kartu `.glass`, 22 file).
- `.bus-card`: border kiri/kanan transparan 3,5px dihapus; hover angkat + bayangan `rgba` dihapus; `position: relative`.
- `.bus-card::after` baru menggambar tepi status 4px kiri & kanan (`inset` box-shadow) dari `--unit-edge`; `.unit-status-off/-kendala/-to` kini hanya mengisi `--unit-edge`.
- `.bus-card-header`: padding 12px 16px (satu sumber); inline style ganda di `BusCard.tsx` dihapus.

### B. Strip metrik
- Pemisah kolom: `.bus-metric-col + .bus-metric-col { border-left }` (tidak lagi ikut radius kolom Ritase).
- `.bus-metric-strip` latar `--color-surface-subtle`; override tema terang `rgba` dihapus.
- `.bus-metric-interactive:hover` → `--color-action-secondary-bg`; override tema terang dihapus.
- `.bus-metric-label`: tanpa uppercase/letter-spacing/opacity, bobot 600, `--color-text-secondary`.
- `.bus-metric-value`: warna `--color-text-primary` di kelas; inline `color` dihapus di `BusCardSummary.tsx` (3) dan `UnitCard.tsx` (2).
- `.bus-metric-empty`: `--color-text-muted` tanpa opacity.

### C. Kamus teks (`text_dashboard.ts`)
- `UNIT_CARD` & `BUS_CARD_ACTIONS`: `LABEL_RITASE` 'Ritase', `LABEL_KM` 'Total KM', `LABEL_PASSENGER` 'Pelanggan'.

### D. Test
- `texts.test.ts`: ekspektasi `LABEL_RITASE` → 'Ritase'.
- `BusCardSummary.test.tsx`: warna netral ritase kini dari kelas (tanpa override inline).
- `UnitStatusBadge.test.tsx`: kontrak refact_212 diperbarui ke mekanisme `::after` + `--unit-edge` (tetap memastikan latar kartu netral).
- Ratchet: `rgbHslFunction` 930→925, `inlineStyleObject` 2000→1994.

## 2. Before vs After

| Aspek | Before | After |
|---|---|---|
| Sisi kiri/kanan kartu netral | Transparan 3,5px (bingkai tampak putus) | Border 1px utuh di empat sisi |
| Tepi status OFF/kendala/TO | Border 3,5px (menggeser isi) | Lapisan 4px di atas isi, tidak menggeser |
| Pemisah kolom Ritase | Melengkung | Lurus |
| Label metrik | RITASE / TOTAL KM / PELANGGAN, opacity 0,85 | Ritase / Total KM / Pelanggan, tanpa opacity |
| Warna angka | KM biru langit, lainnya netral | Ketiganya netral |
| Bingkai kartu `.glass` | Abu tegas (warna kontrol) | Abu halus (warna pemisah) |
| Padding header kartu | CSS dan inline berbeda | Satu sumber di CSS |

## 3. Case: Skenario Lapangan

### Case BUG-LAYOUT-219-01: Memindai 21 unit di Input SS
- **Situasi:** PDO menggulir daftar unit untuk mencari yang belum diisi.
- **Before:** Kartu tampak seperti garis-garis tanpa sisi; unit berstatus bergeser 2,5px.
- **After:** Kartu utuh dan sejajar; unit OFF/kendala/TO ditandai garis warna di kedua sisi tanpa menggeser isi.

### Case BUG-LAYOUT-219-02: Mengetuk kolom Ritase
- **Situasi:** PDO mengetuk kolom Ritase untuk membuka form trip.
- **Before:** Garis pemisah kolom Ritase melengkung.
- **After:** Pemisah lurus; area ketuk tetap berlatar lembut saat hover.

### Case BUG-LAYOUT-219-03/04: Membaca angka di kartu
- **Situasi:** PDO membandingkan ritase, KM, dan pelanggan.
- **Before:** Label kapital pudar; angka KM beda warna sendiri.
- **After:** Label kalimat biasa, angka seragam warna teks utama.

### Case BUG-LAYOUT-219-05: Tampilan keseluruhan daftar
- **Situasi:** Daftar unit dan kartu analitik di dashboard.
- **Before:** Semua kartu bergaris tebal.
- **After:** Bingkai halus; perhatian ke isi, bukan bingkai.

## 4. Verifikasi

1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` — **158/158 lulus**.
2. `pnpm vitest run src/` — **142 file, 1358/1358 lulus**.
3. `pnpm run build` — **exit 0** (`tsc -b` 0 error).
4. `graphify update .` — 8065 node, 13634 edge, 662 komunitas.

Verifikasi visual di aplikasi yang sudah login (`localhost:5173`, role PDO, 375×812; tanpa menyimpan data):
- Input SS mode gelap: kartu utuh, pemisah lurus, label kalimat biasa, angka netral.
- Kelas status ditambahkan sementara lewat DevTools ke 3 kartu (TO, OFF, kendala) lalu dihapus: tepi warna tampil penuh di kiri & kanan sepanjang header dan strip metrik (versi `inset` pertama tertutup latar strip, lalu dipindah ke `::after`).
- Mode terang (atribut tema diubah sementara): kartu dan tepi status TO terbaca jelas.
- Belum dilihat: unit dengan status nyata dari spreadsheet (data hari ini tidak ada unit OFF/TO) dan perangkat HP fisik.
