# Desain: Warna Kartu Unit Berdasarkan Keterangan (Pengganti Target Ritase)

**Tanggal:** 07 November 2026
**Status:** Disetujui pemilik (sesi 07 Nov 2026), menunggu perintah eksekusi
**Dokumentasi refactor:** `refactor-ss-pdo/refact_209`

## 1. Latar Belakang & Keputusan

- Target ritase per rute **dibatalkan**. Analisis tab 1–5 sheet 18 rute November menunjukkan ritase unit **bergilir per slot keberangkatan setiap hari** (mis. JAK.89 10/10 → 9/9 → 8/9 bergeser 1 baris/hari; JAK.05 unit yang sama 6/6 ↔ 7/7). Satu angka target per rute selalu salah sebagian, dan mengatur komposisi harian menambah beban petugas.
- Penanda "unit bermasalah" yang dipakai di lapangan adalah **kolom keterangan** (baris berwarna di sheet hampir selalu berketerangan). Aplikasi memakai keterangan itu, **bukan** warna sel sheet (warna tiap rute berbeda-beda, membaca format sel menambah biaya API).
- Warna kartu mencerminkan **riwayat 1 hari penuh**: dihitung dari seluruh isi keterangan (S1 dan S2), **tidak** bergantung shift aktif, agar petugas shift lain tetap melihat histori masalah.
- Angka ritase di kartu **satu warna netral** untuk semua unit.

## 2. Klasifikasi Keterangan

Satu fungsi murni bersama, mis. `classifyUnitKeterangan(keterangan): UnitKeteranganStatus` di `src/utils/keteranganUtils.ts`.

| Status | Kondisi (pada bagian keterangan mana pun, S1 atau S2) | Warna |
|---|---|---|
| `TO` | `isUnitTo` (T.O / TO / T.O EVDAL / TO EVDAL, termasuk prefiks shift/BA) | Merah |
| `KENDALA` | Ada teks keterangan yang bukan OFF/LIBUR/T.O murni (BA02, NP, Service, Sakit, Perbaikan, dll.) | Oranye |
| `OFF_LIBUR` | `isUnitOff` (kata utuh OFF **atau LIBUR**) | Kuning |
| `NORMAL` | Keterangan kosong | — (tampilan normal) |

- **Prioritas** jika S1 dan S2 berbeda kategori: **TO > KENDALA > OFF_LIBUR**. Contoh: "S1: OFF | S2: BA02 Service" → `KENDALA`; "S1: NP1 | S2: T.O" → `TO`.
- Penilaian per bagian keterangan memakai `splitShiftKeterangan` yang sudah ada; keterangan tanpa prefiks shift dinilai utuh.
- Token pendek non-masalah yang sudah dianggap "status murni" oleh `hasMeaningfulNote` (`SO`, `SGO`) diperlakukan `NORMAL`.

### Perbaikan bug ikutan (wajib)
`isUnitOff` hanya mengenali "OFF". Banyak rute menulis **"LIBUR"** (JAK.01, 110A, 113, 117, 118, 15, 87, 88). Akibat saat ini: **Set Jumlah Trip mengisi trip ke unit LIBUR** dan unit LIBUR ikut dihitung di bar progres. `isUnitOff` diperluas mengenali kata utuh `LIBUR` (bukan substring), sehingga semua pemakai `isUnitOff`/`isUnitOffOrToEvdal` ikut benar. Dampak pada pemakai lain dianalisis & diuji (bulk trip, progres, salin KM, `detectTargetTrip`).

## 3. Tampilan Kartu

Berlaku di **kartu Input SS** (`BusCard`) dan **kartu halaman Armada** (`UnitCard`).

- **Garis tepi kiri + latar tipis** sesuai status, memakai token semantik baru di `src/styles/tokens/semantic.css` (light & dark) berbasis primitif yang ada:
  - `--color-unit-to-{bg,fg,border}` → red
  - `--color-unit-kendala-{bg,fg,border}` → orange
  - `--color-unit-off-{bg,fg,border}` → amber/kuning
  Pasangan `fg`/`bg` wajib lolos `color-contract.test.ts` (≥ 4.5:1) dan border ≥ 3:1 terhadap latar kartu, di kedua tema.
- **Badge kategori** di kepala kartu (OFF/LIBUR, T.O, KENDALA) dinilai dari keterangan **sepanjang hari** (bukan shift aktif) agar warna selalu punya penjelasan teks (WCAG 1.4.1: warna bukan satu-satunya penanda).
- **Strip keterangan** di bawah kartu tampil bila keterangan bermakna (aturan `hasMeaningfulNote`) **atau** memuat prefiks shift (S1:/S2:), agar jelas shift mana yang bermasalah. Status murni tanpa prefiks (mis. "OFF") tetap disembunyikan karena sudah diwakili badge.
- Latar abu-abu `bus-card-non-sgo` (berbasis shift aktif) **diganti** sistem warna ini; tidak ada dua sistem warna bertabrakan.
- Teks badge/strip lewat kamus `src/constants/texts/`.

## 4. Ritase Netral

- Kolom Ritase (kartu ALL), badge "Trip:" (mode fokus kolom trip), dan kartu Armada memakai satu warna netral (`--color-text-primary`; kosong = tampilan kosong yang sudah ada).
- Dihapus: perbandingan target, ikon ⚠️, kelas `status-warning`/`status-achieved` berbasis target, tooltip defisit/tercapai/tidak seimbang, dan fungsi `evaluateTripStatus` (refact_208) beserta test-nya.
- `detectTargetTrip` & `bulkPergi/bulkPulang` **tetap** dipakai hanya sebagai isian awal modal Set Jumlah Trip; prop `targetTrip` ke kartu dihapus.
- Kelas `status-kendala` lama (kata kunci laka/mogok/rusak/batal) digantikan klasifikasi baru (kata-kata itu masuk `KENDALA`).

## 5. Yang Tidak Berubah

- Kunci input per shift (`isBusNonOperational` / banner aktivasi), alur Satset, pengecualian OFF/TO EVDAL di Set Jumlah Trip & Set Trip Terpilih (kini juga LIBUR).
- Pembacaan & penulisan Google Sheets, termasuk pewarnaan baris sheet oleh `sheetColorUtils` (SSOT sheet, tidak disentuh).
- Tidak ada perubahan database / Edge Function.

## 6. Pengujian

- Unit test `classifyUnitKeterangan`: tiap kategori, variasi penulisan (T.O., TO EVDAL, Libur, OFF dalam kurung), prioritas lintas shift, `SO`/`SGO` = NORMAL, keterangan kosong.
- Unit test `isUnitOff` untuk LIBUR: regex kata utuh `\bLIBUR\b` (case-insensitive) → "LIBUR", "Libur", "S1: LIBUR" cocok; "LIBURAN" **tidak** cocok.
- Test Set Jumlah Trip: unit LIBUR dikosongkan/dilewati seperti OFF; progres tidak menghitung LIBUR.
- Test kartu `BusCard`/`UnitCard`: kelas/warna per kategori **tidak berubah ketika shift aktif berganti**; badge & strip muncul; ritase selalu warna netral.
- `pnpm vitest run src/styles/tokens/color-contract.test.ts` untuk token baru; 4 quality gate wajib.

## 7. Risiko & Batasan

- Unit libur yang hanya diwarnai merah di sheet **tanpa teks** (JAK.05 9, JAK.29 10, JAK.89 7, JAK.90 5 unit pada tab 1) tampil normal di aplikasi. Mitigasi operasional: kesepakatan lapangan menulis "LIBUR" di kolom keterangan.
- Perubahan `isUnitOff` memengaruhi beberapa alur sekaligus (progres, bulk trip, salin KM, status badge) — diuji eksplisit.
