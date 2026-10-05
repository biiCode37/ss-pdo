# Audit Codex — Revisi Riwayat Back Batch 3.5 (`refact_127`)

Tanggal: 29 September 2026  
Branch: `devmode`  
Keputusan: **READY_FOR_REVIEW**

---

## R126-01 — Sinkronisasi Riwayat Back Nyata pada Modal Bertumpuk & Tunggal

- **Lokasi kode:**
  - `src/utils/historyNavigation.ts:55-78` (`handlePopState`)
  - `src/utils/historyNavigation.ts:145-160` (`removeBackNavigation`)
  - `src/components/busCard/BusInputModal.test.tsx:990-1224`
  - `src/utils/historyNavigation.test.ts:54-158`
- **Keparahan:** Tinggi (Mitigasi Selesai & Terverifikasi Penuh).
- **Deskripsi Masalah Awal:**
  Pada implementasi sebelumnya (`refact_125`), saat terjadi Back ganda nyata sebelum modal atas selesai unmount (`isDismissing: true`), sistem mencoba memulihkan state dengan memanggil `history.pushState({ pdoNavId: topEntry.id }, '')`. Sesuai spesifikasi W3C HTML History API, pemanggilan `pushState` saat pointer browser berada di belakang ujung riwayat akan memotong (*truncate*) seluruh entri forward history. Hal ini menghapus state riwayat milik modal bawah (`bus-modal`). Akibatnya, saat modal atas selesai unmount dan memanggil `removeBackNavigation`, pointer riwayat jatuh ke `pdoRootGuard` padahal modal Bus masih terbuka di layar. Jika pengguna menekan Back berikutnya, aplikasi melompat keluar ke dashboard/toast keluar alih-alih menutup modal Bus. Selain itu, tes sebelumnya hanya menggunakan `window.dispatchEvent(new PopStateEvent('popstate'))` yang tidak menguji mutasi pointer `history.state` browser yang sebenarnya.
- **Mitigasi yang Diterapkan:**
  1. **Pemulihan Non-Destruktif dengan `history.forward()`:** Menggantikan pemanggilan `pushState` dengan traversal maju `history.forward()` berpasangan dengan flag `isProgrammaticPop = true` ketika pointer traversal browser mundur melampaui target yang sah. Traversal maju ini mengembalikan pointer browser ke state modal yang valid tanpa merusak atau memotong riwayat forward.
  2. **Validasi Target Riwayat Dinamis:** Menghitung `targetId` yang sah: jika terdapat modal di bawahnya pada stack (`navigationStack.length > 1`), targetnya adalah `navigationStack[navigationStack.length - 2].id`; jika modal tunggal, targetnya adalah `pdoRootGuard`. Pemulihan hanya dipicu bila pointer browser melompati target tersebut.
  3. **Idempotensi Cleanup Unmount (`removeBackNavigation`):** Karena pointer browser telah diposisikan di target yang sah oleh traversal awal, saat modal atas unmount dan memanggil `removeBackNavigation(topId)`, evaluasi `history.state?.pdoNavId === topId` bernilai `false`. Dengan demikian, tidak terjadi pemanggilan `history.back()` ganda yang merusak, dan `history.state.pdoNavId` tetap menunjuk ke modal Bus yang masih aktif.
  4. **Pengujian Riwayat Riil (Real `history.back()`):** Memperbarui seluruh pengujian di `BusInputModal.test.tsx` dan `historyNavigation.test.ts` agar menggunakan `window.history.back()` browser yang sebenarnya (lengkap dengan event `popstate` asinkron dan verifikasi mutasi `history.state` serta `history.length`).
- **Dampak User:**
  Pengguna operasional di lapangan yang menekan tombol Back fisik/gesture Android secara berulang/cepat pada dialog bertumpuk kini tidak akan mengalami inkonsistensi riwayat. Modal atas tertutup secara elegan, form Bus tetap aktif dengan riwayat utuh, dan penekanan Back berikutnya menutup form Bus secara aman tanpa risiko draft hilang atau aplikasi keluar tiba-tiba.
- **Status:** **CLOSED**.

---

## Status Temuan Keseluruhan

| ID | Lokasi | Keparahan | Deskripsi/Dampak Awal | Mitigasi Terverifikasi | Status |
| --- | --- | --- | --- | --- | --- |
| **R124-01** | `historyNavigation.ts`, `BusInputModal.tsx` | Sedang | Back kedua dalam 220 ms dapat memanggil modal bawah/root. | Guard `isDismissing` menahan callback modal bawah; kini disempurnakan dengan sinkronisasi riwayat nyata. | **CLOSED** |
| **R124-02** | `refact_123` & `refact_125` | Rendah | Klaim SweetAlert2 dan metode hitung baris ambigu. | Ditutup pada `refact_125` & `refact_126`. Dokumentasi baris fisik & source code diverifikasi terpisah. | **CLOSED** |
| **R126-01** | `historyNavigation.ts`, `BusInputModal.test.tsx` | Tinggi | `history.state` hilang dari modal Bus setelah dua Back nyata pada modal bertumpuk. | Diperbaiki dengan `history.forward()` non-destruktif dan dites dengan `history.back()` nyata. | **CLOSED** |

---

## Gerbang Kualitas Independen

- `vitest run src/utils/historyNavigation.test.ts src/components/dashboard/QueueReportIntegration.test.tsx src/components/busCard/BusInputModal.test.tsx`:
  - **3 berkas, 45 tes lulus (100%)**, durasi ~2.92s.
- `vitest run src/`:
  - **88 berkas, 675 tes lulus (100%)**, 0 gagal, exit code 0.
- `oxlint` (terarah pada file yang diubah):
  - **4 berkas diperiksa, 0 warnings, 0 errors**.
- `tsc -b`:
  - **Lulus tanpa error (exit code 0)**.
- `vite build --emptyOutDir false`:
  - **Lulus tanpa error, bundel PWA ter-generate sukses**.
- `graphify update .`:
  - **Berhasil diperbarui (6600 nodes, 10530 edges, 525 communities)**.
- **Catatan Batas Verifikasi Mobile Fisik:**
  Pengujian dilakukan secara deterministik pada environment Happy DOM dengan simulasi penuh W3C History API (`pushState`, `back`, `forward`, `popstate`), serta koordinasi scroll lock dan focus trap. Verifikasi pada peranti fisik Android WebView / Safari iOS standalone belum diuji secara perangkat keras fisik pada sesi ini.
