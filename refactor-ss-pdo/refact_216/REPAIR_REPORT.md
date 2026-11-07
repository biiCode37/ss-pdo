# REPAIR REPORT: REFACTOR 216
**Modul:** Normalisasi skala tipografi (ukuran & bobot huruf)
**Tanggal:** 07 November 2026
**Status:** Selesai — 4 quality gate lulus

---

## 1. Implementasi Perbaikan

### A. Codemod deterministik (skrip sekali pakai, tidak disimpan di repo)
- Memindai `src/**/*.{tsx,ts,css}` (kecuali test, `styles/tokens/`, `sheetColorUtils.ts`).
- Lokasi yang diubah: `fontSize:` dan `fontWeight:` di objek style JSX (termasuk ternary multi-baris), `font-size:`/`font-weight:` di CSS, dan CSS di dalam string template SweetAlert.
- Segmen berisi `${}`, `var()`, `calc`, `clamp`, `min()`, `max()`, `*`, `/` dilewati (tidak ada yang ditemukan).
- Hasil: **113 file**, **692 ukuran** dan **114 bobot** diubah.

Pemetaan ukuran terbanyak: 11px→12px (170), 11.5px→12px (81), 10.5px→12px (67), 10px→12px (66), 12.5px→13px (57), 0.78rem→12px (30), 13.5px→14px (26), 0.82rem/0.8rem→13px (42), 0.75rem→12px (18), 9.5px→12px (15), 15px→16px (15), 0.85rem→14px (12), 0.95rem→16px (10), 17px→18px (9), 9px→12px (7), 1.15rem→18px (6), 1.4rem→24px (2), 8.5px→12px (1).

### B. Test
- `BusFormField.test.tsx`: ekspektasi ukuran varian sekunder `0.95rem` → `16px`.
- `ui-debt-ratchet.test.ts`: pengukuran ukuran huruf kini juga mencakup ternary multi-baris dan CSS di string template; baseline `fontSizeBelow12px`, `fontSizeOffScale`, `fontWeightHeavy` dikunci di **0**.

### C. Aturan agent (`.agents/rules/ui-consistency.md`)
- Bagian tipografi dinyatakan berlaku (bukan lagi sementara); bobot 800/900 dilarang sepenuhnya.

## 2. Before vs After

| Aspek | Before | After |
|---|---|---|
| Teks < 12px | 386 | 0 (dikunci) |
| Ukuran di luar skala | 619 | 0 (dikunci) |
| Bobot 800/900 | 106 | 0 (dikunci) |
| Satuan ukuran | Campuran `px` dan `rem` | `px` saja |
| Label navigasi bawah monitoring (≤ 380px) | 9,5px | 12px, tetap muat di layar 360px |
| Template SweetAlert | 10,5–11,5px | ≥ 12px |

## 3. Case: Skenario Lapangan

### Case BUG-TYPO-216-01: Membaca kartu status armada di luar ruangan
- **Situasi:** Korwil membuka tab Status Armada dan detail rute di HP saat siang hari.
- **Before:** Label dan keterangan 9,5–10,5px sulit dibaca, harus memperbesar layar.
- **After:** Teks terkecil 12px, terbaca tanpa zoom.

### Case BUG-TYPO-216-02: Berpindah antar halaman
- **Situasi:** Admin berpindah dari Input SS ke Monitoring lalu ke Manajemen Pengguna.
- **Before:** Teks setara (label, keterangan) berukuran 11, 11.5, 12.5, 0.78rem, dst. di tiap halaman.
- **After:** Teks setara memakai ukuran yang sama dari skala tetap.

### Case BUG-TYPO-216-03: Memindai kartu unit dan KPI
- **Situasi:** PDO memindai angka di kartu unit dan ringkasan.
- **Before:** Hampir semua angka dan judul 800, sehingga tidak ada yang menonjol.
- **After:** Bobot maksimal 700; hierarki lebih tenang dan jelas.

## 4. Verifikasi

1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` — **158/158 lulus**.
2. `pnpm vitest run src/` — **142 file, 1356/1356 lulus**.
3. `pnpm run build` — **exit 0**.
4. `graphify update .` — 7998 node, 13600 edge, 638 komunitas.

Verifikasi visual (dev server, viewport 360×780):
- Halaman login, light & dark: tidak ada scroll horizontal, tidak ada elemen terpotong, **0 teks < 12px**.
- Navigasi bawah monitoring (markup & kelas asli, dipasang sementara lalu dihapus) dengan setiap tab aktif bergantian: label 12px tidak terpotong; lebar navigasi 246–303px, muat di layar 360px.
- Pemindaian statis: 166 titik yang naik dari ≤ 10,5px diperiksa terhadap kotak berukuran tetap + `nowrap`/`overflow: hidden`; satu kandidat (`MonitoringLeaderboard.tsx`, lingkaran peringkat 20px) aman karena hanya memuat 1–2 digit.
- Belum dilihat langsung: layar yang butuh login (monitoring, modal input bus, detail unit). Risiko yang perlu dicek: teks yang kini 1–3px lebih besar bisa membungkus ke baris baru di kartu yang padat.
