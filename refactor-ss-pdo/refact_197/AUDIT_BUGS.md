# AUDIT TEMUAN BUG & ERGONOMI UI: REFACTOR 197
**Modul:** Plotting Armada Harian (`src/components/plotting/`)  
**Fokus Masalah:** Overcrowding Card Unit, Truncation Identitas Armada, Bad Date Wrapping, Bottom Nav Overlap

---

### ID Temuan: BUG-PLOTTING-197-01
- **Lokasi Kode:** `src/components/plotting/PlottingUnitCard.tsx` (Baris 136–316)
- **Keparahan:** High (Kritikal Operasional Lapangan)
- **Deskripsi:** Baris 1 pada kartu unit memaksakan 7 elemen interaktif berbeda sekaligus (`[O]` checkbox, `[::]` grip drag handle, `[ 1 ]` sequential order badge, `Unit Name`, `[↑]` panah naik, `[↓]` panah turun, dan `[📍 Priok ⇄]` pangkalan start switch). Akibatnya, pada layar ponsel (lebar 360px–390px), area nama unit terhimpit hingga tersisa < 50px, menyebabkan nomor lambung bus terpotong menjadi `KW...`.
- **Dampak User:** Pengawas lapangan di subuh hari tidak dapat melihat nomor armada bus yang sedang di-plotting, meningkatkan risiko salah atur urutan unit dan kebingungan operasional.
- **Mitigasi:** Menerapkan arsitektur layout dua baris hierarkis (*Two-Tier Clean Layout*). Baris 1 dikhususkan murni untuk Identitas Utama (`[O]`, `[::]`, `[ 1 ]`, `Unit Name` fleksibel bebas potong, dan `[ ✓ Siap ]` status pill). Kontrol logistik pangkalan `[📍 Priok ⇄]` serta panah reorder `[↑] [↓]` dipindahkan ke Baris 2 bersanding harmonis dengan stepper target ritase.

---

### ID Temuan: BUG-PLOTTING-197-02
- **Lokasi Kode:** `src/components/plotting/PlottingUnitCard.tsx` (Baris 75 & 83)
- **Keparahan:** Medium
- **Deskripsi:** Saat unit mengalami kendala (`status === 'TROUBLE'` atau `'OFF'`), teks keterangan kendala (yang bisa mencapai belasan hingga puluhan karakter) dimasukkan langsung ke dalam label teks tombol status pill. Ini mendistorsi tombol pill dari ~72px membengkak hingga > 180px, meremukkan tata letak horizontal di baris atas.
- **Dampak User:** Tampilan kartu unit menjadi acak-acakan dan bertabrakan saat ada armada mogok/perbaikan.
- **Mitigasi:** Status pill di Baris 1 dibuat selalu tegas dan ringkas (`Siap`, `Kendala`, `OFF`). Jika unit memiliki catatan kendala (`item.keterangan || item.note`), catatan tersebut dialokasikan ke strip info tersendiri (*sub-row chip*) dengan latar semantik transparan dan ikon peringatan, memberikan keterbacaan sempurna tanpa mengganggu baris identitas.

---

### ID Temuan: BUG-PLOTTING-197-03
- **Lokasi Kode:** `src/components/plotting/PlottingHeader.tsx` (Baris 70)
- **Keparahan:** Low (Visual / Polish)
- **Deskripsi:** Tanggal pada subtitle header (`Perencanaan Subuh Rute JAK.115 • 2026-11-03`) mengalami pemotongan baris di karakter tanda strip `-` (`2026-11-` di atas, `03` terlempar ke bawah).
- **Dampak User:** Mengurangi estetika profesional dan kerapian tampilan mobile.
- **Mitigasi:** Membungkus segmen tanggal dalam `<span style={{ whiteSpace: 'nowrap' }}>{date}</span>` sehingga browser selalu mempertahankan kesatuan tanggal.

---

### ID Temuan: BUG-PLOTTING-197-04
- **Lokasi Kode:** `src/components/plotting/DailyPlottingPage.tsx` (Baris 766)
- **Keparahan:** Medium
- **Deskripsi:** Padding bawah container halaman plotting hanya sebesar `calc(92px + env(safe-area-inset-bottom, 0px))`. Ketika pengguna menggulir ke paling bawah, unit kartu terakhir tertutup sebagian oleh floating `BottomNav`.
- **Dampak User:** Pengguna kesulitan menekan tombol kontrol ritase atau pangkalan start pada unit bus paling bawah.
- **Mitigasi:** Menaikkan padding bawah container menjadi `calc(130px + env(safe-area-inset-bottom, 0px))` sehingga seluruh kartu unit dapat digulir bebas di atas bilah navigasi.
