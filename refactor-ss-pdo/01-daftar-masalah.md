# Daftar Masalah — Proyek SS_PDO (Sistem Pencatatan Shift Bus)

**Repo:** github.com/biiCode37/ss-pdo
**Jenis dokumen:** Katalog bug/kekurangan hasil audit kode
**Terkait dengan:** `02-rekomendasi-solusi.md`, `03-aturan-ai-agent.md` (gunakan ID yang sama sebagai referensi silang di ketiga dokumen ini)

Setiap temuan diberi ID unik (BUG-01 s.d. BUG-16) yang dipakai konsisten di seluruh dokumen pendukung.

---

## Ringkasan

| ID | Judul Singkat | Severity | Lokasi Utama |
|---|---|---|---|
| BUG-01 | Race condition di antrean sync menghapus edit terbaru | 🔴 Kritis | `hooks/useOfflineSync.ts` |
| BUG-02 | Antrean offline tidak punya deteksi konflik/collision | 🔴 Kritis | `hooks/useOfflineSync.ts` |
| BUG-03 | Head-of-line blocking — 1 error blokir semua antrean | 🔴 Kritis | `hooks/useOfflineSync.ts`, `components/BusCard.tsx` |
| BUG-04 | Tombol login macet permanen jika popup Google ditutup | 🔴 Kritis | `services/googleSheets.ts`, `components/LoginScreen.tsx` |
| BUG-05 | Kegagalan silent per-kolom saat header sheet tak cocok | 🔴 Kritis | `services/googleSheets.ts` |
| BUG-06 | False positive "Tabrakan Data" usai sync offline sukses | 🟠 Sedang | `components/BusCard.tsx`, `components/Dashboard.tsx` |
| BUG-07 | Field Manual Shift 1/2 & Keterangan terkunci di mode filter kategori | 🟠 Sedang | `components/BusCard.tsx`, `components/BusList.tsx` |
| BUG-08 | Badge antrean duplikat + styling rusak (Tailwind tak terpasang) | 🟠 Sedang | `components/SyncQueueBadge.tsx`, `App.tsx` |
| BUG-09 | Jendela kehilangan data <1 detik pada auto-save draft | 🟠 Sedang | `hooks/useDebounce.ts`, `components/BusCard.tsx` |
| BUG-10 | Deteksi baris header rapuh (fuzzy substring match) | 🟡 Minor | `services/googleSheets.ts` |
| BUG-11 | Tidak ada refresh token otomatis / deteksi kedaluwarsa proaktif | 🟡 Minor | `services/googleSheets.ts` |
| BUG-12 | Status `'failed'` pada SyncItem didefinisikan tapi tak pernah dipakai | 🟡 Minor | `hooks/useOfflineSync.ts` |
| BUG-13 | Rute (Google Sheet) duplikat tidak dicegah saat disimpan | 🟡 Minor | `components/Dashboard.tsx` |
| BUG-14 | Pull-to-refresh tidak memeriksa status online | 🟡 Minor | `components/Dashboard.tsx` |
| BUG-15 | `StrictMode` memicu init API dua kali saat development | 🟡 Minor | `main.tsx`, `App.tsx` |
| BUG-16 | Persentase "Progres Harian" ambigu saat filter kategori aktif | 🟡 Minor | `components/BusList.tsx` |

---

## 🔴 KRITIS

### BUG-01 — Race condition di antrean sync menghapus edit terbaru
**Lokasi:** `hooks/useOfflineSync.ts`, fungsi `processQueue` (± baris 51–90)
**Deskripsi:** `processQueue` mengambil snapshot antrean dari `localStorage` sekali di awal (`currentQueue`), lalu menyimpan hasilnya lewat `saveQueue(remainingQueue)` setiap satu item sukses disinkronkan. Karena setiap sinkronisasi antar-item punya jeda 2 detik, sementara `remainingQueue` adalah variabel lokal yang tidak pernah membaca ulang state terbaru.
**Root cause:** Jika `addToQueue` dipanggil (user mengedit baris apa pun) *selama* jeda tersebut, item baru itu memang sempat masuk ke `localStorage`/state — tapi begitu iterasi berikutnya selesai dan `saveQueue(remainingQueue)` dipanggil lagi, seluruh isi `localStorage` **ditimpa** oleh snapshot lama yang tidak mengenal item baru itu.
**Dampak ke user:** Edit yang baru saja dilakukan bisa hilang tanpa jejak, tanpa pesan error apa pun — bertentangan langsung dengan klaim CHANGELOG v1.3.0 bahwa data yang sudah "masuk queue" aman dari kehilangan.
**Skenario reproduksi:** Ada ≥2 item di antrean → mulai proses sync → di tengah jeda 2 detik, edit ulang salah satu baris (baik yang sedang diproses maupun baris lain) → setelah sync selesai, cek `localStorage.PDO_SYNC_QUEUE`, edit terbaru tersebut hilang.

### BUG-02 — Antrean offline tidak punya deteksi konflik/collision
**Lokasi:** `hooks/useOfflineSync.ts` (`processQueue` memanggil `updateBusData` langsung) vs `components/BusCard.tsx` (`handleSave`, pre-flight check via `getBusRowData`)
**Deskripsi:** Fitur "Optimistic Concurrency Control" (CHANGELOG v1.4.0) hanya berjalan di jalur simpan langsung. Jalur antrean offline (`processQueue`) tidak pernah memanggil `getBusRowData` untuk membandingkan data server sebelum menulis.
**Root cause:** Fitur collision-check ditambahkan belakangan (v1.4.0) tanpa mengintegrasikannya ke mekanisme antrean yang sudah ada sejak v1.3.0.
**Dampak ke user:** Setiap edit yang sempat masuk antrean (karena offline atau error apa pun — lihat BUG-03) berpotensi menimpa perubahan rekan kerja lain tanpa peringatan sama sekali — justru pada skenario sinyal buruk yang menjadi nilai jual utama aplikasi.

### BUG-03 — Head-of-line blocking: satu error memblokir seluruh antrean permanen
**Lokasi:** `hooks/useOfflineSync.ts` (`processQueue`, blok `catch` ± baris 79–86); `components/BusCard.tsx` (`handleSave`, blok `catch` ± baris 177–188)
**Deskripsi:** Loop `processQueue` melakukan `break` untuk **error apa pun**, bukan hanya error auth. Di sisi lain, `BusCard.handleSave` menganggap **semua error yang bukan auth** sebagai "masalah jaringan" lalu otomatis memasukkannya ke antrean — termasuk error permanen (403 permission, baris terhapus, range tidak valid).
**Dampak ke user:** Sekali ada satu item yang gagal permanen, seluruh antrean berhenti diproses selamanya. Setiap kali perangkat online lagi, proses akan mengulang item bermasalah yang sama lalu berhenti lagi — badge "N Tertunda" macet tanpa pesan apa pun yang menjelaskan penyebabnya.

### BUG-04 — Tombol login macet permanen (infinite spinner) jika popup Google ditutup
**Lokasi:** `services/googleSheets.ts`, fungsi `signIn` (± baris 61–77) dan `initGoogleApi` (`initTokenClient`, ± baris 34–48); `components/LoginScreen.tsx` (± baris 14–28)
**Deskripsi:** `signIn()` hanya me-resolve Promise lewat event `google-login-success`. `initTokenClient` tidak diberi opsi `error_callback`.
**Root cause:** Jika user menutup/membatalkan popup OAuth (aksi yang sangat wajar terjadi), tidak ada event apa pun yang dipicu — Promise `signIn()` menggantung selamanya.
**Dampak ke user:** `isLoading` macet `true` selamanya, tombol "Sign In with Google" berputar tanpa henti, satu-satunya jalan keluar adalah reload halaman penuh. Menariknya, `LoginScreen.tsx` sudah punya logika untuk menangani `err.error === 'popup_closed_by_user'`, tapi kondisi ini tidak pernah benar-benar tercapai — dead code.

### BUG-05 — Kegagalan silent per-kolom saat header sheet tidak terdeteksi
**Lokasi:** `services/googleSheets.ts`, fungsi `getBusData` (deteksi header ± baris 180–247) dan `updateBusData`/`addUpdate` (± baris 351–371)
**Deskripsi:** Hanya kolom "Unit" yang divalidasi keberadaannya (lempar error jika tak ketemu). 9 kolom data lain (TOA, KM Awal/Akhir, Manual Shift, Keterangan) tidak divalidasi.
**Root cause:** `addUpdate` di `updateBusData` diam-diam melewati (skip) kolom mana pun yang `headerMap[key] === -1`.
**Dampak ke user:** Jika penulisan header di sheet sedikit berbeda dari kata kunci yang diantisipasi kode, form tetap menampilkan "Tersimpan!" sukses — padahal data pada kolom tersebut **tidak pernah** benar-benar tertulis ke spreadsheet. Tidak ada peringatan ke petugas maupun admin; baru ketahuan saat rekap bulanan.

---

## 🟠 SEDANG

### BUG-06 — False positive "Tabrakan Data" untuk perubahan milik sendiri
**Lokasi:** `components/BusCard.tsx` (pre-flight check ± baris 144–166); `components/Dashboard.tsx` (`handleUpdateBus`, ± baris 147–154, hanya dipanggil dari jalur sukses langsung)
**Deskripsi:** Saat sinkronisasi lewat antrean berhasil di latar belakang, `busData` di `Dashboard` tidak pernah diperbarui (karena `onUpdateBus` tak dipanggil dari `processQueue`).
**Dampak ke user:** Percobaan edit berikutnya pada baris yang sama memicu modal "⚠️ Petugas lain baru saja mengubah data bus ini" — padahal perubahan itu adalah hasil sinkronisasi milik user sendiri. Membingungkan dan mengikis kepercayaan pada fitur deteksi konflik.

### BUG-07 — Field Manual Shift 1/2 & Keterangan tak bisa diedit dalam mode filter kategori
**Lokasi:** `components/BusList.tsx` (array `categories`, ± baris 25–33); `components/BusCard.tsx` (`isFieldDisabled`, ± baris 214–218)
**Deskripsi:** Daftar `categories` hanya memuat 6 kolom (TOA S1, Total TOA, KM Awal/Akhir S1/S2) — tidak ada entri untuk `manualShift1`, `manualShift2`, `keterangan`. `isFieldDisabled` men-disable semua field yang bukan `activeCategory` terpilih saat mode bukan "ALL".
**Dampak ke user:** Begitu petugas memilih mode entri cepat per kolom (mis. chip "KM Awal S1" untuk input massal), field Manual Shift 1/2 dan Keterangan otomatis ter-disable tanpa ada cara mengaktifkannya kecuali kembali ke mode "Semua Kolom" — kemungkinan besar tidak disengaja oleh developer.

### BUG-08 — Badge antrean sinkronisasi duplikat, salah satunya rusak tampilannya
**Lokasi:** `App.tsx` (± baris 52, merender `<SyncQueueBadge />`); `components/Dashboard.tsx` (± baris 220–225, badge inline sendiri); `components/SyncQueueBadge.tsx` (seluruh file)
**Deskripsi:** Dua indikator "N Tertunda" tampil bersamaan di layar yang sama. `SyncQueueBadge.tsx` memakai class Tailwind CSS (`fixed`, `bottom-4`, `bg-orange-500`, `z-50`, `rounded-full`, `inset-0`, dll.) — sudah diverifikasi lewat `package.json`, `index.html`, dan seluruh file CSS bahwa **Tailwind tidak terpasang/terkonfigurasi sama sekali** di proyek ini.
**Dampak ke user:** Selain duplikasi indikator yang membingungkan, badge mengambang dari `SyncQueueBadge` kemungkinan besar tidak ter-*fixed*-position dan modalnya tidak ter-overlay dengan benar karena class tersebut tidak menghasilkan CSS apa pun.

### BUG-09 — Jendela kehilangan data <1 detik pada auto-save draft
**Lokasi:** `hooks/useDebounce.ts`; `components/BusCard.tsx` (`useDebounce(formData, 1000)`, ± baris 61 & 82–85)
**Deskripsi:** Draft baru ditulis ke `localStorage` 1000ms setelah user berhenti mengetik.
**Dampak ke user:** Jika user mengetik lalu langsung menutup aplikasi/tab sebelum 1 detik berlalu, ketikan terakhir tidak sempat tersimpan sebagai draft.

---

## 🟡 MINOR / Keanehan

### BUG-10 — Deteksi baris header rapuh (fuzzy substring match)
**Lokasi:** `services/googleSheets.ts`, `findColumnIndex`/`HEADER_KEYWORDS` (± baris 145–166)
Pencocokan kata kunci memakai *substring* longgar (mis. `"bus"` di dalam `unit`). Baris data 5 teratas yang nilai Unit-nya kebetulan mengandung teks tersebut (wajar untuk penomoran armada bus) berisiko salah dideteksi sebagai baris header, menggeser seluruh kolom tanpa error yang terlihat.

### BUG-11 — Tidak ada refresh token otomatis
**Lokasi:** `services/googleSheets.ts` (`checkSignedIn`, ± baris 93–107)
Token Google (± 1 jam masa berlaku) kedaluwarsa di tengah sesi tanpa peringatan proaktif atau upaya silent-refresh; user baru sadar saat penyimpanan tiba-tiba gagal.

### BUG-12 — Status `'failed'` pada `SyncItem` didefinisikan tapi tak pernah dipakai
**Lokasi:** `hooks/useOfflineSync.ts` (interface `SyncItem`, ± baris 5–13)
Tipe `status: 'pending' | 'failed'` ada, tapi tidak ada satu baris kode pun yang men-set `'failed'` — terkait erat dengan BUG-03/BUG-12, karena tanpa status ini UI tidak bisa membedakan "sedang menunggu giliran" vs "gagal permanen".

### BUG-13 — Rute (link Google Sheet) duplikat tidak dicegah
**Lokasi:** `components/Dashboard.tsx`, fungsi `saveNewRoute` (± baris 82–103)
Tidak ada pengecekan apakah URL/judul rute yang sama sudah ada di `savedRoutes` sebelum disimpan — user bisa menambahkan rute identik berkali-kali.

### BUG-14 — Pull-to-refresh tidak memeriksa status online
**Lokasi:** `components/Dashboard.tsx`, `handleTouchEnd` (± baris 173–184)
Menarik-turun untuk refresh langsung memanggil `handleLoadData(true)` tanpa mengecek `isOnline`, sehingga saat offline hanya menghasilkan pesan error alih-alih ditolak lebih awal dengan pesan yang lebih sesuai konteks (mis. "Tidak bisa refresh saat offline").

### BUG-15 — `StrictMode` memicu init API dua kali saat development
**Lokasi:** `main.tsx` (± baris 6–10); `App.tsx` (`useEffect` pemanggil `initializeApi`, ± baris 29–31)
React `StrictMode` sengaja me-mount ulang komponen saat development, sehingga `initializeApi()` terpanggil dua kali. Saat ini tidak merusak (operasinya idempoten), tapi berpotensi menimbulkan kebingungan debugging (log ganda) dan perlu diwaspadai bila logic init menjadi lebih kompleks ke depannya.

### BUG-16 — Persentase "Progres Harian" ambigu saat filter kategori aktif
**Lokasi:** `components/BusList.tsx`, `isBusFilled`/`filledCount` (± baris 36–54)
Saat `activeCategory` bukan "ALL", persentase yang ditampilkan berubah makna menjadi "berapa bus yang sudah mengisi SATU kolom itu saja", tapi label tetap "Progres Harian" tanpa keterangan tambahan — berpotensi disalahartikan sebagai progres keseluruhan.
