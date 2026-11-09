// Dashboard statistik: mengambil data dari /statistik/api.php (yang membaca Google Analytics 4)
// dan menampilkannya dengan gaya ringkas ala dashboard analytics kanal video.
(function () {
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var token = '';
  try { token = localStorage.getItem('pf-token') || ''; } catch (x) {}

  var st = { situs: [], aktif: 'semua', metrik: 'activeUsers', data: null, rtTimer: 0, minta: 0 };
  var nf = new Intl.NumberFormat('id-ID');
  var BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  var METRIK = [
    { k: 'activeUsers', lbl: 'Pengunjung', satuan: 'pengunjung' },
    { k: 'screenPageViews', lbl: 'Tayangan halaman', satuan: 'tayangan' },
    { k: 'averageSessionDuration', lbl: 'Rata-rata lama kunjungan', durasi: true },
    { k: 'klik', lbl: 'Klik link', satuan: 'klik' }
  ];
  var KANAL = {
    'Organic Search': 'Pencarian Google / Bing', 'Direct': 'Langsung (ketik alamat / tanpa sumber)', 'Organic Social': 'Media sosial',
    'Referral': 'Web lain', 'Organic Video': 'Video (YouTube)', 'Paid Search': 'Iklan pencarian', 'Paid Social': 'Iklan media sosial',
    'Email': 'Email', 'Unassigned': 'Tidak terdeteksi', 'Organic Shopping': 'Belanja', 'Display': 'Iklan display', 'Cross-network': 'Iklan lintas jaringan'
  };
  var SUMBER = { '(direct)': 'Langsung', 'google': 'Google', 'l.instagram.com': 'Instagram', 'instagram': 'Instagram', 'ig': 'Instagram', 'whatsapp': 'WhatsApp',
    'wa': 'WhatsApp', 'facebook': 'Facebook', 'm.facebook.com': 'Facebook', 'l.facebook.com': 'Facebook', 'lm.facebook.com': 'Facebook', 'tiktok': 'TikTok',
    'linkedin': 'LinkedIn', 'lnkd.in': 'LinkedIn', 'bing': 'Bing', 'youtube': 'YouTube', 'm.youtube.com': 'YouTube', 't.co': 'X / Twitter', 'chatgpt.com': 'ChatGPT' };
  var PERANGKAT = { mobile: 'HP', desktop: 'Komputer', tablet: 'Tablet', 'smart tv': 'Smart TV' };

  // ---------- util ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function angka(v) { return nf.format(Math.round(v || 0)); }
  function durasi(d) {
    d = Math.round(d || 0);
    if (d < 60) return d + ' dtk';
    var m = Math.floor(d / 60), s = d % 60;
    if (m < 60) return m + ' mnt ' + (s ? s + ' dtk' : '');
    return Math.floor(m / 60) + ' jam ' + (m % 60) + ' mnt';
  }
  function nilai(m, v) { return m.durasi ? durasi(v) : angka(v); }
  function iso(d) { var x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); }
  function tglPendek(s) { return (+s.slice(6, 8)) + ' ' + BLN[+s.slice(4, 6) - 1]; }
  function tglPanjang(s) { var d = new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)); return HARI[d.getDay()] + ', ' + d.getDate() + ' ' + BLN[d.getMonth()] + ' ' + d.getFullYear(); }
  function tglISO(s) { return tglPanjang(s.replace(/-/g, '')); }
  function delta(ini, lalu) {
    ini = ini || 0; lalu = lalu || 0;
    if (!lalu) return '<span class="delta">' + (ini ? 'baru (sebelumnya 0)' : '–') + '</span>';
    var p = (ini - lalu) / lalu * 100;
    if (Math.abs(p) < 0.5) return '<span class="delta">± 0% dari sebelumnya</span>';
    return '<span class="delta ' + (p > 0 ? 'naik' : 'turun') + '">' + (p > 0 ? '▲ ' : '▼ ') + Math.abs(p).toFixed(0) + '% dari sebelumnya</span>';
  }

  function periode() {
    var v = $('#periode').value, now = new Date(), a, b = new Date(now);
    if (v === 'bulan-ini') a = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (v === 'bulan-lalu') { a = new Date(now.getFullYear(), now.getMonth() - 1, 1); b = new Date(now.getFullYear(), now.getMonth(), 0); }
    else { a = new Date(now); a.setDate(a.getDate() - (+v - 1)); }
    return { mulai: iso(a), akhir: iso(b) };
  }

  function api(aksi, q) {
    var qs = new URLSearchParams(Object.assign({ aksi: aksi }, q || {}));
    return fetch('/statistik/api.php?' + qs, { headers: { 'X-Token': token } }).then(function (r) {
      return r.json().catch(function () { return { galat: 'Server tidak mengembalikan data (HTTP ' + r.status + '). Pastikan hosting mendukung PHP.' }; })
        .then(function (j) { if (!r.ok) { var e = new Error(j.galat || 'HTTP ' + r.status); e.status = r.status; throw e; } return j; });
    });
  }

  function galat(pesan) { var g = $('#galat'); g.textContent = pesan || ''; g.hidden = !pesan; }

  // ---------- tooltip ----------
  var tip = $('#tip');
  function tampilTip(html, x, y) {
    tip.innerHTML = html; tip.hidden = false;
    var w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, x - w / 2)) + 'px';
    tip.style.top = (y - h - 14 < 8 ? y + 18 : y - h - 14) + 'px';
  }
  function sembunyiTip() { tip.hidden = true; }

  // ---------- batang horizontal ----------
  function barList(el, rows, opt) {
    if (!rows.length) { el.innerHTML = '<p class="kosong">Belum ada data di periode ini.</p>'; return; }
    var total = rows.reduce(function (s, r) { return s + r.v; }, 0) || 1;
    var max = Math.max.apply(null, rows.map(function (r) { return r.v; })) || 1;
    el.innerHTML = '<div class="bar-list">' + rows.map(function (r) {
      return '<div class="bar-row"><span class="nm" title="' + esc(r.title || r.nm) + '">' + esc(r.nm) + (r.sub ? '<small>' + esc(r.sub) + '</small>' : '') + '</span>' +
        '<span class="vl">' + angka(r.v) + (opt && opt.persen === false ? '' : '<small>' + (r.v / total * 100).toFixed(0) + '%</small>') + '</span>' +
        '<span class="trk"><i style="width:' + (r.v / max * 100).toFixed(1) + '%"></i></span></div>';
    }).join('') + '</div>';
  }

  // ---------- grafik garis ----------
  function skalaRapi(max) {
    if (max <= 0) return { top: 4, step: 1 };
    var kasar = max / 4, p = Math.pow(10, Math.floor(Math.log10(kasar))), n = kasar / p;
    var step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
    if (step < 1) step = 1;
    return { top: Math.ceil(max / step) * step, step: step };
  }
  function grafik() {
    var el = $('#grafik'), m = METRIK.filter(function (x) { return x.k === st.metrik; })[0];
    var rows = (st.data && st.data.harian) || [];
    if (!rows.length) { el.innerHTML = '<p class="kosong">Belum ada data di periode ini.</p>'; return; }
    var W = el.clientWidth - 36 || 600, H = window.innerWidth <= 640 ? 220 : 280, kiri = 44, bawah = 24, atas = 10;
    var vals = rows.map(function (r) { return r[m.k] || 0; });
    var sk = skalaRapi(Math.max.apply(null, vals));
    var x = function (i) { return kiri + (rows.length === 1 ? (W - kiri) / 2 : i * (W - kiri - 6) / (rows.length - 1)); };
    var y = function (v) { return atas + (H - atas - bawah) * (1 - v / sk.top); };
    var g = '';
    for (var t = 0; t <= sk.top + 1e-9; t += sk.step) {
      g += '<line x1="' + kiri + '" x2="' + W + '" y1="' + y(t) + '" y2="' + y(t) + '"/><text x="' + (kiri - 8) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + (m.durasi ? Math.round(t / 60) + 'm' : angka(t)) + '</text>';
    }
    var nLabel = Math.min(rows.length, W < 500 ? 4 : 7), sx = '';
    for (var j = 0; j < nLabel; j++) {
      var i = nLabel === 1 ? 0 : Math.round(j * (rows.length - 1) / (nLabel - 1));
      sx += '<text x="' + x(i) + '" y="' + (H - 4) + '" text-anchor="' + (j === 0 ? 'start' : j === nLabel - 1 ? 'end' : 'middle') + '">' + tglPendek(rows[i].date) + '</text>';
    }
    var d = vals.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' ');
    var area = d + ' L' + x(rows.length - 1) + ' ' + y(0) + ' L' + x(0) + ' ' + y(0) + ' Z';
    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(m.lbl) + ' per hari">' +
      '<g class="grid">' + g + '</g><g class="sumbu">' + sx + '</g>' +
      '<path class="area" d="' + area + '"/><path class="garis" d="' + d + '"/>' +
      '<line class="silang" visibility="hidden" y1="' + atas + '" y2="' + (H - bawah) + '" x1="-10" x2="-10"/><circle class="titik" visibility="hidden" r="5" cx="-10" cy="-10"/>' +
      '<rect x="' + kiri + '" y="0" width="' + (W - kiri) + '" height="' + H + '" fill="transparent"/></svg>';
    var svg = $('svg', el), sil = $('.silang', el), tt = $('.titik', el);
    function gerak(ev) {
      var b = svg.getBoundingClientRect(), px = (ev.clientX - b.left) * W / b.width;
      var i = rows.length === 1 ? 0 : Math.max(0, Math.min(rows.length - 1, Math.round((px - kiri) / ((W - kiri - 6) / (rows.length - 1)))));
      sil.setAttribute('visibility', 'visible'); tt.setAttribute('visibility', 'visible'); sil.setAttribute('x1', x(i)); sil.setAttribute('x2', x(i)); tt.setAttribute('cx', x(i)); tt.setAttribute('cy', y(vals[i]));
      tampilTip(tglPanjang(rows[i].date) + '<br><b>' + nilai(m, vals[i]) + '</b> ' + (m.satuan || ''), b.left + x(i) * b.width / W, b.top + y(vals[i]) * b.height / H);
    }
    svg.addEventListener('pointermove', gerak);
    svg.addEventListener('pointerdown', gerak);
    svg.addEventListener('pointerleave', function () { sembunyiTip(); sil.setAttribute('visibility', 'hidden'); tt.setAttribute('visibility', 'hidden'); });
  }

  // ---------- tampilan satu web ----------
  function kpi() {
    var r = st.data.ringkasan;
    $('#kpi').innerHTML = METRIK.map(function (m) {
      return '<button role="tab" data-m="' + m.k + '" aria-selected="' + (m.k === st.metrik) + '"><span class="lbl">' + m.lbl + '</span><span class="nil">' +
        nilai(m, r.ini[m.k]) + '</span>' + delta(r.ini[m.k], r.lalu[m.k]) + '</button>';
    }).join('');
  }
  $('#kpi').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    st.metrik = b.dataset.m; kpi(); grafik();
  });

  function tampilSitus() {
    var d = st.data;
    kpi(); grafik();
    barList($('#kanal'), d.kanal.map(function (r) { return { nm: KANAL[r.sessionDefaultChannelGroup] || r.sessionDefaultChannelGroup, v: r.sessions }; }));
    barList($('#sumber'), d.sumber.map(function (r) {
      var s = r.sessionSource;
      return { nm: SUMBER[s] || SUMBER[s.replace(/^www\./, '')] || s, sub: s === '(direct)' ? '' : s + ' / ' + r.sessionMedium, v: r.sessions };
    }));
    $('#halaman').innerHTML = d.halaman.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Halaman</th><th class="num">Tayangan</th><th class="num opsional">Pengunjung</th><th class="num">Lama dibaca</th></tr></thead><tbody>' +
      d.halaman.map(function (r) {
        return '<tr><td><span class="jd" title="' + esc(r.pageTitle) + '">' + esc(r.pageTitle.replace(/ · Irfan Fauzi$/, '') || r.pagePath) + '</span><span class="pt">' + esc(r.pagePath) + '</span></td><td class="num">' +
          angka(r.screenPageViews) + '</td><td class="num opsional">' + angka(r.activeUsers) + '</td><td class="num">' + durasi(r.activeUsers ? r.userEngagementDuration / r.activeUsers : 0) + '</td></tr>';
      }).join('') + '</tbody></table></div>' : '<p class="kosong">Belum ada data di periode ini.</p>';
    barList($('#link'), d.link.map(function (r) {
      var u = r.linkUrl || '(tanpa alamat)';
      return { nm: (r.linkText && r.linkText !== '(not set)' ? r.linkText : u), sub: u.replace(/^https?:\/\//, '').slice(0, 60), title: u, v: r.eventCount };
    }), { persen: false });
    barList($('#perangkat'), d.perangkat.map(function (r) { return { nm: PERANGKAT[r.deviceCategory] || r.deviceCategory, v: r.activeUsers }; }));
    barList($('#kota'), d.kota.map(function (r) { return { nm: r.city === '(not set)' ? 'Tidak diketahui' : r.city, v: r.activeUsers }; }));
    $('#kaki').textContent = 'Data dari Google Analytics 4, disimpan sementara 10 menit.' + (d.diambil ? ' Terakhir diambil ' + new Date(d.diambil).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + '.' : '');
  }

  function realtime() {
    clearTimeout(st.rtTimer);
    var id = st.aktif;
    if (id === 'semua') return;
    api('realtime', { situs: id }).then(function (r) {
      if (st.aktif !== id) return;
      $('#rt-angka').textContent = angka(r.aktif);
      $('#rt-halaman').innerHTML = r.halaman.length ? r.halaman.map(function (h) { return '<li>' + esc(h.unifiedScreenName.replace(/ · Irfan Fauzi.*$/, '')) + ' <span>' + angka(h.screenPageViews) + '</span></li>'; }).join('') : '<li class="muted">Tidak ada</li>';
    }).catch(function () { $('#rt-angka').textContent = '–'; });
    st.rtTimer = setTimeout(realtime, 60000);
  }

  // ---------- tampilan semua web ----------
  function tampilSemua(res) {
    var siap = res.situs.filter(function (s) { return s.siap && !s.galat; });
    $('#semua-grid').innerHTML = res.situs.map(function (s) {
      var info = st.situs.filter(function (x) { return x.id === s.id; })[0] || { nama: s.id, domain: '' };
      if (!s.siap) return '<div class="kartu situs-kartu belum"><h3>' + esc(info.nama) + '</h3><span class="dom">' + esc(info.domain) + '</span><p class="kosong">ID Properti GA4 belum diisi di <code>statistik/config.php</code>.</p></div>';
      if (s.galat) return '<div class="kartu situs-kartu belum"><h3>' + esc(info.nama) + '</h3><span class="dom">' + esc(info.domain) + '</span><p class="kosong">' + esc(s.galat) + '</p></div>';
      var a = s.ini || {}, b = s.lalu || {};
      return '<button class="kartu situs-kartu" data-situs="' + esc(s.id) + '"><h3>' + esc(info.nama) + '</h3><span class="dom">' + esc(info.domain) + '</span>' +
        '<span class="besar">' + angka(a.activeUsers) + '</span><span class="muted kecil">pengunjung</span>' + delta(a.activeUsers, b.activeUsers) +
        '<span class="rinci"><span><b>' + angka(a.screenPageViews) + '</b> tayangan</span><span><b>' + durasi(a.averageSessionDuration) + '</b> rata-rata</span><span><b>' + angka(a.klik) + '</b> klik</span></span></button>';
    }).join('');
    var bars = siap.map(function (s) {
      var info = st.situs.filter(function (x) { return x.id === s.id; })[0];
      return { nm: info.nama, sub: info.domain, v: (s.ini || {}).screenPageViews || 0 };
    }).sort(function (p, q) { return q.v - p.v; });
    barList($('#semua-bar'), bars);
    var belum = res.situs.length - siap.length;
    $('#semua-catatan').textContent = belum ? belum + ' web belum tersambung, jadi belum ikut dihitung.' : '';
    $('#kaki').textContent = 'Klik kartu untuk melihat detail satu web. Data dari Google Analytics 4, disimpan sementara 10 menit.';
  }

  // ---------- navigasi ----------
  function tabs() {
    var list = [{ id: 'semua', nama: 'Semua web' }].concat(st.situs);
    $('#situs-tabs').innerHTML = list.map(function (s) { return '<button role="tab" data-situs="' + esc(s.id) + '" aria-selected="' + (s.id === st.aktif) + '">' + esc(s.nama) + '</button>'; }).join('');
  }
  function pilih(id) {
    st.aktif = id;
    try { history.replaceState(null, '', id === 'semua' ? location.pathname : '#' + id); } catch (x) {}
    tabs(); muat();
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-situs]'); if (b) pilih(b.dataset.situs);
  });
  $('#periode').addEventListener('change', function () {
    try { localStorage.setItem('st-periode', $('#periode').value); } catch (x) {}
    muat();
  });
  window.addEventListener('hashchange', function () {
    var h = location.hash.slice(1) || 'semua';
    if (h !== st.aktif && (h === 'semua' || st.situs.some(function (s) { return s.id === h; }))) pilih(h);
  });
  var tunda; window.addEventListener('resize', function () { clearTimeout(tunda); tunda = setTimeout(function () { if (st.aktif !== 'semua' && st.data) grafik(); }, 150); });

  function muat() {
    var p = periode(), id = st.aktif, no = ++st.minta;
    var info = st.situs.filter(function (x) { return x.id === id; })[0];
    $('#judul').textContent = info ? info.nama : 'Semua web';
    $('#subjudul').textContent = (info ? info.domain + ' · ' : '') + tglISO(p.mulai) + ' – ' + tglISO(p.akhir);
    $('#v-semua').hidden = id !== 'semua'; $('#v-situs').hidden = id === 'semua';
    galat('');
    var wadah = id === 'semua' ? $('#v-semua') : $('#v-situs');
    wadah.classList.add('memuat');
    if (info && !info.siap) {
      wadah.classList.remove('memuat');
      galat('ID Properti GA4 untuk ' + info.nama + ' belum diisi. Buka Google Analytics → Admin → Property details, salin angkanya, lalu isi di src/statistik/config.php.');
      $('#v-situs').hidden = true; return;
    }
    var jalan = id === 'semua'
      ? api('semua', p).then(function (r) { if (no === st.minta) tampilSemua(r); })
      : api('laporan', { situs: id, mulai: p.mulai, akhir: p.akhir }).then(function (r) { if (no !== st.minta) return; st.data = r; tampilSitus(); realtime(); });
    jalan.catch(function (e) {
      if (e.status === 401 || e.status === 403) return keluarLogin(e.message);
      galat(e.message);
    }).then(function () { wadah.classList.remove('memuat'); });
  }

  // ---------- login ----------
  function keluarLogin(pesan) {
    clearTimeout(st.rtTimer);
    $('#app').hidden = true; $('#login').hidden = false;
    var err = $('#login-err'); err.textContent = pesan || ''; err.hidden = !pesan;
  }
  function mulai() {
    return api('situs').then(function (r) {
      st.situs = r.situs;
      var h = location.hash.slice(1);
      st.aktif = st.situs.some(function (s) { return s.id === h; }) ? h : 'semua';
      $('#login').hidden = true; $('#app').hidden = false;
      tabs(); muat();
    });
  }
  $('#login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    token = $('#token').value.trim();
    mulai().then(function () { try { localStorage.setItem('pf-token', token); } catch (x) {} })
      .catch(function (x) { keluarLogin(x.message); });
  });
  $('#logout').addEventListener('click', function () {
    try { localStorage.removeItem('pf-token'); } catch (x) {}
    location.reload();
  });

  try { var pp = localStorage.getItem('st-periode'); if (pp && $('#periode option[value="' + pp + '"]')) $('#periode').value = pp; } catch (x) {}
  if (token) mulai().catch(function (x) { keluarLogin(x.message); });
  else keluarLogin('');
})();
