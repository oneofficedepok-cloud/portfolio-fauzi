---
title: "Web sekolahku dulu kayak rumah kosong, jadi aku bikinin CMS gratis"
kategori: "Website"
menit: 10
date: 2026-10-23
deskripsi: "Cerita keresahan lihat website SMP sendiri yang kayak nggak ada yang ngurus, sampai akhirnya aku bikin website sekolah berbasis CMS lengkap dengan panel admin. Source code-nya gratis, panduan pasangnya ada di sini."
draft: false
---

Jadi gini. Suatu malam, habis beres ngoprek server klien, aku iseng buka website SMP tempat aku dulu sekolah. Niatnya cuma nostalgia, pengen lihat foto guru-guru, siapa tahu ada foto angkatanku yang lagi upacara sambil nahan ngantuk.

Yang muncul? Jujurly, aku langsung pengen nutup laptop terus wudhu.

Di artikel ini aku spill semuanya: **keresahan** lihat web sekolah yang kayak rumah kosong, **kenapa** aku akhirnya bikin website sekolah berbasis CMS sendiri, dan yang paling penting buat kamu: **source code-nya aku kasih gratis**, lengkap dengan **panduan pasangnya** dari nol sampai online. Siapin kopi, ini agak panjang, tapi worth it.

## Masalah yang diselesaikan

### Episode 1: Mengunjungi rumah kosong

Begitu halaman kebuka (setelah loading 14 detik, aku hitung), ini yang aku temuin:

- **Slider banner** yang gambarnya udah nggak ada. Jadi isinya kotak abu-abu bertuliskan "image not found", geser kanan, kotak abu-abu lagi. Konsisten sih, aku hargai.
- **Berita terbaru** judulnya "Selamat Datang Siswa Baru Tahun Ajaran 2016/2017". Terbaru, ya. Mungkin maksudnya terbaru di zamannya.
- Ada **visitor counter** di pojok kanan bawah, angkanya 004.317. Aku curiga setengahnya itu operator sekolah yang lagi nyari tombol login.
- **Teks berjalan** warna kuning di atas background merah. Mata aku sampai butuh cuti.
- Menu **"Galeri"** isinya error. Menu **"Download"** isinya file Word bernama `Dokumen1 (2) FINAL revisi.doc`.
- Footer-nya: **"Copyright 2015"**. Waktu di website itu berhenti, kayak jam dinding di film horor.

Terus aku kepo, tanya ke temen yang kebetulan ngajar disana: "Ini webnya koq gini amat ya, siapa yang pegang ya?"

Jawabannya bikin aku paham semuanya: *"Urusan di pegang sama si Fulan, kayanya di bikin pakai Ai Google dah, cuma kaya gak serius gtuh bikinnya"*

Nah. Itu dia akar masalahnya.

### Episode 2: Kenapa web sekolah banyak yang begini?

Setelah ngobrol sama beberapa guru dan operator dari sekolah lain, ternyata pola ceritanya sama semua:

1. **Dibikin sekali, ditinggal selamanya.** Website dianggap kayak papan nama: pasang, terus dilupain.
2. **Yang bikin pergi, ilmunya ikut pergi.** Nggak ada dokumentasi, nggak ada serah terima. Password admin cuma ada di kepala satu orang (dan kepala itu sekarang kerja di kota lain).
3. **Ganti isi harus ngoding.** Mau ganti foto kepala sekolah aja harus buka file HTML. Operator sekolah yang kerjaannya udah segunung, ya mana sempat.
4. **Tampilannya bikin malu.** Padahal website itu "etalase" sekolah. Orang tua calon siswa biasanya lihat web dulu sebelum datang. Kalau webnya kayak rumah kosong, kesan pertamanya juga ikut kosong.

Jadi masalahnya bukan cuma "webnya jelek". Masalah intinya: **sekolah nggak punya alat yang gampang buat ngurus websitenya sendiri.**

### Episode 3: Oke, aku bikinin aja

Sebagai orang IT yang tiap hari ngurus server dan aplikasi, rasanya kok nggak enak kalau cuma ngeluh di grup alumni. Jadi aku putuskan bikin **website sekolah berbasis CMS** dengan tiga prinsip:

- **Tampilannya harus kece**, biar sekolah bangga ngebagiin link-nya.
- **Semua isi bisa diubah dari panel admin**, tanpa nyentuh kode sama sekali. Kalau bisa ngetik di WhatsApp, harusnya bisa ngurus web ini.
- **Gampang dipasang di hosting murah**, karena budget IT sekolah biasanya cuma cukup buat beli tinta printer (dan itu pun sering kurang).

Hasilnya kayak gini:

![Tampilan beranda website sekolah berbasis CMS](/img/sekolah.webp)

Dan karena niat awalnya buat bantu sekolah, **source code-nya aku bagikan gratis** buat siapa aja yang baca artikel ini. Mau dipakai buat sekolahmu, sekolah adikmu, atau madrasah di dekat rumah, gaskeun.

### Fitur yang ada di dalamnya

Biar kebayang, ini yang bisa diatur dari panel admin:

| Menu admin | Buat apa |
| --- | --- |
| Halaman | Bikin halaman dari template (profil, galeri, kontak, PPDB, FAQ, dll). Isinya disusun dari blok yang bisa ditambah, diurutkan, disembunyikan, atau dihapus. |
| Menu | Atur menu utama, menu atas, dan footer. Bisa pakai submenu. |
| Berita | Tulis berita lengkap dengan foto sampul, kategori, dan draf. |
| Galeri foto | Bikin album dan upload banyak foto sekaligus. |
| Video, Agenda, Guru & staf, Unduhan | Data yang otomatis tampil di halaman terkait. |
| Media | Pustaka gambar. Foto otomatis diperkecil biar web tetap ringan. |
| Pesan masuk | Pesan dari formulir kontak, ada tombol balas via WhatsApp. |
| Pendaftar PPDB | Data pendaftar online, ubah statusnya, dan unduh ke Excel. |
| Pengaturan | Nama sekolah, logo, alamat, kontak, media sosial, peta, sampai warna. |
| Pengguna | Tambah admin atau editor (editor nggak bisa ubah pengaturan). |

Blok yang bisa dipakai juga banyak: banner utama, statistik, visi misi, struktur organisasi, linimasa sejarah, testimoni alumni, tanya jawab, formulir PPDB, cek status PPDB, sampai hitung mundur kuota pendaftaran. Pokoknya operator tinggal susun kayak main lego.

Soal keamanan juga nggak aku skip: password disimpan terenkripsi, login dibatasi 8 percobaan per 15 menit, semua formulir dilindungi token CSRF, dan file yang diupload dicek jenisnya. Jadi bukan web yang bisa dibobol cuma pakai `admin` / `admin`.

## Yang dibutuhkan

Kabar baiknya, kebutuhannya simpel banget:

- **Hosting dengan cPanel** (hosting murah juga bisa), PHP versi **8.1 atau lebih baru**. Hampir semua hosting sekarang sudah memenuhi.
- **Domain**, misalnya `namasekolah.sch.id` atau subdomain dulu buat coba-coba.
- **Source code gratisnya**: [github.com/oneofficedepok-cloud/web_sekolah](https://github.com/oneofficedepok-cloud/web_sekolah)
- **Database**: nggak wajib setup apa-apa. Bawaannya pakai **SQLite** yang otomatis jadi. Kalau mau pakai MySQL juga bisa (dibahas di bawah).
- **Foto-foto asli sekolah**: kepala sekolah, gedung, kegiatan siswa. Ini yang bikin web terasa hidup.
- Waktu sekitar **30 menit** dan niat yang tulus.

## Langkah-langkah

### 1. Download source code-nya

Buka [repo web_sekolah di GitHub](https://github.com/oneofficedepok-cloud/web_sekolah), klik tombol hijau **Code**, lalu pilih **Download ZIP**. Nggak perlu akun GitHub, nggak perlu install apa-apa. Simpan file ZIP-nya, jangan diekstrak dulu.

### 2. Upload ke hosting

1. Login ke **cPanel** hosting kamu, buka **File Manager**.
2. Masuk ke folder `public_html` (atau bikin subfolder dulu, misalnya `public_html/web-baru`, kalau mau coba tanpa ganggu web lama).
3. Klik **Upload**, pilih file ZIP tadi.
4. Setelah selesai, klik kanan file ZIP, pilih **Extract**.
5. Hasil ekstrak biasanya masuk ke folder bernama `web_sekolah-main`. **Pindahkan semua isinya** ke folder tujuan (misalnya `public_html`), lalu hapus folder kosong dan file ZIP-nya.

### 3. Cek file tersembunyi (ini sering kelewat!)

Di dalam source code ada file bernama `.htaccess`. Titik di depan namanya bikin file ini **tersembunyi**, dan tanpa file ini web kamu bakal error 404 di banyak halaman (dan beberapa folder penting malah bisa dibuka orang).

Di File Manager, klik **Settings** di pojok kanan atas, centang **Show Hidden Files (dotfiles)**, lalu save. Pastikan file `.htaccess` ada di:

- folder utama website,
- folder `app/`,
- folder `storage/`,
- folder `uploads/`.

Kalau semuanya ada, aman. Kalau nggak ada, ulangi proses ekstrak ZIP-nya.

### 4. Atur izin folder

Website perlu menyimpan database dan foto, jadi dua folder ini harus bisa ditulis:

- `storage/`
- `uploads/`

Klik kanan masing-masing folder, pilih **Change Permissions**, isi **755** (kalau nanti gagal upload foto, coba **775**). Jangan pernah pakai 777 ya, itu sama aja kayak ninggalin pintu rumah kebuka sambil pasang spanduk "silakan masuk".

### 5. Buka website, ikuti halaman Pemasangan

Sekarang buka alamat website kamu di browser. Kalau semua langkah tadi benar, yang muncul pertama kali adalah halaman **Pemasangan**. Isi:

- **Nama** kamu,
- **Nama pengguna** admin (huruf kecil, minimal 3 karakter),
- **Kata sandi** minimal 8 karakter, lalu ulangi sekali lagi,
- Biarkan centang **"Isi dengan konten contoh"** supaya web langsung terisi lengkap sesuai desain.

Klik **Pasang dan masuk**, dan... boom. Website sekolah kamu langsung jadi, lengkap dengan halaman beranda, profil, akademik, kesiswaan, berita, galeri, PPDB, dan kontak.

Panel admin ada di:

```
https://alamat-website-kamu/admin
```

Simpan username dan password-nya di password manager, **bukan** di kertas yang ditempel di monitor ruang TU. Kita nggak mau mengulang sejarah kakak kelas magang tadi.

### 6. (Opsional) Pakai MySQL

SQLite bawaan sudah cukup buat kebanyakan sekolah. Tapi kalau kamu lebih nyaman pakai MySQL:

1. Di cPanel, buka **MySQL Databases**. Bikin database, bikin user, lalu tambahkan user ke database dengan **All Privileges**.
2. Di File Manager, salin file `config.sample.php` menjadi `config.php`.
3. Edit `config.php`, ubah bagian ini:

```php
'db_driver' => 'mysql',
'mysql_host' => 'localhost',
'mysql_database' => 'namauser_sekolah',
'mysql_user' => 'namauser_admin',
'mysql_password' => 'password-database-kamu',
```

4. Simpan, lalu buka websitenya. Tabel dibuat otomatis dan halaman Pemasangan muncul seperti langkah 5.

### 7. Ganti konten contoh jadi punya sekolahmu

Konten contoh itu ibarat rumah yang udah ada perabotnya, tinggal kamu ganti fotonya. Urutan yang aku sarankan:

1. **Pengaturan** dulu: nama sekolah, logo, alamat, nomor WhatsApp, email, media sosial, peta, NPSN, dan warna utama.
2. **Cari teks dalam kurung siku**, misalnya `[Nama Kepala Sekolah]` atau `[000]`. Itu semua tempat isian yang harus diganti dengan data asli.
3. **Ganti foto contoh** dengan foto asli sekolah lewat menu **Media** atau langsung di tiap blok. Foto stok itu cakep, tapi orang tua pengen lihat sekolah aslinya.
4. **Tulis berita pertama**. Nggak usah muluk-muluk, kegiatan upacara Senin kemarin juga cukup. Yang penting web kelihatan hidup.
5. **Atur PPDB**: kuota, alur pendaftaran, dan formulir online. Pendaftar yang masuk bisa langsung dicek di menu **Pendaftar PPDB** dan diunduh ke Excel.

### 8. Bagi tugas biar nggak terulang

Ingat akar masalahnya tadi? Website mati karena cuma satu orang yang pegang. Jadi:

- Bikin minimal **dua akun admin** (misalnya operator dan wakil kepala sekolah).
- Kasih akun **editor** buat guru yang rajin nulis berita. Editor bisa nulis tapi nggak bisa ngacak-ngacak pengaturan.
- Tulis di satu dokumen: alamat admin, siapa saja yang pegang akun, dan info login hosting. Simpan di tempat yang aman dan bisa diakses pihak sekolah.

### 9. Jangan lupa backup

Semua data penting ada di dua folder:

- `storage/` (database SQLite),
- `uploads/` (foto dan file yang diupload).

Seminggu sekali, compress dua folder itu lewat File Manager lalu download, atau pakai fitur backup otomatis dari hosting kamu. Kalau mau lebih serius, baca juga tutorial aku soal *Backup otomatis harian ke NAS dan cloud*.

### 10. Coba di laptop dulu (buat yang penasaran)

Kalau kamu developer atau sekadar pengen nyoba sebelum upload ke hosting, cukup install PHP di laptop, masuk ke folder source code, lalu jalankan:

```bash
php -S localhost:8000 router.php
```

Buka `http://localhost:8000` di browser, dan halaman Pemasangan akan muncul. Cocok buat ngoprek tampilan tanpa takut ngerusak web yang sudah online.

## Hasil akhir

Setelah semua langkah di atas, sekolah kamu punya:

- **Website yang tampilannya modern** dan nyaman dibuka di HP, bukan lagi rumah kosong dengan slider abu-abu.
- **Panel admin** untuk mengubah semua isi: halaman, menu, berita, galeri, guru, unduhan, sampai PPDB, **tanpa ngoding**.
- **PPDB online** dengan data pendaftar yang bisa diunduh ke Excel.
- **Pengelolaan bersama**, karena akun admin dan editor bisa dibagi, jadi web nggak mati cuma karena satu orang lulus atau pindah kerja.
- **Keamanan dasar yang beres**: password terenkripsi, batas percobaan login, formulir anti-bot, dan folder penting yang terkunci.

Kalau nanti kamu pakai source code ini buat sekolahmu, kabarin aku ya. Aku pengen lihat web sekolah di Indonesia satu per satu bangkit dari kubur. Dan kalau ada yang bingung waktu pasang, tinggal klik tombol WhatsApp di bawah, insyaAllah aku bantu.

Sekarang, aku mau balik ke grup alumni. Mau nanya lagi siapa yang pegang password hosting sekolah. Doain ya.
