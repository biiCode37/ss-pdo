# AUDIT TEMUAN UJI COBA LAPANGAN INPUT SS: REFACTOR 208
**Modul:** Input SS (Set Jumlah Trip / Set Trip Terpilih), navigasi swipe antar tab, pewarnaan ritase kartu unit (Input SS & Armada)
**Fokus Masalah:** Tiga temuan pemilik saat mencoba aplikasi setelah refact_206–207: trip massal tidak bisa dikosongkan, scroll cepat berpindah tab sendiri, dan ritase setengah (8/7) tampil kuning.

---

### ID Temuan: BUG-TRIP-208-01
- **Lokasi Kode:** `src/utils/modals/bulkModals.ts` (`showBulkTripModal` → `preConfirm`), `src/components/busList/useBulkOperations.ts` (`handleOpenBulkTripModal`, `handleApplyTripToSelected`)
- **Keparahan:** Medium (salah isi trip massal tidak bisa dibatalkan dari aplikasi)
- **Deskripsi:** Validasi modal menolak kolom kosong (`REQUIRED`). Satu-satunya cara "menghapus" adalah mengisi 0, yang menulis angka 0 ke SS, bukan sel kosong. Tab Ritase per unit sudah bisa mengosongkan.
- **Dampak User:** Salah Set Jumlah Trip di tanggal/rute yang keliru harus dibersihkan manual di Google Sheets satu per satu, atau meninggalkan angka 0 yang dibaca sebagai data.
- **Mitigasi:** Kedua kolom kosong = hapus trip (kirim `""`). Hanya satu kolom kosong → pesan validasi. Wajib dialog konfirmasi (aksi massal destruktif). Target rute di tombol direset setelah sukses.

### ID Temuan: BUG-NAV-208-02
- **Lokasi Kode:** `src/components/SwipeableContainer.tsx` (`handleTouchEnd`)
- **Keparahan:** High (kehilangan konteks kerja tiba-tiba saat input lapangan)
- **Deskripsi:** Swipe hanya dinilai dari titik awal vs akhir sentuhan: `|dx| ≥ 50px` dan `|dx| > |dy| × 1,2`. Saat scroll vertikal cepat, jempol melengkung ke samping sehingga gestur scroll lolos sebagai swipe. Tidak ada penguncian arah, pengecekan halaman ikut ter-scroll, maupun `touchcancel`.
- **Dampak User:** PDO yang menggulir daftar unit tiba-tiba terlempar ke halaman "Armada" (atau Dashboard).
- **Mitigasi:** Kunci arah gestur di 10px pertama (`'x'` hanya bila ≥2× lebih horizontal), syarat dominasi 2× di akhir, batalkan bila `window.scrollY` berubah selama gestur, tangani `touchcancel` dan multi-touch.

### ID Temuan: BUG-UI-208-03
- **Lokasi Kode:** `src/components/busCard/BusCardSummary.tsx` (`isImbalanced`, `isBelowTarget`), `src/components/busCard/busCardStyles.ts`, `src/components/UnitCard.tsx`
- **Keparahan:** Medium (peringatan palsu menurunkan kepercayaan pada indikator)
- **Deskripsi:** (a) `isImbalanced = pergi !== pulang` → 8/7 selalu kuning padahal selisih 1 trip itu normal. (b) Target dibandingkan per kolom (`pergi < targetP || pulang < targetQ`), sehingga unit start B 7/8 dianggap di bawah target rute 8/7 walau ritasenya sama 7,5. (c) Logika tersebar di 3 file, warna hex/rgba mentah (`#10b981`, `#f97316`, `rgba(245,158,11,…)`).
- **Dampak User:** Banyak unit normal tampil kuning ⚠️, unit yang benar-benar kurang ritase sulit dibedakan.
- **Mitigasi:** Satu fungsi `evaluateTripStatus` (satuan ritase PP): di bawah target bila ritase < ritase target; anomali hanya bila selisih pergi–pulang > 1 trip. Warna diganti token `--color-warning/success/error-*`.
