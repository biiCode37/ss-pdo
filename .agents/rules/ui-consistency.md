# Standar Konsistensi Tampilan UI SS_PDO (Wajib untuk Semua AI Agent)

Berlaku untuk **setiap kode UI baru atau yang diubah** (`.tsx`, `.css`, template SweetAlert). Tujuannya: tampilan rapi, tenang, profesional, dan konsisten. Prinsip utamanya **kurangi, jangan tambah**: jika ragu, pilih opsi yang lebih sederhana dan lebih sedikit elemen.

Aturan warna, kontras WCAG, kamus teks `src/constants/texts/`, dan quality gate di `AGENTS.md` tetap berlaku. Dokumen ini menambah aturan tata letak, tipografi, ikon, fokus, dan efek.

## 1. Pakai ulang dulu, baru buat
Sebelum membuat komponen atau gaya baru, **wajib** cek yang sudah ada:
- Kelas CSS: `.ui-button` (+ `--primary`, `--secondary`, `--danger`), `.ui-input`, `.ui-input-group`, `.ui-status`, `.ui-chart-*` di `src/styles/components/`.
- Komponen: `ModalShell`, `UnitStatusBadge` (`src/components/ui/`), `RoleBadge`, `Skeletons`, `BusFormField` (`busCard/modal/fields/`).
- Dialog/toast: `src/utils/alertUtils.ts` (`showSuccessToast`, `showConfirmDialog`, dll.) dan `pdoSwal` di `swalBase.ts`.

Jika butuh varian, tambahkan prop atau kelas modifier pada komponen yang ada. **Dilarang menyalin** komponen lalu mengubah sedikit gayanya. Pola yang muncul mirip di 2 tempat atau lebih wajib dijadikan satu komponen/kelas bersama.

## 2. Cara menulis gaya
- **Dilarang menambah `style={{}}` inline untuk nilai statis** (warna, ukuran huruf, bobot, jarak, radius, border, bayangan). Nilai statis ditulis sebagai kelas di `src/styles/components/*.css`.
- Inline style hanya untuk nilai **dinamis hasil hitung** (lebar progress, posisi, tinggi viewport).
- Saat mengubah komponen lama, jangan menambah inline statis baru; jika menyentuh satu blok gaya, pindahkan ke kelas bila tidak memperluas cakupan tugas.
- `!important` hanya untuk menimpa gaya library (SweetAlert2), wajib diberi komentar alasan.

## 3. Fokus & interaksi (refact_213)
- Kolom teks memakai **satu cincin fokus** dari `forms.css` (`outline 2px`, `outline-offset: -2px`). **Dilarang** menambah `:focus` yang mengubah `border-color`, menambah `box-shadow` glow, atau outline kedua.
- **Dilarang `outline: none`** kecuali (a) kolom tanpa border di dalam pembungkus berkelas `.ui-input-group` (cincin pindah ke pembungkus), atau (b) wadah dialog `tabIndex={-1}`. Dijaga oleh `src/styles/components/focus-ring.test.ts`.
- Target sentuh minimal **44×44 px**. Tombol hanya-ikon wajib punya `aria-label`.

## 4. Warna & efek
- Hanya token semantik `var(--color-*)` dari `semantic.css`. `--accent-color` dan hijau `#3ECF8E`/`#24B47E` adalah **warisan**: jangan dipakai di kode baru; aksi utama memakai `--color-action-primary-*`.
- **Dilarang gradasi** dalam bentuk apa pun: teks bergradasi (`background-clip: text`), latar, progress bar, avatar, tombol. Pakai warna solid.
- **Dilarang** glow/neon, `text-shadow`, dan `backdrop-filter`/glassmorphism baru.
- Jangan memakai `opacity` untuk meredupkan teks; pakai `--color-text-secondary`/`--color-text-muted`.
- Maksimal **1 tombol primary** per layar atau per modal; aksi lain `--secondary`.
- Status (OFF, TO, kendala, sukses, error) **selalu disertai label teks**, tidak boleh hanya warna.
- Bayangan hanya untuk lapisan melayang (modal, sheet, dropdown). Kartu biasa cukup border tipis, tanpa bayangan.

## 5. Tipografi (berlaku sejak refact_216, dikunci ratchet)
- Ukuran yang diizinkan (px): **12, 13, 14, 16, 18, 20, 24**, plus **28** khusus angka besar. **Minimal 12px**; dilarang 8–11px dan nilai pecahan seperti 11.5px atau 0.78rem.
- Satuan ukuran huruf: **px**. Jangan mencampur `rem` dan `px` di komponen yang sama.
- Bobot: **400, 500, 600, 700** saja. Dilarang 800/900 (termasuk angka utama).
- Angka dalam tabel, kartu unit, dan KPI memakai `font-variant-numeric: tabular-nums`.
- Font mengikuti `body`. `monospace` hanya untuk pratinjau teks laporan WA atau kode.
- Dilarang kalimat dalam HURUF KAPITAL SEMUA; kapital hanya untuk singkatan (KM, TOA, OFF, TO).

## 6. Ikon
- Hanya `lucide-react`. Tanpa emoji di UI.
- Ikon **hanya boleh** untuk: navigasi, tombol hanya-ikon (tutup, kembali, menu), dan penanda status yang **didampingi teks**.
- **Dilarang** ikon dekoratif di judul halaman, judul section, judul kartu, label form, dan item daftar. Maksimal **1 ikon** per tombol/label.
- Ukuran: **16** (sebaris teks/tombol kecil), **20** (tombol & navigasi), **24** (ikon tunggal besar/empty state). Tidak ada ukuran lain.

## 7. Isi & teks bantuan
- Dilarang deskripsi/subjudul di bawah setiap menu, kartu, atau tombol.
- Teks bantuan hanya untuk: pesan error, empty state, format input yang tidak jelas, dan konsekuensi aksi yang merusak data. Maksimal satu kalimat.
- Label tombol: kata kerja, 1–3 kata ("Simpan", "Isi data", "Hapus unit").
- Semua teks tetap lewat `src/constants/texts/`.

## 8. Tata letak & jarak (skala SEMENTARA)
- Jarak (padding, margin, gap) kelipatan 4: **4, 8, 12, 16, 20, 24, 32**.
- Radius: **8** (chip, kontrol kecil), **12** (input, tombol, kartu), **16** (modal, bottom sheet), **999px** (pill, avatar).
- Gutter layar 16px. Padding kartu 12–16px. Hindari kartu di dalam kartu.
- Mobile-first: rapi di lebar **360px**, tanpa scroll horizontal; dicek di light & dark.

## 9. Penjaga otomatis (wajib lulus)
- `src/styles/ui-debt-ratchet.test.ts` menghitung pelanggaran (hex/rgba mentah, gradasi, inline style, ukuran huruf < 12px atau di luar skala, bobot 800+, ukuran ikon di luar skala, `--accent-color` warisan, text-shadow, backdrop-filter). Jika angkanya **naik**, test gagal: **perbaiki kodenya**.
- **Dilarang menaikkan angka `BASELINE`**. Baseline hanya boleh diturunkan, yaitu saat merapikan kode; test akan meminta penurunan itu.
- `src/styles/components/focus-ring.test.ts` menjaga aturan fokus (bagian 3).

## 10. Proses wajib untuk perubahan visual
1. Mockup dibuat **hanya jika pengguna memintanya**. Tanpa permintaan, langsung implementasi perubahan yang sudah disepakati.
2. Setelah implementasi, verifikasi di browser (lebar ~375px, light & dark) dengan bukti nyata (screenshot/nilai computed style).
3. Dokumentasikan di `refactor-ss-pdo/refact_N` dan jalankan 4 quality gate di `AGENTS.md`.

## 11. Checklist sebelum menyerahkan pekerjaan UI
- [ ] Tidak ada komponen/gaya duplikat; komponen yang ada sudah dipakai ulang.
- [ ] Tidak ada inline style statis baru, hex/rgba mentah, gradasi, glow, atau `outline: none` baru.
- [ ] Ukuran huruf, bobot, ikon, jarak, dan radius hanya dari skala di atas.
- [ ] Ikon hanya di tempat yang diizinkan; tidak ada teks bantuan berlebih.
- [ ] Fokus input tampil satu cincin; target sentuh ≥ 44px.
- [ ] Dicek di light & dark, lebar 360–375px.
