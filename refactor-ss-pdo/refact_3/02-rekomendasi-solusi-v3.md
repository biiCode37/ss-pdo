# Rekomendasi Solusi v3 — Proyek SS_PDO / SPUM

**Jenis dokumen:** Rekomendasi perbaikan untuk tiap temuan di `01-daftar-masalah-v3.md` (BUG-37 s.d. BUG-44)

---

## 🔴 KRITIS

### Solusi BUG-37 — Allowlist Supabase *fail-open*
**Ini prioritas keamanan #1 — mengizinkan akses tidak sah adalah risiko tertinggi di seluruh audit v1–v3.**

**Pendekatan yang direkomendasikan:**
1. **Ubah pola dari *fail-open* menjadi *fail-closed*** di kedua jalur bermasalah:
   - Jika `!isSupabaseConfigured` → JANGAN `return { isAllowed: true }`. Kembalikan `{ isAllowed: false, message: 'Sistem verifikasi akun belum dikonfigurasi. Hubungi Admin.' }` sebagai default aman — kecuali memang ada skenario penggunaan sah di mana app boleh berjalan TANPA Supabase sama sekali (mis. mode demo/development lokal); jika demikian, pertimbangkan flag environment eksplisit (`VITE_ALLOW_NO_AUTH_CHECK=true`) yang harus SENGAJA diaktifkan, bukan perilaku default saat variabel kosong.
   - Di blok `catch`, JANGAN `return { isAllowed: true }`. Kembalikan `{ isAllowed: false, message: 'Tidak dapat memverifikasi akun Anda saat ini (gangguan koneksi/sistem). Coba lagi dalam beberapa saat, atau hubungi Admin jika berlanjut.' }`.
2. **⚠️ Titik yang perlu dikonfirmasi ke pemilik proyek:** fail-closed berarti jika Supabase mengalami gangguan, **SEMUA** user (termasuk yang sah terdaftar) tidak bisa login sampai Supabase pulih. Ini trade-off keamanan-vs-ketersediaan yang wajar untuk gerbang otorisasi, tapi sebaiknya dipasangkan dengan: (a) pemantauan uptime Supabase (lihat `04-roadmap-menuju-production-grade.md` bagian Observability), dan (b) jalur kontak darurat yang jelas ditampilkan di pesan error (mis. nomor WhatsApp Admin) untuk petugas yang mendadak terblokir di lapangan.
3. Setelah diubah ke fail-closed, **verifikasi ulang secara langsung**: coba login dengan akun yang SENGAJA tidak didaftarkan di `user_profiles`, pastikan benar-benar ditolak. Cek juga dari sisi Supabase dashboard: pastikan kebijakan RLS tabel `user_profiles` memang mengizinkan `anon` role melakukan `SELECT` (tanpa ini, fail-closed yang baru akan menolak SEMUA orang, bukan cuma yang tidak terdaftar — perlu policy RLS seperti `CREATE POLICY "Allow anon read" ON user_profiles FOR SELECT TO anon USING (true);` atau setara, dikombinasikan dengan filter di level query).
4. Bagian dari Solusi BUG-43 di bawah — dokumentasikan policy RLS ini sebagai kode, bukan konfigurasi tersembunyi di dashboard.

### Solusi BUG-38 — Auto re-auth tanpa gesture klik
**Pendekatan yang direkomendasikan (kombinasi, bukan salah satu saja):**
1. **Jangan panggil `reauthenticateSession()` secara otomatis dari `withAuthRetry`.** Sebagai gantinya, saat silent refresh (`ensureValidToken`) gagal DAN API call masih 401/403, `withAuthRetry` cukup dispatch event `google-auth-expired` (sudah ada) lalu langsung `throw err` — jangan mencoba popup otomatis sama sekali.
2. **Tangkap event `google-auth-expired` di level atas** (`App.tsx` atau `Dashboard.tsx`) dan tampilkan UI yang jelas & persisten (banner/modal, BUKAN sekadar pesan error yang lewat) berisi tombol **"Login Ulang"** yang eksplisit harus di-tap user. Pemanggilan `reauthenticateSession()`/`signIn()` dilakukan dari `onClick` tombol ini — ini SATU-SATUNYA cara yang andal lolos dari pemblokiran popup browser, karena benar-benar dipicu gesture klik langsung.
3. Perpanjang timeout silent refresh di `refreshTokenInteractiveOrSilent` dari 3.5 detik menjadi lebih longgar (mis. 8-10 detik) — mengingat target pengguna eksplisit disebut "sinyal lemah di lapangan" di `.agents/AGENTS.md`, 3.5 detik kemungkinan terlalu ketat dan menyebabkan silent refresh dianggap gagal padahal sebenarnya cuma lambat.
4. **Wajib diuji langsung di browser mobile sungguhan** (Chrome Android & Safari iOS minimal) — perilaku pemblokiran popup berbeda-beda antar browser/OS, tidak cukup diuji di desktop saja.

---

## 🔴 UX Kritis (Swipe Navigation)

### Solusi BUG-39 & BUG-40 — Swipe halaman memicu di area scroll (kategori kolom & grafik tren)
**Pendekatan langsung (perbaikan cepat):**
1. Tambahkan class `no-swipe` ke `category-scroll-container` di `BusList.tsx` dan ke container scroll grafik di `DailyToaTrendCard.tsx` (bisa digabung dengan `no-scrollbar` yang sudah ada: `className="no-scrollbar no-swipe"`).

**Pendekatan lebih tahan lama (direkomendasikan sebagai perbaikan jangka menengah):**
2. Alih-alih mengandalkan daftar class pengecualian manual (yang gampang terlupa setiap kali menambah komponen baru dengan scroll horizontal — persis seperti yang terjadi di BUG-40), ubah `SwipeableContainer.tsx` agar mendeteksi SECARA PROGRAMATIK: saat `touchstart`, telusuri `target.closest()` ke atas mencari elemen dengan `scrollWidth > clientWidth` DAN `overflowX` bukan `visible`/`hidden` (elemen yang benar-benar bisa di-scroll horizontal) — jika ditemukan, otomatis nonaktifkan deteksi swipe untuk sentuhan itu, TANPA perlu class manual apa pun. Ini menghilangkan seluruh kelas bug ini secara struktural untuk komponen scroll horizontal yang akan ditambahkan di masa depan.

---

## 🟠 SEDANG

### Solusi BUG-41 — Rute+Bulan+Tahun jadi 3 selector terpisah
**Pendekatan:**
1. Ubah UI pemilihan (bukan form "Tambah Rute Baru", tapi selector UTAMA untuk melihat data) menjadi 3 tingkat: **Rute** (dropdown berisi `route_code` unik saja, tanpa bulan/tahun) → **Bulan** (dropdown, hanya menampilkan bulan yang punya data untuk rute terpilih) → **Tahun** (dropdown/selector, hanya menampilkan tahun yang punya data untuk kombinasi rute+bulan terpilih).
2. Turunkan `sheetUrl` secara otomatis dari kombinasi ketiga pilihan ini (cari di `flatSheets` yang cocok `routeCode + month + year`), bukan dipilih langsung dari satu dropdown gabungan.
3. Tangani kasus kombinasi yang belum punya data (mis. rute dipilih tapi belum ada sheet untuk bulan/tahun tertentu) dengan pesan yang jelas, bukan dropdown kosong yang membingungkan.
4. Form "Tambah Rute Baru" yang sudah punya `newMonth`/`newYear` terpisah bisa dijadikan referensi pola UI yang sama.

### Solusi BUG-42 — Simpan & pulihkan rute+tanggal terakhir
**Pendekatan:**
1. Setiap kali `sheetUrl`/`selectedTab` (atau, setelah BUG-41 selesai: routeCode/month/year/tanggal) berubah DAN berhasil dimuat (`handleLoadData` sukses), simpan ke `localStorage` (mis. key `PDO_LAST_VISITED`).
2. Saat aplikasi dimuat, baca `PDO_LAST_VISITED` lebih dulu SEBELUM fallback ke `flat[0]`/tanggal hari ini. Hanya gunakan default (rute pertama, tanggal hari ini) jika benar-benar tidak ada riwayat tersimpan (pengguna baru pertama kali).
3. Pertimbangkan (opsional, konfirmasi dulu ke pemilik produk): apakah TANGGAL harus ikut dipulihkan persis seperti terakhir dikunjungi, atau selalu lompat ke tanggal HARI INI (tapi tetap di RUTE terakhir)? Keduanya masuk akal tergantung alur kerja petugas — sebaiknya ditanyakan, bukan diasumsikan.

---

## 🟠 Proses & Dokumentasi

### Solusi BUG-43 — Skema Supabase tidak ter-*version control*
**Pendekatan:** Gunakan Supabase CLI (`supabase migration new <nama>`) untuk mengekspor skema tabel yang sudah ada saat ini ke file SQL, simpan di folder `supabase/migrations/` dalam repo. Tuliskan juga kebijakan RLS untuk tiap tabel secara eksplisit sebagai SQL (`CREATE POLICY ...`), khususnya untuk `user_profiles` (kunci dari Solusi BUG-37). Dokumentasikan langkah `supabase db push` di README untuk setup environment baru.

### Solusi BUG-44 — Label `.env.example` menyesatkan
**Pendekatan:** Ganti komentar dari:
```
# Supabase (Optional for metadata registry & audit logs)
```
menjadi sesuatu seperti:
```
# Supabase (PENTING — mengontrol allowlist keamanan login/otorisasi user.
# Jika dikosongkan, verifikasi user TIDAK aktif — lihat BUG-37/routeService.ts)
```

---

## Kelompok Perbaikan (untuk perencanaan implementasi v3)

- **Prioritas Tertinggi — Kelompok Keamanan Auth:** BUG-37, 38, 43, 44 — semuanya saling terkait di rantai login/otorisasi. BUG-37 (fail-closed) sebaiknya SELESAI lebih dulu sebelum atau bersamaan dengan BUG-43 (RLS ter-dokumentasi), karena fail-closed yang salah konfigurasi RLS-nya justru akan mengunci SEMUA orang.
- **Kelompok Swipe Navigation:** BUG-39, 40 — perbaikan cepat sekaligus (tambah class), lalu perbaikan struktural (deteksi programatik) sebagai tindak lanjut.
- **Kelompok Route/Date UX:** BUG-41, 42 — direkomendasikan dikerjakan BERSAMAAN karena BUG-42 (simpan state terakhir) akan lebih rapi diimplementasikan setelah struktur 3-selector dari BUG-41 selesai (menyimpan `routeCode+month+year+tanggal` sebagai 4 nilai terpisah lebih jelas daripada menyimpan `sheetUrl` mentah).
