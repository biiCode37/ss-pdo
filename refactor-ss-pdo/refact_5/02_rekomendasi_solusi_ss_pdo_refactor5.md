# Refactor 5 — Rekomendasi Solusi SS_PDO

Dokumen ini memetakan solusi terbaik untuk tiap masalah pada `01_daftar_masalah_ss_pdo_refactor5.md`.

## Prinsip umum
1. Pakai **satu sumber identitas** untuk rute, sheet, spreadsheet ID, dan tab.
2. Jangan pakai substring match untuk identitas yang harus unik.
3. Bedakan jelas antara **data live**, **data cache**, dan **data draft lokal**.
4. Semua fallback harus punya **indikator UI** yang eksplisit.
5. Semua operasi penting harus punya **hasil deterministik** dan **state final** yang jelas.

---

## SOL-01 — Validasi auth harus sinkron dan final
**Masalah yang diselesaikan:** ISS-01  
**Solusi terbaik:**
- Ubah `checkSignedIn()` agar tidak cuma membaca flag, tapi juga memastikan token ada, valid, dan bisa dipasang ke client.
- Kalau token invalid, jangan kembalikan `true`; kembalikan `false` atau status terpisah seperti `needsReauth`.
- Simpan state auth dalam satu model tunggal di memori aplikasi, bukan campuran localStorage + efek samping async.

**Output yang diharapkan:**
- App tidak masuk ke main UI kalau session rusak.
- Error auth muncul cepat dan konsisten.

## SOL-02 — Normalisasi identitas sheet/rute
**Masalah yang diselesaikan:** ISS-02, ISS-05, ISS-09, sebagian ISS-12  
**Solusi terbaik:**
- Buat helper tunggal untuk identifikasi sheet:
  - `normalizeSpreadsheetId()`
  - `normalizeSheetUrl()`
  - `matchRouteSheetById()`
- Simpan field identitas yang canonical di cache route: `route_code`, `spreadsheet_id`, `sheet_url`, `tab_name`, `year`, `month`.
- Ganti semua `includes()` yang dipakai buat identitas unik dengan compare berbasis ID ter-normalisasi.
- Kalau identitas tidak cocok, tampilkan state “sheet tidak dikenali” daripada diam-diam fallback ke hasil lain.

**Output yang diharapkan:**
- Router, selector, analytics, dan cache mengacu ke identitas yang sama.

## SOL-03 — Perbaiki fallback akumulasi multi-hari
**Masalah yang diselesaikan:** ISS-03  
**Solusi terbaik:**
- Jangan fallback ke `getBusData()` untuk akumulasi rentang.
- Buat fallback kedua yang tetap menghormati `startDay` dan `endDay`.
- Kalau batch fetch gagal total, tampilkan error yang spesifik: “gagal membaca rentang akumulasi”.
- Kalau cuma satu hari gagal, pertahankan data hari lain dan tandai hari yang gagal sebagai partial error.

**Output yang diharapkan:**
- Rentang tanggal tetap benar.
- Grafik / akumulasi tidak berubah jadi satu hari saja.

## SOL-04 — Parser URL harus lebih toleran dan eksplisit
**Masalah yang diselesaikan:** ISS-04  
**Solusi terbaik:**
- Tambahkan parser URL yang mendukung:
  - URL standar Google Sheets
  - URL dengan query string
  - input berupa spreadsheet ID mentah
- Kalau gagal parse, return `null` atau `Result` error, jangan kembalikan string mentah tanpa validasi.
- Tampilkan pesan UI yang menjelaskan format input yang diterima.

**Output yang diharapkan:**
- Input link lebih tahan variasi.
- Error jadi jelas, bukan gagal diam-diam.

## SOL-05 — Cache fallback harus transparan ke user
**Masalah yang diselesaikan:** ISS-07  
**Solusi terbaik:**
- Saat pakai cache lokal, tampilkan badge/label “Mode cache” atau “Data terakhir tersimpan”.
- Simpan timestamp cache terakhir pada metadata.
- Kalau data live gagal dimuat, beri warning yang berbeda dari data benar-benar kosong.

**Output yang diharapkan:**
- User tahu kapan sedang melihat cache.

## SOL-06 — Jangan samakan error total dengan nol
**Masalah yang diselesaikan:** ISS-08  
**Solusi terbaik:**
- Return status per-hari, misalnya:
  - `ok`
  - `partial`
  - `error`
- Kalau satu hari gagal, jangan isi 0 polos. Tandai sebagai `null` / `error` / `unknown`.
- Grafik harus bisa membedakan “nol aktual” dan “data gagal dibaca”.

**Output yang diharapkan:**
- Grafik tren tidak menipu user.

## SOL-07 — Offline storage perlu lapisan backup dan pemulihan
**Masalah yang diselesaikan:** ISS-06  
**Solusi terbaik:**
- Pertahankan localStorage hanya sebagai cache cepat, bukan satu-satunya penyimpanan.
- Tambahkan backup terstruktur ke Supabase bila koneksi ada.
- Buat migrasi queue/draft yang aman dan versioned.
- Tambahkan indikator kapasitas storage / kegagalan write localStorage.
- Buat mekanisme recovery dari backup ketika draft/queue hilang.

**Output yang diharapkan:**
- Kehilangan storage tidak langsung berarti kehilangan kerja user.

## SOL-08 — Selector harus punya recovery flow yang tegas
**Masalah yang diselesaikan:** ISS-09  
**Solusi terbaik:**
- Kalau tidak ada match route–bulan–tahun, tampilkan state kosong dengan tombol:
  - pilih route lain
  - reload daftar
  - lihat detail error
- Jangan hanya mengosongkan `sheetUrl`.
- Simpan state invalid selection sebagai state UI tersendiri.

**Output yang diharapkan:**
- User tidak mentok di selector kosong.

## SOL-09 — Sinkronisasi profil login harus jelas hasil akhirnya
**Masalah yang diselesaikan:** ISS-10  
**Solusi terbaik:**
- Jadikan upsert profil sebagai langkah yang statusnya jelas:
  - berhasil
  - gagal tapi login tetap lanjut
  - gagal fatal
- Kalau upsert gagal, simpan event log lokal untuk retry nanti.
- Jangan biarkan sinkronisasi profil “mengambang” tanpa pencatatan.

**Output yang diharapkan:**
- Audit login lebih konsisten.
- Tidak ada state abu-abu yang susah dilacak.

## SOL-10 — Collision detection harus pakai snapshot asli yang immutable
**Masalah yang diselesaikan:** ISS-11  
**Solusi terbaik:**
- Simpan `originalSnapshot` eksplisit saat form pertama kali dibuka atau saat data server terakhir diambil.
- Jangan jadikan props saat ini sebagai baseline konflik.
- Normalisasi nilai sebelum compare:
  - trim
  - angka format Indonesia
  - null / kosong
- Tampilkan field mana yang benar-benar bentrok.

**Output yang diharapkan:**
- Konflik jadi akurat dan lebih mudah dipahami.

## SOL-11 — Gesture handling harus berbasis konteks, bukan class selector rapuh
**Masalah yang diselesaikan:** ISS-12  
**Solusi terbaik:**
- Tambahkan prop eksplisit seperti `ignoreSwipe` / `swipeDisabled`.
- Gunakan data attribute (`data-no-swipe="true"`) daripada daftar class CSS.
- Pastikan komponen interaktif baru bisa opt-out dari swipe tanpa ubah kode gesture utama.

**Output yang diharapkan:**
- Refactor UI tidak gampang memecah gesture.

## SOL-12 — Buat layer helper bersama untuk identitas, cache, dan status
**Masalah yang diselesaikan:** ISS-02, ISS-04, ISS-05, ISS-07, ISS-08  
**Solusi terbaik:**
- Pindahkan helper umum ke satu modul:
  - identitas sheet
  - metadata cache
  - status result
  - normalisasi string
- Larang komponen memanggil localStorage / parse URL / substring matching langsung.
- Semua akses identitas harus lewat helper itu.

**Output yang diharapkan:**
- Perilaku konsisten, mudah dites, dan mudah direfactor lagi.

---

## Urutan implementasi yang disarankan
1. SOL-01
2. SOL-02
3. SOL-03
4. SOL-06
5. SOL-07
6. SOL-08
7. SOL-10
8. SOL-11
9. SOL-04
10. SOL-05
11. SOL-09
12. SOL-12