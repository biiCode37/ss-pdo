# AUDIT BUGS: KETERSEMBUNYIAN & KETIDAKTERSEDIAAN AKSES CEPAT TRIP PER UNIT (REFACTOR 13)

Dokumen ini mendokumentasikan temuan audit UX, fungsionalitas visual, dan alur kerja operasional terkait fitur pencatatan Trip Operasional per unit armada bus di aplikasi SS_PDO.

---

## 1. TRIP-13-01: Ketiadaan Visual Trip pada Kartu Armada & Ketidakterlihatan Fitur Edit Trip Mandiri

- **ID Temuan:** `TRIP-13-01`
- **Lokasi Kode:**
  - `src/components/BusCard.tsx` (baris 50–80, 305–345, 360–385)
  - `src/utils/modals/busInputModal.ts` (baris 530–625, 780–850)
  - `src/components/BusList.tsx` (baris 230–260, 480–525)
- **Keparahan:** **HIGH** (Gap Fungsionalitas UX & Visibilitas Operasional Lapangan)
- **Deskripsi Teknis Masalah:**
  1. **Visual Blind Spot di Kartu Bus:**
     Komponen `BusCard.tsx` hanya merender badge `[Total KM]` dan `[Total Penumpang]`. Tidak ada elemen yang menampilkan status `tripPergi` dan `tripPulang` unit. Petugas di lapangan tidak dapat memantau apakah suatu unit telah menyelesaikan target ritase (misal 4/4) atau mengalami kendala di tengah hari (misal mogok dan hanya mencapai 2/1).
  2. **State Lokal `BusCard` Tidak Menyimpan Data Trip:**
     Di `BusCard.tsx`, state `formData` tidak menginisialisasi maupun memantau `tripPergi` dan `tripPulang`. Akibatnya, pembaruan trip per unit tidak reaktif pada kartu bus.
  3. **Tab Trip Tersembunyi (Hidden by Default):**
     Saat modal `showBusInputModal` dibuka, tab yang aktif secara default selalu `🔵 Shift 1`. Tab `🚌 Trip` berada di urutan ke-3 pada segmented control tanpa adanya shortcut langsung dari kartu bus.
  4. **Ketiadaan Opsi Trip pada Fokus Kolom:**
     Daftar opsi `categories` pada dropdown "Fokus Kolom" di `BusList.tsx` tidak menyertakan kategori `Trip`. Petugas yang ingin memverifikasi atau mengoreksi trip armada yang bermasalah tidak memiliki opsi fokus cepat.
- **Dampak Lapangan:**
  Petugas operasional menganggap bahwa pengaturan trip hanya bisa dilakukan secara masal ("Set Jumlah Trip"). Ketika suatu unit mengalami insiden/kendala di tengah hari (mogok, laka, kerusakan mesin), petugas kesulitan memperbarui ritase unit tersebut secara individual.
- **Mitigasi Terencana:**
  1. Di `BusCard.tsx`:
     - Tambahkan `tripPergi` dan `tripPulang` ke state `formData` dan sinkronisasi `useEffect`.
     - Render badge Trip di baris ringkasan kartu bus (contoh: `🚌 4/4 Rit` atau `⚠️ 2/1 Rit` jika ada pemotongan/kendala).
     - Tambahkan handler tap langsung pada badge Trip (`e.stopPropagation()`) yang memicu `showBusInputModal` dengan parameter pembuka langsung ke tab `trip`.
  2. Di `src/utils/modals/busInputModal.ts`:
     - Dukung opsi `initialTab?: 'shift1' | 'shift2' | 'trip' | 'notes'` pada `BusModalOptions`.
     - Dukung pembukaan langsung panel tab `trip` saat `initialTab === 'trip'` atau ketika `activeCategory === 'trip'`.
  3. Di `src/components/BusList.tsx`:
     - Tambahkan opsi `{ id: "trip", label: "Trip Armada" }` ke dalam `categories`.
     - Perbarui logika `isBusFilled` untuk memeriksa keterisian field `tripPergi` dan `tripPulang`.
