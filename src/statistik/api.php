<?php
// API dashboard statistik: memeriksa login (token GitHub yang sama dengan /admin/),
// lalu mengambil data dari Google Analytics Data API memakai service account.
// Tidak butuh Composer: tanda tangan JWT memakai ekstensi openssl bawaan PHP.

declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

$CFG = require __DIR__ . '/config.php';
$DEMO = getenv('STATISTIK_DEMO') === '1'; // hanya untuk uji di komputer sendiri

function keluar(int $kode, array $isi): void
{
    http_response_code($kode);
    echo json_encode($isi, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function gagal(int $kode, string $pesan): void
{
    keluar($kode, ['galat' => $pesan]);
}

// ---------- cache file ----------
function folderCache(): string
{
    global $CFG;
    $dir = $CFG['cache'];
    if (!is_dir($dir) && !@mkdir($dir, 0700, true)) {
        $dir = sys_get_temp_dir() . '/ga4-cache-' . md5(__DIR__);
        if (!is_dir($dir)) @mkdir($dir, 0700, true);
    }
    return $dir;
}

function cacheAmbil(string $kunci, int $detik)
{
    $f = folderCache() . '/' . md5($kunci) . '.json';
    if (is_file($f) && filemtime($f) > time() - $detik) {
        return json_decode((string) file_get_contents($f), true);
    }
    return null;
}

function cacheSimpan(string $kunci, $isi): void
{
    @file_put_contents(folderCache() . '/' . md5($kunci) . '.json', json_encode($isi), LOCK_EX);
}

// ---------- HTTP ----------
function http(string $metode, string $url, array $header, ?string $body = null): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $metode,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $header,
        CURLOPT_TIMEOUT => 25,
        CURLOPT_USERAGENT => 'statistik-irfanfauzi',
    ]);
    if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    $res = curl_exec($ch);
    $kode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($res === false) return [0, ['error' => ['message' => $err]]];
    return [$kode, json_decode($res, true)];
}

// ---------- login ----------
function cekLogin(): void
{
    global $CFG, $DEMO;
    $token = trim($_SERVER['HTTP_X_TOKEN'] ?? '');
    if ($token === '') gagal(401, 'Belum masuk.');
    if ($DEMO) return;
    $kunci = 'login:' . hash('sha256', $token);
    if (cacheAmbil($kunci, 900) === true) return;
    [$kode, $repo] = http('GET', 'https://api.github.com/repos/' . $CFG['repo'], [
        'Authorization: Bearer ' . $token,
        'Accept: application/vnd.github+json',
    ]);
    if ($kode === 401) gagal(401, 'Token GitHub tidak valid atau sudah kedaluwarsa.');
    if ($kode !== 200 || empty($repo['permissions']['push'])) gagal(403, 'Token ini tidak punya izin ke repo ' . $CFG['repo'] . '.');
    cacheSimpan($kunci, true);
}

// ---------- Google ----------
function b64url(string $s): string
{
    return rtrim(strtr(base64_encode($s), '+/', '-_'), '=');
}

function tokenGoogle(): string
{
    global $CFG;
    $c = cacheAmbil('google-token', 3000);
    if (is_string($c)) return $c;
    if (!is_file($CFG['kunci'])) gagal(500, 'File kunci Google belum diupload ke ' . $CFG['kunci'] . '. Lihat panduan pemasangan.');
    $sa = json_decode((string) file_get_contents($CFG['kunci']), true);
    if (empty($sa['private_key']) || empty($sa['client_email'])) gagal(500, 'File kunci Google tidak valid (harus file JSON service account).');
    $now = time();
    $jwt = b64url(json_encode(['alg' => 'RS256', 'typ' => 'JWT'])) . '.' . b64url(json_encode([
        'iss' => $sa['client_email'],
        'scope' => 'https://www.googleapis.com/auth/analytics.readonly',
        'aud' => 'https://oauth2.googleapis.com/token',
        'iat' => $now,
        'exp' => $now + 3600,
    ]));
    if (!openssl_sign($jwt, $sig, $sa['private_key'], 'sha256WithRSAEncryption')) gagal(500, 'Gagal menandatangani kunci Google.');
    $jwt .= '.' . b64url($sig);
    [$kode, $res] = http('POST', 'https://oauth2.googleapis.com/token', ['Content-Type: application/x-www-form-urlencoded'],
        http_build_query(['grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer', 'assertion' => $jwt]));
    if ($kode !== 200 || empty($res['access_token'])) gagal(502, 'Google menolak kunci: ' . ($res['error_description'] ?? $res['error'] ?? 'tidak diketahui'));
    cacheSimpan('google-token', $res['access_token']);
    return $res['access_token'];
}

function ga(string $properti, string $aksi, array $body): array
{
    [$kode, $res] = http('POST', "https://analyticsdata.googleapis.com/v1beta/properties/$properti:$aksi", [
        'Authorization: Bearer ' . tokenGoogle(),
        'Content-Type: application/json',
    ], json_encode($body));
    if ($kode !== 200) {
        $pesan = $res['error']['message'] ?? 'tidak diketahui';
        if ($kode === 403) $pesan = 'Akun service belum diberi akses ke properti ' . $properti . ' di Google Analytics (Admin → Property access management → tambah email service account sebagai Viewer).';
        throw new RuntimeException($pesan, $kode);
    }
    return $res;
}

// Ubah respons GA menjadi baris sederhana: [{dim1: .., met1: ..}, ...]
function baris(array $laporan): array
{
    $dims = array_map(fn($h) => $h['name'], $laporan['dimensionHeaders'] ?? []);
    $mets = array_map(fn($h) => $h['name'], $laporan['metricHeaders'] ?? []);
    $out = [];
    foreach ($laporan['rows'] ?? [] as $r) {
        $o = [];
        foreach ($dims as $i => $n) $o[$n] = $r['dimensionValues'][$i]['value'] ?? '';
        foreach ($mets as $i => $n) $o[$n] = (float) ($r['metricValues'][$i]['value'] ?? 0);
        $out[] = $o;
    }
    return $out;
}

function rentang(string $mulai, string $akhir): array
{
    $a = new DateTimeImmutable($mulai);
    $b = new DateTimeImmutable($akhir);
    $hari = (int) $a->diff($b)->days + 1;
    $pb = $a->modify('-1 day');
    $pa = $pb->modify('-' . ($hari - 1) . ' days');
    return [
        ['startDate' => $mulai, 'endDate' => $akhir, 'name' => 'ini'],
        ['startDate' => $pa->format('Y-m-d'), 'endDate' => $pb->format('Y-m-d'), 'name' => 'lalu'],
    ];
}

const METRIK_RINGKAS = ['activeUsers', 'newUsers', 'sessions', 'screenPageViews', 'averageSessionDuration', 'engagementRate'];
const FILTER_KLIK = ['filter' => ['fieldName' => 'eventName', 'stringFilter' => ['value' => 'klik_link']]];

function laporanSitus(string $p, string $mulai, string $akhir): array
{
    $r = rentang($mulai, $akhir);
    $ini = [$r[0]];
    $desc = fn($m) => [['metric' => ['metricName' => $m], 'desc' => true]];
    $dim = fn(...$n) => array_map(fn($x) => ['name' => $x], $n);
    $met = fn(...$n) => array_map(fn($x) => ['name' => $x], $n);

    $b1 = ga($p, 'batchRunReports', ['requests' => [
        ['dateRanges' => $r, 'metrics' => $met(...METRIK_RINGKAS)],
        ['dateRanges' => $ini, 'dimensions' => $dim('date'), 'metrics' => $met('activeUsers', 'screenPageViews', 'averageSessionDuration'),
            'orderBys' => [['dimension' => ['dimensionName' => 'date']]]],
        ['dateRanges' => $ini, 'dimensions' => $dim('sessionDefaultChannelGroup'), 'metrics' => $met('sessions'), 'orderBys' => $desc('sessions')],
        ['dateRanges' => $ini, 'dimensions' => $dim('sessionSource', 'sessionMedium'), 'metrics' => $met('sessions'), 'orderBys' => $desc('sessions'), 'limit' => 10],
        ['dateRanges' => $ini, 'dimensions' => $dim('pagePath', 'pageTitle'), 'metrics' => $met('screenPageViews', 'activeUsers', 'userEngagementDuration'),
            'orderBys' => $desc('screenPageViews'), 'limit' => 10],
    ]]);
    [$ring, $harian, $kanal, $sumber, $halaman] = array_map('baris', $b1['reports']);

    $b2 = ga($p, 'batchRunReports', ['requests' => [
        ['dateRanges' => $r, 'dimensions' => $dim('eventName'), 'metrics' => $met('eventCount'), 'dimensionFilter' => FILTER_KLIK],
        ['dateRanges' => $ini, 'dimensions' => $dim('date'), 'metrics' => $met('eventCount'), 'dimensionFilter' => FILTER_KLIK],
        ['dateRanges' => $ini, 'dimensions' => $dim('deviceCategory'), 'metrics' => $met('activeUsers'), 'orderBys' => $desc('activeUsers')],
        ['dateRanges' => $ini, 'dimensions' => $dim('city'), 'metrics' => $met('activeUsers'), 'orderBys' => $desc('activeUsers'), 'limit' => 8],
    ]]);
    [$klikTotal, $klikHarian, $perangkat, $kota] = array_map('baris', $b2['reports']);

    // Link yang diklik: parameter link_url/link_text cocok dengan dimensi bawaan linkUrl/linkText.
    $link = [];
    try {
        $link = baris(ga($p, 'runReport', ['dateRanges' => $ini, 'dimensions' => $dim('linkUrl', 'linkText'), 'metrics' => $met('eventCount'),
            'dimensionFilter' => FILTER_KLIK, 'orderBys' => $desc('eventCount'), 'limit' => 10]));
    } catch (RuntimeException $e) {
        $link = [];
    }

    // Ringkasan: pisahkan periode ini & periode lalu (dimensi dateRange ditambahkan otomatis oleh GA).
    $per = ['ini' => array_fill_keys(METRIK_RINGKAS, 0), 'lalu' => array_fill_keys(METRIK_RINGKAS, 0)];
    foreach ($ring as $x) $per[$x['dateRange'] ?? 'ini'] = array_intersect_key($x, $per['ini']);
    foreach ($klikTotal as $x) $per[$x['dateRange'] ?? 'ini']['klik'] = $x['eventCount'];
    $per['ini']['klik'] = $per['ini']['klik'] ?? 0;
    $per['lalu']['klik'] = $per['lalu']['klik'] ?? 0;

    // Lengkapi hari yang kosong (GA tidak mengirim baris untuk hari tanpa kunjungan).
    $klikPerHari = array_column($klikHarian, 'eventCount', 'date');
    $perHari = array_column($harian, null, 'date');
    $harian = [];
    for ($d = new DateTimeImmutable($mulai); $d <= new DateTimeImmutable($akhir); $d = $d->modify('+1 day')) {
        $k = $d->format('Ymd');
        $harian[] = ($perHari[$k] ?? ['date' => $k, 'activeUsers' => 0, 'screenPageViews' => 0, 'averageSessionDuration' => 0]) + ['klik' => $klikPerHari[$k] ?? 0];
    }

    return [
        'rentang' => $r,
        'ringkasan' => $per,
        'harian' => $harian,
        'kanal' => $kanal,
        'sumber' => $sumber,
        'halaman' => $halaman,
        'link' => $link,
        'perangkat' => $perangkat,
        'kota' => $kota,
    ];
}

function realtime(string $p): array
{
    $res = ga($p, 'batchRunRealtimeReports', ['requests' => [
        ['metrics' => [['name' => 'activeUsers']], 'minuteRanges' => [['startMinutesAgo' => 29, 'endMinutesAgo' => 0]]],
        ['dimensions' => [['name' => 'unifiedScreenName']], 'metrics' => [['name' => 'screenPageViews']], 'limit' => 5,
            'orderBys' => [['metric' => ['metricName' => 'screenPageViews'], 'desc' => true]]],
    ]]);
    $tot = baris($res['reports'][0] ?? []);
    return ['aktif' => $tot[0]['activeUsers'] ?? 0, 'halaman' => baris($res['reports'][1] ?? [])];
}

// ---------- data contoh (STATISTIK_DEMO=1) ----------
function demo(string $aksi, array $situs, string $mulai, string $akhir)
{
    mt_srand(crc32($situs['id'] ?? 'x'));
    $skala = mt_rand(20, 120);
    if ($aksi === 'realtime') return ['aktif' => mt_rand(0, 6), 'halaman' => [['unifiedScreenName' => 'Irfan Fauzi · IT Infrastructure', 'screenPageViews' => 4], ['unifiedScreenName' => 'Cara Bersihkan Website dari Judol', 'screenPageViews' => 2]]];
    $r = rentang($mulai, $akhir);
    $harian = [];
    for ($d = new DateTimeImmutable($mulai); $d <= new DateTimeImmutable($akhir); $d = $d->modify('+1 day')) {
        $u = max(0, (int) ($skala * (0.6 + 0.4 * sin($d->format('z') / 3)) + mt_rand(-10, 10)));
        $harian[] = ['date' => $d->format('Ymd'), 'activeUsers' => $u, 'screenPageViews' => (int) ($u * 2.3), 'averageSessionDuration' => mt_rand(40, 200), 'klik' => (int) ($u * 0.4)];
    }
    $sum = fn($k) => array_sum(array_column($harian, $k));
    $ini = ['activeUsers' => $sum('activeUsers'), 'newUsers' => (int) ($sum('activeUsers') * .8), 'sessions' => (int) ($sum('activeUsers') * 1.2), 'screenPageViews' => $sum('screenPageViews'), 'averageSessionDuration' => 96.4, 'engagementRate' => 0.61, 'klik' => $sum('klik')];
    if ($aksi === 'semua') return ['ini' => $ini, 'lalu' => array_map(fn($v) => $v * 0.85, $ini)];
    return [
        'rentang' => $r,
        'ringkasan' => ['ini' => $ini, 'lalu' => array_map(fn($v) => $v * 0.85, $ini)],
        'harian' => $harian,
        'kanal' => [['sessionDefaultChannelGroup' => 'Organic Search', 'sessions' => 420], ['sessionDefaultChannelGroup' => 'Direct', 'sessions' => 260], ['sessionDefaultChannelGroup' => 'Organic Social', 'sessions' => 180], ['sessionDefaultChannelGroup' => 'Referral', 'sessions' => 40], ['sessionDefaultChannelGroup' => 'Unassigned', 'sessions' => 12]],
        'sumber' => [['sessionSource' => 'google', 'sessionMedium' => 'organic', 'sessions' => 410], ['sessionSource' => '(direct)', 'sessionMedium' => '(none)', 'sessions' => 260], ['sessionSource' => 'instagram', 'sessionMedium' => 'bio', 'sessions' => 120], ['sessionSource' => 'whatsapp', 'sessionMedium' => 'chat', 'sessions' => 44], ['sessionSource' => 'l.facebook.com', 'sessionMedium' => 'referral', 'sessions' => 16]],
        'halaman' => [['pagePath' => '/', 'pageTitle' => 'Irfan Fauzi · IT Infrastructure, Web & Aplikasi', 'screenPageViews' => 640, 'activeUsers' => 410, 'userEngagementDuration' => 30500], ['pagePath' => '/ebook/bersihkan-website-dari-judol/', 'pageTitle' => 'Cara Bersihkan Website dari Judol + Cegah Terulang · Irfan Fauzi', 'screenPageViews' => 380, 'activeUsers' => 300, 'userEngagementDuration' => 41000], ['pagePath' => '/karya/app-masjid/', 'pageTitle' => 'Aplikasi Masjid · Irfan Fauzi', 'screenPageViews' => 120, 'activeUsers' => 90, 'userEngagementDuration' => 5400]],
        'link' => [['linkUrl' => 'https://wa.me/6282124038826', 'linkText' => 'Terbuka untuk proyek', 'eventCount' => 64], ['linkUrl' => 'https://lynk.id/ayyubiid/6dkvyknw7x9j', 'linkText' => 'Beli ebook di Lynk', 'eventCount' => 41], ['linkUrl' => 'https://irfanfauzi.web.id/ebook/', 'linkText' => 'Ebook', 'eventCount' => 30]],
        'perangkat' => [['deviceCategory' => 'mobile', 'activeUsers' => 520], ['deviceCategory' => 'desktop', 'activeUsers' => 230], ['deviceCategory' => 'tablet', 'activeUsers' => 12]],
        'kota' => [['city' => 'Depok', 'activeUsers' => 180], ['city' => 'Jakarta', 'activeUsers' => 150], ['city' => 'Bogor', 'activeUsers' => 70], ['city' => '(not set)', 'activeUsers' => 30]],
    ];
}

// ---------- rute ----------
cekLogin();
$aksi = $_GET['aksi'] ?? '';
$daftar = $CFG['situs'];

if ($aksi === 'situs') {
    keluar(200, ['situs' => array_map(fn($s) => ['id' => $s['id'], 'nama' => $s['nama'], 'domain' => $s['domain'], 'siap' => $s['properti'] !== '' || $DEMO], $daftar)]);
}

$tgl = '/^\d{4}-\d{2}-\d{2}$/';
$mulai = $_GET['mulai'] ?? '';
$akhir = $_GET['akhir'] ?? '';
if (in_array($aksi, ['laporan', 'semua'], true) && (!preg_match($tgl, $mulai) || !preg_match($tgl, $akhir) || $mulai > $akhir)) gagal(400, 'Tanggal tidak valid.');

$cariSitus = function (string $id) use ($daftar, $DEMO) {
    foreach ($daftar as $s) if ($s['id'] === $id) {
        if ($s['properti'] === '' && !$DEMO) gagal(400, 'ID Properti GA4 untuk ' . $s['nama'] . ' belum diisi di statistik/config.php.');
        return $s;
    }
    gagal(404, 'Web tidak ditemukan.');
};

try {
    if ($aksi === 'laporan') {
        $s = $cariSitus($_GET['situs'] ?? '');
        if ($DEMO) keluar(200, demo('laporan', $s, $mulai, $akhir));
        $kunci = "laporan:{$s['properti']}:$mulai:$akhir";
        $data = cacheAmbil($kunci, $CFG['cache_menit'] * 60);
        if ($data === null) { $data = laporanSitus($s['properti'], $mulai, $akhir); $data['diambil'] = date('c'); cacheSimpan($kunci, $data); }
        keluar(200, $data);
    }
    if ($aksi === 'realtime') {
        $s = $cariSitus($_GET['situs'] ?? '');
        if ($DEMO) keluar(200, demo('realtime', $s, '', ''));
        $kunci = "realtime:{$s['properti']}";
        $data = cacheAmbil($kunci, 60);
        if ($data === null) { $data = realtime($s['properti']); cacheSimpan($kunci, $data); }
        keluar(200, $data);
    }
    if ($aksi === 'semua') {
        $hasil = [];
        foreach ($daftar as $s) {
            if ($s['properti'] === '' && !$DEMO) { $hasil[] = ['id' => $s['id'], 'siap' => false]; continue; }
            try {
                if ($DEMO) { $per = demo('semua', $s, $mulai, $akhir); }
                else {
                    $kunci = "semua:{$s['properti']}:$mulai:$akhir";
                    $per = cacheAmbil($kunci, $CFG['cache_menit'] * 60);
                    if ($per === null) {
                        $b = ga($s['properti'], 'batchRunReports', ['requests' => [
                            ['dateRanges' => rentang($mulai, $akhir), 'metrics' => array_map(fn($x) => ['name' => $x], METRIK_RINGKAS)],
                            ['dateRanges' => rentang($mulai, $akhir), 'dimensions' => [['name' => 'eventName']], 'metrics' => [['name' => 'eventCount']], 'dimensionFilter' => FILTER_KLIK],
                        ]]);
                        $per = ['ini' => ['klik' => 0], 'lalu' => ['klik' => 0]];
                        foreach (baris($b['reports'][0]) as $x) $per[$x['dateRange'] ?? 'ini'] = array_intersect_key($x, array_flip(METRIK_RINGKAS)) + ['klik' => 0];
                        foreach (baris($b['reports'][1]) as $x) $per[$x['dateRange'] ?? 'ini']['klik'] = $x['eventCount'];
                        cacheSimpan($kunci, $per);
                    }
                }
                $hasil[] = ['id' => $s['id'], 'siap' => true] + $per;
            } catch (RuntimeException $e) {
                $hasil[] = ['id' => $s['id'], 'siap' => true, 'galat' => $e->getMessage()];
            }
        }
        keluar(200, ['situs' => $hasil]);
    }
} catch (RuntimeException $e) {
    gagal(502, 'Google Analytics: ' . $e->getMessage());
}

gagal(400, 'Aksi tidak dikenal.');
