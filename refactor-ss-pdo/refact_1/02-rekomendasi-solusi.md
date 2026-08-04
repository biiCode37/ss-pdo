# Rekomendasi Solusi — Proyek SS_PDO (Sistem Pencatatan Shift Bus)

**Jenis dokumen:** Rekomendasi perbaikan untuk tiap temuan di `01-daftar-masalah.md`
**Cara pakai:** ID solusi mengikuti ID bug yang sama (BUG-01, dst.) agar mudah dilacak silang.
**Catatan penting:** BUG-01, BUG-02, BUG-03, dan BUG-12 saling terkait erat (semuanya berpusat di mekanisme antrean offline) — lihat catatan "Kelompok Perbaikan" di akhir dokumen sebelum mengerjakan satu per satu.

---

## 🔴 KRITIS

### Solusi BUG-01 — Race condition di antrean sync
**Pendekatan yang direkomendasikan:** Ganti pola "baca snapshot di awal → proses → tulis snapshot di akhir" menjadi **read-modify-write atomik per-item**, tepat sebelum tiap penghapusan:
1. Setelah 1 item berhasil disinkronkan, **baca ulang `localStorage` saat itu juga** (bukan pakai `remainingQueue` yang sudah basi), lalu hapus HANYA item dengan `id` yang baru sukses dari daftar yang baru dibaca itu, baru simpan kembali.
2. Terapkan hal yang sama di `addToQueue`: gunakan `setQueue(prev => ...)` yang sudah benar (functional update) — pastikan tidak ada jalur lain yang menulis `localStorage` dari data basi.
3. **Opsi lebih tahan lama (direkomendasikan untuk jangka menengah):** migrasi penyimpanan antrean dari satu key `localStorage` berisi array besar, ke **IndexedDB** dengan satu record per item (`key = item.id`). Operasi tambah/hapus jadi granular per-record, sehingga race condition semacam ini secara struktural tidak mungkin terjadi lagi.
4. **Verifikasi:** buat skenario uji — antrekan 2 item, saat item pertama sedang diproses (dalam jeda 2 detik), panggil `addToQueue` untuk item ketiga; pastikan setelah proses selesai ketiga item (atau sisanya yang benar) tetap konsisten di `localStorage`.

### Solusi BUG-02 — Tidak ada deteksi konflik di jalur antrean offline
**Pendekatan:**
1. Tambahkan field `originalSnapshot: Partial<BusData>` ke interface `SyncItem`, diisi dari data `bus` (snapshot sebelum edit) saat `addToQueue` dipanggil.
2. Di `processQueue`, sebelum memanggil `updateBusData`, panggil `getBusRowData` lalu bandingkan terhadap `item.originalSnapshot` — persis logika `hasCollision` yang sudah ada di `BusCard.tsx`, cukup dipindah/di-reuse sebagai fungsi bersama (mis. `checkCollision()` diekspor dari `services/googleSheets.ts` agar tidak ada duplikasi logika).
3. Jika terdeteksi collision: **jangan** langsung force-overwrite maupun langsung digagalkan. Tandai item dengan status baru `'conflict'`, hentikan HANYA item itu (lanjutkan ke item lain di antrean — lihat Solusi BUG-03), dan munculkan notifikasi/badge yang meminta user membuka kembali baris terkait untuk memilih resolusi (Gunakan Data Server / Force Save), sama seperti alur simpan langsung.

### Solusi BUG-03 — Head-of-line blocking
**Pendekatan:**
1. Ubah `processQueue`: ganti `break` menjadi `continue` untuk error yang **bukan** auth, agar item lain di antrean tetap diproses.
2. Tambahkan `retryCount` ke `SyncItem`. Terapkan batas retry (mis. maksimal 5 kali) dengan backoff bertahap (mis. 2s → 5s → 15s → 60s), bukan jeda tetap 2 detik untuk semua kondisi.
3. Setelah batas retry terlampaui, set `status: 'failed'` (mengaktifkan BUG-12) dan **hentikan auto-retry otomatis** untuk item itu — biarkan tetap terlihat di UI dengan opsi manual "Coba Lagi" atau "Hapus dari Antrean".
4. Auth error (401) tetap harus menghentikan pemrosesan **untuk sisa item yang belum diproses** (karena semuanya pasti akan gagal juga), tapi WAJIB memicu state yang terlihat oleh user (mis. banner "Sesi berakhir — login ulang untuk melanjutkan sinkronisasi"), bukan berhenti diam-diam.
5. Perbaiki `BusCard.handleSave` agar tidak menganggap semua error non-auth sebagai "network error": periksa jenis error secara eksplisit — error jaringan asli (`!navigator.onLine`, `TypeError: Failed to fetch`) boleh masuk antrean; error dari Google API dengan kode status jelas (400/403/404) ditampilkan sebagai error permanen langsung ke user tanpa diam-diam diantrekan.

### Solusi BUG-04 — Tombol login macet permanen
**Pendekatan:**
1. Tambahkan opsi `error_callback` pada `google.accounts.oauth2.initTokenClient(...)` di `initGoogleApi`, yang menangkap semua kegagalan (popup ditutup, popup gagal terbuka, akses ditolak) dan memicu event terpisah, mis. `window.dispatchEvent(new CustomEvent('google-login-error', { detail: err }))`.
2. Di `signIn()`, tambahkan listener untuk event tersebut yang memanggil `reject(...)`, sehingga Promise selalu berakhir (resolve atau reject), tidak pernah menggantung.
3. Tambahkan **timeout pengaman** (mis. 60 detik) sebagai jaring pengaman terakhir jika Google tidak memberi respons apa pun — reject dengan pesan jelas, dan pastikan `LoginScreen` mengembalikan `isLoading` ke `false` di semua jalur (`finally` sudah benar, tinggal pastikan Promise benar-benar settle).
4. Uji dengan sengaja menutup popup Google di tengah proses login, pastikan tombol kembali bisa ditekan dan pesan error muncul.

### Solusi BUG-05 — Kegagalan silent per-kolom
**Pendekatan:**
1. Setelah `headerMap` terbentuk di `getBusData`, validasi seluruh field yang wajib ada (bukan cuma `unit`) — kumpulkan daftar field yang bernilai `-1`.
2. Jika ada yang tidak terdeteksi: tampilkan **warning yang jelas dan persisten** di UI (mis. banner kuning di atas `BusList`: "Kolom berikut tidak terdeteksi dan TIDAK akan tersimpan: KM Awal Shift 2. Hubungi admin untuk memperbaiki header sheet.") sebelum user mulai mengisi data, bukan gagal diam-diam saat simpan.
3. Opsional: nonaktifkan input untuk field yang kolomnya tak terdeteksi (dengan tooltip penjelasan), daripada membiarkan user mengisi data yang pasti tidak akan tersimpan.

---

## 🟠 SEDANG

### Solusi BUG-06 — False positive "Tabrakan Data"
**Pendekatan:** Ubah signature `useOfflineSync` agar menerima callback `onSyncSuccess(rowIndex, sheetId, tabName, updates)`, dipanggil oleh `processQueue` setiap satu item berhasil disinkronkan. Di `Dashboard.tsx`, teruskan `handleUpdateBus` sebagai callback ini — sama persis seperti yang sudah dilakukan di jalur simpan langsung — sehingga `busData` (dan `bus` prop tiap `BusCard`) selalu mencerminkan data terbaru yang benar-benar berhasil tersinkron, termasuk yang lewat antrean.

### Solusi BUG-07 — Field Manual Shift & Keterangan terkunci
**Pendekatan (pilih salah satu, sesuai kebutuhan bisnis — sebaiknya didiskusikan dengan pengguna akhir/petugas lapangan sebelum implementasi):**
- **Opsi A (rekomendasi default):** Kecualikan `manualShift1`, `manualShift2`, `keterangan` dari logika `isFieldDisabled` — field-field ini SELALU aktif diedit terlepas dari `activeCategory` yang dipilih, karena sifatnya pelengkap/catatan, bukan kolom kerja utama yang diisi bergilir.
- **Opsi B:** Tambahkan ketiganya sebagai chip kategori baru di `categories`, agar konsisten dengan pola filter kolom yang sudah ada.

### Solusi BUG-08 — Badge duplikat & styling rusak
**Pendekatan:**
1. Pilih satu sumber kebenaran untuk indikator antrean. Rekomendasi: **pertahankan badge inline di `Dashboard.tsx`** (sudah konsisten dengan sistem styling aplikasi via CSS variable), lalu **hapus** `<SyncQueueBadge />` dari `App.tsx`.
2. Jika detail modal (daftar item tertunda) dari `SyncQueueBadge` ingin dipertahankan, pindahkan fungsionalitas itu (bukan komponennya secara utuh) ke badge Dashboard — buat modal-nya dengan CSS inline/class yang sudah ada di `index.css`/`App.css`, **tanpa** menambah dependency Tailwind baru (agar tidak menambah bundle size untuk stack yang sudah dipilih tim).
3. Setelah BUG-12 selesai (status `'failed'` benar-benar dipakai), modal ini adalah tempat yang tepat untuk menampilkan item berstatus gagal secara berbeda (warna merah + tombol "Coba Lagi"/"Hapus").

### Solusi BUG-09 — Jendela kehilangan data pada debounce draft
**Pendekatan:** Tambahkan listener `visibilitychange` (kondisi `document.visibilityState === 'hidden'`) dan/atau `pagehide` di `BusCard.tsx` yang langsung menulis `formData` (state realtime, bukan `debouncedFormData`) ke `localStorage` secara sinkron — sebagai pengaman tambahan di luar mekanisme debounce normal, tanpa mengubah perilaku debounce yang sudah ada untuk kasus normal.

---

## 🟡 MINOR

### Solusi BUG-10 — Deteksi header rapuh
Tambahkan syarat tambahan sebelum suatu baris dianggap header: mayoritas sel di baris itu berupa teks pendek (bukan angka murni), dan/atau sediakan **override manual** di UI (dropdown "Baris keberapa header-nya?") sebagai fallback jika auto-detect terbukti salah untuk sheet tertentu.

### Solusi BUG-11 — Tidak ada refresh token otomatis
Tambahkan timer yang mengecek `expiresAt` tersimpan secara berkala (mis. tiap 5 menit); beberapa menit sebelum kedaluwarsa, coba `requestAccessToken({ prompt: '' })` (silent refresh) di latar belakang. Jika gagal, tampilkan notifikasi halus (bukan mengganggu) yang mengajak user login ulang sebelum sesi benar-benar habis.

### Solusi BUG-12 — Status `'failed'` tak terpakai
Diselesaikan sebagai bagian dari **Solusi BUG-03** (retry counter + status transition ke `'failed'`). Tidak perlu solusi terpisah — cukup pastikan status ini benar-benar di-*set* dan dibaca oleh UI (badge & modal).

### Solusi BUG-13 — Rute duplikat
Di `saveNewRoute`, tambahkan pengecekan `savedRoutes.some(r => extractSheetId(r.url) === sheetId)` sebelum menyimpan; jika sudah ada, tampilkan pesan informatif alih-alih menambah duplikat.

### Solusi BUG-14 — Pull-to-refresh tanpa cek online
Di `handleTouchEnd`, tambahkan pengecekan `isOnline` sebelum memanggil `handleLoadData(true)`; jika offline, tampilkan pesan singkat ("Tidak bisa refresh saat offline") tanpa memicu request yang pasti gagal.

### Solusi BUG-15 — Double-init akibat StrictMode
Tidak wajib diperbaiki (perilaku ini hanya muncul di mode development, bukan production build). Jika ingin dirapikan: tambahkan guard sederhana (mis. `useRef` flag) di `initializeApi` agar hanya benar-benar berjalan sekali meski effect terpanggil dua kali. Prioritas rendah.

### Solusi BUG-16 — Persentase progres ambigu
Tambahkan label dinamis: saat `activeCategory !== 'ALL'`, ubah teks menjadi mis. "Progres Kolom: KM Awal S1" alih-alih "Progres Harian", agar makna angka yang ditampilkan tidak disalahartikan.

---

## Kelompok Perbaikan (untuk perencanaan implementasi)

Karena saling berkaitan erat secara teknis, kelompok berikut **sebaiknya dikerjakan sebagai satu unit kerja**, bukan terpisah-pisah, untuk menghindari kondisi antara yang justru menambah inkonsistensi baru:

- **Kelompok Antrean Offline:** BUG-01, BUG-02, BUG-03, BUG-06, BUG-12 (semuanya berpusat pada `useOfflineSync.ts` dan bagaimana `BusCard`/`Dashboard` berinteraksi dengannya).
- **Kelompok Autentikasi:** BUG-04, BUG-11 (keduanya di `services/googleSheets.ts` seputar siklus hidup token).
- **Independen (boleh dikerjakan kapan saja, terpisah):** BUG-05, BUG-07, BUG-08, BUG-09, BUG-10, BUG-13, BUG-14, BUG-15, BUG-16.
