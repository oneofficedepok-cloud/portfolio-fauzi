---
title: "Standar skema jaringan untuk kantor pusat dan cabang"
kategori: "Jaringan"
menit: 5
date: 2026-10-16
deskripsi: "Biar jaringan cabang nggak jadi hutan kabel dan IP acak, ini standar yang aku pakai: pola IP, VLAN, penamaan perangkat, VPN ke pusat, sampai dokumentasinya."
draft: false
urutan: 4
candaan: "Semua cabang pakai IP 192.168.1.1. Kompak banget sih, cuma VPN-nya yang nggak bisa diajak kompak."
---

Kalau kantor cuma satu, jaringan berantakan masih bisa diakalin. Tapi begitu cabangnya nambah jadi tiga, lima, sepuluh, dan tiap cabang di-setup orang yang beda, hasilnya chaos: IP tabrakan, password router beda-beda (atau malah masih default), dan nggak ada yang tahu kabel mana nyambung ke mana. Di tutorial ini aku spill **standar** yang aku pakai supaya semua cabang punya pola yang **sama persis**.

## Masalah yang diselesaikan

- **IP tabrakan antar cabang.** Semua cabang pakai `192.168.1.0/24` bawaan router, jadi pas mau disambung VPN ke pusat, nggak bisa.
- **Setup beda-beda tiap cabang.** Troubleshoot jadi lama karena tiap lokasi harus "dipelajari ulang".
- **Tamu dan CCTV satu jaringan dengan PC kantor.** Ini rawan banget dari sisi keamanan.
- **Nggak ada dokumentasi.** Teknisi yang setup resign, ilmunya ikut pergi.
- **Cabang nggak bisa akses server pusat** (ERP, file server, backup) dengan aman.

## Yang dibutuhkan

- **Router** di tiap lokasi yang support VLAN dan VPN, misalnya MikroTik (RouterOS v7) atau sejenisnya.
- **Switch managed** (bisa VLAN) di tiap lokasi.
- **Access point** yang bisa pancarkan beberapa SSID dengan VLAN berbeda.
- **Koneksi internet** di pusat dengan IP publik (atau layanan VPN/cloud sebagai titik temu).
- **Spreadsheet dokumentasi** yang disimpan di satu tempat yang bisa diakses tim IT.

## Langkah-langkah

### 1. Bikin pola IP yang konsisten

Ini fondasi semuanya. Aku pakai pola **`10.<kode cabang>.<VLAN>.0/24`**:

| Lokasi | Kode | Contoh IP kantor (VLAN 10) |
| --- | --- | --- |
| Pusat | 10 | `10.10.10.0/24` |
| Cabang 1 | 11 | `10.11.10.0/24` |
| Cabang 2 | 12 | `10.12.10.0/24` |

Jadi cukup lihat IP `10.12.30.15`, langsung ketahuan: ini di **Cabang 2**, **VLAN 30**. Nggak perlu buka catatan.

Di dalam tiap subnet juga ada aturan:

- `.1` = gateway (router)
- `.2 – .19` = switch, access point, perangkat jaringan
- `.20 – .49` = server, printer, perangkat dengan IP statis
- `.50 – .250` = DHCP untuk PC dan HP

### 2. Pisahkan jaringan pakai VLAN

Standar VLAN yang sama di semua lokasi:

| VLAN | Nama | Isinya |
| --- | --- | --- |
| 10 | KANTOR | PC dan laptop karyawan |
| 20 | SERVER | Server dan NAS (biasanya cuma di pusat) |
| 30 | CCTV | NVR dan kamera |
| 40 | TAMU | Wi-Fi tamu, cuma boleh internet |
| 99 | MGMT | Akses ke router, switch, AP |

Aturan firewall-nya simpel: **TAMU** cuma boleh ke internet, **CCTV** nggak boleh ke internet kecuali yang perlu, dan **MGMT** cuma boleh diakses dari IP admin.

### 3. Standar penamaan perangkat

Format: **`<jenis>-<lokasi>-<nomor>`**. Contoh:

- `RTR-PST-01` = router pusat
- `SW-CB1-01` = switch cabang 1
- `AP-CB2-02` = access point kedua di cabang 2

Tempel label dengan nama yang sama di perangkat fisiknya. Kabel juga dilabel di dua ujungnya, misalnya `SW-CB1-01/P05`. Kelihatannya sepele, tapi ini yang bikin troubleshoot dari 2 jam jadi 10 menit.

### 4. Sambungkan cabang ke pusat pakai VPN site-to-site

Supaya cabang bisa akses server pusat seolah-olah satu gedung, pakai **VPN site-to-site**. Di RouterOS v7, WireGuard jadi pilihan favorit aku karena ringan dan stabil. Contoh di **router cabang 1**:

```
/interface wireguard add name=wg-pusat listen-port=13231
/interface wireguard peers add interface=wg-pusat \
    public-key="<public key router pusat>" \
    endpoint-address=<IP publik pusat> endpoint-port=13231 \
    allowed-address=10.10.0.0/16,172.16.0.0/30 persistent-keepalive=25s
/ip address add address=172.16.0.2/30 interface=wg-pusat
/ip route add dst-address=10.10.0.0/16 gateway=wg-pusat
```

Di **router pusat**, bikin peer kebalikannya dengan `allowed-address=10.11.0.0/16` buat cabang 1, dan route `10.11.0.0/16` lewat interface WireGuard. Karena pola IP-nya rapi, routing tiap cabang cukup satu baris: `10.<kode>.0.0/16`.

Jangan lupa buka port UDP WireGuard di firewall pusat, dan **cuma** dari interface internet.

### 5. Bikin template konfigurasi

Setelah cabang pertama jalan, export konfigurasinya jadi **template**. Untuk cabang baru tinggal ganti:

- kode cabang (`11` jadi `13`, dst),
- key WireGuard,
- nama perangkat.

Setup cabang baru yang tadinya seharian bisa jadi kurang dari sejam. Konsisten, minim typo.

### 6. Hardening dasar di semua perangkat

Checklist wajib sebelum perangkat dinyatakan "selesai":

- Ganti user dan password default, pakai password unik per lokasi.
- Matikan service yang nggak dipakai (telnet, ftp, api kalau nggak perlu).
- Akses winbox/SSH cuma dari VLAN MGMT atau IP pusat.
- Update firmware ke versi stabil.
- Aktifkan backup konfigurasi otomatis dan simpan ke server pusat.

### 7. Dokumentasikan semuanya

Satu spreadsheet, satu sheet per lokasi, isinya:

- Daftar subnet dan VLAN,
- Daftar perangkat (nama, IP, lokasi fisik, nomor seri),
- Peta port switch (port berapa ke mana),
- Info ISP (nomor pelanggan, kontak support),
- Tanggal perubahan terakhir dan siapa yang ubah.

Simpan password **di password manager**, bukan di spreadsheet.

## Hasil akhir

- **Semua cabang punya pola yang sama**: IP, VLAN, nama perangkat, dan konfigurasi.
- **Cabang terhubung ke pusat lewat VPN**, jadi bisa akses ERP, file server, dan ikut backup ke pusat.
- **Jaringan tamu dan CCTV terpisah** dari jaringan kantor, jauh lebih aman.
- **Cabang baru bisa di-setup cepat** pakai template.
- **Troubleshoot lebih cepat**, karena siapapun di tim IT bisa baca jaringannya dari dokumentasi dan label.

Standar itu kedengarannya kaku, tapi justru itu yang bikin kerja IT jadi santai. Sekali rapi, selanjutnya tinggal copy pola.
