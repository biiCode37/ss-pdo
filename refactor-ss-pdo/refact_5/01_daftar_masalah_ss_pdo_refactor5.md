# Refactor 5 — Daftar Masalah SS_PDO

**Sumber analisa:** review statik kode pada branch `production`  
**Catatan:** ini analisa dari kode dan struktur repo, bukan hasil menjalankan aplikasi.

## Ringkasan area yang paling riskan
- Autentikasi dan state sesi
- Pemetaan rute / spreadsheet / tab
- Sinkronisasi offline dan antrean localStorage
- Perhitungan akumulasi / analytics
- UX mobile: swipe, selector, dan state yang dipertahankan

---

## ISS-01 — State login terlalu optimistis
**Area:** Auth / session  
**Gejala:** aplikasi bisa tetap menganggap user “sudah login” hanya karena flag localStorage ada, walau token sebenarnya kosong, rusak, atau refresh gagal.  
**Penyebab inti:** pengecekan login mengembalikan `true` secara langsung setelah membaca flag persistensi, tanpa menunggu hasil validasi token.  
**Dampak ke user:** user bisa masuk ke halaman utama lalu gagal saat mulai tarik data / simpan data. Ini terasa seperti “sudah login tapi aplikasi ngaco”.  
**Risiko tambahan:** kondisi auth yang salah bikin error berikutnya menyebar ke banyak fitur lain.

## ISS-02 — Pencocokan sheet / rute terlalu rapuh
**Area:** routing, metadata sheet, pemilihan rute  
**Gejala:** app bisa salah mengenali rute aktif, bulan/tahun aktif, atau sheet yang sedang dibuka.  
**Penyebab inti:** kode memakai campuran exact match dan substring match (`includes`) pada URL sheet, spreadsheet ID, dan URL aktif di beberapa tempat berbeda.  
**Dampak ke user:** label bulan/tahun bisa salah, selector bisa lompat ke data yang bukan target, dan cache bisa menempel ke rute yang salah.  
**Catatan:** ini salah satu sumber bug paling berbahaya karena efeknya diam-diam.

## ISS-03 — Fallback akumulasi mengabaikan rentang tanggal
**Area:** analytics / akumulasi harian  
**Gejala:** saat batch fetch akumulasi gagal, fallback jatuh ke pengambilan data tunggal yang tidak lagi mengikuti rentang startDay–endDay.  
**Penyebab inti:** fallback memanggil jalur data tunggal dengan parameter yang cuma mewakili satu hari.  
**Dampak ke user:** hasil akumulasi bisa tampak benar-benar salah, terutama untuk rentang lebih dari satu hari.

## ISS-04 — Ekstraksi spreadsheet ID terlalu sempit
**Area:** parser URL  
**Gejala:** beberapa bentuk URL Google Sheets tidak dikenali secara bersih.  
**Penyebab inti:** regex hanya mencari format `/d/<id>`, lalu kalau tidak cocok fungsi mengembalikan input mentah.  
**Dampak ke user:** input yang sebenarnya valid bisa diteruskan sebagai string yang salah, lalu gagal di API call berikutnya.  
**Catatan:** ini rawan muncul saat user paste link dari sumber berbeda atau link sudah diubah sedikit.

## ISS-05 — Sinkronisasi cache latar belakang memakai identifikasi yang sama-sama rapuh
**Area:** auto-sync ke Supabase / cache analytics  
**Gejala:** background sync ringkasan bisa salah mengaitkan data ke route atau sheet yang bukan target.  
**Penyebab inti:** mapping route masih bergantung pada pengecekan substring pada sheet URL / spreadsheet ID.  
**Dampak ke user:** dashboard, trend, dan ringkasan harian bisa membaca cache yang salah atau tampak tidak sinkron.

## ISS-06 — localStorage jadi single point of failure
**Area:** offline queue, draft, route cache  
**Gejala:** data kerja lokal hilang kalau storage browser dibersihkan, korup, atau quota habis.  
**Penyebab inti:** antrean sync, draft form, dan cache route semuanya bertumpu pada localStorage.  
**Dampak ke user:** draft yang belum tersimpan, antrian update, dan cache rute bisa lenyap sekaligus.  
**Catatan:** ini bukan cuma kelemahan arsitektur; buat user lapangan, ini bisa terasa seperti hilang kerjaan.

## ISS-07 — Cache fallback bisa menampilkan data usang tanpa penanda yang jelas
**Area:** fetch route / offline fallback  
**Gejala:** saat query Supabase gagal, app langsung pakai cache lokal.  
**Penyebab inti:** fallback cache dilakukan diam-diam tanpa indikator yang membedakan “data live” dan “data cache lama”.  
**Dampak ke user:** user bisa mengira daftar rute adalah data terbaru padahal sebenarnya cache lama.

## ISS-08 — getMonthlyToaTrend bisa menyamaratakan error jadi nol
**Area:** grafik tren  
**Gejala:** kalau ada error fetch / parsing di level tertentu, trend harian bisa diisi nilai 0 semua.  
**Penyebab inti:** blok catch mengembalikan data nol untuk semua hari tanpa membedakan error parsial vs total.  
**Dampak ke user:** grafik terlihat seperti tidak ada aktivitas, padahal sebenarnya sistem yang gagal membaca data.  
**Efek samping:** error data jadi sulit dibedakan dari kondisi “memang kosong”.

## ISS-09 — Route selector bisa mengosongkan sheet tanpa recovery yang jelas
**Area:** UI selector rute  
**Gejala:** kombinasi route–bulan–tahun yang tidak cocok membuat `sheetUrl` dikosongkan.  
**Penyebab inti:** saat tidak ada match, selector tidak memberi recovery flow yang kuat.  
**Dampak ke user:** form terlihat aktif tapi tombol load / state berikutnya bingung karena target sheet kosong.  
**Catatan:** ini membuat user merasa aplikasi “mati” atau “tidak merespons”.

## ISS-10 — Login profil dibagi dua tahap, tapi sinkronisasi profil tidak dijamin
**Area:** login / profil user  
**Gejala:** login berhasil, tapi pembaruan profil ke Supabase tidak selalu pasti selesai.  
**Penyebab inti:** upsert profil dijalankan fire-and-forget.  
**Dampak ke user:** nama/avatar/last_login_at bisa telat atau tidak tercatat, sementara user sudah dianggap masuk.  
**Dampak operasional:** audit user jadi kurang konsisten.

## ISS-11 — Collision check rawan false positive karena membandingkan snapshot yang tidak benar-benar immutable
**Area:** penyimpanan bus data  
**Gejala:** user bisa dituduh “tabrakan data” padahal yang berubah cuma representasi nilai / refresh state.  
**Penyebab inti:** pembanding konflik memakai data props saat ini sebagai baseline, bukan snapshot original yang eksplisit dan stabil.  
**Dampak ke user:** penyimpanan terhenti, muncul modal konflik, dan user dipaksa memilih resolusi padahal bukan konflik yang nyata.

## ISS-12 — UI gesture layer cukup rapuh terhadap perubahan struktur DOM
**Area:** swipe / mobile gesture  
**Gejala:** elemen baru yang interaktif bisa ikut terbaca sebagai area swipe kalau class pengecualian tidak ikut diupdate.  
**Penyebab inti:** whitelist pengecualian gesture tergantung selector CSS tertentu.  
**Dampak ke user:** klik / swipe bisa saling ganggu di layar mobile, terutama setelah ada komponen baru.  
**Catatan:** ini latent bug yang mudah muncul saat refactor lanjutan.

---

## Prioritas perbaikan
### P0
- ISS-01
- ISS-02
- ISS-03
- ISS-05

### P1
- ISS-04
- ISS-06
- ISS-07
- ISS-08

### P2
- ISS-09
- ISS-10
- ISS-11
- ISS-12