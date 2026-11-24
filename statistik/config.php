<?php
// Pengaturan dashboard statistik (irfanfauzi.web.id/statistik).
// File ini aman berada di public_html: PHP dijalankan server, isinya tidak bisa dibaca dari browser.

// Folder di luar public_html, misalnya /home/namauser. Kunci Google dan cache disimpan di sini.
$LUAR_WEB = dirname($_SERVER['DOCUMENT_ROOT'] ?? __DIR__ . '/../..');

return [
    // Repo yang dipakai untuk login. Hanya akun GitHub yang punya izin push ke repo ini yang bisa membuka statistik
    // (token yang sama dengan halaman /admin/).
    'repo' => 'oneofficedepok-cloud/portfolio-fauzi',

    // File kunci JSON service account Google. Upload lewat cPanel File Manager ke folder home (DI LUAR public_html).
    'kunci' => $LUAR_WEB . '/ga4-kunci.json',

    // Folder cache supaya Google tidak dipanggil setiap kali halaman dibuka.
    'cache' => $LUAR_WEB . '/ga4-cache',
    'cache_menit' => 10,

    // Daftar web. "properti" = ID Properti GA4 (angka, di Admin → Property details).
    // "stream" = Stream ID (Admin → Data streams). Diisi kalau beberapa web berbagi satu properti,
    // supaya datanya dipisahkan per web. Kosongkan kalau web punya properti sendiri.
    // Urutan di sini = urutan tab di dashboard.
    'situs' => [
        ['id' => 'portfolio', 'nama' => 'Portfolio', 'domain' => 'irfanfauzi.web.id', 'properti' => '562896650', 'stream' => '16284969866'],
        ['id' => 'trireka', 'nama' => 'Trireka', 'domain' => 'trireka.web.id', 'properti' => '562896650', 'stream' => '16284943275'],
        ['id' => 'imarah', 'nama' => 'Imarah', 'domain' => 'imarah.my.id', 'properti' => '562896650', 'stream' => '16285054919'],
        ['id' => 'akademik', 'nama' => 'Akademik', 'domain' => 'akademik.imarah.my.id', 'properti' => '562896650', 'stream' => '16284997350'],
        ['id' => 'masjidqu', 'nama' => 'MasjidQu', 'domain' => 'masjid.imarah.my.id', 'properti' => '562896650', 'stream' => '16285025097'],
    ],
];
