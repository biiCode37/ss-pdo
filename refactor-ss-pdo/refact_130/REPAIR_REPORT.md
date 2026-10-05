# Laporan Kesiapan Rilis Cepat (Fast Track Pilot) — `refact_130`

Tanggal: 29 September 2026  
Branch: `devmode`  
Status: **READY_FOR_REVIEW**

---

## 1. Ringkasan Kesiapan Rilis Cepat (Fast Track Pilot Readiness)

Sesuai arahan prioritas baru dari Codex pada `refact_129`, fokus kerja dialihkan dari dekomposisi monolitik Fase 4–6 ke **paket kesiapan pilot lapangan (*Fast Track Pilot Readiness*)**.

### Prinsip Utama
1. **Zero Unverified Claims:** Tidak ada klaim bahwa aplikasi "sudah 100% siap lapangan" hanya berdasarkan hasil unit test di lingkungan Happy DOM. Seluruh alur yang membutuhkan interaksi pihak ketiga langsung (Google OAuth popup, write ke Google Sheets operasional, koneksi Supabase live, dan input sentuh keyboard virtual fisik) ditandai secara jujur sebagai `UNVERIFIED (Requires Owner Live Credentials)` dengan panduan runbook yang jelas.
2. **Perlindungan Data Operasional:** Tidak ada operasi tulis (*write/delete*) ke spreadsheet atau database produksi tanpa persetujuan eksplisit owner.
3. **Isolasi Branch:** Seluruh baseline dan evaluasi dilakukan pada branch `devmode` tanpa reset, stash, clean, commit, atau push yang tidak terotorisasi.

---

## 2. Before vs After: Pendekatan Rilis

| Dimensi | Pendekatan Awal (Menunggu Selesai Fase 4–6) | Pendekatan Jalur Cepat Pilot (`refact_130`) |
| --- | --- | --- |
| **Kriteria Peluncuran Pilot** | Menunggu pemecahan seluruh file monitoring, CSS, dan form helper selesai (bisa memakan waktu berminggu-minggu). | Meluncurkan pilot terbatas segera setelah seluruh temuan **P0 & P1 tertutup** dan alur operasional inti terverifikasi. |
| **Fokus Verifikasi** | Struktur modul, batas baris file (<400 baris), dan pemecahan file sekunder. | Perjalanan pengguna nyata: login, pilih rute, input KM/TOA, offline queue, deteksi konflik, dan tampilan ponsel. |
| **Status Temuan Arsitektur** | Menahan seluruh pekerjaan sebelum file besar dipecah. | File besar non-kritis (monitoring & CSS) diklasifikasikan sebagai **P2 (Backlog)** yang dilanjutkan bertahap setelah pilot stabil. |
| **Kejujuran Bukti Lapangan** | Potensi salah anggap bahwa 675 unit test = siap pakai di ponsel lapangan. | Pembagian tegas: **Unit Test & Static Audit (PASS 100%)** vs **Live Device Interaction (UNVERIFIED — Panduan Runbook untuk Owner)**. |

---

## 3. Case: Skenario Lapangan

### Skenario 1: Petugas Menyimpan Data KM/TOA Saat Jaringan Stabil
- **Alur Lapangan:** Petugas membuka form unit `TJ-0123`, mengisi KM Awal 1, KM Akhir 1, TOA Shift 1, lalu menekan Simpan.
- **Perilaku Sistem:**
  - Validasi *Zero Phantom Value* memastikan KM Akhir 1 tidak bernilai kosong atau lebih kecil dari KM Awal 1.
  - Odometer 3-digit prefill menempatkan kursor di akhir angka acuan kemarin.
  - Data dikirim langsung ke Google Sheets target via `updateBusData` dengan jeda rate limit 250 ms.
  - Nilai ritase dihitung murni sesuai formula PP: $\frac{\text{Trip Pergi} + \text{Trip Pulang}}{2}$.

### Skenario 2: Petugas Berada di Area Blank-Spot (Koneksi Terputus)
- **Alur Lapangan:** Petugas menekan Simpan saat berada di koridor tanpa sinyal internet.
- **Perilaku Sistem:**
  - Deteksi kegagalan jaringan secara otomatis mengalihkan payload ke `useOfflineSync` (`addToQueue`).
  - Item disimpan secara atomik ke `localStorage` (`PDO_SYNC_QUEUE`) dan dicadangkan ke Supabase latar belakang jika dimungkinkan.
  - Badge antrean di header dashboard berubah menampilkan counter `[1 Antrean Pending]`.
  - Ketika perangkat kembali online (`window.onLine`), sistem otomatis memproses antrean satu per satu tanpa menimpa baris lain.

### Skenario 3: Dua Petugas Mengubah Unit yang Sama (Konflik Sinkronisasi)
- **Alur Lapangan:** Petugas A menginput saat offline; di saat yang sama Petugas B telah mengupdate unit tersebut di server Google Sheets.
- **Perilaku Sistem:**
  - Saat Petugas A kembali online, `processQueue` menjalankan `detectCollision()`.
  - Sistem mendeteksi data server telah berbeda dari snapshot awal Petugas A.
  - Status item diubah menjadi `conflict` (tidak ditimpa paksa).
  - Modal `showQueueConflictDialog` terbuka menyajikan pilihan:
    1. *Force Save*: Menimpa data server dengan data lokal Petugas A.
    2. *Gunakan & Gabung Server*: Menggabungkan data server dengan perubahan lokal Petugas A (`mergeRemoteBusDataWithLocalUpdates`).
    3. *Batal*: Menunda resolusi.

### Skenario 4: Pengawas Membuka Aplikasi pada Layar Ponsel (Mobile-First UX)
- **Alur Lapangan:** Pengawas mengakses aplikasi dari ponsel Android di lapangan pada siang hari (Light Mode) dan malam hari (Dark Mode).
- **Perilaku Sistem:**
  - Kontras teks judul, badge, chip, dan input memenuhi rasio kontras WCAG $\ge 4{,}5:1$.
  - Saat keyboard virtual muncul, `useVisualViewport` menyesuaikan tinggi modal sehingga tombol Simpan dan Batal tetap terlihat di atas keyboard (*sticky footer*).
  - Tombol Back fisik menutup dialog lapis per lapis secara idempoten tanpa menutup aplikasi secara mendadak.

---

## 4. Daftar Gerbang Rilis Pilot (Pilot Release Gates Checklist)

Sebelum aplikasi disebarkan ke kelompok pengguna percontohan (*pilot users*), seluruh gerbang di bawah ini wajib diverifikasi:

```
[✓] Gerbang 1: P0 & P1 Defect Clearance
    - P0 (Korupsi/kehilangan data): 0 Terbuka.
    - P1 (Alur inti terblokir): 0 Terbuka secara kode aplikasi.
    - Seluruh mitigasi R126-01 (history Back synchronization) terbukti lulus 100%.

[✓] Gerbang 2: Build & Bundle Integrity
    - TypeScript strict mode (tsc -b): 0 error.
    - PWA build (vite build): Berhasil terkompilasi, service worker & manifest valid.
    - Linter (oxlint): 0 warning, 0 error pada area yang dimodifikasi.
    - All unit tests (vitest run src/): 88 berkas, 675 tes lulus (100%).

[ ] Gerbang 3: OAuth & Origin Configuration (Wajib Verifikasi Owner)
    - Domain Vercel Preview/Production telah didaftarkan pada Authorized JavaScript Origins di Google Cloud Console.
    - Authorized Redirect URI Google Identity Services (GIS) terkonfigurasi.
    - Client ID (VITE_GAPI_CLIENT_ID) dan API Key (VITE_GAPI_API_KEY) aktif dan memiliki kuota Google Sheets API v4 yang cukup.

[ ] Gerbang 4: Hak Akses Rute & Spreadsheet Pilot (Wajib Verifikasi Owner)
    - Minimal 1 rute uji aktif terdaftar di tabel Supabase routes dengan spreadsheet_id sandbox.
    - Akun Google petugas uji telah memiliki izin Edit pada Google Sheets sandbox terkait.

[✓] Gerbang 5: Secret Sanitization
    - Tidak ada private key, password database, atau service account credential yang terekspos di bundle frontend (dist/) maupun file evidence.

[✓] Gerbang 6: Prosedur Rollback & Pemantauan Antrean
    - Prosedur rollback cepat terdokumentasi (lihat Bagian 6 di bawah).
    - Mekanisme pembersihan antrean macet tersedia via tombol "Hapus Antrean" di QueueModal.
```

---

## 5. Owner Field Runbook: Panduan Uji Asap Mandiri (Smoke Test Runbook)

Owner atau tim teknis dapat menjalankan 8 langkah uji mandiri ini di peranti nyata:

| Langkah | Aksi Pengujian | Hasil yang Diharapkan | Status Lapangan |
| --- | --- | --- | --- |
| **1. Login Google** | Buka URL aplikasi di Chrome ponsel ➔ Klik `[Login dengan Google]` ➔ Pilih akun Google terdaftar. | Popup Google OAuth muncul, setelah disetujui aplikasi masuk ke Dashboard dan nama user tampil di profil header. | `[ ] Menunggu Uji Owner` |
| **2. Pilih Rute** | Pada form selector: pilih Tahun ➔ Bulan ➔ Kode Rute uji ➔ Tanggal hari ini. | Data rute termuat, daftar unit bus muncul pada tabel/kartu dashboard, form selector menciut (*morph*) menjadi kapsul. | `[ ] Menunggu Uji Owner` |
| **3. Input Data Bus** | Tap salah satu unit bus ➔ Modal `BusInputModal` terbuka ➔ Masukkan KM Awal S1, KM Akhir S1, TOA S1 ➔ Klik `[Simpan]`. | Modal tertutup dengan animasi mulus, toast sukses muncul, angka KM dan TOA pada kartu unit terbarui. | `[ ] Menunggu Uji Owner` |
| **4. Cek Spreadsheet** | Buka file Google Sheets target di tab browser lain. | Baris unit yang diedit telah terisi nilai yang sama persis seperti yang diinput di aplikasi. | `[ ] Menunggu Uji Owner` |
| **5. Uji Offline Queue** | Aktifkan Mode Pesawat (Airplane Mode) di ponsel ➔ Edit unit bus lain ➔ Klik `[Simpan]`. | Muncul notifikasi bahwa data disimpan ke Antrean Offline. Counter antrean bertambah `[1]`. | `[ ] Menunggu Uji Owner` |
| **6. Uji Auto-Sync** | Matikan Mode Pesawat (koneksi internet kembali aktif). | Sistem otomatis mendeteksi koneksi online, antrean disinkronkan, counter antrean kembali ke 0, dan data masuk ke Google Sheets. | `[ ] Menunggu Uji Owner` |
| **7. Uji Hardware Back** | Buka form bus ➔ Buka dialog konfirmasi/batal ➔ Tekan tombol Back fisik peranti 2 kali cepat. | Modal atas tertutup lebih dulu, modal form bus tetap ada, Back berikutnya baru menutup form bus (tidak langsung mental keluar aplikasi). | `[ ] Menunggu Uji Owner` |
| **8. Uji Tema & Layout** | Beralih antara Light Mode dan Dark Mode di menu pengaturan. | Warna kontras terbaca jelas, teks tidak ada yang pudar/putih di atas putih, form input nyaman disentuh. | `[ ] Menunggu Uji Owner` |

---

## 6. Prosedur Rollback Cepat & Monitoring Telemetri

Jika terjadi kendala saat pengujian pilot lapangan:
1. **Rollback Aplikasi Web:**
   - Karena deployment menggunakan branch `devmode` pada Vercel Preview, owner dapat langsung membatalkan deployment preview melalui dashboard Vercel dengan mengarahkan domain preview kembali ke deployment hash stabil sebelumnya (`1fb52a6`).
2. **Penyelamatan Data Antrean Lokal:**
   - Jika ada data petugas yang tertahan di antrean lokal dan gagal sinkronisasi:
     - Buka modal antrean via ikon antrean di header dashboard.
     - Klik tombol `[Force Save]` atau `[Coba Lagi]` per item.
     - Jika format data salah, item dapat dihapus via `[Hapus]` setelah dicatat manual.
3. **Pemeriksaan Log Telemetri:**
   - Seluruh aktivitas sinkronisasi dan konflik tercatat di tabel Supabase `audit_logs` dengan aksi `SYNC_OFFLINE_QUEUE` dan `BUS_DATA_UPDATE`.

---

## 7. Rekapitulasi Berkas Evidence

Berkas bukti eksekusi lengkap tersimpan di folder `refactor-ss-pdo/refact_130/evidence/`:
- `baseline-git.txt`: Snapshot branch `devmode`, HEAD `1fb52a6`, status working tree.
- `baseline-tests.txt`: Hasil eksekusi `vitest run src/` (88 berkas, 675 passed).
- `baseline-typecheck.txt`: Hasil eksekusi `tsc -b` (0 error).
- `baseline-lint.txt`: Hasil eksekusi `oxlint` (0 warning, 0 error).
- `baseline-build.txt`: Hasil kompilasi Vite PWA v1.3.0.
- `file-sizes.txt`: Ukuran dan baris file-file inti.

Status: **READY_FOR_REVIEW**.
