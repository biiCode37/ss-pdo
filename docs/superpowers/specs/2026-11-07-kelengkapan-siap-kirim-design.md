# Desain: Kelengkapan Data & Konfirmasi "Siap Dikirim" (Tab Siap Kirim di Monitoring)

**Tanggal:** 07 November 2026
**Status:** Disetujui per bagian oleh pemilik (sesi 07 Nov 2026). Menunggu review dokumen ini.
**Dokumentasi refactor:** folder `refactor-ss-pdo/refact_N` berikutnya saat implementasi.

## 1. Latar Belakang & Tujuan

- Setiap malam setelah ±22.00 (akhir operasional), file SS ke-18 rute wajib dikirim ke admin pusat lewat Google Form. Sebelum dikirim, korlap/korwil harus memastikan data **lengkap dan benar**.
- Teguran atasan paling sering muncul karena data **tidak lengkap atau janggal** (misalnya ritase terisi tapi TOA kosong, atau sebaliknya). Angka capaian adalah prioritas **kedua**.
- Saat ini korlap/korwil harus menebak-nebak rute mana yang belum lengkap. Halaman Monitoring juga masih **ditutup** untuk korlap (`regional_monitoring.is_enabled=false`), karena pemilik khawatir kuota Supabase jebol lagi: muat ulang otomatis Monitoring bisa mencapai ±300 request/jam per layar.
- **Tujuan:** menyediakan checklist "Siap Dikirim" per rute yang (a) menunjukkan unit mana dan kolom apa yang belum lengkap atau janggal, (b) mencatat konfirmasi pengiriman beserta jejak audit, dan (c) cukup murah kuota sehingga Monitoring aman dibuka untuk korlap dan PJ.

## 2. Aturan Kelengkapan per Baris Unit

Kolom **wajib**: Trip Pergi, Trip Pulang, TOA S1, Total TOA. Kolom **opsional**: Manual S1, Manual S2, Keterangan. **KM awal/akhir S1/S2 tidak diperiksa.** TOA S2 adalah kolom berumus, jadi tidak diperiksa sebagai input.

- **Sel kosong berarti belum diisi; angka 0 berarti terisi** (berlaku untuk trip dan TOA). Sel berisi `-` juga dianggap kosong, selaras dengan `normalizeFieldValue`. Petugas wajib mengetik 0 untuk nilai yang memang nol. Perhitungan memeriksa **isi sel mentah**, bukan hasil `parseIndonesianNumber` yang mengubah sel kosong menjadi 0.
- "Ritase terisi" = Trip Pergi **dan** Trip Pulang keduanya terisi.

| Status | Kondisi |
|---|---|
| `LENGKAP` | Trip Pergi, Trip Pulang, TOA S1, Total TOA semuanya terisi, dan tidak ada kejanggalan |
| `DIKECUALIKAN` | Keempat kolom wajib kosong **dan** keterangan berklasifikasi bukan `NORMAL` (OFF_LIBUR / KENDALA / TO) |
| `BELUM_DIISI` | Keempat kolom wajib kosong **dan** keterangan `NORMAL` (kosong) |
| `JANGGAL` | (a) salah satu trip terisi, tapi TOA S1 **dan** Total TOA kosong; atau (b) TOA S1 atau Total TOA terisi, tapi kedua trip kosong; atau (c) Total TOA < TOA S1 (keduanya terisi) |
| `SEBAGIAN` | Selain di atas: ada data, tapi minimal satu kolom wajib kosong |

- Keterangan **hanya** membebaskan baris yang kosong total. Unit yang sempat beroperasi lalu kendala tetap diperiksa normal.
- **Klasifikasi keterangan memakai aturan yang sama dengan `classifyUnitKeterangan` di `src/utils/keteranganUtils.ts`.** Yang dibutuhkan hanya NORMAL vs bukan-NORMAL; NORMAL = kosong atau `SO`/`SGO` (boleh berprefiks S1:/S2:). Pengecualian terdokumentasi: `-` dan `0` dianggap tanpa keterangan. Regex lokal yang sekarang ada di `sheet-sync-webhook` tidak dipakai untuk kelengkapan. Kesetaraan dijaga dengan uji paritas (§7).
- Status rute = jumlah unit per status, ditambah daftar unit selain `LENGKAP` dan `DIKECUALIKAN`.
- Mode penilaian **apa adanya**, tanpa tenggat jam: aplikasi menampilkan status, dan korlap yang menilai sesuai waktunya.

## 3. Arsitektur & Data

### 3.1 Perhitungan di `sheet-sync-webhook`
- Webhook sudah membaca seluruh baris unit di setiap edit (dipicu Apps Script master). Perhitungan kelengkapan ditambahkan pada loop yang sama, **tanpa pembacaan Sheets tambahan**.
- Logika berupa **fungsi murni** di `supabase/functions/_shared/completeness.ts` (tanpa API Deno), sehingga bisa diuji Vitest.
- Hasil disimpan di kolom baru `daily_route_reports.completeness` (`jsonb`):
  ```json
  {
    "v": 1,
    "computedAt": "2026-11-07T14:05:00Z",
    "status": "ok | header_not_found",
    "counts": { "LENGKAP": 24, "DIKECUALIKAN": 2, "BELUM_DIISI": 1, "JANGGAL": 1, "SEBAGIAN": 0 },
    "issues": [ { "unit": "KLM 540", "status": "SEBAGIAN", "missing": ["tripPulang"] },
                { "unit": "KLM 541", "status": "JANGGAL", "reason": "TOA_TANPA_RITASE" } ],
    "fingerprint": "<hash nilai kolom wajib + keterangan seluruh unit, urut unit>"
  }
  ```
  `issues` hanya berisi unit bermasalah (target < 2 KB per rute).
- **Hanya webhook yang menulis kolom ini.** Penulis lain (`regionalIngestionService`, `scripts/ingest-regional.mjs`) tidak menyertakannya dalam payload upsert, sehingga nilainya tidak tertimpa. Hal ini wajib diverifikasi untuk setiap penulis.
- Kegagalan perhitungan kelengkapan **tidak boleh** menggagalkan penyimpanan angka capaian. Bila gagal, kolom `completeness` lama dibiarkan.

### 3.2 Konfirmasi "Siap Dikirim"
- Tabel baru `route_submission_confirmations`: `route_id`, `route_code`, `date`, `confirmed_by` (email), `confirmed_at`, `issues_at_confirm` (int), `reason` (text, wajib bila `issues_at_confirm > 0`), `fingerprint_at_confirm`. Unik pada (`route_id`, `date`). Konfirmasi ulang menimpa baris tersebut.
- Riwayat: setiap aksi konfirmasi menulis **1 baris** `activity_logs`.
- **"Data berubah setelah dikonfirmasi"** = `completeness.fingerprint` ≠ `fingerprint_at_confirm`. Edit KM saja tidak memicu tanda ini.
- RLS: `SELECT` untuk anon/authenticated. **Tidak ada** policy atau grant tulis untuk anon/authenticated; penulisan hanya lewat `service_role`.

### 3.3 Edge Function `route-confirmation`
- Verifikasi pemanggil memakai sesi proxy refact_205. Kode verifikasi sesi dipindah dari `sheets-proxy` ke `supabase/functions/_shared/` dan dipakai kedua fungsi; perilaku `sheets-proxy` tidak berubah.
- Hak akses dievaluasi di server dengan aturan halaman `regional_monitoring` (`is_enabled`, `allowed_roles`, `allowed_user_emails`, `denied_user_emails`), identik dengan logika klien di `pageManagementService`.
- Validasi: rute terdaftar; tanggal tidak di masa depan dan ≤ 7 hari ke belakang (WIB); alasan wajib bila ada masalah (dibatasi panjang dan disanitasi).
- **`issues_at_confirm` dan `fingerprint_at_confirm` diambil server** dari `daily_route_reports.completeness` saat itu, bukan dari kiriman klien.
- Rute tanpa data kelengkapan boleh dikonfirmasi dengan alasan wajib (dihitung sebagai masalah).

### 3.4 Alur Data di Klien
- Saat tab dibuka: **2 request** (kelengkapan 18 rute untuk tanggal terpilih + konfirmasi tanggal itu), ditambah **1 request tunggakan** (konfirmasi 7 hari).
- Realtime `postgres_changes` pada `daily_route_reports` (filter `date=eq.X`) dan `route_submission_confirmations` (filter `date=eq.X`). Payload sudah membawa nilai terbaru, sehingga tampilan **diperbarui di tempat tanpa request**. Debounce ≥ 3 detik untuk render, dengan cleanup timer dan channel.
- Saat koneksi Realtime tersambung kembali atau tab kembali terlihat: muat ulang **sekali**.
- Tombol **Cek ulang** per rute memanggil `triggerRealtimeSheetSync(routeCode, date)` (1 pemanggilan webhook).

## 4. Tampilan

- **Navigasi tetap 5 item.** Slot "Status Armada" menjadi tab **Siap Kirim** dengan segmen **Kelengkapan | Armada**:
  - Segmen **Kelengkapan** (baru) adalah default.
  - Segmen **Armada** memakai `MonitoringFleetStatusTab` yang sudah ada **apa adanya**, sehingga tidak ada fungsi yang hilang. Edit armada tetap tersedia juga di tab Laporan WA.
- Tab Siap Kirim menjadi tab **default** halaman Monitoring.
- Isi segmen Kelengkapan, dari atas ke bawah:
  1. **Pita tunggakan** (hanya bila ada): jumlah pasangan rute–tanggal yang belum dikonfirmasi dalam 7 hari terakhir, tidak termasuk hari ini, dan hanya untuk tanggal ≥ tanggal fitur aktif. Tanggal fitur aktif adalah konstanta `SUBMISSION_FEATURE_START_DATE` (format `YYYY-MM-DD`) yang diisi tanggal peluncuran produksi. Daftarnya bisa diketuk untuk melompat ke tanggal tersebut.
  2. **Ringkasan tanggal** dan pemilih tanggal yang sudah ada.
  3. **Filter pantauan pribadi**: chip "Semua rute" / "Pantauan saya (n)" dan pemilih rute. Disimpan di `localStorage` per tanggal per perangkat, dengan akses dibungkus try/catch.
  4. **Daftar kartu rute**, urut: Janggal → Belum diisi / Belum ada data / Format tidak dikenali → Sebagian → Berubah setelah konfirmasi → Lengkap belum dikonfirmasi → Sudah dikonfirmasi. Kartu menampilkan jumlah per status, "diperbarui HH:MM", dan status konfirmasi (siapa dan jam berapa, atau tanda ⚠ berubah).
  5. **Detail rute** (`ModalShell`): daftar unit bermasalah dengan kolom yang kosong atau jenis kejanggalannya, tombol **Cek ulang**, dan tombol **Konfirmasi Siap Dikirim**. Bila masih ada masalah, dialog meminta alasan wajib.
- **Tanggal default:** kemarin, bila rute pantauan kemarin (atau semua rute bila tidak memilih) belum semuanya dikonfirmasi; selain itu hari ini. Pengguna tetap bebas memilih tanggal (tidak memblokir).
- **Tab capaian lain** (Dashboard, Rute, Korwil, Laporan WA): muat ulang otomatis dari Realtime **dihentikan** dan diganti banner "Ada pembaruan data — Muat ulang".
- Wajib mengikuti AGENTS.md: teks di `src/constants/texts/` (+ uji `texts.test.ts`), token warna semantik, aturan `.agents/rules/ui-consistency.md` (komponen bersama, tanpa inline style statis baru, skala font/ikon/jarak/radius, cincin fokus tunggal), dan lolos ratchet UI.

## 5. Keamanan & Kuota

- Konfirmasi tidak bisa dipalsukan dengan anon key: tulis hanya lewat Edge Function terverifikasi, dan nilai audit diambil server.
- Perkiraan dampak per layar Monitoring yang terbuka: dari ≤ ±300 request/jam (muat ulang otomatis) menjadi ±3 request saat dibuka, ditambah pesan Realtime. Konfirmasi ±18 pemanggilan Edge Function per hari.
- Circuit breaker klien (refact_200) tetap aktif sebagai pengaman terakhir.
- **Peluncuran bertahap:** buka `regional_monitoring` untuk 1–2 korlap/PJ lewat whitelist selama beberapa hari sambil memantau Log Ingestion (batas 1 GB/bulan) dan Egress di dashboard. Buka untuk semua bila angka aman (patokan Log Ingestion < 0,2 GB/minggu).

## 6. Penanganan Kesalahan

| Situasi | Perilaku |
|---|---|
| Trigger Apps Script terlewat | Tampilkan "diperbarui HH:MM" dan tombol Cek ulang |
| Belum ada `completeness` untuk rute/tanggal | Status "Belum ada data", diurutkan butuh perhatian, dihitung tunggakan |
| Header sheet tidak ditemukan | `status: header_not_found`, tampil "Format sheet tidak dikenali", tidak dianggap lengkap |
| Realtime terputus | Muat ulang sekali saat tersambung atau tab terlihat |
| Konfirmasi saat offline | Ditolak dengan pesan ramah; tanpa antrean offline |
| Sesi akses habis | Alur masuk ulang refact_205 |
| Konfirmasi bersamaan | Yang terakhir berlaku; keduanya tercatat di `activity_logs` |

## 7. Pengujian

1. `completeness.ts`: tabel kasus untuk setiap status, sel kosong vs 0, pembebasan keterangan hanya untuk baris kosong, Total TOA < TOA S1, kolom KM/opsional tidak berpengaruh, serta fingerprint yang stabil saat KM berubah dan berubah saat ritase/TOA/keterangan berubah.
2. **Uji paritas** klasifikasi keterangan modul bersama vs `classifyUnitKeterangan` pada fixture keterangan nyata.
3. Evaluasi hak akses halaman di server (nonaktif, role, whitelist, blacklist) dan validasi tanggal/alasan.
4. Klien: tepat 2 (+1 tunggakan) request saat mount, 0 request saat pesan Realtime, debounce dan cleanup channel, banner pengganti muat ulang otomatis di tab capaian, tunggakan tidak mencakup tanggal sebelum fitur aktif, dan aturan tanggal default.
5. Gate: 4 quality gate AGENTS.md, `deno check` fungsi terdampak (tanpa meng-commit `deno.lock`), ratchet UI, dan verifikasi browser light/dark pada lebar 375 px.
6. Produksi: probe REST bahwa anon tidak bisa menulis `route_submission_confirmations`; uji ujung-ke-ujung satu rute (edit sheet → status berubah → konfirmasi → ubah sheet → tanda berubah).

## 8. Di Luar Cakupan

- Klaim atau kepemilikan rute per orang (diputuskan: filter pantauan pribadi saja).
- Tenggat berbasis jam per shift.
- Pengisian awal (backfill) data kelengkapan untuk tanggal sebelum fitur aktif.
- Notifikasi (WA atau push) dan integrasi langsung ke Google Form.
- Perubahan role atau penambahan role "PJ" (memakai whitelist halaman yang sudah ada).
