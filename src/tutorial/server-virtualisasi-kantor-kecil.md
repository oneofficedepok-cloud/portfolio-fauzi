---
title: "Membangun server virtualisasi untuk kantor kecil"
kategori: "Server"
menit: 5
date: 2026-10-21
deskripsi: "Satu mesin fisik, banyak server di dalamnya. Begini cara aku bangun server virtualisasi pakai Proxmox biar kantor kecil nggak perlu beli server satu-satu."
draft: false
urutan: 1
---

Jujurly, banyak kantor kecil masih punya pola kayak gini: ada PC buat file server, ada PC lain buat aplikasi akuntansi, ada lagi satu buat database. Semua nyala 24 jam, makan listrik, dan kalau salah satu rusak, semua orang panik. Di tutorial ini aku spill cara aku ngeringkas semua itu jadi **satu server fisik** yang isinya banyak "server virtual" pakai **Proxmox VE**.

## Masalah yang diselesaikan

- **Server berceceran.** Tiap aplikasi punya PC sendiri, jadi boros listrik, boros tempat, dan ribet dirawat.
- **Susah dipulihkan.** Kalau harddisk PC aplikasi mati, install ulang bisa makan seharian. Nggak ada snapshot, nggak ada backup yang rapi.
- **Mau nyoba sesuatu, takut rusak.** Mau update aplikasi atau tes sistem baru, tapi nggak ada tempat aman buat eksperimen.
- **Budget terbatas.** Lisensi hypervisor berbayar mahal banget buat skala kantor kecil.

Proxmox jawab semuanya: open source, gratis dipakai, ada web dashboard, bisa snapshot, bisa backup terjadwal, dan bisa jalanin VM (Windows/Linux) maupun container (LXC) yang super ringan.

## Yang dibutuhkan

- **1 mesin server atau PC yang cukup kuat.** Minimal CPU yang support virtualisasi (Intel VT-x / AMD-V), RAM 32 GB biar lega, dan sebaiknya 2 SSD buat dibikin mirror.
- **Flashdisk 8 GB** buat installer.
- **ISO Proxmox VE** versi terbaru dari situs resmi proxmox.com.
- **IP statis** di jaringan kantor buat servernya, misalnya `192.168.10.5`.
- **UPS.** Ini wajib, bukan opsional. Server virtual yang mati mendadak karena listrik itu red flag banget.
- Laptop buat akses dashboard lewat browser.

## Langkah-langkah

### 1. Cek dan siapkan hardware

Masuk ke BIOS, pastikan **Intel VT-x / AMD-V** (dan kalau ada, **VT-d / IOMMU**) dalam posisi *Enabled*. Tanpa ini, VM nggak bakal jalan. Kalau ada 2 SSD, colok dua-duanya, nanti kita jadiin satu pasangan mirror.

### 2. Bikin flashdisk installer

Download ISO Proxmox VE, lalu tulis ke flashdisk pakai **balenaEtcher** atau **Rufus** (mode DD). Boot server dari flashdisk itu.

### 3. Install Proxmox

Ikutin wizard-nya, tapi perhatiin bagian ini:

- **Target disk:** klik *Options*, pilih filesystem **ZFS (RAID1)** kalau punya 2 disk. Jadi kalau satu SSD mati, data aman di SSD satunya. Auto tenang.
- **Network:** isi IP statis, gateway (router kantor), dan DNS. Hostname bikin yang jelas, misalnya `pve01.kantor.lan`.
- **Password root dan email:** simpan password di password manager, jangan di sticky note monitor ya.

Setelah selesai dan reboot, buka dari laptop:

```
https://192.168.10.5:8006
```

Login pakai user `root` dan realm *Linux PAM*. Kalau browser bilang "not secure", itu normal karena sertifikatnya self-signed.

### 4. Atur repository update

Versi gratis Proxmox nggak pakai repo enterprise, jadi kita ganti biar update tetap jalan:

1. Buka **node > Updates > Repositories**.
2. *Disable* repo yang namanya **enterprise** (baik PVE maupun Ceph).
3. Klik **Add**, pilih **No-Subscription**, simpan.
4. Balik ke **Updates**, klik **Refresh** lalu **Upgrade**.

Popup "No valid subscription" waktu login boleh dicuekin, itu cuma pengingat.

### 5. Upload ISO dan template

- Buat **VM**: buka storage `local` > **ISO Images** > **Upload**, masukin ISO Windows Server / Ubuntu Server.
- Buat **container (LXC)**: buka **CT Templates** > **Templates**, download misalnya `debian-12-standard`. Container ini enteng banget, cocok buat aplikasi web, database kecil, atau tools internal.

### 6. Bikin VM pertama

Klik **Create VM** di pojok kanan atas, lalu:

- **OS:** pilih ISO yang tadi diupload.
- **System:** kalau Windows, centang **Qemu Agent** dan pakai SCSI controller **VirtIO SCSI single**.
- **Disks:** bus **SCSI**, centang **Discard** kalau storagenya SSD.
- **CPU:** type **host** biar performanya maksimal.
- **Memory:** kasih secukupnya, misalnya 4–8 GB. Jangan semua RAM dikasih ke satu VM.
- **Network:** bridge `vmbr0`, model **VirtIO**.

Khusus Windows, siapin juga ISO **virtio-win** buat driver disk dan network-nya. Setelah OS terinstall, pasang **QEMU Guest Agent** di dalam VM supaya Proxmox bisa shutdown VM dengan rapi.

### 7. Atur supaya VM nyala otomatis

Di tiap VM, buka **Options > Start at boot** jadikan *Yes*. Atur juga **Start/Shutdown order** kalau ada urutan, misalnya database harus nyala duluan sebelum aplikasi.

### 8. Pasang backup terjadwal

Ini bagian paling penting dan sering di-skip. Buka **Datacenter > Backup > Add**:

- **Schedule:** tiap hari jam 22:00 atau di luar jam kerja.
- **Mode:** **Snapshot**, jadi VM tetap jalan waktu dibackup.
- **Compression:** **ZSTD** (cepat dan hemat).
- **Retention:** misalnya simpan 7 harian dan 4 mingguan.
- **Storage:** arahkan ke NAS atau disk terpisah, **jangan** ke disk yang sama dengan VM.

Detail backup ke NAS dan cloud aku bahas di tutorial *Backup otomatis harian ke NAS dan cloud*.

### 9. Biasain pakai snapshot

Sebelum update aplikasi atau Windows, klik **Snapshot > Take Snapshot**. Kalau ada yang error setelah update, tinggal **Rollback**, beres dalam hitungan detik. Tapi ingat: snapshot itu bukan backup, hapus snapshot lama setelah update aman.

## Hasil akhir

Setelah semua jalan, kantor punya:

- **Satu server fisik** yang isinya beberapa VM dan container, misalnya file server, aplikasi akuntansi, database, dan server tools internal.
- **Dashboard web** buat mantau CPU, RAM, dan disk semua server dari satu layar.
- **Backup otomatis tiap malam** plus snapshot sebelum update, jadi kalau ada masalah tinggal restore.
- **Hemat listrik dan tempat**, karena PC-PC lama bisa dipensiunkan.

Tips terakhir dari aku: catat semua IP, nama VM, dan fungsinya di satu dokumen. Server yang rapi itu bukan cuma yang jalan, tapi yang bisa dipahami orang lain kalau kamu lagi cuti.
