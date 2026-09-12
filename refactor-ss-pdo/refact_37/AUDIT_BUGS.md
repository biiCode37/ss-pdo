# Laporan Audit Bug (Refactor 37)

Dokumen ini mencatat audit investigasi terkait masalah status armada: penghapusan status "BA/Kendala", kegagalan perubahan status unit kembali ke SGO, dan implementasi audit log status armada di Supabase.

---

## Ringkasan Eksekutif

| Item | Deskripsi |
| :--- | :--- |
| **Siklus Refactor** | Refact 37 |
| **Branch Wajib** | `devmode` |
| **Fokus Area** | Fleet Status Selector (`FleetStatusModal.tsx`), Shift Combination Formatter (`keteranganUtils.ts`), Supabase Append-Only Audit Trail (`fleet_status_logs`) |
| **Status Akhir** | ✅ Fixed, Tested, & Verified (329 unit tests passed, build clean) |

---

## Temuan Masalah

### BUG-37.1: Status Unit yang Kembali SGO Gagal Tersimpan Karena Overwrite di `combineShiftKeterangan`

- **ID Temuan:** BUG-37.1
- **Lokasi Terkait:** `src/utils/keteranganUtils.ts` (`combineShiftKeterangan`)
- **Tingkat Keparahan:** High (Kegagalan integritas data saat unit beroperasi kembali di tengah jam operasional)
- **Deskripsi Masalah:**
  Ketika suatu unit awalnya berstatus non-SGO (misal `TO EVDAL` atau `OFF`), `splitShiftKeterangan` mengisi `s1` dan `s2` dengan nilai tersebut.
  Saat pengawas mengubah Shift 1 menjadi SGO (`s1 = ""`), `combineShiftKeterangan` mengevaluasi:
  `if (!note1 && note2) return note2;`
  Akibatnya, fungsi tersebut mengembalikan keterangan Shift 2 (`"TO EVDAL"`).
  Nilai yang dikirim ke Google Sheets dan diupdate ke state `busData` tetap `"TO EVDAL"`.
  Unit tetap terkunci dan status SGO tidak pernah tersimpan.
- **Dampak Pengguna:**
  Pengawas operasional tidak dapat membuka kunci pengisian data untuk bus yang telah kembali beroperasi (SGO) di jam tertentu.
- **Mitigasi:**
  Format kanonik per shift di Google Sheets diubah menjadi eksplisit jika salah satu shift SGO:
  `"SGO | ${note2}"` atau `"${note1} | SGO"`.
  Dengan demikian `splitShiftKeterangan` dapat membedakan status SGO murni pada shift target.

---

### BUG-37.2: Status "BA/Kendala" Membingungkan pada Form Awal Status Armada

- **ID Temuan:** BUG-37.2
- **Lokasi Terkait:**
  - `src/components/fleetStatus/FleetStatusModal.tsx`
  - `src/constants/texts/text_fleet_status.ts`
- **Tingkat Keparahan:** Medium (UX Confusing pada penentuan kesiapan armada di awal shift)
- **Deskripsi Masalah:**
  Pada penentuan status armada awal shift, armada mikrotrans sebenarnya hanya berstatus SGO (siap jalan), T.O (tidak operasi / cadangan), atau OFF (perpal / perawatan). Pilihan "BA/Kendala" pada kuas status armada menimbulkan ambiguitas dengan form input kendala perjalanan.
- **Dampak Pengguna:**
  Pengawas bingung membedakan antara status unit siap guna operasi dengan pencatatan kendala harian.
- **Mitigasi:**
  Menghilangkan opsi "BA/Kendala" dari kuas status armada dan footer modal, sehingga hanya tersisa opsi: **`[SGO, T.O, OFF]`**.

---

### BUG-37.3: Ketiadaan Tabel Riwayat Audit Perubahan Status Armada di Supabase

- **ID Temuan:** BUG-37.3
- **Lokasi Terkait:** Database Supabase & `src/services/dailyRouteReportService.ts`
- **Tingkat Keparahan:** Medium (Audit Trail Compliance)
- **Deskripsi Masalah:**
  Sebelumnya, perubahan status armada hanya menimpa kolom snapshot `fleet_status_shift1` dan `fleet_status_shift2` pada tabel `daily_route_reports`. Tidak ada catatan kronologis mengenai jam berapa perubahan terjadi, berapa unit SGO/TO/OFF pada setiap iterasi, dan siapa pengawas yang mengonfirmasi perubahan tersebut.
- **Dampak Pengguna:**
  Tidak ada rekam jejak audit historis jika terjadi investigasi operasional terkait perubahan unit non-SGO menjadi SGO di tengah hari.
- **Mitigasi:**
  Membuat tabel append-only `public.fleet_status_logs` di Supabase dan mencatat setiap event konfirmasi sebagai baris baru permanen tanpa pernah menimpa baris sebelumnya.
