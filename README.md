# portfolio-fauzi

Sebuah wadah untuk mendokumentasikan apa yang saya kerjakan.
Website: **https://irfanfauzi.web.id**

Situs statis (HTML + CSS murni, tanpa framework di browser) yang dibangun dengan [Eleventy](https://www.11ty.dev/).
Setiap kali ada perubahan di branch `main`, GitHub Actions otomatis membangun ulang dan menerbitkan situs.

## Cara memperbarui isi

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

## Hosting

- GitHub Pages lewat `.github/workflows/deploy.yml` (Settings → Pages → Source: **GitHub Actions**).
- Domain `irfanfauzi.web.id` diatur lewat file `src/CNAME` dan DNS di DomaiNesia:
  - `A` record `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
  - `CNAME` record `www` → `oneofficedepok-cloud.github.io`
