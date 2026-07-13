# Improvement v1.2 Design Spec (Keamanan & Validasi)

**Date**: 2026-07-13
**Topic**: Improvement v1.2 - Security, Validation & Error Handling

## Context & Purpose
Versi 1.2 berfokus pada peningkatkan keandalan aplikasi PDO Mobile dengan meminimalisir potensi kesalahan manusia (*human error*) dari sisi input personil lapangan, serta mencegah kesalahan sistem (*system error*) dan kerentanan keamanan yang disebabkan oleh manajemen kredensial dan kelebihan kuota API Google Sheets.

## Core Architecture & Changes

### 1. Validasi Logika Input (Mencegah *Human Error*)
Kita akan menambahkan *guardrails* atau batas-batas logika pada form input sebelum data bisa disimpan.
* **Validasi Numerik & Kondisional**: 
  * Nilai `kmAkhir1` (KM Akhir Shift 1) **wajib \>=** `kmAwal1`.
  * Nilai `kmAkhir2` (KM Akhir Shift 2) **wajib \>=** `kmAwal2`.
* **Validasi Lintas Shift & UI Enabler**:
  * Nilai `kmAwal2` **wajib \>=** `kmAkhir1`.
  * **[Fitur Baru]**: Menambahkan tombol UI "Salin KM Akhir Shift 1" di dekat form `kmAwal2`. Saat di-tap, tombol ini akan mengambil nilai `kmAkhir1` yang sudah tersimpan sebelumnya/yang sedang ada di form, dan mengisi form `kmAwal2` secara otomatis. Jika tidak di-tap, user bebas memasukkan angka selama memenuhi validasi \>= `kmAkhir1`.
* **Error Handling UI**: Jika validasi gagal, tombol "Simpan" tidak akan memproses pengiriman data, melainkan menampilkan pesan error/notifikasi (misal: tulisan merah di bawah input yang salah).

### 2. Pencegahan Spam & Kuota API (*System Rate Limiting*)
* **Disable Double-Submit**: Saat tombol "Simpan" ditekan, *state* tombol akan berubah menjadi *loading* (terkunci) sampai *request* selesai (berhasil masuk *queue* offline atau sukses ke API). Ini mencegah *user* mengetuk tombol berkali-kali secara membabi-buta saat koneksi *lag*.
* **Sync Debouncing**: Di dalam arsitektur Auto-Sync (v1.1), proses eksekusi antrean (`PDO_SYNC_QUEUE`) akan diberikan jeda/interval (misalnya 1-2 detik antar *request*) sehingga tidak menembak API Google Sheets serentak sekaligus untuk mencegah *Error 429 Too Many Requests*.

### 3. Keamanan Sesi & Kredensial (*Security*)
* **Migrasi ke Environment Variables (Opsi A)**: 
  * Menghapus ketergantungan pada `localStorage.getItem('GAPI_CLIENT_ID')` dan `localStorage.getItem('GAPI_API_KEY')`.
  * Memindahkan kredensial ke dalam file `.env` sebagai `VITE_GAPI_CLIENT_ID` dan `VITE_GAPI_API_KEY`.
  * Kode di `src/services/googleSheets.ts` akan diubah untuk membaca nilai dari `import.meta.env`.
* **Pembersihan UI**: Menghapus form/UI yang sebelumnya meminta *user* memasukkan API Key secara manual. 
* **Syarat Pasca-Implementasi (Developer Note)**: Di sisi Google Cloud Console, developer *wajib* mengunci API Key dengan membatasi *HTTP Referrers* ke URL domain *production* PDO Mobile.

### 4. Resolusi Konflik Sinkronisasi Offline (*Data Integrity*)
* Untuk mencegah antrean data yang sudah terlampau lama *(stale)* menimpa data baru di Sheets, kita dapat memprioritaskan validasi bahwa data yang dikirim adalah yang paling relevan (berdasarkan waktu). (Note: Ini akan berjalan secara beriringan dengan mekanisme `updateBusData` yang ada di v1.1).

## Scope Check
Semua fitur ini sangat terpusat di form (komponen UI input), state management tombol simpan, dan modifikasi kecil di `googleSheets.ts`. Sangat aman dan terukur untuk dieksekusi dalam satu rencana implementasi (*implementation plan*).
