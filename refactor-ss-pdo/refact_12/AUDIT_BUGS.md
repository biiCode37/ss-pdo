# AUDIT BUGS: GANGGUAN INTERAKSI GANDA PADA PEMILIHAN RUTE (REFACTOR 12)

Dokumen ini mencatat audit investigasi mendalam terhadap bug *double interaction* pada komponen **Route Selector Card** di mana pengguna harus memilih rute sebanyak 2 kali agar data rute baru berhasil dimuat.

---

## 1. ROUTE-12-01: Circular Overwrite & Premature Stale Load pada Pemilihan Rute

- **ID Temuan:** `ROUTE-12-01`
- **Lokasi Kode:**
  - `src/components/Dashboard.tsx` (baris 431–436, 745–758)
  - `src/components/RouteSelectorCard.tsx` (baris 260–286, 309–325, 767–775)
- **Keparahan:** **HIGH** (Regresi UX Fungsional Lapangan)
- **Deskripsi Teknis Masalah:**
  1. **Premature Trigger via `handleSelectTab`:**
     `Dashboard.tsx` mengoper callback `handleSelectTab` sebagai prop `setSelectedTab` ke `RouteSelectorCard`. Di dalam `RouteSelectorCard`, fungsi `handleRouteCodeChange(code)` selalu memanggil `setSelectedTab(defaultDay)` untuk menyiapkan default tanggal saat rute dipilih. Akibatnya, `handleSelectTab` seketika memanggil `handleLoadData(false, defaultDay)` tanpa menunggu pengguna menekan tombol *"Load Data Unit"*.
  2. **Race Condition & Stale Closure Ref:**
     Saat `handleLoadData` terpicu otomatis tersebut, `sheetUrlRef.current` di `Dashboard.tsx` masih menyimpan URL rute **sebelumnya** (karena `useEffect` sinkronisasi ref baru berjalan di siklus render berikutnya). Akibatnya, `handleLoadData` memuat data rute lama.
  3. **Circular Reset di Dropdown State:**
     Di `RouteSelectorCard.tsx`, terdapat `useEffect` sinkronisasi yang memantau dependency `[routes, sheetUrl, currentSheetId, selectedTab]`. Di dalamnya terdapat logika:
     ```ts
     const targetId = currentSheetId || extractSpreadsheetId(sheetUrl);
     ```
     Karena `currentSheetId` rute sebelumnya masih aktif dan berada di posisi pertama sebelum `||`, `targetId` selalu mengambil ID rute lama. Efek ini langsung menimpa balik (`revert`) `selectedRouteCode` pengguna kembali ke rute sebelumnya:
     ```ts
     setSelectedRouteCode(active.routeCode); // Mengembalikan dropdown ke rute lama!
     ```
  4. Pengguna mendapati dropdown kembali ke rute sebelumnya dan data tidak berubah, sehingga terpaksa mengulangi pemilihan rute untuk kedua kalinya.
- **Dampak User:**
  Petugas operasional di lapangan harus melakukan interaksi ganda (pilih rute -> rute batal/kembali -> pilih rute ke-2 kali -> tekan load data) yang sangat membingungkan dan memperlambat pencatatan ritase bus.
- **Mitigasi Terencana:**
  1. Di `Dashboard.tsx`: Pisahkan `handleSetSelectedTab` (setter murni tanpa side-effect load) untuk `RouteSelectorCard`. `handleSelectTab` yang memiliki efek load hanya digunakan oleh navigasi chart analitik.
  2. Di `Dashboard.tsx`: Buat wrapper setter sinkron `handleSetSheetUrl` dan `handleSetSelectedTab` yang langsung mengupdate `sheetUrlRef.current` dan `selectedTabRef.current` seketika (zero render-lag).
  3. Di `RouteSelectorCard.tsx`: Hapus `sheetUrl` dan `selectedTab` dari dependency effect sinkronisasi dropdown. Gunakan `prevLoadedSheetIdRef` agar sinkronisasi HANYA terjadi saat `currentSheetId` selesai dimuat dan benar-benar berganti sheet ID baru.
  4. Di `RouteSelectorCard.tsx`: Oper parameter eksplisit `onLoadData(selectedTab, sheetUrl)` langsung dari tombol *"Load Data Unit"* ke `handleLoadData(true, tab, targetUrl)`.
