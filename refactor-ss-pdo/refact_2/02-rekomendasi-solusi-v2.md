# Rekomendasi Solusi v2 — Proyek SS_PDO (Sistem Pencatatan Shift Bus)

**Jenis dokumen:** Rekomendasi perbaikan untuk tiap temuan di `01-daftar-masalah-v2.md` (BUG-18 s.d. BUG-36)
**Cara pakai:** ID solusi mengikuti ID bug yang sama. Untuk BUG-01 s.d. BUG-17, lihat `02-rekomendasi-solusi.md` (v1) — semuanya sudah terverifikasi terpasang dengan benar di kode saat ini, kecuali BUG-13 (lihat BUG-29 di sini).

---

## 🔴 KRITIS

### Solusi BUG-18 — ❌ DICABUT, tidak perlu tindakan
Temuan ini keliru (lihat catatan retraksi di `01-daftar-masalah-v2.md`). Kolom "Kilometer Awal/Akhir Shift 1/2" ternyata memang ada di seluruh file contoh nyata — audit awal salah karena tampilan kolom sempat dipotong. **Tidak ada solusi yang perlu dikerjakan untuk item ini.**

### Solusi BUG-19 — Race condition ganti tab/tanggal
**Pendekatan:**
1. Gunakan `AbortController`: setiap kali `handleLoadData` dipanggil, batalkan request sebelumnya yang masih berjalan (simpan referensi controller di `useRef`, panggil `.abort()` di awal pemanggilan baru sebelum membuat controller baru).
2. Sebagai lapisan pengaman kedua (defense in depth): beri setiap pemanggilan `handleLoadData` sebuah nomor urut lokal (`requestIdRef.current += 1`), simpan nomor urut saat request dimulai, dan sebelum melakukan `setBusData`/`setCurrentSheetId`/dst. di blok `try`, periksa apakah nomor urut ini masih yang TERBARU (`if (thisRequestId !== requestIdRef.current) return;` — abaikan hasil yang sudah usang).
3. Terapkan pola yang sama pada pemilihan rute (bukan hanya tab tanggal), karena `onLoadData` di `RouteSelectorCard` bisa mengalami risiko serupa jika ditekan berkali-kali dengan cepat.

### Solusi BUG-20 — Parsing angka salah di `calculateAnalytics`
**Pendekatan:** Ganti seluruh `parseInt(bus.X, 10)` dan `parseFloat(bus.Y)` di `calculateAnalytics` dengan `parseIndonesianNumber()` yang sudah diekspor dari `services/googleSheets.ts` (tinggal di-import). Setelah diganti, tambahkan kasus uji baru di `analytics.test.ts` (idealnya dengan test-runner sungguhan, lihat Solusi BUG-32) yang secara eksplisit menguji nilai berformat ribuan (`"1.234"` harus terbaca `1234`, bukan `1`) dan desimal Indonesia (`"45,5"` harus terbaca `45.5`).

### Solusi BUG-21 — Pembulatan di `getMonthlyToaTrend`
**Pendekatan:** Hapus `Math.round(...)`, kembalikan `finalDayTotal` apa adanya (`number`, presisi penuh). Jika tampilan grafik memerlukan pembulatan untuk KETERBACAAN visual (mis. label sumbu Y), lakukan pembulatan HANYA pada level presentasi/formatting angka di komponen chart (`DailyToaTrendCard.tsx`), bukan pada data mentah yang disimpan/dikembalikan — sehingga nilai asli presisi tetap tersedia bila dibutuhkan (mis. tooltip saat hover menampilkan angka penuh).

### Solusi BUG-22 — "Gunakan Data Server" tidak refresh data
**Pendekatan:** Ubah `resolveConflict` agar menerima data server yang sudah didapat sebelumnya dari proses collision-check (`remoteData` di `processQueue`) dan teruskan lewat callback `onSyncSuccess` (atau callback baru khusus, mis. `onConflictResolvedWithServerData`) ke `Dashboard.tsx`, sehingga `handleUpdateBus` dipanggil dengan data SERVER (bukan data lokal user) untuk baris terkait — memperbarui tampilan secara langsung tanpa memerlukan refresh manual.

### Solusi BUG-23 — `onAuthError` tidak terhubung
**Pendekatan:** Di `Dashboard.tsx`, lengkapi pemanggilan `useOfflineSync({...})` dengan `onAuthError: () => setError(formatUserError({ status: 401 }, 'Sesi login Anda telah berakhir...'))` (atau tampilkan lewat mekanisme banner/toast yang sama dengan error lain di Dashboard). Pastikan pesan yang muncul konsisten dengan wording di `errorFormatter.ts` (lihat juga Solusi BUG-30) dan idealnya juga memicu status "perlu login ulang" yang terlihat jelas (mis. menonaktifkan tombol simpan sampai user login ulang), bukan sekadar pesan sekali-lewat yang mudah terlewat.

---

## 🟠 SEDANG

### Solusi BUG-24 — Tidak ada retry terjadwal otomatis
**Pendekatan:** Tambahkan `setInterval` ringan (mis. tiap 30–60 detik) di dalam `useOfflineSync` yang memanggil `processQueue()` HANYA jika ada item berstatus `'pending'` dengan `retryCount > 0` di antrean DAN `navigator.onLine` bernilai true — hindari polling terus-menerus tanpa syarat agar tidak boros baterai/kuota. Pastikan interval ini dibersihkan (`clearInterval`) saat komponen unmount.

### Solusi BUG-25 — Delay retry sia-sia setelah item 'failed'
**Pendekatan:** Pindahkan `const delay = ...; await sleep(delay);` ke DALAM cabang `else` (retry masih berlanjut) saja. Untuk cabang `if (newRetryCount >= MAX_RETRIES)` (item baru ditandai gagal permanen), lanjutkan ke item berikutnya TANPA delay tambahan (atau dengan delay sangat singkat, mis. 200-500ms, hanya untuk mencegah pemrosesan yang terlalu instan/berat bagi UI).

### Solusi BUG-26 — Deteksi header di `getMonthlyToaTrend` tidak konsisten
**Pendekatan:** Ekstrak logika deteksi header (termasuk validasi ≥50% teks dari BUG-10) dan pembangunan composite header dari `getBusData` menjadi SATU fungsi helper bersama (mis. `detectHeaderRowAndBuildComposite(rows)`), lalu panggil helper yang sama dari `getBusData` maupun `getMonthlyToaTrend`. Ini juga mengurangi risiko duplikasi serupa muncul lagi di masa depan (lihat juga prinsip di `03-aturan-ai-agent-v2.md`).

### Solusi BUG-27 — Form rute baru berbagi state
**Pendekatan:** Tambahkan state terpisah `const [newRouteUrl, setNewRouteUrl] = useState('')` khusus untuk input di panel "Tambah Rute Baru", TIDAK memakai `sheetUrl`/`setSheetUrl` yang aktif. `handleSaveRoute` memakai `newRouteUrl` untuk disimpan (dan boleh sekaligus meng-aktifkan-nya lewat `setSheetUrl(newRouteUrl)` SETELAH berhasil disimpan, bukan selama proses mengetik). Tombol batal (X) cukup me-reset `newRouteUrl` ke string kosong tanpa menyentuh `sheetUrl` sama sekali.

### Solusi BUG-28 — Pil ringkas menampilkan data belum termuat
**Pendekatan:** Turunkan `displayRouteTitle`/`Tgl {selectedTab}` pada pil ringkas dari `currentSheetId`/`currentTabName` yang SUDAH DIKONFIRMASI termuat (state yang di-update Dashboard SETELAH `getBusData` sukses), bukan dari `sheetUrl`/`selectedTab` yang baru dipilih di dropdown. Header form yang bisa diklik untuk menciutkan sebaiknya juga disable jika `sheetUrl`/`selectedTab` saat ini belum sama dengan `currentSheetId`/`currentTabName` yang benar-benar termuat (menandakan ada pilihan baru yang belum di-"Load").

### Solusi BUG-29 — Regresi pencegahan rute duplikat
**Pendekatan:** Kembalikan pengecekan yang sama seperti solusi BUG-13 di v1 — sebelum `setSavedRoutes`, cek `savedRoutes.some(r => extractSheetId(r.url) === extractSheetId(url))`; jika sudah ada, tampilkan pesan informatif dan batalkan penyimpanan alih-alih menambah duplikat. **Tambahan untuk mencegah regresi berulang:** karena ini adalah perbaikan v1 yang hilang akibat refactor UI besar-besaran, catat secara eksplisit di komentar kode (mis. `// BUG-13/BUG-29: JANGAN hapus pengecekan duplikat ini saat refactor UI`) agar lebih tahan terhadap refactor berikutnya.

### Solusi BUG-30 — Pesan error auth tidak konsisten
**Pendekatan:** Hapus percabangan manual di `BusCard.tsx` (baris 232–235) yang membuat pesan sendiri; ganti dengan memanggil `formatUserError(err, ...)` di SEMUA cabang error (termasuk yang saat ini hardcoded), sehingga `errorFormatter.ts` benar-benar menjadi satu-satunya sumber kebenaran untuk teks pesan yang dilihat user. `isAuthError()` di `useOfflineSync.ts` boleh tetap ada sebagai fungsi deteksi (dipakai untuk logika alur, bukan teks), tapi teks pesannya harus tetap mengambil dari `errorFormatter.ts` di titik manapun pesan itu ditampilkan ke user.

### Solusi BUG-31 — Aturan `.includes('unit')` terlalu longgar
**Pendekatan:** Perketat kondisi menjadi pencocokan yang lebih spesifik terhadap pesan error ASLI yang benar-benar dilempar kode ini sendiri, misalnya `lowerMsg.includes('tidak bisa menemukan kolom')` atau `lowerMsg.includes('no body')` (keduanya sudah cukup unik dan berasal dari pesan error yang memang ditulis sendiri di `getBusData`), dan HAPUS kondisi generik `lowerMsg.includes('unit')` yang berdiri sendiri.

---

## 🟡 MINOR

### Solusi BUG-32 — Tidak ada test runner sungguhan
**Pendekatan:** Pasang `vitest` (paling natural karena proyek sudah memakai Vite) sebagai devDependency, tambahkan script `"test": "vitest run"` di `package.json`, lalu migrasikan `analytics.test.ts`/`errorFormatter.test.ts` dari pola `console.assert` + self-invoke menjadi `describe`/`it`/`expect` standar vitest. Ini tergolong peningkatan infrastruktur (bukan bug yang mendesak) — boleh dikerjakan belakangan, tapi sebaiknya dilakukan SEBELUM/BERSAMAAN dengan Solusi BUG-20 agar kasus uji format angka Indonesia yang baru benar-benar tervalidasi otomatis.

### Solusi BUG-33 — Hapus dead code `SyncQueueBadge.tsx`
**Pendekatan:** Hapus file `src/components/SyncQueueBadge.tsx` sepenuhnya dari repo (sudah dipastikan tidak dipakai di manapun).

### Solusi BUG-34 — `bus.unit` mentah sebagai DOM id
**Pendekatan:** Buat fungsi kecil `slugifyUnitId(unit: string)` yang menghasilkan id aman (mis. mengganti spasi/karakter non-alfanumerik dengan `-`), dipakai konsisten di `BusCard.tsx` (saat set `id`) dan `Dashboard.tsx` (saat `getElementById`). Untuk risiko duplikat, tidak perlu solusi rumit — cukup pastikan proses input data mendorong keunikan `unit` (di luar cakupan kode aplikasi ini, lebih ke tata kelola data sheet).

### Solusi BUG-35 — Tab default Analytics
**Pendekatan:** Bukan bug teknis — cukup konfirmasi ke pemilik produk: siapa pengguna utama yang membuka aplikasi setelah data dimuat (petugas entri di lapangan vs pengawas)? Sesuaikan default `mainTab` sesuai jawabannya. Tidak memerlukan perubahan kode sampai keputusan ini diambil.

### Solusi BUG-36 — Pembulatan `totalPassengers`
**Pendekatan:** Konfirmasi dulu ke pemilik proyek apakah `Total Pelanggan` di sheet sumber memang bisa berupa pecahan. Jika TIDAK PERNAH pecahan (murni hitungan orang), pembulatan ini aman dan boleh dibiarkan — cukup tambahkan komentar kode yang menjelaskan kenapa field ini secara sengaja berbeda dari yang lain. Jika BISA pecahan, hapus `Math.round()` agar konsisten dengan field SSOT lainnya.

---

## Kelompok Perbaikan (untuk perencanaan implementasi v2)

- **Prioritas Tertinggi:** BUG-19 (race condition ganti tab/tanggal) — berdiri sendiri, dampaknya langsung ke integritas data (bisa tersimpan ke hari yang salah), kerjakan lebih dulu.
- **Kelompok Antrean Offline v2:** BUG-22, BUG-23, BUG-24, BUG-25 (semuanya di `useOfflineSync.ts`/interaksinya dengan `Dashboard.tsx`, melanjutkan kelompok yang sama dari v1).
- **Kelompok Route Selector:** BUG-27, BUG-28, BUG-29 (semuanya di `RouteSelectorCard.tsx`/`Dashboard.tsx`, saling terkait karena berasal dari komponen yang sama).
- **Kelompok Konsistensi Error Message:** BUG-30, BUG-31 (di `errorFormatter.ts` dan titik-titik pemanggilnya).
- **Independen:** BUG-19, BUG-20, BUG-21, BUG-26, BUG-32, BUG-33, BUG-34, BUG-35, BUG-36.
