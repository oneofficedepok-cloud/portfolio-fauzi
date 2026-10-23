---
title: "Backup otomatis harian ke NAS dan cloud"
kategori: "Backup"
menit: 8
date: 2026-10-20
deskripsi: "Data kantor itu aset. Ini cara aku bikin backup yang jalan sendiri tiap malam ke NAS dan ke cloud, lengkap dengan cara ngecek kalau backup-nya beneran bisa dipulihkan."
draft: false
urutan: 2
candaan: "Ditanya 'backup terakhir kapan?', ruangan langsung hening. Lebih hening dari server yang baru kena ransomware."
---

Pertanyaan paling horor di dunia IT: *"Backup terakhir kapan?"* terus semua orang diem. Kebanyakan kantor sebenarnya "punya backup", tapi isinya copy manual ke harddisk eksternal yang terakhir dilakukan tiga bulan lalu. Di tutorial ini aku spill cara bikin backup yang **jalan sendiri tiap malam**, ke **NAS di kantor** dan ke **cloud**, dan yang paling penting: **beneran bisa dipulihkan**.

## Masalah yang diselesaikan

- **Backup manual = backup yang lupa.** Kalau ngandelin orang buat copy file, cepat atau lambat pasti kelewat.
- **Backup satu tempat aja nggak cukup.** Harddisk eksternal yang ditaruh di samping server ikut hilang kalau ada kebakaran, banjir, atau pencurian.
- **Ransomware.** Kalau folder backup bisa diakses langsung dari PC user, ransomware bisa ikut ngenkripsi backup-nya. Game over.
- **Data cabang tercecer.** Tiap cabang nyimpen data sendiri-sendiri tanpa salinan di pusat.

## Yang dibutuhkan

- **Aturan 3-2-1** sebagai pegangan: **3** salinan data, di **2** media berbeda, **1** di luar kantor.
- **NAS** (Synology, TrueNAS, atau server Linux dengan disk besar) sebagai tujuan backup lokal. Pakai RAID 1 minimal.
- **Akun cloud storage** yang support S3 atau sejenisnya (misalnya Backblaze B2, Wasabi, Google Drive, atau object storage lokal).
- **Server Linux kecil** (bisa VM/container di Proxmox) buat jalanin script, dengan `rsync` dan `rclone` terpasang.
- **Akun notifikasi**, misalnya bot Telegram atau email, buat lapor tiap backup selesai atau gagal.

## Langkah-langkah

### 1. Petakan data mana yang wajib dibackup

Jangan langsung "backup semua". Bikin daftar dulu:

| Data | Lokasi | Seberapa penting |
| --- | --- | --- |
| Folder share kantor | File server | Wajib |
| Database aplikasi (ERP, dll) | Server database | Wajib |
| VM dan container | Proxmox | Wajib |
| Email | Hosting / cloud | Cek apakah provider sudah backup |
| File di laptop user | Laptop | Arahkan ke folder share / cloud sync |

Dari tabel ini kelihatan mana yang harus masuk jadwal malam dan mana yang cukup mingguan.

### 2. Siapkan NAS dan user khusus backup

Di NAS, bikin **share khusus backup** dan **user khusus backup** (misalnya `svc-backup`). User biasa kantor **nggak boleh** punya akses ke share ini. Ini benteng pertama dari ransomware.

Kalau NAS-nya support, aktifkan **snapshot** di share backup (di Synology namanya Snapshot Replication, di TrueNAS ada Periodic Snapshot). Snapshot ini *read-only*, jadi walaupun file backup dihapus atau dienkripsi, versi lamanya masih bisa diambil.

### 3. Backup database dulu jadi file

Database jangan di-copy file mentahnya waktu lagi jalan. Dump dulu jadi file, contoh untuk MySQL/MariaDB:

```bash
mysqldump --single-transaction --all-databases | gzip > /backup/db/db-$(date +%F).sql.gz
```

Untuk PostgreSQL pakai `pg_dump`, untuk SQL Server pakai fitur *Backup Database* bawaannya lalu arahkan hasilnya ke folder yang ikut di-sync.

### 4. Kirim ke NAS pakai rsync

Contoh script sederhana `/opt/backup/harian.sh`:

```bash
#!/bin/bash
set -e
TGL=$(date +%F)

# 1. Dump database
mysqldump --single-transaction --all-databases | gzip > /backup/db/db-$TGL.sql.gz

# 2. Sinkron folder share ke NAS
rsync -a --delete /data/share/ svc-backup@192.168.10.20:/volume1/backup/share/

# 3. Kirim hasil dump database
rsync -a /backup/db/ svc-backup@192.168.10.20:/volume1/backup/db/

# 4. Hapus dump lokal yang lebih dari 14 hari
find /backup/db -name "*.sql.gz" -mtime +14 -delete
```

Pakai **SSH key** buat login ke NAS biar nggak perlu password di script. `--delete` bikin isi NAS sama persis dengan sumber, makanya snapshot di langkah 2 itu penting: kalau ada file kehapus di sumber, versi lamanya masih ada di snapshot.

### 5. Kirim salinan ke cloud pakai rclone

Setup sekali pakai `rclone config`. Saran aku: bikin remote **crypt** di atas remote cloud-nya, jadi data dienkripsi **sebelum** keluar dari kantor. Provider cloud pun nggak bisa baca isinya.

Tambahin di akhir script:

```bash
# 5. Salinan terenkripsi ke cloud
rclone sync /backup/ cloud-crypt:kantor --transfers 4 --log-file /var/log/rclone.log
```

Kalau di cloud-nya ada fitur **versioning** atau **object lock**, aktifin juga. Ini lapisan perlindungan terakhir kalau semuanya kena.

### 6. Jadwalkan pakai cron

Buka `crontab -e` lalu tambahkan:

```
0 23 * * * /opt/backup/harian.sh && /opt/backup/lapor.sh OK || /opt/backup/lapor.sh GAGAL
```

Artinya: tiap jam 23:00 backup jalan, lalu kirim laporan sukses atau gagal. Script `lapor.sh` isinya cukup satu `curl` ke API bot Telegram. Jadi tiap pagi kamu tinggal lihat HP: ada centang atau ada alarm.

### 7. Backup dari cabang

Untuk cabang, prinsipnya sama: server atau PC kecil di cabang jalanin script yang kirim data ke NAS pusat lewat **VPN site-to-site**. Jadwalnya geser-geser per cabang (cabang A jam 21:00, cabang B jam 22:00) biar bandwidth pusat nggak penuh barengan.

### 8. Tes restore, jangan cuma percaya

Backup yang belum pernah dites restore itu cuma harapan. Bikin jadwal **sebulan sekali**:

1. Ambil satu file random dari NAS, buka, cek isinya.
2. Restore satu dump database ke server tes, pastikan aplikasinya bisa baca.
3. Tiga bulan sekali, coba restore dari **cloud**, bukan cuma dari NAS.

Catat hasilnya di log. Kalau suatu hari ada audit atau insiden, kamu punya bukti backup-nya sehat.

## Hasil akhir

- **Backup jalan sendiri tiap malam**, tanpa ada yang perlu ingat.
- **3 salinan data**: di server asli, di NAS kantor (dengan snapshot), dan di cloud (terenkripsi).
- **Notifikasi tiap pagi**, jadi kalau backup gagal ketahuan di hari yang sama, bukan pas udah butuh.
- **Tahan ransomware** karena share backup terpisah dari user dan punya snapshot read-only.
- **Teruji**: restore dicoba rutin, bukan cuma diasumsikan.

Intinya: backup yang bagus itu yang membosankan. Jalan tiap hari, nggak pernah drama, dan pas dibutuhin, langsung bisa dipakai.
