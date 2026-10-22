# portfolio-fauzi

Sebuah wadah untuk mendokumentasikan apa yang saya kerjakan.
Website: **https://irfanfauzi.web.id**

Situs statis (HTML + CSS murni, tanpa framework di browser) yang dibangun dengan [Eleventy](https://www.11ty.dev/).
Setiap kali ada perubahan di branch `main`, GitHub Actions otomatis membangun ulang dan menerbitkan situs.

## Dashboard admin

Buka **https://irfanfauzi.web.id/admin/** untuk mengelola karya (tambah, ubah, ganti status, urutan, gambar), log pekerjaan, dan tutorial tanpa mengedit file.

- Login memakai GitHub fine-grained token (repo `portfolio-fauzi`, izin **Contents: Read and write** dan **Actions: Read-only**). Token hanya disimpan di browser yang dipakai; klik **Keluar** di komputer umum.
- Setiap **Simpan ke website** membuat commit ke `main`. Setelah status build hijau, klik **Deploy** di cPanel → Git Deploy Manager.
- Halaman admin tidak diindeks Google (`noindex` dan `robots.txt`).

## Cara memperbarui isi (manual)

Semua isi bisa diubah langsung dari GitHub (buka file → ikon pensil → **Commit changes**). Situs akan diperbarui sekitar 1 menit kemudian.

| Yang ingin diubah | File |
| --- | --- |
| Nama, email, WhatsApp, domain, teks footer | `src/_data/site.json` |
| Daftar proyek (karya) | `src/_data/proyek.json` |
| Log pekerjaan | `src/_data/log.json` |
| Tutorial | `src/tutorial/*.md` |
| Gambar proyek | `src/img/` (format `.webp`, rasio 16:10, lebar ±1040 px) |

### Menambah proyek

Tambahkan satu blok di `src/_data/proyek.json`. Urutan di file = urutan tampil (paling atas tampil pertama).

```json
{
  "id": "PRJ-13",
  "slug": "nama-proyek-tanpa-spasi",
  "judul": "Nama Proyek",
  "jenis": "INFRA",
  "status": "live",
  "label": ["Proxmox", "Server"],
  "ringkasan": "Satu-dua kalimat yang tampil di kartu.",
  "gambar": "nama-gambar.webp",
  "ilustrasi": false,
  "lebar": false,
  "teknologi": ["Proxmox VE", "Ubuntu"],
  "tautan": "https://contoh.com",
  "cerita": ["Paragraf pertama di halaman detail.", "Paragraf kedua."],
  "poin": ["Hal yang dikerjakan 1", "Hal yang dikerjakan 2"]
}
```

- `status`: `live` (Go Live), `prog` (Progress), atau `plan` (Rancangan).
- `jenis`: label pendek di tag kabel, misalnya `APP`, `WEB`, `INFRA`.
- `ilustrasi`: `true` kalau gambarnya bukan screenshot asli (muncul label "Ilustrasi").
- `lebar`: `true` agar kartu tampil lebar (2 kolom). Pakai di proyek unggulan.
- `teknologi`, `tautan`, `cerita`, `poin` boleh dihapus kalau belum ada. `cerita` dan `poin` mengisi halaman detail `/karya/<slug>/`.
- Angka di bagian atas (go live, progress, rancangan) dan tab dihitung otomatis.

### Menambah log pekerjaan

Tambahkan baris paling atas di `src/_data/log.json` (beranda menampilkan 10 terbaru):

```json
{ "tanggal": "2026-10-22", "pesan": "Website portfolio go live", "proyek": "PRJ-13", "status": "ok" },
```

`status`: `ok` (titik hijau) atau `wip` (titik kuning). `proyek` boleh dihapus.

### Menulis tutorial

Sudah ada 5 kerangka tutorial di `src/tutorial/` dengan `draft: true`. Selama masih draft, judulnya tampil di beranda dengan label **Segera** dan halamannya belum terbit.
Isi tulisannya dengan format Markdown, lalu ubah `draft: true` menjadi `draft: false` dan perbarui `date`. Untuk tutorial baru, salin salah satu file dan ganti nama filenya (nama file = alamat halaman).

## Menjalankan di komputer (opsional)

```bash
npm install
npm start        # pratinjau di http://localhost:8080
npm run build    # hasil di folder _site/
```

Folder `_site/` juga bisa di-upload langsung ke hosting biasa (cPanel / public_html) kalau suatu saat pindah hosting.

## Hosting (cPanel DomaiNesia)

Alurnya: **edit di GitHub → otomatis di-build → Pull di cPanel**.

1. Setiap push ke `main`, GitHub Actions (`.github/workflows/build-hosting.yml`) membangun website dan menyimpan hasil jadinya di branch **`hosting`**.
2. Di cPanel → **Git™ Version Control**, repo ini di-clone dari branch `hosting`.
3. Untuk menayangkan perubahan: **Manage → Pull or Deploy → Update from Remote**, lalu **Deploy HEAD Commit**.
   File `.cpanel.yml` menyalin website ke `public_html` (folder lain di sana tidak dihapus).

### Setup pertama di cPanel

1. cPanel → **Git™ Version Control** → **Create**.
2. Aktifkan *Clone a Repository*, isi:
   - Clone URL: `https://github.com/oneofficedepok-cloud/portfolio-fauzi.git`
   - Repository Path: `repositories/portfolio-fauzi`
   - Repository Name: `portfolio-fauzi`
3. Setelah ter-clone: **Manage** → di *Checked-Out Branch* pilih **`hosting`** → **Update**.
4. Tab **Pull or Deploy** → **Deploy HEAD Commit**.

Kalau document root `irfanfauzi.web.id` bukan `public_html` (cek di cPanel → Domains), ubah `DEPLOYPATH` di `src/.cpanel.yml`.
Setelah SSL aktif, buka komentar blok redirect HTTPS di `src/.htaccess`.
