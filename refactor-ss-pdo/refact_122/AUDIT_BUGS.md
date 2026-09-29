# Audit Codex — Gerbang Fase 3 Batch 3.4

Tanggal: 29 September 2026  
Branch: `devmode`  
Sumber revisi: `refactor-ss-pdo/refact_121/`  
Keputusan: **PASS — BATCH 3.4 CLOSED**

## Matriks temuan

| ID | Lokasi | Keparahan | Deskripsi dan dampak user | Mitigasi terverifikasi | Status |
| --- | --- | --- | --- | --- | --- |
| R120-01 | `src/components/busCard/modal/singleFocus/SingleFocusKmRolloverBanner.tsx`, `src/index.css` | Sedang | Judul dan uraian saran rollover sebelumnya kurang terbaca di Light Mode; petugas berisiko salah membaca koreksi KM. | Token judul Light `#9a3412` dan isi `#171717` cocok dengan kode. Di atas latar komposit `#fdeee7`, rasionya 6,46:1 dan 15,85:1. Dark Mode 7,28:1 dan 13,36:1. Semua melewati AA teks normal. | CLOSED |
| R120-02 | `refactor-ss-pdo/refact_119/REPAIR_REPORT.md`; errata dan skrip di `refact_121/` | Rendah | Angka luminansi dan asumsi alpha lama tidak konsisten, sehingga bukti mutu sulit direproduksi. | `refact_121/evidence/contrast-verification.js` dijalankan ulang. Nilai `#d97706` = 0,2796, `#0f172a` = 0,0088, tombol = 5,60:1; chip Shift 1 dengan alpha CSS aktual 8% = 5,36:1. Arsip lama tetap utuh. | CLOSED |

## Hasil pemeriksaan independen

- Nilai warna dalam skrip bukti dibandingkan dengan `src/index.css` dan style komponen. Skrip memakai konstanta eksplisit, bukan membaca CSS secara otomatis; hasilnya sah untuk revisi ini, tetapi harus dihitung ulang bila token berubah.
- `node refactor-ss-pdo/refact_121/evidence/contrast-verification.js`: exit 0, hasil di atas sesuai laporan.
- `vitest run src/`: **88 file, 664 tes lulus**, exit 0. Happy DOM mencetak diagnostik pemuatan Google API saat tes auth, tanpa kegagalan tes.
- `tsc -b`: exit 0.
- `vite build`: exit 0, PWA generated. Peringatan ukuran chunk >500 kB adalah catatan performa yang sudah ada, bukan penahan batch ini.
- `oxlint` pada banner dan tes barunya: exit 0.
- Verifikasi visual pada perangkat/browser nyata tidak dilakukan pada audit ini; gerbang warna didasarkan pada token aktual dan perhitungan WCAG serta tes DOM.

Tidak ditemukan temuan penahan baru dalam lingkup revisi `refact_121`. Temuan global R80-10 tetap **PARTIAL** dan menjadi sasaran Batch 3.5 untuk alur Bus Input; modal lain tetap dilacak terpisah.
