# REPAIR REPORT: REFACTOR 217
**Modul:** Perapian ikon (ukuran & ikon dekoratif) + label grafik SVG
**Tanggal:** 07 November 2026
**Status:** Selesai — 4 quality gate lulus

---

## 1. Implementasi Perbaikan

### A. Normalisasi ukuran ikon (skrip sekali pakai)
- Angka literal di prop `size={…}` pada komponen berawalan huruf kapital (kecuali `RoleBadge`) dipetakan: ≤ 17 → 16, 18–21 → 20, ≥ 22 → 24. Termasuk ternary (`isKeyboardOpen ? 16 : 20`).
- **264 ukuran** diubah: 14→16 (60), 13→16 (43), 15→16 (42), 18→20 (40), 12→16 (35), 19→20 (10), 11→16 (9), 10→16 (7), 17→16 (7), 22→24 (3), 32/36→24 (4), 28/30/34/48→24 (4).

### B. Ikon dekoratif dibuang
- Judul kartu analitik: `FileText`, `Activity`, `Split`, `BarChart2`.
- Header modal: kotak ikon `Bus` (input bus, detail unit) dan `Layers` (akumulasi).
- Judul modal periode monitoring: `Calendar` ×2; judul sheet pemilih rute: `MapPin`; judul catatan detail unit: `MessageSquare`.
- Kartu fitur login: kotak ikon `Activity`/`Bus`/`Lock`; judul kartu kini memakai `--color-text-primary` (bukan hijau warisan).
- Kartu unit tab Armada: ikon `Bus` di depan nomor unit.
- Impor lucide yang tidak terpakai dihapus; CSS mati dihapus: `.analytics-card-title > svg`, `--title-icon-color` (2 tema), `.ui-icon-tile`.

### C. Label grafik SVG (`ToaBarChart.tsx`)
- Label sumbu tanggal `fontSize="9"` → `"13"`; badge nilai `fontSize="10"` → `"13"`, `fontWeight="800"` → `"700"`.

### D. Ratchet (`src/styles/ui-debt-ratchet.test.ts`)
- Deteksi tambahan: atribut `fontSize="N"`/`fontSize={N}` dan `fontWeight="800"|{800}`. Diuji: mengembalikan `fontSize="9"` membuat `fontSizeBelow12px` dan `fontSizeOffScale` gagal.
- Baseline diturunkan: `iconSizeOffScale` 274→**0**, `rawHexColor` 786→780, `rgbHslFunction` 931→930, `inlineStyleObject` 2008→2000, `legacyAccentColor` 247→236.

## 2. Before vs After

| Aspek | Before | After |
|---|---|---|
| Ukuran ikon berbeda | 17 nilai | 3 nilai (16/20/24), dikunci ratchet |
| Ikon dekoratif di judul/daftar | 13 titik + ikon bus di setiap kartu Armada | Dibuang |
| Label tanggal grafik pelanggan | ±8px | ±12px |
| CSS ikon judul hijau warisan | `--title-icon-color: #3ECF8E/#24B47E` | Dihapus |
| Deteksi ukuran huruf di atribut SVG | Tidak ada | Ada |

## 3. Case: Skenario Lapangan

### Case BUG-ICON-217-01: Memindai daftar unit dan modal input
- **Situasi:** PDO membuka Input SS lalu modal input bus.
- **Before:** Ikon di tombol, chip, dan tab berukuran 12–15px yang berbeda-beda.
- **After:** Ikon sebaris teks 16px, ikon tombol/navigasi 20px, seragam.

### Case BUG-ICON-217-02: Membaca dashboard dan tab Armada
- **Situasi:** PDO membuka Dashboard lalu Armada untuk mencari satu unit.
- **Before:** Setiap judul kartu dan setiap kartu unit diawali ikon; layar terasa ramai.
- **After:** Judul dan nomor unit langsung terbaca; ikon hanya tersisa di navigasi, tombol, dan badge status.

### Case BUG-ICON-217-03: Membaca tanggal di grafik pelanggan harian
- **Situasi:** Korlap melihat grafik pelanggan bulan berjalan di HP.
- **Before:** Tanggal di bawah batang grafik ±8px.
- **After:** Tanggal ±12px dan terbaca tanpa zoom.

## 4. Verifikasi

1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` — **158/158 lulus**.
2. `pnpm vitest run src/` — **142 file, 1356/1356 lulus**.
3. `pnpm run build` — **exit 0** (`tsc -b` juga dijalankan terpisah: 0 error setelah impor `MapPin` sisa di `RouteSelectorSheet.tsx` dihapus).
4. `graphify update .` — 8018 node, 13609 edge, 647 komunitas.

Verifikasi visual di aplikasi yang sudah login (dev server `localhost:5173`, akun role PDO, viewport 375×812, mode gelap; hanya melihat — tidak ada data yang disimpan):
- Dashboard: tidak ada scroll horizontal, tidak ada elemen terpotong; teks < 12px hanya label grafik (lalu diperbaiki, butir C); ikon terukur 16/20/24 saja.
- Input SS: 0 teks < 12px, 0 elemen terpotong, ikon 16/20/24.
- Modal input bus (dibuka lalu ditutup dengan "Batal"): header tanpa kotak ikon, kolom TOA aktif menampilkan satu cincin fokus, 0 teks < 12px.
- Tab Armada: 0 teks < 12px, 0 elemen terpotong; ikon bus di kartu unit kemudian dibuang.
- Menu profil: tampil normal; ikon item menu (navigasi) dipertahankan.
- Belum dilihat: halaman Monitoring, Manajemen Pengguna, dan Kelola Halaman (akun yang login ber-role PDO sehingga tidak punya akses).
