# REPAIR REPORT: REFACTOR 218
**Modul:** Normalisasi radius & jarak
**Tanggal:** 07 November 2026
**Status:** Selesai — 4 quality gate lulus

---

## 1. Implementasi Perbaikan

### A. Codemod radius (skrip sekali pakai)
- Hanya token `<angka>px` non-negatif pada properti radius; segmen berisi `var()`, `calc`, `${}`, `clamp`, `min()`, `max()` dilewati.
- **390 nilai** diubah: 10→12 (156), 6→8 (93), 14→12 (34), 20→16 (24), 24→16 (23), 9999→999 (21), 2→8 (10), 4/5/7→8 (24), 3→8 (2), 15→16 (2), 9→8 (1).

### B. Codemod jarak
- Properti `padding`, `margin`, `gap`, `rowGap`, `columnGap` (+ varian sisi) di JSX, CSS, dan CSS di string template.
- **325 nilai** diubah: 3→4 (83), 5→6 (80), 7→8 (38), 1→2 (33), 18→20 (26), 9→10 (25), 11→12 (14), 36→40 (5), 13→14 (4), 22→24 (3), 1.5→2 (3), dan 12 nilai pecahan/besar lain (25, 50, 2.5, 30, 3.5, 5.5, 4.5, 6.5, 60, 44, 34).

### C. Keputusan skala jarak (berbeda dari draf aturan)
- Draf aturan meminta kelipatan 4. Nilai 6, 10, dan 14px dipakai ±790 kali sebagai langkah setengah yang wajar; memaksa semuanya ke kelipatan 4 akan menggeser ±2px di ratusan tempat, termasuk layar monitoring yang belum bisa diverifikasi, dengan manfaat visual kecil.
- Skala final: genap sampai 16 (0–16), lalu 20, 24, 28, 32, 40, 48, 56, 64. Yang dihapus adalah nilai ganjil dan pecahan.

### D. Ratchet & aturan
- `ui-debt-ratchet.test.ts`: metrik baru `radiusOffScale` dan `spacingOffScale`, dikunci di **0**. Diuji dengan file sementara (`borderRadius: "10px"`, `padding: "5px 9px"`) → gagal pada kedua metrik; lulus kembali setelah file dihapus.
- `.agents/rules/ui-consistency.md` bagian 8 dan `AGENTS.md` poin 5: skala radius & jarak dinyatakan wajib (bukan sementara).

## 2. Before vs After

| Aspek | Before | After |
|---|---|---|
| Nilai radius berbeda | 19 | 5 (8, 12, 16, 999px, 50%), dikunci |
| Tombol/input/kartu | 10, 12, 14px | 12px |
| Modal/bottom sheet | 20, 24px | 16px |
| Nilai jarak ganjil/pecahan | 325 | 0, dikunci |

## 3. Case: Skenario Lapangan

### Case BUG-SPACE-218-01: Berpindah dari daftar unit ke modal input
- **Situasi:** PDO mengetuk kartu unit lalu mengisi data di modal.
- **Before:** Kartu, tombol, chip, dan modal memakai lengkungan 6, 10, 14, 20px yang berbeda.
- **After:** Kartu & tombol 12px, chip 8px, modal 16px — konsisten.

### Case BUG-SPACE-218-02: Memindai baris angka di kartu
- **Situasi:** PDO membandingkan angka ritase/KM antar kartu unit.
- **Before:** Celah 3, 5, 7, 9px bercampur sehingga baris tidak lurus.
- **After:** Celah mengikuti skala genap; ritme lebih teratur.

## 4. Verifikasi

1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` — **158/158 lulus**.
2. `pnpm vitest run src/` — **142 file, 1358/1358 lulus** (termasuk 2 metrik ratchet baru).
3. `pnpm run build` — **exit 0** (`tsc -b` juga 0 error).
4. `graphify update .` — 8049 node, 13620 edge, 656 komunitas.

Verifikasi visual di aplikasi yang sudah login (`localhost:5173`, role PDO, 375×812, mode gelap; tanpa menyimpan data):
- Dashboard, Input SS, dan modal input bus (dibuka lalu ditutup "Batal"): tidak ada scroll horizontal, tidak ada elemen terpotong; radius terukur hanya 8px, 12px, 16px, 999px, dan 50%.
- Belum dilihat: Monitoring, Manajemen Pengguna, Kelola Halaman (butuh role admin/superadmin).
