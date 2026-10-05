# 📑 Spesifikasi Integritas Data, Scoped Updates, & Resolusi Konflik (SS_PDO)

Dokumen ini adalah **Single Source of Truth (SSOT)** dan acuan mutlak untuk arsitektur sinkronisasi data, pembentukan payload formulir (*scoped vs full updates*), pencegahan tabrakan data palsu (*false-positive conflict*), dan mekanisme *Optimistic Concurrency Control (OCC)* pada aplikasi SS_PDO.

---

## 1. Latar Belakang & Masalah yang Diselesaikan

Pada implementasi sebelumnya, ketika seorang petugas di lapangan membuka modal **Mode Fokus (Single Column Focus)** untuk menginput `KM Awal Shift 1` pada unit bus yang di Google Sheets kolomnya masih kosong murni, mendadak muncul pop-up peringatan kritis SweetAlert2:
> *"Tabrakan Data (Conflict) - Data unit KWK 222171 di Google Sheets telah berubah saat Anda offline. Data dari server digabung dengan input Anda."*

### Akar Masalah Teknis yang Teridentifikasi:
1. **Over-Broad Payload di Mode Fokus:**
   Meskipun pengguna hanya membuka kotak input `KM Awal S1`, fungsi submit modal di [`useBusInputForm.ts`](file:///d:/MINE/SS_PDO/src/components/busCard/modal/useBusInputForm.ts) selalu mengemas dan mengirim seluruh 12 kolom armada sekaligus ke fungsi penyimpan.
2. **Pengecekan Konflik Membabi Buta (Blind Conflict Checking):**
   Fungsi simpan di [`useBusCardSave.ts`](file:///d:/MINE/SS_PDO/src/components/busCard/useBusCardSave.ts) memeriksa seluruh kolom yang ada pada objek `updates` terhadap data server terbaru (`remoteData`). Sistem tidak memeriksa apakah pengguna sebenarnya mengubah kolom tersebut atau tidak.
3. **Asimetri Data & Hilangnya Kolom `toaShift2` di `getBusRowData`:**
   Pada fungsi [`getBusRowData`](file:///d:/MINE/SS_PDO/src/services/googleSheets/core.ts), kolom `toaShift2` tidak disertakan dalam objek yang dikembalikan sehingga nilainya selalu `undefined` (ternormalisasi jadi string kosong `""`). Sementara di sisi aplikasi lokal, data awal selalu memiliki nilai default `'0'`. Perbandingan `"" !== "0"` menyebabkan sistem mendeteksi tabrakan data palsu pada setiap penyimpanan.
4. **Redaksi Dialog Tidak Kontekstual:**
   Pengguna sedang bekerja secara online, namun pop-up menampilkan teks *"telah berubah saat Anda offline"*, yang sangat membingungkan pengguna operasional di lapangan.

---

## 2. Prinsip Emas (Golden Principles)

1. **Scoped Payload (Kirim Sesuai Kebutuhan Mode):**
   - Pada **Mode Fokus (Single Column Focus)**, payload `updates` **HANYA** boleh memuat kolom utama yang menjadi target fokus pengguna (misalnya `kmAwal1`), ditambah sub-field opsional yang dibuka secara eksplisit oleh pengguna melalui tombol chip (misal: `kmAkhir1` atau `keterangan`).
   - Kolom-kolom lain yang tidak relevan dengan mode fokus (seperti `tripPergi`, `tripPulang`, `toaShift1`, `toaShift2`, dll) **DILARANG** dimasukkan ke dalam objek `updates`.
2. **Selective Dirty Checking (Optimistic Concurrency Control Murni):**
   - Pengecekan tabrakan data ke Google Sheets (`hasCollision`) **HANYA** mengevaluasi kolom-kolom yang **BENAR-BENAR BERUBAH (*dirty fields*)** antara apa yang ingin disimpan pengguna (`updates[field]`) dan nilai dasar saat data dimuat ke aplikasi (`bus[field]`).
   - Jika pengguna tidak mengubah suatu kolom (`normalizeFieldValue(updates[field]) === normalizeFieldValue(bus[field])`), maka perbedaan apa pun pada kolom tersebut di Google Sheets **TIDAK BOLEH** memicu peringatan konflik bagi pengguna.
3. **Aturan Tiga Syarat Tabrakan Data Riil (Three-Way Collision Rule):**
   Sebuah kolom armada **HANYA** boleh dinyatakan mengalami tabrakan data (*conflict*) jika memenuhi **KETIGA SYARAT BERIKUT SEKALIGUS**:
   $$\text{Conflict}(k) \iff (\text{Mine}_k \ne \text{Base}_k) \land (\text{Theirs}_k \ne \text{Base}_k) \land (\text{Theirs}_k \ne \text{Mine}_k)$$
   - $\text{Mine}_k \ne \text{Base}_k$: Pengguna lokal mengubah nilai kolom $k$.
   - $\text{Theirs}_k \ne \text{Base}_k$: Pihak lain/sistem di Google Sheets telah mengubah nilai kolom $k$ dari data awal.
   - $\text{Theirs}_k \ne \text{Mine}_k$: Nilai di Google Sheets berbeda dengan nilai baru yang ingin disimpan pengguna lokal.
4. **Kesetaraan & Kelengkapan Skema Kolom (Symmetric Schema):**
   - Seluruh fungsi pembacaan baris spreadsheet ([`getBusRowData`](file:///d:/MINE/SS_PDO/src/services/googleSheets/core.ts)) dan penulisan bulk spreadsheet ([`updateBulkBusData`](file:///d:/MINE/SS_PDO/src/services/googleSheets/mutations.ts)) **WAJIB** menyertakan seluruh 12 kolom secara lengkap dan simetris (termasuk `toaShift2`).
5. **Pemisahan Konteks Pesan (Online vs Offline):**
   - Dialog konflik saat online wajib menggunakan pesan ramah yang jelas: *"Data unit {unit} di Google Sheets baru saja diperbarui oleh pengguna lain..."*.
   - Dialog antrean offline tetap menggunakan pesan rekonsiliasi saat sinkronisasi offline.

---

## 3. Matriks Keputusan Tabrakan Data (Decision Matrix)

Tabel berikut menjadi acuan evaluasi setiap kolom saat pengguna menekan tombol **Simpan**:

| Kondisi $\text{Mine}$ (Input Baru) vs $\text{Base}$ (Lokal Awal) | Kondisi $\text{Theirs}$ (Server Sheets) vs $\text{Base}$ | Kondisi $\text{Theirs}$ vs $\text{Mine}$ | Status Integritas | Tindakan Sistem |
|---|---|---|---|---|
| **Sama** (User tidak menyentuh kolom) | **Sama** (Sheets tidak berubah) | **Sama** | **Clean / No Change** | Kolom tidak perlu diperbarui ke server. |
| **Sama** (User tidak menyentuh kolom) | **Berbeda** (Sheets diubah orang lain) | **Berbeda** | **Safe Remote Update** | **TIDAK ADA KONFLIK.** Simpan input user tanpa menimpa data server orang lain. |
| **Berbeda** (User mengubah kolom) | **Sama** (Sheets tidak disentuh orang lain) | **Berbeda** | **Safe Local Update** | **TIDAK ADA KONFLIK.** Tulis nilai baru user langsung ke Google Sheets. |
| **Berbeda** (User mengubah kolom) | **Berbeda** (Sheets juga diubah orang lain) | **SAMA** (Angka yang diketik kebetulan identik) | **Idempotent Match** | **TIDAK ADA KONFLIK.** Data server sudah sesuai dengan kehendak user. |
| **Berbeda** (User mengubah kolom) | **Berbeda** (Sheets juga diubah orang lain) | **BERBEDA** (Angka berbeda) | 💥 **REAL CONFLICT** | **TAMPILKAN DIALOG KONFLIK.** Berikan opsi Timpa (*Force Save*) atau Gabung (*Merge*). |

---

## 4. Alur Kerja Logika (Workflow Diagram)

```
[Pengguna Menekan Tombol Simpan]
                 │
                 ▼
  Ekstraksi Dirty Fields:
  Cari kolom k di mana:
  normalize(updates[k]) !== normalize(bus[k])
                 │
        ┌────────┴────────┐
   Tidak ada          Ada Dirty
  Dirty Fields         Fields
        │                 │
        ▼                 ▼
   (No-Op)           Ambil remoteData via getBusRowData()
   Tutup Modal            │
                          ▼
             Periksa setiap Dirty Field k:
             Apakah remoteData[k] !== bus[k]
             DAN remoteData[k] !== updates[k] ?
                          │
                 ┌────────┴────────┐
                TIDAK              YA
                 │                 │
                 ▼                 ▼
         (Aman / Bebas)    💥 TABRAKAN DATA RIIL!
         Kirim updates     Tampilkan Dialog Pilihan:
         ke Google Sheets  1. Force Save (Timpa)
                           2. Gunakan & Gabung Server
```

---

## 5. Rincian Skenario Lapangan (Field Test Cases)

### Skenario 1: Petugas Mengisi KM Awal S1 di Pagi Hari (Mode Fokus)
- **Kondisi:** Di pagi hari jam 05.00 WIB, petugas lapangan membuka modal fokus `KM Awal S1` untuk unit `KWK 222171`. Di Google Sheets, baris tersebut masih kosong murni.
- **Tindakan User:** Mengetik `300100` lalu klik **Simpan**.
- **Hasil yang Diharapkan:**
  - Payload hanya mengirim `{ kmAwal1: "300100" }`.
  - Sistem mendeteksi satu-satunya *dirty field* adalah `kmAwal1`.
  - Di server, `kmAwal1` masih `""` (sama dengan baseline lokal).
  - Data tersimpan instan ke Google Sheets dengan sukses tanpa memicu peringatan tabrakan data.

### Skenario 2: Rekan Pengawas Mengubah Keterangan di Spreadsheet Secara Bersamaan
- **Kondisi:** Petugas A di halte sedang membuka form untuk menginput `KM Awal S1`. Di saat bersamaan, Pengawas B di kantor membuka spreadsheet langsung dan mengisi kolom Keterangan menjadi `"BA.01"`.
- **Tindakan Petugas A:** Menyimpan `KM Awal S1 = "300100"`. Petugas A tidak mengubah Keterangan.
- **Hasil yang Diharapkan:**
  - Sistem mendeteksi `kmAwal1` adalah *dirty field*, sedangkan `keterangan` bukan *dirty field*.
  - Perubahan `keterangan` di Google Sheets tidak memicu konflik pada `kmAwal1`.
  - Nilai `kmAwal1 = "300100"` berhasil disimpan tanpa menghapus catatan `"BA.01"` buatan Pengawas B.

### Skenario 3: Tabrakan Data Riil (Dua Petugas Menginput Kolom yang Sama dengan Nilai Berbeda)
- **Kondisi:** Petugas A dan Petugas B membuka unit yang sama pada waktu bersamaan. Petugas B lebih cepat menyimpan `KM Awal S1 = "300100"` ke Google Sheets. Beberapa detik kemudian, Petugas A (yang belum refresh) mencoba menyimpan `KM Awal S1 = "300250"`.
- **Hasil yang Diharapkan:**
  - Terdeteksi *Real Conflict* pada kolom `kmAwal1` (`300250` vs `300100` vs baseline `""`).
  - Muncul dialog konfirmasi SweetAlert2 dengan teks online yang ramah: *"Data unit KWK 222171 di Google Sheets telah diperbarui. Data server saat ini: 300100, input Anda: 300250."*
  - Petugas A dapat memilih apakah ingin menimpa (*Force Save*) atau menggunakan data server (*Use Server*).

### Skenario 4: Rekonsiliasi Idempoten (Dua Petugas Menginput Nilai yang Sama)
- **Kondisi:** Petugas A dan Petugas B sama-sama melihat catatan fisik dan menginput `KM Awal S1 = "300100"`. Petugas B menyimpan lebih dulu. Ketika Petugas A menyimpan:
- **Hasil yang Diharapkan:**
  - Nilai server (`"300100"`) identik dengan nilai input Petugas A (`"300100"`).
  - Sistem mengenali ini sebagai *Idempotent Match*. Tidak ada peringatan konflik yang mengganggu, penyimpanan langsung dinyatakan sukses.

---

## 6. Standar Kamus Teks Sentral (`src/constants/texts/`)

Seluruh pesan antarmuka, judul modal, dan label tombol **WAJIB** menggunakan kamus teks sentral di `src/constants/texts/text_alerts.ts`:

- `TEXT_ALERTS.CONFLICT_ONLINE.TITLE`: `"Data Spreadsheet Telah Berubah"`
- `TEXT_ALERTS.CONFLICT_ONLINE.UNIT_TEXT(unit: string)`: `"Data unit ${unit} di Google Sheets baru saja diperbarui. Apakah Anda ingin menimpa perubahan tersebut atau menggabungkannya dengan data server?"`
- `TEXT_ALERTS.CONFLICT_OFFLINE.*`: Khusus untuk sinkronisasi antrean saat kembali online.

Dilarang keras menyisipkan string teks antarmuka yang di-hardcode di dalam komponen atau fungsi pembantu.
Setiap variabel yang dimasukkan ke dalam pesan SweetAlert2 wajib disanitasi menggunakan `escapeHtml()`.
