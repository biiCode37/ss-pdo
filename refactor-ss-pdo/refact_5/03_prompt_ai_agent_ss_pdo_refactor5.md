# Refactor 5 — Prompt untuk AI Agent Code

Dokumen ini adalah instruksi kerja untuk AI agent yang akan mengimplementasikan semua solusi dari dokumen solusi.

## Misi
Refactor repo `ss-pdo` branch `production` agar:
- identitas sheet/rute konsisten,
- auth state valid dan tidak optimistis,
- akumulasi dan analytics tidak salah baca,
- offline queue dan draft lebih aman,
- UI mobile tidak gampang rusak saat refactor berikutnya.

## Aturan kerja
1. Jangan ubah perilaku yang sudah benar kecuali memang dibutuhkan untuk memperbaiki bug.
2. Jangan memakai substring match untuk identitas unik.
3. Jangan menyembunyikan error penting di balik fallback diam-diam.
4. Jangan menimpa data user tanpa snapshot yang jelas.
5. Jangan memindahkan bug dari satu layer ke layer lain.
6. Semua fallback harus punya status yang bisa dibedakan di UI.
7. Semua helper yang menyangkut identitas, parsing, cache, dan status harus dipusatkan.
8. Semua perubahan harus kompatibel dengan pola React + TypeScript yang sudah ada.
9. Hindari membuat duplikasi logika baru di komponen lain.
10. Kalau ada keputusan yang bisa memengaruhi data user, pilih opsi yang paling aman.

## Batasan
- Jangan mengubah schema database kecuali benar-benar wajib.
- Jangan menghapus fitur offline-first.
- Jangan memecah API publik komponen tanpa alasan kuat.
- Jangan mengganti stack utama.
- Jangan menambah dependency baru kalau helper internal cukup.
- Jangan mengandalkan localStorage sebagai satu-satunya sumber kebenaran untuk data penting.
- Jangan membuat UI baru yang mengaburkan status error, cache, atau konflik.

## Ketentuan teknis wajib
- Buat helper tunggal untuk:
  - parsing spreadsheet ID / URL
  - matching route sheet
  - metadata cache
  - state auth
  - normalisasi error status
- Ganti semua pemakaian `includes()` pada identitas unik dengan compare canonical.
- Tambahkan struktur status yang eksplisit untuk:
  - live
  - cache
  - partial
  - error
  - conflict
  - pending
  - failed
- Pertahankan data lokal user selama mungkin.
- Pastikan data gagal tidak berubah menjadi angka nol palsu.
- Pastikan UI menjelaskan ketika app sedang memakai cache atau fallback.
- Pastikan selector rute tidak mengosongkan state tanpa recovery.
- Pastikan login tidak lolos bila session rusak.

## Langkah implementasi
### Tahap 1 — Fondasi
- Audit semua helper identitas dan auth.
- Pusatkan parser URL dan sheet ID.
- Pusatkan status result dan error model.

### Tahap 2 — Routing & selector
- Perbaiki matching route-sheet.
- Hapus matching berbasis substring untuk state penting.
- Tambahkan fallback UI yang jelas.

### Tahap 3 — Auth
- Perbaiki `checkSignedIn`.
- Pastikan token validasi sinkron sebelum app dianggap login.
- Bedakan auth invalid dan akses data ditolak.

### Tahap 4 — Offline queue
- Perkuat penyimpanan queue dan draft.
- Tambahkan backup/pemulihan bila memungkinkan.
- Pertahankan konflik, pending, failed, dan retry sebagai state yang jelas.

### Tahap 5 — Analytics & akumulasi
- Perbaiki fallback akumulasi multi-hari.
- Bedakan error total vs partial.
- Perbaiki trend chart agar tidak mengubah error menjadi nol.

### Tahap 6 — UX mobile
- Ganti dependency gesture pada class selector rapuh dengan data attribute / prop eksplisit.
- Pastikan komponen baru bisa opt-out dari swipe tanpa ubah core gesture.

## Format output yang diminta
Untuk setiap perubahan:
- jelaskan file yang diubah,
- jelaskan alasan perubahan,
- jelaskan dampak ke user,
- tampilkan risiko yang masih tersisa,
- sertakan catatan test manual yang perlu dilakukan.

## Acceptance criteria
- User tidak bisa masuk ke UI utama kalau auth memang rusak.
- Sheet / route / tab yang dipilih selalu konsisten.
- Akumulasi dan trend tidak salah walau fallback terjadi.
- Data cache dan data live bisa dibedakan di UI.
- Draft dan queue lebih tahan gangguan storage.
- Gesture mobile tetap aman setelah refactor.
- Tidak ada fallback diam-diam yang menipu user.

## Urutan pengerjaan yang disarankan
1. Fondasi helper dan auth
2. Routing / selector / cache identity
3. Accumulation / analytics
4. Offline queue / draft
5. Gesture / mobile UX
6. Final cleanup dan test manual

## Output akhir yang diharapkan
- repo tetap build
- fitur inti tetap jalan
- bug paling terasa user berkurang drastis
- kode lebih mudah di-refactor lagi pada fase berikutnya