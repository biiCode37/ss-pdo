# Aturan & Ketentuan Kerja untuk AI Coding Agent v3 — Proyek SS_PDO / SPUM

**Jenis dokumen:** Instruksi kerja mengikat untuk babak perbaikan ketiga ini.
**Dokumen rujukan wajib:** `01-daftar-masalah-v3.md`, `02-rekomendasi-solusi-v3.md`.
**Dokumen yang TETAP BERLAKU bersamaan dengan dokumen ini:** `.agents/AGENTS.md`, `03-aturan-ai-agent.md` (v1), `03-aturan-ai-agent-v2.md` (v2). Dokumen ini menambahkan, tidak menggantikan.

---

## 1. Prioritas Tertinggi: Keamanan Auth (BUG-37, BUG-38)

Ini adalah audit pertama yang menemukan **kerentanan keamanan sungguhan** (bukan cuma bug fungsional) — perlakukan sebagai prioritas di atas segalanya, termasuk di atas temuan v1/v2 yang belum dikerjakan.

1. **BUG-37 (allowlist fail-open) dikerjakan lebih dulu.**
2. **⚠️ WAJIB konfirmasi ke manusia sebelum implementasi:** perubahan ke pola *fail-closed* berarti gangguan Supabase akan mengunci SEMUA user, termasuk yang sah. Sampaikan trade-off ini secara eksplisit ke pemilik proyek dan dapatkan persetujuan sebelum mengubah perilaku default — ini keputusan produk/keamanan, bukan murni teknis.
3. **Verifikasi RLS tidak bisa dilakukan murni dari kode.** Agent code TIDAK memiliki akses ke dashboard Supabase pemilik proyek. Setelah BUG-37 diimplementasikan (fail-closed), agent WAJIB meminta pemilik proyek untuk:
   - Mengonfirmasi kebijakan RLS tabel `user_profiles` mengizinkan `anon` role melakukan `SELECT`.
   - Menguji langsung dengan akun yang sengaja tidak terdaftar, memastikan benar-benar ditolak.
   Agent tidak boleh menandai BUG-37 "Selesai" tanpa konfirmasi hasil pengujian nyata ini dari pemilik proyek — verifikasi lewat kode/unit test saja tidak cukup untuk temuan keamanan sekelas ini.
4. **BUG-38 wajib diuji di browser mobile sungguhan** (Chrome Android, Safari iOS) sebelum ditandai selesai — perilaku pemblokiran popup tidak konsisten antar browser dan tidak bisa diverifikasi lewat unit test atau browser desktop saja.

## 2. Urutan Prioritas Setelah Bagian 1

1. **BUG-39, BUG-40** (swipe navigation) — perbaikan cepat (tambah class `no-swipe`), berdampak langsung ke pengalaman harian pengguna, risiko regresi rendah.
2. **BUG-41, BUG-42** (route/date UX) — dikerjakan sebagai satu kelompok, lihat catatan di `02-rekomendasi-solusi-v3.md`.
3. **BUG-43, BUG-44** (dokumentasi & proses Supabase) — bisa paralel dengan pekerjaan lain, tidak saling bergantung ketat dengan sisanya kecuali sebagai pendukung verifikasi BUG-37.

## 3. Prinsip Kerja Tambahan Khusus Babak Ini

- **Untuk BUG-37 & BUG-38, "berhasil di unit test" TIDAK SAMA DENGAN "selesai".** Kedua bug ini menyangkut interaksi dengan sistem eksternal (Supabase RLS, perilaku popup browser) yang tidak sepenuhnya bisa disimulasikan lewat `vitest`. Definition of Done untuk keduanya WAJIB mencakup pengujian manual langsung di kondisi nyata (lihat Bagian 1, poin 3 & 4), bukan hanya lolos test otomatis.
- **Jangan menganggap masalah selesai hanya karena kode "terlihat benar".** Pola ini persis yang menyebabkan BUG-37 & BUG-38 lolos tanpa terdeteksi di audit v1/v2 sebelumnya — kode `verifyUserProfile` dan `reauthenticateSession` masing-masing terlihat masuk akal dibaca sepintas, tapi baru terungkap jadi masalah ketika diuji perilakunya di dunia nyata (login dengan akun tak terdaftar; popup di browser mobile sungguhan).
- **Untuk BUG-39/40, saat menerapkan perbaikan terstruktur (deteksi programatik `scrollWidth > clientWidth`), uji dengan SEMUA area scroll horizontal yang ada saat ini** (kategori kolom, grafik tren TOA) DAN pastikan tidak mematikan swipe-ganti-tab di area yang seharusnya tetap bisa (konten utama BusList/AnalyticsDashboard yang tidak scroll horizontal).

## 4. Batasan Teknis Tambahan

- Perubahan skema database (BUG-43) memerlukan akses Supabase CLI yang mungkin tidak tersedia bagi agent code secara otomatis — jika akses tidak tersedia, agent membuat file migrasi SQL sebagai DRAF (merepresentasikan skema yang SUDAH ADA saat ini, seakurat mungkin berdasarkan `types/supabase.ts` dan perilaku `routeService.ts`), lalu meminta pemilik proyek menjalankannya/memverifikasinya terhadap skema live yang sesungguhnya — jangan asumsikan draf ini 100% identik dengan skema live tanpa konfirmasi.
- Perubahan pada `SwipeableContainer.tsx` (BUG-39/40) harus tetap mempertahankan performa 60/120 FPS yang jadi standar animasi proyek ini (`.agents/AGENTS.md`) — hindari pengecekan `scrollWidth`/`clientWidth` yang berat dipanggil berulang kali per event `touchmove` jika swipe diperluas untuk mendeteksi gestur secara kontinu; cukup dicek sekali saat `touchstart`.

## 5. Kapan Harus Berhenti dan Bertanya ke Manusia (tambahan)

- **BUG-37, sebelum mengubah perilaku default** — sudah ditegaskan di Bagian 1.
- **BUG-42** — konfirmasi dulu apakah tanggal ikut dipulihkan penuh atau selalu lompat ke hari ini (lihat catatan di `02-rekomendasi-solusi-v3.md`).
- Jika saat memperbaiki BUG-37/38 ditemukan bahwa Supabase dashboard/RLS sama sekali tidak bisa diakses atau kredensialnya tidak tersedia untuk verifikasi — laporkan ini sebagai blocker, jangan menandai bug selesai berdasarkan asumsi konfigurasi yang benar.

## 6. Pelaporan Progres

Sama seperti v1/v2. Tambahan khusus untuk BUG-37 & BUG-38: sertakan secara eksplisit hasil pengujian manual nyata (bukan cuma hasil unit test) — mis. "Dicoba login dengan akun test@gmail.com yang sengaja tidak didaftarkan di user_profiles → ditolak dengan pesan yang sesuai ✓" dan "Diuji di Chrome Android/Safari iOS: setelah token dipaksa kedaluwarsa, muncul banner 'Login Ulang' yang berfungsi dengan satu tap, tanpa popup diblokir ✓".
