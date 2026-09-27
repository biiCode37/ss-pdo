# Tugas Gemini — revisi terarah hasil Fase 1

Paket dari Codex untuk Antigravity/Gemini. Baca `refact_81/AUDIT_BUGS.md` dan `REPAIR_REPORT.md` terlebih dahulu. Keputusan saat ini **REVISE**; fase implementasi kode berikutnya belum dibuka.

## Ruang kerja dan keluaran

Tetap di branch `devmode`. Pertahankan seluruh perubahan lokal. Jangan mengedit dokumentasi `refact_79`, `refact_80`, atau `refact_81` yang sudah selesai. Buat folder urutan baru `refactor-ss-pdo/refact_N` (periksa nomor maksimum; perkiraan berikutnya 82) untuk revisi ini.

Fase revisi ini khusus dokumen/inventory. Jangan mengubah `src/`, data operasional, konfigurasi aplikasi, atau dependency. Tidak perlu mengulang seluruh test/build bila hash source tetap sama; rujuk bukti gate yang sudah ada dan catat bahwa bukti itu bukan hasil run baru.

## Koreksi wajib

1. **Inventory lengkap yang benar:** salin hasil audit ke `COMPONENT_INVENTORY.csv` di folder baru, lalu verifikasi secara manual klasifikasi semua 167 file. Prioritaskan 23 baris yang sebelumnya diberi `Facade Re-export`, 7 baris `Page / Orchestrator`, serta file root `src/components/*.tsx`. Minimal betulkan 12 implementasi yang mislabeled sebagai facade dan 3 facade yang mislabeled sebagai page. Perbaiki `Tanggung Jawab`, `Keputusan`, dan referensi test/caller yang tidak tepat. Beri bukti ringkas cara validasi; path tetap lengkap/unik.
2. **Ritase:** perbaiki spesifikasi di audit dan batch implementasi. Formula fallback mengikuti prioritas nilai sumber lalu `route.totalTrips / 2` tanpa `Math.round` atau `.toFixed(1)`. Angka sumber dan formatting dipisahkan. Cantumkan kasus 101, 100, 0, serta sumber eksplisit.
3. **Pemulihan batch:** ganti contoh `git checkout -- ...` dan `rm -rf ...` dengan langkah aman yang membandingkan status/diff sebelum batch dan memulihkan hanya perubahan hunk/file yang dibuat batch setelah memastikan tidak ada edit lain bertumpuk. Jangan menjalankan perintah rollback pada revisi ini.
4. **Modal:** sebut R80-10 sebagai risiko bersyarat yang didukung cleanup kode, sementara dampak UI masih perlu reproduksi. Telusuri jalur aktual pembuka QueueModal/BusInputModal dan catat apakah overlap sungguh terjadi. Perbaiki kontrak scroll lock agar aman pada dua urutan penutupan, atau tunda `ModalShell` sampai kebutuhan dua konsumen nyata terbukti. Jangan mengklaim penyimpanan `prevOverflow` lokal otomatis stack-safe.
5. **Token dan pilot:** gunakan token CSS yang benar-benar didefinisikan atau rincikan penambahan token baru. Hapus `var(--bg-main)` yang belum didefinisikan. Pilot Shift 1/2 mencakup field/style yang sama; chip nyata adalah Manual/Keterangan. Jangan membawa status armada SGO/AP/AC ke pilot ini.
6. **Bukti vs hipotesis:** lunakkan klaim lag ketikan, ukuran CSS memperlambat render, dan “satu-satunya lokasi” yang belum didukung pengukuran/pencarian cakupan penuh. Tandai confirmed/suspected/needs runtime repro secara konsisten.

## Artefak di folder revisi

- `AUDIT_BUGS.md`: temuan R81 yang diperbaiki, ID, lokasi, tingkat, dampak user, mitigasi, status.
- `REPAIR_REPORT.md`: perubahan dokumen, Before vs After, Case: Skenario Lapangan per koreksi, evidence, serta status `READY_FOR_REVIEW` bila lengkap.
- `COMPONENT_INVENTORY.csv`: 167 path terkini dengan klasifikasi yang tervalidasi.
- `UI_CONTRACTS.md`: kontrak hasil koreksi, terutama token/modal/pilot.
- `IMPLEMENTATION_BATCHES.md`: rencana mikro hasil koreksi dengan file terdampak dan pemulihan aman.
- `REVIEW_RESOLUTION.md`: tabel R81-01 s.d. R81-06 berisi file/baris dokumen hasil revisi dan alasan.

## Syarat agar Codex dapat meluluskan

- Inventory cocok satu banding satu dengan path aktual dan tidak menyebut implementasi lokal sebagai facade.
- Domain ritase tidak memiliki pembulatan tambahan, baik dalam formula maupun contoh kode.
- Semua instruksi pemulihan menghormati perubahan lokal dan dapat dijalankan di Windows tanpa operasi hapus rekursif luas.
- Bug modal yang belum direproduksi ditandai bersyarat, dengan rencana pengujian dua urutan penutupan.
- Token dan konsumen pilot cocok dengan source.
- Klaim dampak dibatasi oleh bukti yang tersedia. Laporan Fase 1 tetap membedakan pekerjaan yang direncanakan dari yang sudah diterapkan.

Setelah selesai, kembalikan path folder baru dan ringkasan berbahasa Indonesia. Codex akan mereview ulang dan baru kemudian menerbitkan paket Fase 2.
