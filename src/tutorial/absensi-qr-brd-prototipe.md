---
title: "Merancang absensi QR dari BRD sampai prototipe"
kategori: "Aplikasi"
menit: 4
date: 2026-10-22
deskripsi: "Behind the scenes bikin aplikasi absensi QR buat event: dari nulis BRD, nentuin alur, desain data, sampai prototipe yang bisa langsung dicoba klien."
draft: true
urutan: 5
---

---

---

Absensi event pakai kertas dan pulpen itu vibes-nya tahun 2010: antrean panjang di meja registrasi, tulisan nggak kebaca, dan panitia baru tahu jumlah peserta yang datang pas acara udah kelar. Di tutorial ini aku spill proses aku merancang **Absensi Digital QR For Event**, mulai dari **BRD**, alur pengguna, desain data, sampai **prototipe** yang bisa langsung dicoba klien sebelum ngoding beneran.

## Masalah yang diselesaikan

- **Antrean registrasi lama.** Satu peserta bisa 1–2 menit cuma buat cari nama di daftar dan tanda tangan.
- **Data kehadiran telat.** Panitia baru bisa rekap setelah acara, padahal butuh angka real time (misalnya buat konsumsi atau bus).
- **Gampang dicurangi.** Titip absen, tanda tangan dobel, atau nama yang nggak terdaftar ikut masuk.
- **Event bertahap** (trip, rundown multi-sesi) butuh absen di beberapa titik, bukan cuma di pintu masuk.

## Yang dibutuhkan

- **Ngobrol dulu sama klien.** Ini input terpenting, bukan tools.
- **Dokumen BRD** (Business Requirement Document), cukup pakai Google Docs atau Notion.
- **Tools desain/prototipe**, misalnya Figma, atau langsung prototipe HTML yang bisa dibuka di HP.
- **HP Android/iPhone** buat ngetes scan QR beneran.
- **Data peserta contoh** (nama, email/WA, kategori) buat simulasi.

## Langkah-langkah

### 1. Gali kebutuhan, bukan langsung fitur

Pertanyaan yang aku tanyain ke klien di awal:

- Eventnya kayak apa? Sekali datang, atau trip berhari-hari dengan banyak titik kumpul?
- Berapa peserta dan berapa crew yang jaga?
- Peserta daftar di mana dan datanya bentuknya apa?
- Angka apa yang paling mereka butuhin saat acara berlangsung?
- Sinyal di lokasi gimana? (Ini sering dilupain dan bisa jadi plot twist.)

Dari jawaban ini baru kelihatan fitur apa yang beneran perlu.

### 2. Tulis BRD singkat tapi jelas

BRD aku biasanya isinya:

1. **Latar belakang dan tujuan**: masalah apa yang mau diselesaikan.
2. **Pengguna**: peserta, crew scanner, admin panitia.
3. **Kebutuhan fungsional**, contoh:
   - Peserta dapat **e-ticket QR** lewat email/WA.
   - Crew bisa **scan QR** dari HP.
   - Ada opsi **self check-in** (peserta scan QR di lokasi).
   - Admin lihat **dashboard kehadiran real time**.
   - Bisa **export** rekap ke Excel.
4. **Kebutuhan non-fungsional**: proses scan di bawah 2 detik, bisa dipakai di HP biasa, data aman.
5. **Di luar cakupan**: misalnya pembayaran tiket nggak termasuk fase 1.

Bagian "di luar cakupan" ini penting banget biar project nggak melebar ke mana-mana. Setelah BRD disetujui, baru bikin penawaran harga.

### 3. Gambar alur pengguna

Sebelum desain layar, gambar dulu alurnya pakai kotak dan panah:

- **Peserta:** daftar → terima e-ticket QR → datang → di-scan crew (atau self check-in) → dapat konfirmasi.
- **Crew:** login → pilih titik/sesi absen → scan → lihat hasil (hijau = valid, merah = sudah check-in / tidak terdaftar).
- **Admin:** import peserta → kirim e-ticket → pantau dashboard → export rekap.

Alur ini yang nanti jadi patokan jumlah layar di prototipe.

### 4. Desain data dan keamanan QR

Tabel intinya cuma beberapa:

| Tabel | Isi penting |
| --- | --- |
| `event` | nama, tanggal, lokasi |
| `sesi` | titik absen (misal: Keberangkatan, Hari 1, Pulang) |
| `peserta` | nama, kontak, kategori, kode tiket |
| `checkin` | peserta, sesi, waktu, crew yang scan |

Soal keamanan QR, **jangan** isi QR dengan ID berurutan kayak `0001`, `0002`, karena gampang ditebak. Pakai **kode acak panjang** (token unik) per peserta, dan validasi selalu dilakukan di server. Tambah aturan: satu peserta cuma bisa check-in sekali per sesi, scan kedua langsung muncul peringatan "sudah check-in jam sekian".

### 5. Bikin prototipe yang bisa dicoba

Ini bagian paling seru. Prototipe bukan cuma gambar statis, tapi **bisa diklik**:

- Halaman **e-ticket** peserta dengan QR besar.
- Layar **scanner crew** dengan feedback warna dan suara.
- **Dashboard admin**: jumlah terdaftar vs hadir, per sesi, update otomatis.

Kirim link prototipe ke klien dan minta mereka coba di HP masing-masing. Feedback yang datang dari "nyobain sendiri" itu jauh lebih jujur dibanding dari baca dokumen.

### 6. Revisi, kunci, baru build

Kumpulkan feedback, revisi prototipe, lalu **kunci** cakupannya. Setelah itu baru masuk tahap arsitektur dan build aplikasi. Karena alur dan datanya udah jelas dari awal, proses ngoding jadi jauh lebih lancar dan minim bongkar pasang.

## Hasil akhir

- **BRD yang disetujui klien**, jadi semua pihak sepakat soal apa yang dibangun dan apa yang tidak.
- **Prototipe yang bisa dicoba di HP**: e-ticket, scanner crew, self check-in, dan dashboard real time.
- **Desain data dan aturan keamanan QR** yang siap dipakai developer.
- **Estimasi waktu dan biaya yang lebih akurat**, karena didasarkan pada alur yang jelas.

Pelajaran yang aku dapet: semakin lama kamu di tahap BRD dan prototipe, semakin sedikit drama di tahap ngoding. Ngobrol dulu, gambar dulu, baru gaskeun.
