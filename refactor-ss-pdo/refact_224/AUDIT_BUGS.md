# AUDIT TEMUAN KONTROL TERJANGKAU SAAT SCROLL (TAB SIAP KIRIM): REFACTOR 224
**Modul:** Tab Siap Kirim (Monitoring), dialog detail rute & pemilih rute, navigasi bawah Monitoring, kelas bersama `.ui-chip-btn`
**Fokus Masalah:** Aplikasi dipakai petugas lapangan dengan satu tangan. Informasi konteks dan tombol aksi hilang saat menggulir, sehingga pengguna harus kembali ke ujung atas atau bawah untuk membaca konteks atau bertindak (dilaporkan pemilik saat uji tampilan refact_223).

---

### ID Temuan: BUG-UX-224-01
- **Lokasi Kode:** `ReadinessRouteDetailModal.tsx`, `WatchlistModal.tsx`
- **Keparahan:** Medium
- **Deskripsi:** Seluruh isi dialog ikut tergulir. Judul "Kelengkapan {rute}" hilang saat daftar unit panjang digulir, dan tombol Konfirmasi baru terlihat di ujung bawah. Dialog juga tidak punya tombol tutup.
- **Dampak User:** Pengguna lupa rute mana yang sedang dilihat, dan harus menggulir bolak-balik untuk bertindak.
- **Mitigasi:** Struktur header (judul + status + tombol tutup 44 px) – isi (satu-satunya bagian yang di-scroll) – footer (alasan + aksi di zona jempol).

### ID Temuan: BUG-UX-224-02
- **Lokasi Kode:** `SubmissionReadinessTab.tsx`
- **Keparahan:** Medium
- **Deskripsi:** Ringkasan dan tombol pemilih rute hilang saat daftar rute digulir.
- **Dampak User:** Untuk mengganti fokus (misalnya hanya rute janggal) atau memilih pantauan, pengguna harus kembali ke atas.
- **Mitigasi:** Satu baris kontrol sticky di bawah header Monitoring (`top: var(--sticky-header-height)` dari `ResizeObserver`): ringkasan, chip filter masalah, dan tombol ikon Pilih rute. Segmen dan pita tunggakan tetap tidak sticky agar ruang daftar luas.

### ID Temuan: BUG-UX-224-03
- **Lokasi Kode:** `MonitoringBottomNav.tsx`
- **Keparahan:** Low
- **Deskripsi:** Tidak ada jalan cepat kembali ke atas dari zona jempol.
- **Mitigasi:** Mengetuk tab yang sedang aktif menggulir ke atas (konvensi umum aplikasi mobile; sengaja tanpa teks bantuan, keputusan pemilik).

### ID Temuan: BUG-UI-224-04 (ditemukan saat review)
- **Lokasi Kode:** `src/styles/components/actions.css` (`.ui-chip-btn`)
- **Keparahan:** Medium
- **Deskripsi:** Kelas bersama `.ui-chip-btn` tidak punya gaya untuk `aria-pressed="true"`, sehingga chip filter yang aktif tampak sama dengan yang tidak aktif.
- **Mitigasi:** `.ui-chip-btn[aria-pressed="true"]` memakai `--color-state-active-bg/-fg` (sama dengan segmen aktif).

### ID Temuan: BUG-UX-224-05 (ditemukan saat review)
- **Lokasi Kode:** `SubmissionReadinessTab.tsx` (filter masalah)
- **Keparahan:** Medium
- **Deskripsi:** Bila kategori yang sedang difilter menjadi 0 (misalnya semua unit janggal sudah dibetulkan dan data masuk lewat Realtime), chip-nya hilang tetapi filter tetap aktif.
- **Dampak User:** Daftar kosong tanpa tombol untuk mematikan filter.
- **Mitigasi:** Filter efektif kembali ke "semua" bila jumlah kategori aktif 0.

## Aturan baru
`.agents/rules/ui-consistency.md` §8a dan `AGENTS.md` poin 10: kontrol penting tetap terjangkau saat scroll. Berlaku untuk Claude dan Antigravity.
