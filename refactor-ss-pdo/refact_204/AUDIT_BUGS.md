# AUDIT TEMUAN HAK HAPUS PUBLIK daily_unit_summaries: REFACTOR 204
**Modul:** Database Supabase (`public.daily_unit_summaries`): RLS policy & grant tabel
**Fokus Masalah:** Observasi refact_203 menemukan bahwa pemegang anon key (publik, tertanam di bundle JS) dapat menghapus ringkasan unit harian, yang menjadi sumber Monitoring 18 Rute dan Rekap Lintas Periode.

## Metode
- `pg_policies`, `pg_class.relacl`, `pg_attribute.attacl` (read-only MCP) untuk policy dan grant.
- Penelusuran semua pemakai tabel di `src/`, `supabase/functions/`, `scripts/`, `.github/`.
- Probe REST sebagai anon dengan filter yang tidak cocok ke baris mana pun: `DELETE /rest/v1/daily_unit_summaries?id=eq.-1` (tidak ada data yang terhapus).

---

### ID Temuan: BUG-SEC-204-01
- **Lokasi Kode:** Policy `"Allow public insert/update daily_unit_summaries"` (`FOR ALL TO public USING (true)`) dan grant tabel `anon=arwdDxtm`, `authenticated=arwdDxtm`. Asal: proyek lama, ikut termigrasi 6 Nov 2026.
- **Keparahan:** High (penghapusan data massal tanpa login; integritas data Monitoring dan rekap)
- **Deskripsi:** Policy `FOR ALL` memberi hak `DELETE` ke semua role, dan grant tabel juga memuat `DELETE` serta `TRUNCATE`. Probe `DELETE ?id=eq.-1` sebagai anon dijawab **HTTP 200 `[]`**: permintaan diterima, hanya saja tidak ada baris yang cocok. Filter `id=gt.0` akan menghapus seluruh ±puluhan ribu baris. Selain itu ada policy SELECT ganda (`Allow public read` dan `Allow read`).
- **Dampak User:** Satu permintaan iseng atau berbahaya dapat mengosongkan ringkasan unit. Akibatnya angka fallback Monitoring dan Rekap Lintas Periode menjadi 0 atau salah sampai PDO membuka ulang setiap tab tanggal di aplikasi (upsert ulang dari Sheets).
- **Mitigasi:** Drop policy `FOR ALL` dan policy SELECT duplikat. `REVOKE ALL` lalu `GRANT SELECT, INSERT, UPDATE` ke anon dan authenticated. Jalur aplikasi (upsert `ON CONFLICT` dari `googleSheets/core.ts`, baca dari `routes.ts` dan RPC refact_203) hanya membutuhkan ketiga hak itu. Edge Function dan cron memakai `service_role`, jadi tidak terdampak.

---

## Observasi Lain (tidak diperbaiki di refact ini)
Pola `FOR ALL`/`DELETE` dengan `USING (true)` untuk anon/public masih ada di tabel lain:
`app_settings`, `daily_fleet_non_sgo_units`, `daily_fleet_shifts`, `daily_route_plottings` (DELETE), `daily_route_reports`, `fleet_statuses`.
Dua di antaranya (`daily_route_reports`, `daily_fleet_shifts`) tercantum sebagai tabel sensitif di AGENTS.md. Setiap tabel perlu ditelusuri jalur hapusnya sebelum diketatkan, karena beberapa fitur (misalnya plotting) memang menghapus baris dari browser.
