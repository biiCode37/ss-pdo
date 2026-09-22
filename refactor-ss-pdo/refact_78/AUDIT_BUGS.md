# Audit Bugs & UX Review - Refactor 78

Dokumentasi audit UX dan layout untuk pembuatan 1 blok baris komponen terpadu (`Datepicker + Refresh + Load All`) responsif tanpa menyisakan ruang kosong (*blank space*) dengan jarak tombol yang rapi.

---

## 1. Daftar Temuan

### BUG-REFACT78-01: Keberadaan Blank Space Kosong pada Baris Kontrol di Layar Mobile
* **Lokasi Kode:**
  * [`src/components/monitoring/MonitoringHeader.tsx`](file:///d:/MINE/SS_PDO/src/components/monitoring/MonitoringHeader.tsx)
  * [`src/components/monitoring/MonitoringHeader.test.tsx`](file:///d:/MINE/SS_PDO/src/components/monitoring/MonitoringHeader.test.tsx)
* **Kategori / Keparahan:** Responsive Layout & Space Utilization / Medium
* **Deskripsi Masalah:**
  Pada tata letak mobile sebelumnya, komponen kontrol tanggal dan tombol aksi dikelompokkan dalam kontainer dengan ukuran tetap (`inline-flex` ~264px). Ketika layar ponsel pengguna memiliki lebar 375px hingga 430px (standar perangkat smartphone saat ini), terdapat sisa ruang kosong menganga (*blank space*) sekitar 110px–160px di sebelah kanan tombol Load All, yang membuat tampilan header terlihat menggantung dan tidak proporsional.
* **Dampak Pengguna:**
  * Tampilan antarmuka mobile terasa tidak seimbang (*asymmetric visual balance*).
  * Area sentuh teks tanggal di tengah kapsul menjadi sempit karena tidak memanfaatkan ruang horizontal yang tersedia.
* **Mitigasi & Solusi:**
  1. Satukan datepicker, tombol refresh, dan tombol load all ke dalam 1 blok baris komponen (`data-testid="monitoring-control-bar"`) dengan `width: "100%"`, `flex: "1 1 320px"`, dan `maxWidth: "520px"`.
  2. Jadikan kapsul Datepicker membentang fleksibel (`flex: 1`, `minWidth: 0`), dengan tombol stepper `<` di sisi kiri, penampil tanggal interaktif di posisi tengah (`justifyContent: "center"`), dan tombol `>` di sisi kanan.
  3. Berikan jarak pemisah yang rapi dan konsisten (`gap: "8px"`) antara Datepicker, tombol Refresh, dan tombol Load All.
  4. Perbarui unit test pada `MonitoringHeader.test.tsx`.
