---
title: "Cara Bersihkan Website dari Judol + Cegah Terulang"
label: "Ebook · Khusus pengguna cPanel"
deskripsi: "Panduan langkah demi langkah untuk admin website sekolah, desa, kampus, dan UMKM yang websitenya disusupi judi online. Bahasa santai, bisa diikuti tanpa latar belakang programmer."
date: 2026-11-06
sampul: "ebook/judol-sampul.webp"
gambar: "ebook/judol-sampul.webp"
lynk: "https://lynk.id/ayyubiid/6dkvyknw7x9j"
statistik:
  - { angka: "10 bab", ket: "dari diagnosa sampai pengamanan" }
  - { angka: "42 halaman", ket: "lengkap dengan gambar" }
  - { angka: "Checklist", ket: "siap cetak" }
  - { angka: "Diuji", ket: "semua perintah dicoba di lab" }
potongan: "Cara menemukan pengaturan itu, membersihkan WordPress dan database, mengusir admin palsu, memulihkan nama website di Google, sampai mengunci website supaya tidak kebobolan lagi, semuanya ada di ebook. Lengkap dengan perintah yang tinggal salin dan cara mengetes hasilnya di tiap langkah."
ajakan: "Mau beresin judol sampai ke akar-akarnya? Dapatkan panduan lengkapnya: 10 bab, perintah siap salin, dan checklist perawatan bulanan."
daftarIsi:
  - { bab: 0, judul: "Cek Dulu Hosting Kamu", ket: "Fitur ada / nggak + alternatif" }
  - { bab: 1, judul: "Kenalan Sama Serangan Judol", ket: "Kenapa & gimana kejadiannya", cuplikan: true }
  - { bab: 2, judul: "Website Saya Kena Nggak?", ket: "5 cara cek", cuplikan: true }
  - { bab: 3, judul: "Persiapan: Backup & Kunci Semua Pintu", ket: "Wajib sebelum bersih-bersih" }
  - { bab: 4, judul: "Bersihin File Lewat cPanel", ket: "File Manager & Terminal", cuplikan: true }
  - { bab: 5, judul: "Bersihin WordPress & Database", ket: "Core, plugin, phpMyAdmin", cuplikan: true }
  - { bab: 6, judul: "Berburu Pintu Belakang", ket: "Cron, FTP, subdomain, dll", cuplikan: true }
  - { bab: 7, judul: "Pulihin Nama Website di Google", ket: "Search Console" }
  - { bab: 8, judul: "Kunci Website Biar Nggak Kebobolan Lagi", ket: "Hardening + cara ngetes" }
  - { bab: 9, judul: "Checklist Siap Cetak", ket: "Pembersihan & perawatan" }
  - { bab: 10, judul: "Kalau Mentok, FAQ & Kamus Istilah", ket: "Solusi error umum" }
bantuan:
  judul: "Males ngerjain sendiri? Biar saya yang beresin."
  teks: "Nggak semua orang punya waktu buat ngoprek cPanel berjam-jam. Kalau website sekolah, desa, kampus, atau usaha kamu kena judol, saya siap bantu membersihkannya sampai tuntas, sesuai langkah-langkah di ebook ini."
  poin:
    - "Bersihin file jahat, folder titipan, dan sitemap palsu"
    - "Bersihin WordPress, plugin, tema, dan database"
    - "Berburu backdoor, cron jahat, dan akun asing"
    - "Pulihin nama website di Google lewat Search Console"
    - "Pasang pengaman biar nggak kebobolan lagi"
---

## Website kamu kelihatan normal. Google bilang lain.

Bayangin kamu ketik nama website sekolah di Google, eh yang nongol malah *"Slot Gacor Maxwin Hari Ini"*. Pas dibuka langsung, websitenya normal-normal aja. Admin bilang aman, operator bilang aman. Terus yang salah siapa?

Biang keroknya trik yang namanya **cloaking**, alias nyamar. Website yang udah disusupi nampilin isi yang beda tergantung siapa yang dateng:

<figure class="eb-fig">
  <img src="/img/ebook/judol-cloaking.webp" alt="Diagram cloaking: pengunjung biasa melihat halaman normal, Googlebot melihat halaman judi" width="1200" height="439" loading="lazy">
  <figcaption>Gambar 1.1 · Kamu lihat website normal, Google lihat halaman judi.</figcaption>
</figure>

Makanya banyak yang mikir masalahnya beres setelah hapus satu halaman aneh. Seminggu kemudian, judolnya muncul lagi. Soalnya yang dihapus cuma gejalanya, sementara "pintu belakang" yang dipasang penyerang masih nempel di tempat yang jarang dicek orang.

## Cek 1 menit: website kamu kena nggak?

Cara paling gampang: buka Google, ketik `site:domainkamu.sch.id slot`. Kalau muncul hasil berisi kata-kata judi, ya udah, hampir pasti website kamu disusupin.

Tapi hasil bersih belum tentu aman, karena Google nggak selalu nampilin semua halaman. Di ebook ada cara **nyamar jadi Googlebot** pakai satu perintah di Terminal cPanel. Hasilnya bisa bikin kaget:

<figure class="eb-fig">
  <img src="/img/ebook/judol-googlebot.webp" alt="Hasil Terminal: versi Googlebot berisi kata gacor, maxwin, slot, versi pengunjung biasa bersih" width="1200" height="428" loading="lazy">
  <figcaption>Gambar 2.2 · Versi Googlebot ada kata judi, versi pengunjung biasa bersih. Ini tanda cloaking.</figcaption>
</figure>

Dan hati-hati, hasil tes ini juga bisa menipu. Penyerang yang lebih canggih ngecek alamat IP Googlebot asli, bukan cuma namanya. Ada satu cara yang **nggak bisa dikibulin**, dan itu yang dibahas di Bab 2.

## Jejaknya kelihatan, kalau tahu cara nyarinya

File jahat biasanya dibikin barengan sama awal serangan. Coba urutin File Manager pakai kolom **Last Modified**, terus perhatiin polanya:

<figure class="eb-fig">
  <img src="/img/ebook/judol-filemanager.webp" alt="File Manager cPanel diurutkan Last Modified, baris merah adalah file mencurigakan seperti wp-confiq.php dan sitemap-slot.xml" width="1200" height="561" loading="lazy">
  <figcaption>Gambar 4.2 · Baris merah = file yang patut dicurigai. Ilustrasi.</figcaption>
</figure>

Lihat `wp-confiq.php`? Itu bukan typo kamu. Itu typo yang **sengaja** dibikin penyerang biar nyaru sama `wp-config.php` asli. Ada juga `index.php` yang ukurannya 9,4 KB, padahal punya WordPress asli cuma belasan baris.

Masalahnya, penyerang yang licik bisa malsuin tanggal file biar kelihatan lama. Jadi kalau cuma ngandelin urutan tanggal, ada file yang bakal lolos. Di Bab 4 ada 8 ciri file mencurigakan plus perintah pencarian yang di website lab berhasil nemuin **semua** backdoor yang ditanam, termasuk yang disamarkan dan...

## Admin yang nggak pernah kamu bikin

Satu lagi yang sering kelewat: akun admin baru di database. Namanya dibikin sok teknis biar nggak dicurigai.

<figure class="eb-fig">
  <img src="/img/ebook/judol-adminpalsu.webp" alt="Hasil query phpMyAdmin menampilkan dua akun admin palsu yang dibuat pada tanggal serangan" width="1200" height="353" loading="lazy">
  <figcaption>Gambar 5.2 · Dua akun teratas dibikin penyerang pas tanggal serangan. Ilustrasi.</figcaption>
</figure>

`wpsupport_sys` dan `adminbackup`, dibikin jam 2 pagi, selisih 30 detik. Kalau admin asli kamu udah diubah penyerang sampai nggak bisa login, tenang, masih ada jalan masuk lewat phpMyAdmin. Caranya cuma butuh satu kolom dan...

## Kenapa judol bisa "hidup lagi"?

Ini bagian yang paling bikin frustrasi. Udah dihapus semua, besoknya muncul lagi. Salah satu penyebabnya ngumpet di menu yang jarang dibuka:

<figure class="eb-fig">
  <img src="/img/ebook/judol-cron.webp" alt="Daftar Cron Jobs di cPanel, dua baris merah mengunduh dan menjalankan kode dari situs luar" width="1200" height="330" loading="lazy">
  <figcaption>Gambar 6.1 · Dua baris merah download dan jalanin kode dari situs luar. Ilustrasi.</figcaption>
</figure>

Dua baris itu tugas terjadwal yang download ulang file jahat **tiap 5 menit**. Hapus filenya tanpa hapus cron ini sama aja kayak ngepel lantai pas atap masih bocor.

Dan cron cuma satu dari banyak tempat ngumpet. Yang paling licin justru pengaturan PHP bernama `auto_prepend_file`. Pengaturan ini bisa nyuntik judol ke **semua halaman** website kamu, tanpa ngubah satu pun file website. Scanner sering nggak nemu, File Manager juga nggak nunjukin apa-apa. Buat nemuinnya, kamu harus buka...
