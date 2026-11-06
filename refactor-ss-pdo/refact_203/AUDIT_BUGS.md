# AUDIT TEMUAN BEBAN REQUEST & EGRESS PASCA-DEPLOY: REFACTOR 203
**Modul:** Monitoring 18 Rute (`allRouteMonitoringService`), Pelacakan Waktu Aktif Pengguna (`useUserActivityTracking`, `sendUserHeartbeat`)
**Fokus Masalah:** Dashboard proyek baru menunjukkan 2.062 request per jam (6 Nov 2026, 20:03–21:01 WIB). Pemilik khawatir kuota Free plan jebol lagi. Log Supabase (`edge_logs`, `function_edge_logs`) dirinci per endpoint, klien, dan ukuran payload.

## Metode
- `query_logs`: menghitung request per path, metode, user-agent, dan IP, per jendela 10 menit.
- `execute_sql` (read-only): mengukur ukuran JSON payload kueri yang sama dengan `octet_length(row_to_json(...))`.
- Catatan: log tidak mencatat ukuran respons, jadi egress diestimasi dari ukuran JSON mentah (sebelum kompresi).

## Ringkasan Jendela 1 Jam
| Sumber | Request/jam | Payload | Catatan |
|---|---|---|---|
| Heartbeat `user_profiles` (GET+PATCH) | ~746 | Puluhan byte | 563 dari 1 klien (browser bawaan aplikasi Claude, akun pemilik, 20:15–20:46 WIB) |
| `sheets-proxy` | 280 | Belum terukur | Pemakaian normal 1–3 pengguna |
| `sheet-sync-webhook` (+ ~230 query internal) | 54 | Kecil | Aktif sejak Apps Script master diperbarui |
| Monitoring `daily_unit_summaries` | 32 | ~160 KB/muat | Satu ponsel memuat ulang 26× dalam 6 menit (bundle lama sebelum deploy refact_200) |

---

### ID Temuan: BUG-QUOTA-203-01
- **Lokasi Kode:** `src/services/allRouteMonitoringService.ts` (`fetchRegionalMonitoringData`, langkah 3)
- **Keparahan:** High (angka salah + egress terbesar per muat Monitoring)
- **Deskripsi:** Monitoring menarik baris mentah `daily_unit_summaries` per unit bus untuk 3 tanggal (H, H-1, H-7), tanpa `order` dan tanpa paginasi, lalu menjumlahkannya di browser. Untuk 6 Nov, 5 Nov, dan 30 Okt 2026 ada **1.523 baris**, tetapi PostgREST hanya mengembalikan **1.000** (`content-range: 0-999/*`), dengan subset yang tidak deterministik. Setiap muat mengirim ±160 KB JSON.
- **Dampak User:** Angka fallback penumpang, KM, dan TOA per shift, serta riwayat kemarin dan minggu lalu, bisa kurang untuk sebagian rute bila `daily_route_reports` belum terisi. Monitoring yang dibiarkan terbuka sementara Sheets terus diedit bisa memuat ulang hingga 60× per jam (batas throttle refact_200) × ±230 KB ≈ 14 MB/jam per layar.
- **Mitigasi:** RPC `get_daily_unit_summary_totals(p_dates date[])` menjumlahkan di database dan mengembalikan 1 baris per (rute, tanggal). Fungsi bersifat `SECURITY INVOKER` sehingga RLS tetap berlaku, read-only, dan input dibatasi 31 tanggal.

---

### ID Temuan: BUG-QUOTA-203-02
- **Lokasi Kode:** `src/hooks/useUserActivityTracking.ts` (handler `visibilitychange`), `src/services/routes/users.ts` (`sendUserHeartbeat`)
- **Keparahan:** Medium (jumlah request membengkak; egress kecil)
- **Deskripsi:** Setiap kali tab atau aplikasi kembali terlihat, heartbeat langsung dikirim tanpa jeda. Setiap heartbeat memakai 2 request (GET `total_active_seconds` lalu PATCH), termasuk pulsa tanpa durasi (`secondsInterval = 0`) yang tidak membutuhkan nilai lama. Satu klien yang sering berpindah tampilan menghasilkan 282 GET + 281 PATCH dalam ±30 menit (≈1 pulsa per 6 detik), padahal interval resminya 3 menit.
- **Dampak User:** Tidak terlihat oleh pengguna, tetapi menambah request API Gateway dan baris log, dan berpotensi memicu circuit breaker klien (150 request REST per 60 detik) bersama aktivitas lain.
- **Mitigasi:** Pulsa `visibilitychange` dilewati bila pulsa terakhir < 60 detik (`VISIBILITY_HEARTBEAT_MIN_GAP_MS`). Pulsa tanpa durasi hanya memakai 1 request `update` tanpa `select`.

---

## Observasi Lain (tidak diperbaiki di refact ini)
- Policy `Allow public insert/update daily_unit_summaries` (`FOR ALL TO public USING (true)`) memungkinkan anon **menghapus** baris `daily_unit_summaries`. Policy ini sudah ada sejak proyek lama dan ikut termigrasi. Perlu refact keamanan terpisah karena jalur tulis `core.ts` memakai anon.
- Belum ada metrik ukuran respons `sheets-proxy` di log. Egress aktual harus dipantau dari halaman Usage organisasi.
