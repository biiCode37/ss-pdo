# Rekomendasi Solusi v5 — Proyek SS_PDO / SPUM

**Jenis dokumen:** Rekomendasi perbaikan untuk tiap temuan di `01-daftar-masalah-v5.md` (BUG-48 s.d. BUG-52)

---

## 🔴 KRITIS

### Solusi BUG-48 — Stored XSS di modal SweetAlert2
**Ini prioritas keamanan #1 — di atas semua temuan lain di seluruh seri audit v1–v5.**

**Pendekatan yang direkomendasikan (kombinasi):**
1. **Perbaikan cepat (wajib segera):** Tambahkan fungsi `escapeHtml(str: string): string` sederhana (mengganti `&`, `<`, `>`, `"`, `'` dengan entity HTML) di `alertUtils.ts` atau `utils/` bersama, lalu bungkus **SEMUA** ke-18 titik interpolasi `${...}` yang masuk ke atribut HTML dengan fungsi ini — termasuk yang numerik (KM/TOA), karena meski secara desain seharusnya angka, tidak ada jaminan API/upstream selalu benar-benar numerik murni.
2. **Perbaikan struktural (direkomendasikan untuk jangka menengah):** Pindahkan pengisian NILAI (bukan struktur HTML statis) dari template string ke `didOpen` callback SweetAlert2, memakai DOM API yang aman (`element.value = bus.keterangan`, BUKAN membangun ulang HTML string) — pola ini yang dipakai proyek-proyek profesional saat mencampur SweetAlert2 dengan data dinamis, karena `.value =`/`.textContent =` tidak pernah diinterpretasikan sebagai HTML.
3. **Verifikasi:** uji dengan sengaja mengisi Keterangan sebuah unit dengan payload uji aman (mis. `"><b>test</b>` — bukan payload berbahaya sungguhan) lewat Google Sheets langsung, lalu buka modal input unit itu di app; pastikan teks tampil apa adanya sebagai teks (bukan ter-render sebagai elemen HTML `<b>`).
4. **Audit lanjutan:** karena pola SweetAlert2 + HTML mentah ini kemungkinan dipakai juga di `showBulkTripModal`/`showBulkCopyKmModal` (belum sempat diverifikasi detail di audit ini), lakukan pengecekan yang sama di kedua fungsi tersebut sebelum menutup temuan ini.

### Solusi BUG-49 — Selesaikan migrasi fix ISS-02/ISS-04
**Pendekatan:**
1. Di `Dashboard.tsx`, ganti ketiga instance `.includes()` (baris 123, 1064, 1109) dengan `matchRouteSheetById()` dari `utils/sheetIdentity.ts` — pola yang sama persis yang sudah benar dipakai di `RouteSelectorCard.tsx`.
2. Ganti keenam pemanggilan `extractSheetId(...)` (fungsi lama) di `Dashboard.tsx` menjadi `extractSpreadsheetId(...)` (fungsi baru), dan tangani kasus `null` secara eksplisit di tiap titik pemanggilan (bukan diam-diam fallback ke input mentah).
3. Perbaiki `analytics.ts` baris 175 dengan pola yang sama.
4. **Setelah semua call-site bermigrasi**, pertimbangkan menghapus wrapper lama `extractSheetId` sepenuhnya dari `googleSheets.ts` (bukan sekadar membiarkannya sebagai dead code/jebakan) — supaya tidak ada lagi jalur yang diam-diam mengembalikan perilaku pra-ISS-04.
5. Tambahkan test (`sheetIdentity.test.ts` jika belum ada, atau perluas yang ada) yang secara eksplisit menguji `Dashboard.tsx`'s route-matching logic (lewat unit test terhadap fungsi yang diekstrak, bukan mengetes komponen secara utuh) dengan kasus URL yang mirip tapi ID berbeda (persis skenario yang bikin `.includes()` gagal).

---

## 🟠 SEDANG

### Solusi BUG-50 — Akurasi & observability pelacakan aktivitas
**Pendekatan:**
1. Lacak `lastHeartbeatAt` (timestamp) di dalam hook, dan saat mengirim heartbeat berikutnya, hitung durasi AKTUAL (`Date.now() - lastHeartbeatAt`) alih-alih konstanta `HEARTBEAT_SECONDS` tetap — beri batas atas wajar (mis. cap di 200 detik) untuk mengantisipasi jeda ekstrem akibat device sleep.
2. Ganti `.catch(() => {})` dengan minimal `.catch((err) => console.warn('[ActivityTracking] Gagal kirim heartbeat:', err))` — tidak perlu mengganggu UX (tetap silent ke user), tapi developer perlu jejak untuk debugging.

### Solusi BUG-51 — Perkuat baseline collision-check (opsional, hardening)
**Pendekatan:** Simpan `editStartedAt`/snapshot eksplisit (mis. `useRef` yang di-set sekali saat field pertama kali disentuh dalam sesi edit, bukan dibaca ulang dari props tiap render) sebagai baseline pembanding, terpisah dari `bus` prop yang terus mengalir. Ini murni penguatan defensif — tidak mendesak, boleh dikerjakan belakangan setelah BUG-48/49 selesai.

---

## 🟡 MINOR

### Solusi BUG-52 — Transparansi pelacakan aktivitas
**Pendekatan:** Tambahkan satu baris info singkat di layar Profil/Pengaturan (`ProfileMenuSheet.tsx` sudah ada, tempat yang pas) — mis. "Waktu aktif Anda di app tercatat untuk keperluan pemantauan operasional." Tidak perlu mekanisme opt-in/opt-out kompleks untuk alat internal, cukup transparansi dasar.

---

## Kelompok Perbaikan

- **Prioritas mutlak tunggal:** BUG-48 (XSS) — kerjakan sendiri, verifikasi menyeluruh sebelum lanjut ke yang lain, karena ini kerentanan keamanan aktif.
- **Prioritas kedua:** BUG-49 — dampaknya diam-diam dan sudah lama ada, tapi tidak seurgent BUG-48.
- **Boleh paralel/menyusul:** BUG-50, 51, 52 — independen satu sama lain, risiko rendah.
