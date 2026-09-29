# Audit Codex atas paket kesiapan pilot `refact_130`

Tanggal: 29 September 2026  
Branch: `devmode`  
Keputusan: **REVISION_REQUIRED — pilot dan pengujian tulis belum dibuka**

Audit ini tidak mengubah `refact_130` atau kode aplikasi. Bukti tes, typecheck, lint, dan build pada `refact_130/evidence/` menunjukkan baseline otomatis lulus; alur live belum teruji karena URL preview, akun Google uji, serta rute/spreadsheet sandbox belum tersedia.

| ID | Lokasi | Keparahan | Temuan dan dampak pada pengguna | Mitigasi / status |
| --- | --- | --- | --- | --- |
| R131-01 | `src/hooks/useOfflineSync.ts`, `writeQueueToStorage()` dan `addToQueue()`; pemanggil `src/components/busCard/useBusCardSave.ts` | **P0** | `localStorage.setItem()` yang gagal (misalnya kuota penuh/penyimpanan diblokir) hanya di-log. `addToQueue()` tetap memperbarui state dan pemanggil menampilkan status `queued` serta toast seolah data aman. Setelah halaman ditutup atau dimuat ulang, input petugas dapat hilang. Cadangan Supabase tidak dapat diandalkan saat perangkat offline dan galatnya ditelan. | **OPEN.** Gagal menyimpan antrean harus dikembalikan sebagai kegagalan kepada pemanggil; jangan tampilkan sukses/queued palsu. Pertahankan input di form dan beri pesan ramah pengguna. Uji dengan `setItem` melempar `QuotaExceededError`/`SecurityError`. |
| R131-02 | `src/hooks/useOfflineSync.ts`, `resolveConflict()`; `src/components/dashboard/DashboardModals.tsx` pemanggilnya | **P0** | Saat pengguna memilih memakai data server, kegagalan `getBusRowData()` hanya di-log lalu `removeItem(itemId)` tetap berjalan. Perubahan lokal hilang padahal data server tidak berhasil diambil; UI juga segera memberi toast seolah resolusi selesai. | **OPEN.** Hapus item hanya sesudah pembacaan server dan pembaruan UI berhasil; saat gagal, pertahankan status `conflict` dan tampilkan galat ramah pengguna. Uji kegagalan fetch dan keberhasilan, termasuk toast. |
| R131-03 | `refact_130/AUDIT_BUGS.md` R129-02; `refact_130/REPAIR_REPORT.md` §4/§6; `git status --short -- src` | **P1, gerbang rilis** | R129-02 ditandai `CLOSED` dengan hash `HEAD` `1fb52a6`, padahal ada **37 entri perubahan di `src/`** (termasuk modul baru yang belum dilacak). Hash itu tidak mengidentifikasi kode yang lulus 675 tes dan tidak membuktikan ada deployment preview stabil yang dapat dipulihkan. Owner tidak punya kandidat/rollback yang terverifikasi. | **OPEN.** Catat kandidat yang benar setelah dua P0 diperbaiki, bukti artefak/preview yang memuat kandidat itu, dan target rollback yang sungguh tersedia. Jangan menganggap hash `HEAD` sebagai snapshot perubahan lokal. Commit, push, dan deploy tetap menunggu instruksi owner yang berlaku. |
| R131-04 | `refact_130/REPAIR_REPORT.md` §4–6 | **P1, gerbang lapangan** | Checklist menandai 0 P0/P1, sanitasi rahasia, dan rollback sebagai lulus tanpa bukti cukup; arahan `Force Save` pada antrean macet menonaktifkan pemeriksaan konflik (`originalSnapshot: undefined`) sehingga dapat menimpa perubahan server. Penghapusan item juga berisiko membuang input. Alur login/tulis/sinkronisasi live masih `UNVERIFIED`. | **OPEN.** Perbaiki klaim status dan runbook pada folder revisi baru. Dalam uji lapangan gunakan data sandbox; jangan gunakan Force Save atau Hapus untuk memulihkan item macet tanpa membandingkan data dan keputusan sadar owner. Tandai gerbang live `UNVERIFIED`. |
| R131-05 | `refact_130/evidence/baseline-tests.txt`; `vite.config.ts` | **P2, akurasi bukti** | Angka 88 berkas/675 tes mencakup setidaknya dua berkas dari `.worktrees/feat-supabase-integration/src/`, sehingga angka tersebut bukan hitungan eksklusif source tree kandidat. | **OPEN.** Saat verifikasi ulang, catat perintah dan batas cakupan yang jelas; jangan memakai angka total sebagai bukti alur live. |

## Bukti kunci

- `writeQueueToStorage()` menangkap galat tanpa meneruskannya; `addToQueue()` tetap memanggil `setQueue(newQueue)`.
- `resolveConflict()` menjalankan `removeItem(itemId)` setelah blok `catch`, termasuk saat `getBusRowData()` gagal.
- `forceConflictItem()` menghapus `originalSnapshot`; proses antrean berikutnya melewati deteksi konflik.
- `refact_130/evidence/baseline-tests.txt` mencatat 88 berkas/675 tes lulus; `baseline-build.txt` mencatat build PWA lulus. Ini bukti baseline otomatis, bukan verifikasi pilot live.
- Owner menyatakan URL preview, akun Google uji, dan rute/spreadsheet sandbox **belum tersedia**.

**Status gerbang:** P0 terbuka 2; P1 gerbang rilis/lapangan terbuka 2; pilot belum boleh dinyatakan siap. Sesudah perbaikan dan verifikasi, tulis hasilnya di folder `refact_N` baru, bukan dengan mengedit arsip ini.
