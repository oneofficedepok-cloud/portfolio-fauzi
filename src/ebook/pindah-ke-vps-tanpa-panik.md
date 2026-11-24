---
title: "Pindah ke VPS Tanpa Panik"
label: "Ebook · Dari cPanel ke VPS"
deskripsi: "Panduan pindahan website dari cPanel ke VPS sampai online, pakai HTTPS, aman berlapis, dan punya backup otomatis. Ditulis untuk pemula, pakai satu contoh website sekolah dari awal sampai akhir."
date: 2026-11-24
sampul: "ebook/vps-sampul.webp"
gambar: "ebook/vps-promo.webp"
lynk: "https://lynk.id/ayyubiid"
statistik:
  - { angka: "18 bab", ket: "dari beli server sampai rencana darurat" }
  - { angka: "202 halaman", ket: "dibagi jadi 5 bagian" }
  - { angka: "196 gambar", ket: "screenshot terminal asli" }
  - { angka: "Pemula", ket: "nggak perlu jago Linux" }
potongan: "Cara benerin Fail2ban yang buta, aturan Cloudflare yang mengusir bot sebelum sampai ke server, skrip backup yang jalan sendiri dan nyalin ke Google Drive, sampai pindahan WordPress dari cPanel tanpa website mati, semuanya ada di ebook. Tiap bab ditutup checklist siap cetak dan bagian \"Kalau Mentok\" buat error yang paling sering muncul."
ajakan: "Mau pindah ke VPS tanpa deg-degan? Dapatkan panduan lengkapnya: 18 bab, 196 screenshot asli dari Ubuntu 24.04, perintah siap salin, dan checklist di tiap bab."
daftarIsi:
  - { bab: 1, judul: "VPS Itu Apa, dan Kapan Kamu Belum Butuh", ket: "Bagian 1 · Sebelum beli server", cuplikan: true }
  - { bab: 2, judul: "Memilih dan Membeli VPS", ket: "Paket, lokasi, biaya sebenarnya" }
  - { bab: 3, judul: "Linux Secukupnya", ket: "Perintah yang benar-benar kepakai" }
  - { bab: 4, judul: "Masuk ke Server", ket: "Bagian 2 · Server pertama online" }
  - { bab: 5, judul: "Sepuluh Menit Pertama di Server Baru", ket: "User baru, update, zona waktu" }
  - { bab: 6, judul: "Domain dan DNS lewat Cloudflare", ket: "Arahkan domain ke server" }
  - { bab: 7, judul: "Nginx, Pelayan Website Kamu", ket: "Server block pertama" }
  - { bab: 8, judul: "PHP dan MariaDB, Dapur dan Gudangnya", ket: "PHP-FPM & database" }
  - { bab: 9, judul: "HTTPS yang Aman Sampai ke Server", ket: "Sertifikat & mode Full (strict)" }
  - { bab: 10, judul: "Pindahan: WordPress dari cPanel ke VPS", ket: "Bagian 3 · Pindahan" }
  - { bab: 11, judul: "Mengunci Pintu Server", ket: "Bagian 4 · UFW, Fail2ban, SSH key", cuplikan: true }
  - { bab: 12, judul: "Nginx sebagai Satpam", ket: "Blokir file rahasia & batasi login" }
  - { bab: 13, judul: "Cloudflare sebagai Tameng Depan", ket: "Aturan keamanan paket gratis", cuplikan: true }
  - { bab: 14, judul: "Mengeraskan WordPress", ket: "Izin file, wp-config, plugin" }
  - { bab: 15, judul: "Memburu Webshell dan Judol", ket: "Pindai & bersihkan" }
  - { bab: 16, judul: "Backup yang Benar-Benar Bisa Dipulihkan", ket: "Bagian 5 · Otomatis + Google Drive", cuplikan: true }
  - { bab: 17, judul: "Update dan Pemantauan Harian", ket: "Laporan pagi yang jalan sendiri", cuplikan: true }
  - { bab: 18, judul: "Perawatan Rutin dan Rencana Darurat", ket: "Jadwal mingguan & kalau server tumbang" }
bantuan:
  judul: "Nggak sempat ngoprek server? Biar saya yang pindahin."
  teks: "Belajar VPS dengan benar butuh satu sampai dua akhir pekan. Kalau website sekolah, desa, kampus, atau usaha kamu perlu pindah sekarang, saya siap bantu mengerjakannya sampai online dan aman, sesuai langkah-langkah di ebook ini."
  poin:
    - "Bantu pilih paket VPS yang pas sama kebutuhan dan budget"
    - "Siapkan server: Nginx, PHP, MariaDB, dan HTTPS"
    - "Pindahin WordPress dari cPanel tanpa website mati lama"
    - "Pasang pengaman berlapis: firewall, Fail2ban, dan Cloudflare"
    - "Atur backup otomatis ke Google Drive plus laporan harian"
---

## "Pindah ke VPS aja, Pak."

Pak Hendra, operator di SMK Contoh, punya masalah yang datang tiap bulan Juni. Pengumuman PPDB keluar, ratusan orang tua buka website bareng, dan yang muncul cuma tulisan `508 Resource Limit Is Reached`. Vendor yang dulu bikin websitenya cuma bilang satu kalimat: pindah ke VPS aja.

Saran itu nggak salah. Tapi juga belum tentu benar. Cara paling gampang memahaminya, bayangin tempat tinggal:

<figure class="eb-fig">
  <img src="/img/ebook/vps-hosting.webp" alt="Tiga jenis hosting: shared hosting seperti kos-kosan, VPS seperti kontrakan, dedicated server seperti rumah sendiri" width="1200" height="472" loading="lazy">
  <figcaption>Gambar 1 · Shared hosting itu kos-kosan, VPS itu kontrakan, dedicated itu rumah sendiri.</figcaption>
</figure>

Di kos, ada ibu kos yang ngurus pompa air. Di kontrakan, kamu bebas cat dinding warna apa aja, tapi **genteng bocor sekarang urusanmu sendiri**. Kunci hilang, atap bocor, maling masuk, semuanya kamu yang urus.

Makanya Bab 1 justru dibuka dengan bagian yang jarang ditulis orang yang jualan VPS: kapan kamu **belum** butuh VPS. Ada empat tanda kamu sebaiknya tetap di hosting biasa, dan salah satunya bikin banyak orang batal pindah setelah sadar masalahnya ternyata bukan di hostingnya, tapi di...

## Pengaman yang nyala, tapi buta

Bagian 4 adalah bagian terbesar di ebook ini, karena server yang online tanpa pengamanan cuma soal waktu sampai dibobol. Salah satu pengamannya Fail2ban, satpam yang mengusir tukang tebak password SSH.

Pasangnya gampang. Statusnya `active`. Kelihatannya beres. Saya juga mengira begitu, sampai saya sengaja login pakai user ngawur tiga kali, lalu ngecek lagi:

<figure class="eb-fig">
  <img src="/img/ebook/vps-fail2ban.webp" alt="Terminal: catatan SSH mencatat 3 login gagal, tapi Fail2ban mencatat 0" width="1200" height="400" loading="lazy">
  <figcaption>Gambar 82 · Catatan SSH bilang 3 login gagal. Fail2ban bilang 0.</figcaption>
</figure>

Fail2ban-nya menyala, tapi **menatap pintu yang salah**. Di Ubuntu 24.04 ada satu nama layanan yang berubah, dan pengaturan bawaan Fail2ban belum ikut berubah. Kebanyakan tutorial di internet nggak pernah ngetes sampai sini, jadi banyak server yang merasa dijaga padahal satpamnya merem.

Perbaikannya cuma satu baris di `jail.local`. Barisnya, dan cara membuktikan Fail2ban benar-benar memblokir IP penyerang, ada di Bab 11. Ini juga yang jadi prinsip seluruh ebook: pengaman harus **diuji**, bukan cuma...

## "Website sekolah kecil nggak bakal diincar"

Itu kalimat paling berbahaya yang sering saya dengar. Ini angka asli dari website demo ebook ini, yang nggak pernah dipromosikan ke siapa pun, dalam 30 hari:

<figure class="eb-fig">
  <img src="/img/ebook/vps-angka.webp" alt="Tabel: 6.400 permintaan mencari file rahasia, 2.640 percobaan login, 300 ke xmlrpc.php dalam 30 hari" width="1200" height="450" loading="lazy">
  <figcaption>Bab 13 · Kira-kira 1 dari 5 "pengunjung" ternyata bot yang nyari password database.</figcaption>
</figure>

Bot-bot ini nemuin website kamu bukan lewat Google, tapi lewat daftar sertifikat SSL yang baru terbit. Begitu online, website langsung diketuk.

Kabar baiknya, semua penangkalnya di Bab 13 bisa dikerjakan pakai **paket gratis Cloudflare**, tanpa ngetik satu perintah pun di server. Yang bikin repot cuma satu: Cloudflare baru merombak dashboard-nya, jadi menu yang disebut tutorial lama udah nggak ada. Di ebook ada peta menu lama ke menu baru, plus aturan yang...

## Punya backup belum tentu bisa pulih

Banyak orang baru sadar backup-nya rusak justru di hari mereka butuh. Makanya Bab 16 nggak berhenti di "backup sudah jalan". Ada satu langkah yang membedakan *punya backup* dengan *bisa pulih*: pulihkan cadangan ke tempat terpisah, lalu bandingkan dengan aslinya.

<figure class="eb-fig">
  <img src="/img/ebook/vps-pulih.webp" alt="Terminal: database hasil pulih berisi 26 tulisan dan 1 pengguna sama dengan aslinya, folder wp-content SAMA PERSIS" width="1200" height="426" loading="lazy">
  <figcaption>Gambar 168–169 · Isi database dan file hasil pulih sama persis dengan aslinya.</figcaption>
</figure>

Website asli sama sekali nggak disentuh selama uji ini. Dan password database juga nggak perlu diketik atau ditampilkan di layar, karena ada satu trik kecil buat ngambil nama database langsung dari...

## Keesokan paginya, semua jalan sendiri

Ini ujian sebenarnya. Saya biarin server nyala semalaman tanpa nyentuh apa pun, lalu paginya buka log:

<figure class="eb-fig">
  <img src="/img/ebook/vps-pagi.webp" alt="Terminal: backup jam 02.30 terkirim ke Google Drive dan update keamanan terpasang otomatis jam 06.11" width="1200" height="520" loading="lazy">
  <figcaption>Gambar 184–186 · Backup jam 02.30 terkirim ke Drive, update keamanan terpasang sendiri jam 06.11.</figcaption>
</figure>

Backup jalan jam setengah tiga pagi dan nyalin dirinya ke Google Drive. Jam enam, laporan cek server dan cek website siap dibaca sambil ngopi. Di sela-selanya, server masang update keamanannya sendiri.

Tapi laporan pagi itu juga nyelipin satu peringatan kecil yang gampang dilewatin: `server perlu restart`. Kapan aman restart server yang lagi dipakai, dan apa yang harus dicek setelahnya, dibahas di Bab 17 dan...
