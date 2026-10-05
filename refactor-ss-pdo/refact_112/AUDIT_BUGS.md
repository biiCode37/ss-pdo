# Audit Codex — Fase 3 Batch 3.2 Final

**Branch:** `devmode`  
**Keputusan:** `PASS` untuk Batch 3.2; Batch 3.3 dapat dimulai.  
**Objek review:** implementasi dan bukti Gemini pada `refact_111`.

## R110-01 — Pembersihan rollover menghapus error lain: CLOSED

- **Lokasi kode:** `src/components/busCard/modal/useBusInputForm.ts:273-282`; uji `src/components/busCard/modal/useBusInputForm.test.tsx:694-819`.
- **Keparahan awal:** Sedang.
- **Deskripsi:** Filter lama memakai fragmen kalimat umum dan ikut menghapus error KM pair yang masih berlaku.
- **Dampak user awal:** Form sempat tampak bebas error walau KM Akhir lebih kecil daripada KM Awal sesudah rollover.
- **Mitigasi terverifikasi:** Pesan lintas hari aktif diambil sebelum perubahan odometer, lalu hanya pesan yang cocok persis dihapus. Tes campuran membuktikan error KM pair dan TOA bertahan, submit ditolak sampai nilai diperbaiki. Tes kesamaan KM dua shift dari R108-01 tetap lulus.

## R110-02 — Klaim preservasi error pada laporan lama: CLOSED

- **Lokasi dokumen:** `refactor-ss-pdo/refact_109/REPAIR_REPORT.md` dan errata `refactor-ss-pdo/refact_111/AUDIT_BUGS.md`.
- **Keparahan awal:** Rendah.
- **Deskripsi:** Klaim sebelumnya melampaui perilaku kode yang saat itu memakai filter substring.
- **Dampak user/tim:** Kesimpulan audit dapat menyesatkan keputusan rilis.
- **Mitigasi terverifikasi:** Errata dan bukti tes campuran dicatat di `refact_111` tanpa mengubah arsip terdahulu.

## R112-01 — Angka pada error KM pair tidak disegarkan sesudah rollover: TRACKED Batch 3.3

- **Lokasi kode:** `src/components/busCard/modal/useBusInputForm.ts:273-280`, validator KM pair pada `:421-426` dan `:483-488`; uji `useBusInputForm.test.tsx:694-748`.
- **Keparahan:** Rendah (ketepatan umpan balik form; validasi simpan tetap menolak nilai salah).
- **Deskripsi:** Rollover mengubah KM Awal `292003` menjadi `293003`, tetapi error KM pair yang dipertahankan masih menyebut KM Awal lama `292003` sampai submit berikutnya. Tes saat ini memastikan error bertahan, belum memastikan isi pesannya diperbarui.
- **Dampak user:** Petugas dapat membaca angka acuan yang sudah usang saat memperbaiki KM Akhir.
- **Mitigasi:** Dalam ekstraksi validasi Batch 3.3, segarkan error yang masih berlaku dari state baru setelah rollover. Error lintas hari yang sudah terselesaikan harus hilang, sedangkan KM pair/TOA tetap ada dengan angka terkini. Tambahkan tes nilai pesan sebelum dan sesudah rollover. Jangan memperluas perubahan di luar jalur validasi.

## Gerbang review independen

- `pnpm run test`: **84 berkas, 622 tes lulus**, exit 0.
- `pnpm run build`: exit 0; hanya peringatan ukuran chunk Vite.
- Lint terarah pada kode terkait: exit 0.
- Review kode dan dokumen `refact_111`: koreksi R110-01 sesuai hasil uji. R112-01 dicatat untuk batch validasi berikutnya dan tidak menghalangi gerbang Batch 3.2.
