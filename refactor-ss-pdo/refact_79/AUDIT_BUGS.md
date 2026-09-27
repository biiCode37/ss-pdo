# Audit awal arsitektur dan reuse UI — Refact 79

Tanggal: 27 September 2026. Auditor: Codex (orchestrator). Branch: `devmode`.

Ruang lingkup: pemetaan statis untuk merancang fase kerja Gemini. Ini belum audit visual seluruh layar dan belum audit lengkap seluruh logika bisnis. Jumlah baris menghitung baris fisik termasuk baris kosong; daftar lengkap tersedia di `evidence/source-inventory.csv`.

Semua temuan kode di bawah berstatus **OPEN** pada serah tugas ini. Bukti statis dibedakan dari dampak yang masih perlu dibuktikan melalui interaksi. Perbaikan menjadi tugas executor pada fase yang ditetapkan.

## R79-01 — Hook form memusatkan banyak tanggung jawab

- **Lokasi:** `src/components/busCard/modal/useBusInputForm.ts:40`, state sejak baris 75, event input sekitar 432, kalkulasi sekitar 462, validasi/submit 608, return 888; total 969 baris.
- **Keparahan:** Tinggi untuk pemeliharaan dan risiko regresi.
- **Deskripsi:** satu hook menangani draft field, pemilihan mode, prefill odometer, interaksi keyboard, derivasi, validasi, payload, dan penyimpanan. Shift 1/2 menerima seluruh `BusInputFormReturn`.
- **Dampak user:** perubahan kecil pada salah satu alur berisiko memengaruhi alur lain. Ini risiko struktural terkonfirmasi dari tanggung jawab kode, bukan bukti semua alur saat ini gagal.
- **Mitigasi:** petakan kepemilikan state dan invariant, pisahkan perhitungan/validasi murni dan interaksi dengan kontrak kecil. Jaga satu sumber draft dan perilaku pergantian bus/tanggal. Fase 3.

## R79-02 — Gaya kontrol Shift 1 dan Shift 2 diduplikasi

- **Lokasi:** `src/components/busCard/modal/BusInputModalShift1.tsx:42` dan `BusInputModalShift2.tsx:49`; `heroInputStyle`, `secondaryInputStyle`, dan `getChipStyle`.
- **Keparahan:** Sedang.
- **Deskripsi:** kedua file memiliki aturan gaya statis input/chip yang sama, sementara logika TOA dan odometer masing-masing shift berbeda.
- **Dampak user:** perbaikan kontras, ukuran, atau fokus di satu tempat berpotensi tidak terbawa ke shift lain.
- **Mitigasi:** pilot pemusatan style/token dan komponen field dengan props sempit. Pertahankan aturan domain per shift. Buktikan hasil pada dua konsumen sebelum memperluas abstraksi. Fase 2.

## R79-03 — Kontrak modal belum seragam

- **Lokasi:** `src/components/busCard/BusInputModal.tsx:59`, `src/components/pdoReport/ReportModalLayout.tsx:30`, `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx:93`.
- **Keparahan:** Sedang.
- **Deskripsi:** BusInputModal memakai portal, Escape, body scroll lock, dan z-index 99999; ReportModalLayout memakai portal, mobile-back handler, serta pemulihan overflow sebelumnya; modal detail monitoring memakai overlay lokal z-index 1000 tanpa implementasi Escape/scroll-lock/focus management di file tersebut. Perbedaan kontrak terkonfirmasi; seluruh efek runtime di parent belum diaudit.
- **Dampak user:** berisiko terjadi perbedaan perilaku tutup, scroll halaman, urutan overlay, dan navigasi fokus antarfitur.
- **Mitigasi:** audit parent dan modal bertumpuk; tentukan kontrak fokus awal, trap/restore fokus, Escape, back mobile, dismiss, scroll lock, accessible name, serta keyboard viewport. Ekstrak shell setelah kontrak diuji. Fase 2–5.

## R79-04 — CSS global besar dan aturan visual tersebar

- **Lokasi:** `src/index.css:3` (token), `:253` (button), `:288` (form), dan komponen dalam inventory; total CSS 2.165 baris.
- **Keparahan:** Sedang.
- **Deskripsi:** fondasi global dan selector fitur berada dalam satu CSS; terdapat 1.472 kemunculan `style={` di komponen non-test, termasuk duplikasi R79-02. CSS sudah memiliki token warna dua tema, sehingga fondasinya dapat dikembangkan.
- **Dampak user:** perubahan gaya lintas fitur sulit ditelusuri dan rawan hasil berbeda. Jumlah inline style saja tidak membuktikan cacat visual.
- **Mitigasi:** petakan selector/pemakai dan cascade; pisahkan kepemilikan secara bertahap; pusatkan aturan statis berulang; pertahankan style yang benar-benar dinamis. File CSS sedang memiliki perubahan lokal, wajib direkonsiliasi. Fase 2 dan 5.

## R79-05 — Fallback ritase membulatkan trip ganjil

- **Lokasi:** `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx:70`, ekspresi `Math.round(route.totalTrips / 2)` pada baris 73; hasil ditampilkan pada baris 679.
- **Keparahan:** Tinggi untuk akurasi angka, dengan pemicu bersyarat.
- **Deskripsi:** ketika `totalRitasePp` tidak tersedia, 101 trip menghasilkan 51 ritase; aturan domain menetapkan 50,5 ritase PP. Nilai `totalRitasePp` yang tersedia tetap diprioritaskan oleh kode. Temuan terkonfirmasi secara statis; frekuensi terjadinya fallback pada data nyata belum diperiksa.
- **Dampak user:** ringkasan ritase dapat lebih besar 0,5 rit pada total trip ganjil, dan nilai turunannya dapat ikut berbeda.
- **Mitigasi:** pertahankan presisi hasil pembagian, verifikasi sumber nilai dan format, telusuri pola serupa, tambahkan tes trip ganjil/genap/nol dan prioritas sumber. Kerjakan sebagai koreksi domain terpisah dari perubahan layout, sebelum migrasi metrik. Fase 2.

## R79-06 — Label error masih ditulis langsung di hook

- **Lokasi:** `src/components/busCard/modal/useBusInputForm.ts:757` (`"TOA Shift 2"`) dan `:767` (`"Shift 2"`); `src/utils/modals/busInput/busModalValidation.ts:178` meneruskan label ke template error kamus.
- **Keparahan:** Sedang.
- **Deskripsi:** sebagian label validasi sudah mengambil kamus, sebagian berupa literal yang akhirnya tampil dalam pesan user. Ini berbeda dari kode teknis seperti union `"shift2"` yang bukan teks UI.
- **Dampak user:** pengubahan istilah di kamus belum tentu memperbarui seluruh pesan error.
- **Mitigasi:** gunakan entri kamus yang relevan, tambahkan entri hanya jika belum ada dan uji integritasnya; telusuri seluruh label yang mengalir ke pesan UI. Fase 2–3, inventaris menyeluruh pada Fase 1.

## R79-07 — Dokumen arsitektur lama perlu diverifikasi ulang

- **Lokasi:** `roadmap-to-production-grade/roadmap-menuju-production-grade 1.md` bagian Kualitas Kode; `graphify-out/GRAPH_REPORT.md:12`; `package.json`; `tsconfig.app.json`.
- **Keparahan:** Rendah untuk proses perencanaan.
- **Deskripsi:** roadmap lama menyebut belum ada test runner dan strict mode, sedangkan kode saat ini sudah memiliki keduanya. Graf menyebut commit berbeda dari HEAD audit.
- **Dampak user:** executor dapat mengulang pekerjaan yang sudah selesai atau merancang perubahan berdasar struktur lama.
- **Mitigasi:** gunakan sumber terkini dan inventory baru sebagai baseline. Pertahankan dokumen historis; tandai referensi yang perlu validasi dalam laporan baru. Update graf setelah perubahan kode sesuai aturan proyek.

## Catatan yang tidak dihitung sebagai bug

- Facade kecil seperti `src/components/BusCard.tsx` dan `AllRouteMonitoringPage.tsx` adalah re-export ke folder fitur. Tidak ada dasar untuk menyatakan file tersebut duplikasi implementasi atau harus dihapus tanpa audit pemanggil.
- `Skeletons.tsx`, kamus domain, folder fitur, helper angka, dan test yang sudah ada merupakan kandidat reuse sebelum membuat versi baru.
- File besar lain pada inventory merupakan kandidat audit Fase 1. Panjang file belum membuktikan seluruh isinya perlu dipisah dengan pola yang sama.
- Tidak ada klaim audit keamanan/backend lengkap atau kelulusan visual berdasarkan pemeriksaan statis ini.
