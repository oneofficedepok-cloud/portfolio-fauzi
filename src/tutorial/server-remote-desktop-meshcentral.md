---
title: "Capek kena limit TeamViewer, aku bangun server remote desktop sendiri"
kategori: "Server"
menit: 11
date: 2026-10-23
deskripsi: "Dari drama remote PC cabang yang selalu kena limit, riset cari solusi, sampai bangun server MeshCentral sendiri di LXC Proxmox. Lengkap dengan cara uji dan panduan pasangnya."
draft: false
candaan: "Pakai TeamViewer gratis buat remote 40 PC cabang itu kayak numpang Wi-Fi tetangga buat nonton bola: lancar lima menit, habis itu dicurigai."
---

Kalau kamu anak IT yang pegang banyak cabang, pasti pernah ngalamin ini: lagi asyik makan siang, HP bunyi, isinya chat dari cabang. *"Mas, printer nggak bisa ngeprint."* Lima menit kemudian: *"Mas, Excel-nya hilang."* Sepuluh menit kemudian: *"Mas, ini kenapa layarnya biru?"*

Dan karena cabangnya jauh, satu-satunya penyelamat adalah aplikasi remote. Masalahnya, penyelamat ini sering banget **ngambek di tengah jalan**.

Di artikel ini aku spill perjalanan aku dari korban limit aplikasi remote gratisan, riset nyari solusi, sampai akhirnya **bangun server remote desktop sendiri pakai MeshCentral**. Sekarang semua PC cabang bisa aku remote dari satu dashboard, tanpa limit, tanpa drama. Gaskeun.

## Masalah yang diselesaikan

### Babak 1: Drama "sesi Anda telah berakhir"

Awalnya semua aman. Pakai TeamViewer, AnyDesk, dan kawan-kawan versi gratis. Minta user cabang buka aplikasinya, kirim ID dan password lewat WhatsApp, terus aku masuk. Simpel.

Sampai suatu hari, lagi benerin printer cabang, tiba-tiba muncul notifikasi yang intinya: *"Kami mendeteksi penggunaan komersial."* Lalu sesinya diputus. Coba lagi, diputus lagi. Coba pakai aplikasi lain, lancar dua hari, habis itu kena juga.

Wajar sih, versi gratis memang buat pemakaian pribadi. Tapi coba bayangin posisinya:

- **Sesi keputus pas lagi install driver.** Driver setengah jadi, printer makin ngambek, user makin panik.
- **User harus kirim ID dan password tiap kali.** Dan ID-nya sering salah ketik. Satu angka beda, aku nyasar ke PC orang lain. (Bercanda. Semoga.)
- **PC tanpa orang di depannya nggak bisa diremote.** Mau update Windows malam-malam pas cabang tutup? Nggak bisa, karena nggak ada yang buka aplikasinya.
- **Lisensi berbayar untuk puluhan PC itu lumayan.** Budget IT kantor biasanya lebih kecil dari budget snack rapat.

Jadi masalahnya bukan cuma "aplikasinya ngelimit". Intinya: **kantor butuh alat remote yang bisa dipakai tiap hari ke semua PC cabang, tanpa nunggu user, dan nggak bikin budget menangis.**

### Babak 2: Riset, alias membandingkan pilihan sambil ngopi

Sebelum bangun apa-apa, aku bikin daftar dulu. Ini hasil riset aku, versi jujur:

| Opsi | Kelebihan | Kenapa belum cocok |
| --- | --- | --- |
| TeamViewer / AnyDesk berbayar | Gampang, stabil | Biaya lisensi per tahun, makin banyak PC makin mahal |
| Chrome Remote Desktop | Gratis | Terikat akun Google per PC, ribet dikelola banyak cabang |
| RDP + VPN | Bawaan Windows | Butuh VPN rapi ke semua cabang, Windows edisi Home nggak bisa jadi host RDP |
| RustDesk self-hosted | Open source, bisa server sendiri | Bagus, tapi aku butuh dashboard web buat kelola banyak PC sekaligus |
| **MeshCentral** | Open source, gratis, **dashboard web**, agen jalan di background, bisa remote layar + terminal + file | Perlu server sendiri (dan itu justru yang aku mau) |

Yang bikin aku jatuh hati sama **MeshCentral**:

- **Semua lewat browser.** Aku nggak perlu install aplikasi khusus di laptop sendiri. Buka web, login, klik PC, langsung remote.
- **Agen jalan terus di PC cabang** sebagai service Windows. Jadi PC bisa diremote walaupun nggak ada orang di depannya.
- **Agen yang nyambung ke server**, bukan sebaliknya. Artinya, PC cabang **nggak perlu IP publik atau buka port**, cukup ada internet.
- **Fiturnya lengkap**: remote desktop, terminal, transfer file, lihat proses, restart, bahkan Wake-on-LAN.
- **Gratis dan open source.** Budget aman, bos senang, anak IT bisa tidur siang (sebentar).

Keputusan final: bangun server MeshCentral sendiri.

## Yang dibutuhkan

Spesifikasi yang aku pakai dan sekarang sudah menampung **semua PC cabang**:

- **Proxmox VE** sebagai tempat bikin container. Belum punya? Baca dulu [Membangun server virtualisasi untuk kantor kecil](/tutorial/server-virtualisasi-kantor-kecil/).
- **1 container LXC** dengan:
  - OS **Ubuntu 22.04**
  - **2 core** CPU
  - **8 GB** RAM (jujur ini lega banget, MeshCentral sebenarnya irit)
  - Disk 32 GB sudah cukup
- **IP publik atau domain** yang mengarah ke kantor, misalnya `remote.domainkamu.com`, supaya agen dari cabang bisa nyambung.
- **Akses ke router kantor** buat port forwarding port **443** (dan **80** untuk sertifikat SSL) ke container.
- Kopi. Banyak.

## Langkah-langkah

### 1. Bikin container LXC di Proxmox

1. Di Proxmox, buka storage `local` > **CT Templates** > **Templates**, download **ubuntu-22.04-standard**.
2. Klik **Create CT** di pojok kanan atas:
   - **Hostname**: `meshcentral`
   - Centang **Unprivileged container** (lebih aman).
   - **Template**: ubuntu-22.04-standard.
   - **Disk**: 32 GB.
   - **CPU**: 2 cores. **Memory**: 8192 MB.
   - **Network**: IP statis, misalnya `192.168.10.30/24`, gateway router kantor.
3. Setelah jadi, buka **Options** > **Start at boot** jadikan *Yes*. Server remote yang ikut mati pas Proxmox restart itu namanya bukan server, tapi drama.

Masuk ke console container, lalu update dulu:

```bash
apt update && apt upgrade -y
apt install -y curl
```

### 2. Install Node.js

MeshCentral jalan di atas Node.js. Pakai versi LTS dari NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v
```

Kalau keluar angka versi, berarti aman. Kalau keluar error, tarik napas, baca lagi pelan-pelan.

### 3. Install MeshCentral

Bikin user khusus biar MeshCentral nggak jalan sebagai root:

```bash
useradd -r -m -d /opt/meshcentral -s /usr/sbin/nologin meshcentral
cd /opt/meshcentral
sudo -u meshcentral npm install meshcentral
```

Karena MeshCentral perlu pakai port 443 dan 80 (port "istimewa" di Linux), kasih izin ke Node.js:

```bash
setcap 'cap_net_bind_service=+ep' "$(readlink -f "$(which node)")"
```

Jalankan sekali untuk membuat folder data dan file konfigurasi awal, lalu tekan **Ctrl+C** setelah muncul tulisan server sudah jalan:

```bash
sudo -u meshcentral node node_modules/meshcentral
```

### 4. Atur konfigurasi

Edit file `/opt/meshcentral/meshcentral-data/config.json`. Ini versi ringkas yang aku pakai (ganti domain dan email dengan punya kamu):

```json
{
  "settings": {
    "cert": "remote.domainkamu.com",
    "WANonly": true,
    "port": 443,
    "redirPort": 80
  },
  "domains": {
    "": {
      "title": "Remote IT Kantor",
      "newAccounts": false
    }
  },
  "letsencrypt": {
    "email": "it@domainkamu.com",
    "names": "remote.domainkamu.com",
    "production": true
  }
}
```

Penjelasan singkatnya:

- **cert**: nama domain server. Ini penting, karena agen di cabang akan nyambung ke alamat ini.
- **WANonly**: agen nyambung lewat internet, cocok buat banyak cabang.
- **newAccounts: false**: orang lain nggak bisa daftar akun sendiri. Server remote yang bisa didaftari siapa saja itu bukan server, tapi undangan terbuka buat maling.
- **letsencrypt**: sertifikat SSL gratis dan otomatis, jadi dashboard pakai HTTPS beneran.

> Catatan: buat sementara, set **newAccounts** ke `true` dulu, karena kita perlu bikin akun admin pertama. Setelah akun admin jadi, balikin ke `false`.

### 5. Arahkan domain dan buka port

1. Di pengelola DNS domain kamu, bikin **A record** `remote` yang mengarah ke **IP publik kantor**.
2. Di router kantor, bikin **port forwarding**:
   - TCP **443** ke `192.168.10.30:443`
   - TCP **80** ke `192.168.10.30:80` (dipakai Let's Encrypt buat verifikasi sertifikat)

Cuma itu port yang dibuka. PC cabang **nggak perlu** setting apa-apa di router mereka.

### 6. Jadikan service biar jalan otomatis

Bikin file `/etc/systemd/system/meshcentral.service`:

```ini
[Unit]
Description=MeshCentral Server
After=network.target

[Service]
Type=simple
User=meshcentral
WorkingDirectory=/opt/meshcentral
ExecStart=/usr/bin/node /opt/meshcentral/node_modules/meshcentral
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Lalu aktifkan:

```bash
systemctl daemon-reload
systemctl enable --now meshcentral
systemctl status meshcentral
```

Kalau statusnya **active (running)** warna hijau, selamat. Kamu resmi punya server remote sendiri. Boleh joget dikit.

### 7. Bikin akun admin dan grup perangkat

1. Buka `https://remote.domainkamu.com` di browser.
2. Klik **Create Account**. **Akun pertama yang dibuat otomatis jadi admin server**, jadi pastikan itu kamu, bukan anak magang yang lagi iseng.
3. Setelah login, balikin `newAccounts` jadi `false` di config, lalu `systemctl restart meshcentral`.
4. Aktifkan **login 2 langkah (2FA)** di menu akun. Server yang bisa mengendalikan semua PC kantor wajib dikunci dobel.
5. Klik **Add Device Group**, bikin grup per cabang, misalnya `Cabang 1`, `Cabang 2`, `Kantor Pusat`. Biar rapi dan gampang dicari.

### 8. Pasang agen di PC cabang

1. Buka grup perangkat, klik **Add Agent**.
2. Pilih **Windows**, lalu download installer-nya. Installer ini sudah "tahu" alamat server dan grupnya.
3. Jalankan installer di PC cabang (sekali saja, bisa minta tolong user cabang atau lewat remote terakhir pakai aplikasi lama), klik **Install**.
4. Dalam beberapa detik, PC itu muncul di dashboard dengan status **online**.

Ulangi untuk semua PC. Ini satu-satunya momen kamu masih butuh bantuan user cabang. Setelah itu, mereka bebas dari kewajiban kirim-kirim ID dan password lagi.

**Etika remote:** di pengaturan grup, kamu bisa mengaktifkan **notifikasi atau minta izin user** sebelum sesi remote dimulai. Aku sarankan aktifkan, apalagi di jam kerja. Remote tanpa permisi itu nggak sopan, sama kayak masuk rumah orang tanpa salam.

## Uji server

Sebelum diumumkan ke semua cabang, aku uji dulu biar nggak malu:

1. **Remote desktop**: buka satu PC, klik **Desktop** > **Connect**. Cek gerakan mouse dan keyboard lancar.
2. **Terminal dan file**: coba buka **Terminal** dan **Files**, upload satu file kecil ke PC cabang.
3. **Dari luar kantor**: matikan Wi-Fi laptop, pakai hotspot HP, lalu buka dashboard. Kalau bisa remote dari sini, berarti port forwarding dan domain sudah benar.
4. **Uji restart PC cabang**: restart PC dari dashboard, tunggu sampai online lagi. Agen harus nyambung otomatis tanpa ada yang login.
5. **Uji restart server**: restart container di Proxmox. Pastikan MeshCentral hidup lagi sendiri dan semua PC kembali online.
6. **Pantau resource**: cek CPU dan RAM container di Proxmox setelah semua PC cabang terpasang. Di tempat aku, 2 core dan 8 GB RAM masih santai banget.

Kalau enam tes ini lolos, server siap dipakai produksi.

### Kalau ada yang error

- **Agen nggak muncul di dashboard**: cek domain di `cert` sudah benar dan port 443 sudah diteruskan. Coba buka domainnya dari jaringan cabang.
- **Sertifikat SSL gagal**: pastikan port 80 juga sudah diteruskan dan DNS sudah mengarah ke IP yang benar (kadang butuh waktu untuk propagasi).
- **Service gagal jalan di port 443**: ulangi perintah `setcap` di langkah 3, terutama setelah Node.js di-update.
- **Remote patah-patah**: cek upload internet di kantor pusat. Server remote secepat apa pun kalah sama internet yang lemot.

### Jangan lupa backup

Semua data penting MeshCentral (akun, grup, daftar perangkat, sertifikat) ada di folder `/opt/meshcentral/meshcentral-data`. Paling gampang: masukkan container ini ke jadwal **backup Proxmox** harian. Kalau mau lebih serius, baca juga [Backup otomatis harian ke NAS dan cloud](/tutorial/backup-otomatis-nas-cloud/).

## Hasil akhir

Setelah server ini jalan, hidup aku sebagai anak IT berubah drastis:

- **Semua PC cabang tampil di satu dashboard**, dikelompokkan per cabang, lengkap dengan status online atau offline.
- **Remote tanpa limit dan tanpa lisensi**, karena servernya punya sendiri.
- **Nggak perlu minta ID dan password ke user lagi.** Tinggal klik PC-nya, langsung masuk.
- **Bisa remote PC yang nggak ada orangnya**, jadi update dan perawatan bisa dilakukan di luar jam kerja.
- **Lebih aman**: HTTPS, akun admin dengan 2FA, pendaftaran akun ditutup, dan notifikasi ke user saat diremote.
- **Hemat resource**: cuma butuh satu container kecil di Proxmox.

Dan yang paling penting: makan siang aku sekarang lebih tenang. Chat dari cabang masih tetap ada sih, tapi sekarang aku cukup balas, *"Oke, aku cek dari sini ya."* Lalu buka browser, klik, beres. Sambil ngunyah.
