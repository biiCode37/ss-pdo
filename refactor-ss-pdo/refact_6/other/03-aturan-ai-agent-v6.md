# Aturan & Ketentuan Kerja untuk AI Coding Agent v5 — Proyek SS_PDO / SPUM

**Jenis dokumen:** Instruksi kerja mengikat untuk babak perbaikan kelima ini.
**Dokumen rujukan wajib:** `01-daftar-masalah-v5.md`, `02-rekomendasi-solusi-v5.md`.
**Dokumen yang TETAP BERLAKU bersamaan:** `.agents/AGENTS.md`, seluruh `03-aturan-ai-agent*.md` sebelumnya (v1–v4), DAN prioritas dari `refactor-ss-pdo/refact_5/03_prompt_ai_agent_ss_pdo_refactor5.md` (audit ISS-XX) sejauh masih relevan dengan sisa ISS yang belum terverifikasi (ISS-05, 07, 09, 10).

---

## 1. Prioritas Mutlak Tertinggi: BUG-48 (Keamanan — XSS)

Ini kerentanan keamanan paling serius yang pernah ditemukan di seluruh siklus audit proyek ini. Diperlakukan di atas SEMUA pekerjaan lain, termasuk pekerjaan yang sedang berjalan dari babak sebelumnya yang belum selesai.

1. Kerjakan BUG-48 lebih dulu, sebelum apa pun.
2. **Setelah perbaikan, WAJIB audit menyeluruh** seluruh `alertUtils.ts` (1467 baris) untuk memastikan tidak ada titik interpolasi HTML tak ter-escape yang tertinggal — jangan berhenti di 3 contoh yang disebutkan di dokumen masalah, itu hanya sampel. Termasuk periksa `showBulkTripModal` dan `showBulkCopyKmModal` yang belum sempat diverifikasi detail.
3. **Verifikasi TIDAK cukup lewat unit test saja** — sertakan pengujian manual nyata: isi field Keterangan sebuah unit uji dengan payload yang bisa memecah HTML (pakai payload AMAN untuk testing, bukan payload berbahaya sungguhan), buka modal input, pastikan tampil sebagai teks apa adanya.
4. Jangan menganggap kode "aman karena inputnya numerik" — beberapa dari 18 titik interpolasi memang untuk field numerik, tapi perbaikan harus diterapkan merata ke SEMUA titik tanpa pengecualian, karena asumsi "pasti numerik" adalah salah satu akar masalah yang sudah berulang kali terbukti keliru di proyek ini (lihat riwayat bug parsing angka).

## 2. Urutan Prioritas Setelah Bagian 1

1. **BUG-49** — migrasi penuh perbaikan ISS-02/04, prioritas tinggi karena file sentral (`Dashboard.tsx`) dan dampaknya senyap.
2. **BUG-50** — perbaikan akurasi & observability telemetri.
3. **BUG-51, BUG-52** — opsional/hardening, boleh menyusul.

## 3. Prinsip Kerja Tambahan Khusus Babak Ini

- **Pola "perbaikan baru tidak menyebar ke semua call-site lama" sudah terjadi berulang kali di proyek ini** (parseIndonesianNumber: BUG-20→26→45; sheet-matching: ISS-02/04→BUG-49). Sebelum menandai perbaikan APA PUN selesai — bukan cuma di babak ini — **WAJIB `grep` menyeluruh ke seluruh `src/`** untuk pola lama yang digantikan, bukan hanya memperbaiki lokasi yang disebutkan di laporan bug. Ini bukan saran, ini syarat definition-of-done mulai babak ini dan seterusnya.
- **Untuk kode yang mencampur teknologi berbeda** (React + SweetAlert2/raw HTML, seperti kasus BUG-48): waspadai bahwa asumsi keamanan React (auto-escaping JSX) TIDAK berlaku otomatis di teknologi lain yang dicampur ke dalamnya. Setiap kali menulis kode di luar pola React biasa (HTML string manual, `dangerouslySetInnerHTML`, library pihak ketiga yang menerima HTML mentah), secara eksplisit pikirkan ulang keamanan input dari nol — jangan asumsikan proteksi React ikut berlaku.
- **Ada audit independen lain** (`refact_5`, penomoran ISS-XX) yang bekerja paralel dengan seri audit ini. Jika menemukan tumpang tindih di masa depan, utamakan MEMVERIFIKASI status terkini di kode (seperti yang dilakukan dokumen ini), bukan mengasumsikan salah satu audit "menang" atas yang lain — keduanya valid, cross-check keduanya.

## 4. Batasan Teknis

- Perbaikan BUG-48 tidak boleh menambah dependency besar (mis. `DOMPurify` penuh) kecuali benar-benar diperlukan — fungsi `escapeHtml` sederhana (beberapa baris) sudah cukup untuk kasus ini (escaping atribut HTML dasar), sesuai prinsip proyek untuk menjaga bundle size kecil.
- Perubahan di `Dashboard.tsx` untuk BUG-49 harus diuji ulang terhadap skenario race condition yang sudah diperbaiki sebelumnya (BUG-19) — pastikan penggantian fungsi matching tidak mengganggu proteksi `requestIdRef`/`AbortController` yang sudah ada di file yang sama.

## 5. Kapan Harus Berhenti dan Bertanya ke Manusia

- Jika audit menyeluruh BUG-48 (poin 1.2) menemukan bahwa pola serupa juga ada di tempat yang JAUH lebih luas dari perkiraan (mis. ternyata ada banyak file lain yang juga membangun HTML mentah), laporkan skala sebenarnya sebelum melanjutkan — mungkin perlu solusi struktural (poin 2 di `02-rekomendasi-solusi-v5.md`) sejak awal, bukan sekadar tambal di 18 titik yang sudah teridentifikasi.
- BUG-51 sengaja dicatat sebagai "perlu verifikasi lanjutan", bukan bug pasti — jika saat mengerjakannya ditemukan bukti konkret (skenario reproduksi nyata) bahwa ini memang bug aktif, naikkan derajatnya dan laporkan sebagai temuan baru dengan ID berikutnya (BUG-53), jangan diam-diam digabung ke BUG-51 seolah sudah dikonfirmasi sejak awal.

## 6. Pelaporan Progres

Sama seperti babak sebelumnya. Untuk BUG-48, sertakan secara eksplisit: (a) daftar SEMUA titik interpolasi yang diperbaiki (bukan cuma 3 contoh di dokumen), (b) hasil pengujian manual dengan payload uji aman, (c) konfirmasi `showBulkTripModal`/`showBulkCopyKmModal` sudah turut diperiksa.
