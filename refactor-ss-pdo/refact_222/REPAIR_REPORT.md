# REPAIR REPORT: REFACTOR 222
**Modul:** Perapian modal input bus (tab, segmen, preset, warna, layout)
**Tanggal:** 07 November 2026
**Status:** Selesai — 4 quality gate lulus

---

## 1. Implementasi Perbaikan

### A. Komponen CSS bersama (`src/styles/components/actions.css`)
- `.ui-segmented` / `.ui-segmented--inline` + `.ui-segmented-btn`: aktif via `aria-selected`/`aria-pressed` → `--color-state-active-*`.
- `.ui-option-btn`: tombol opsi/preset 32px; aktif `aria-pressed` → `state-active`; `data-tone="warning|error|success"` aktif → latar `--color-{tone}-fg` + teks `--color-surface-default`; `:disabled` / `aria-disabled` → `--color-text-muted`.
- `.ui-tone-panel[data-tone]` untuk panel info/peringatan/error.
- Kontrak baru (`color-contract.test.ts`): `surface-default` di atas `warning-fg`/`error-fg`/`success-fg` ≥ 4,5:1 (174 → 180 kontrak).

### B. Komponen modal
- `BusInputModalTabs.tsx`: ditulis ulang memakai `.ui-segmented`; ikon tab dihapus.
- `BusInputModalNotes.tsx`: segmen Shift 1/2 → `.ui-segmented--inline` (+ titik `.ui-chip-dot` bila ada catatan); checkbox, panel, textarea (`input-field`), dan pratinjau memakai kelas `.bus-notes-*` di `index.css`.
- `KeteranganPresetBar.tsx`: 8 objek style → daftar data + `.ui-option-btn` (OFF `warning`, TO EVDAL `error`, OKB/Renop `success`, BA netral); Reset memakai `:disabled`; kelas `.ket-presets-*`.
- `ShiftOptionChip.tsx`: `.ui-option-btn` + `aria-pressed`.
- `singleFocusStyles.ts`: `getSingleFocusChipStyle` dihapus; 6 pemanggil di KM S1/S2, TOA, Trip memakai `.ui-option-btn` + `aria-pressed`/`aria-disabled`.
- `CrossDayKmIndicator.tsx`: kotak hanya saat ekstrem.
- `SingleFocusKmShift1/2.tsx`: `aria-invalid` saat KM negatif; border `--color-error-fg`.

### C. Warna (skrip sekali pakai, 13 file di `src/components/busCard`)
- 93 fallback di dalam `var()` dibuang; 90 variabel lama → semantik (`--shift1-*` → `--color-shift-1-*`, `--card-border`/`--border-color` → `--color-border-subtle`, `--input-bg` → `--color-surface-subtle`, `--card-bg` → `--color-surface-default`, `--text-*` → `--color-text-*`, `--success/warning/danger-color` → `--color-*-fg`).
- 94 hex/rgba mentah → token menurut rona (merah→error, kuning/oranye→warning, hijau→success, biru→info/link, ungu→shift-2, netral→surface/border/text) dan properti (latar/garis/teks/bayangan).

### D. Test & penjaga
- `KeteranganPresetBar.test.tsx`: asersi warna inline → `aria-pressed="true"` + `data-tone`.
- `BusFormField.test.tsx` (ShiftOptionChip): asersi latar `rgba` → kelas `ui-option-btn`.
- `BusInputModalSingleFocus.test.tsx`: asersi border merah → `aria-invalid="true"`.
- Ratchet: `weakActiveState` 12 → **2** (sisa sorotan baris terpilih grafik TOA & kartu Kelola Halaman); penjaga CSS menerima latar solid status untuk chip bertone. `rawHexColor` 506 → 415, `rgbHslFunction` 799 → 631, `inlineStyleObject` 1948 → 1920, `rawTextColor` 37 → 34.
- `.agents/rules/ui-consistency.md`: daftar komponen bersama ditambah `.ui-segmented`, `.ui-option-btn`, `.ui-tone-panel`, `.ui-status`.

## 2. Before vs After

| Aspek | Before | After |
|---|---|---|
| Tab aktif modal vs wadah | 1,08:1 / 1,10:1 | 9,96:1 / 5,42:1 |
| Segmen Shift 1/2 (Ket) | Tint tipis | Sama dengan tab (state-active) |
| Preset OFF aktif | Tint kuning 0,2 | Kuning solid, 12,40:1 / 7,09:1 |
| Tombol Reset non-aktif | 1,91:1 / 1,00:1 | Teks muted terbaca |
| Badge "0.0 KM" (terang) | 1,81:1 | Token link di atas info-bg |
| Ikon di tab modal | 4 ikon dekoratif | Tidak ada |
| Warna mentah/variabel lama di `busCard/` | 277 | 0 |
| Info selisih KM lintas hari | Kotak di dalam kotak | Baris biasa (kotak hanya saat ekstrem) |

## 3. Case: Skenario Lapangan

### Case BUG-MODAL-222-01: Mengisi Shift 2 di sore hari
- **Situasi:** PDO membuka modal unit dan berpindah ke tab Shift 2.
- **Before:** Tab aktif nyaris sama dengan tab lain; mudah salah mengisi kolom Shift 1.
- **After:** Tab aktif biru tegas tanpa ikon pengalih perhatian.

### Case BUG-MODAL-222-02: Menandai unit OFF lalu mengosongkan catatan
- **Situasi:** PDO menekan preset OFF, lalu ingin menghapus catatan.
- **Before:** OFF aktif hanya tint tipis; tombol Reset tak terlihat di mode terang.
- **After:** OFF aktif kuning solid jelas; Reset selalu terbaca (redup hanya saat tidak ada isi).

### Case BUG-MODAL-222-03: Membaca jarak tempuh
- **Situasi:** PDO mengetik KM akhir dan memeriksa jarak tempuh.
- **Before:** Angka jarak 1,81:1 di mode terang.
- **After:** Angka memakai token yang lolos kontrak.

### Case BUG-MODAL-222-04/05: Panel KM & pembaca layar
- **Situasi:** Selisih KM normal; atau KM akhir lebih kecil dari KM awal.
- **Before:** Kotak berlapis; status negatif hanya warna.
- **After:** Panel rapi satu lapis; input negatif diberi `aria-invalid`.

## 4. Verifikasi

1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` — **180/180 lulus**.
2. `pnpm vitest run src/` — **142 file, 1382/1382 lulus**.
3. `pnpm run build` — **exit 0** (`tsc -b` 0 error).
4. `graphify update .` — 8134 node, 13699 edge, 631 komunitas.

Verifikasi visual & audit kontras otomatis (`localhost:5173`, login role PDO, 375×812, modal unit KWK 222153 — 4 tab × gelap/terang; ditutup dengan "Batal", tidak ada data tersimpan):
- **0 teks < 4,5:1** di 8 kombinasi (sebelumnya: Reset 1,91/1,00; "0.0 KM" 1,81; label 4,10).
- Tab/segmen aktif: 9,96:1 (gelap) / 5,42:1 (terang); preset OFF aktif (ditekan lalu dibatalkan): 12,40:1 / 7,09:1.
- Belum dilihat: mode fokus tunggal (Satset) di perangkat, panel peringatan KM ekstrem/negatif dengan data nyata, dan HP fisik.
