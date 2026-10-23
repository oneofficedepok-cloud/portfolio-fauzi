// Admin portfolio: membaca dan menyimpan file data langsung ke repo GitHub lewat API.
// Setiap simpan = satu commit ke main → GitHub Actions build → klik Deploy di cPanel.
(function () {
  var REPO = 'oneofficedepok-cloud/portfolio-fauzi';
  var BRANCH = 'main';
  var API = 'https://api.github.com/repos/' + REPO;
  var P_PROYEK = 'src/_data/proyek.json';
  var P_LOG = 'src/_data/log.json';
  var D_TUT = 'src/tutorial';
  var D_IMG = 'src/img';
  var P_PENULIS = 'src/_data/penulis.json';
  var STATUS = { live: 'Go Live', prog: 'Progress', plan: 'Rancangan' };

  var token = '';
  var state = { proyek: [], proyekSha: '', log: [], logSha: '', tut: [], penulis: { candaan: {} }, penulisSha: '', dirty: { proyek: false, log: false }, uploads: [] };
  var $ = function (s, el) { return (el || document).querySelector(s); };

  // ---------- util ----------
  function b64enc(str) { return btoa(unescape(encodeURIComponent(str))); }
  function b64dec(b64) { return decodeURIComponent(escape(atob(b64.replace(/\n/g, '')))); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function today() { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }
  function slugify(s) { return String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 70); }
  function toast(msg, bad) {
    var t = $('#toast'); t.textContent = msg; t.className = 'toast' + (bad ? ' bad' : ''); t.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(function () { t.hidden = true; }, 4000);
  }

  function gh(path, opts) {
    opts = opts || {};
    return fetch(path.indexOf('http') === 0 ? path : API + path, {
      method: opts.method || 'GET',
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: 'no-store',
    }).then(function (r) {
      if (r.status === 204) return null;
      return r.json().then(function (j) {
        if (!r.ok) { var e = new Error(j.message || ('HTTP ' + r.status)); e.status = r.status; throw e; }
        return j;
      });
    });
  }
  function getFile(path) { return gh('/contents/' + path + '?ref=' + BRANCH); }
  function putFile(path, contentB64, sha, message) {
    var body = { message: message, content: contentB64, branch: BRANCH };
    if (sha) body.sha = sha;
    return gh('/contents/' + path, { method: 'PUT', body: body });
  }
  function delFile(path, sha, message) { return gh('/contents/' + path, { method: 'DELETE', body: { message: message, sha: sha, branch: BRANCH } }); }
  function errMsg(e) {
    if (e.status === 401) return 'Token tidak valid atau kedaluwarsa.';
    if (e.status === 403 || e.status === 404) return 'Token tidak punya akses tulis ke repo portfolio-fauzi.';
    if (e.status === 409 || e.status === 422) return 'Data di GitHub sudah berubah. Muat ulang halaman lalu coba lagi.';
    return e.message;
  }

  // ---------- front matter tutorial ----------
  function parseMd(text) {
    var m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    var data = {}, body = text;
    if (m) {
      body = m[2];
      m[1].split(/\r?\n/).forEach(function (line) {
        var kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
        if (!kv) return;
        var v = kv[2].trim();
        if (/^".*"$/.test(v)) { try { v = JSON.parse(v); } catch (e) { v = v.slice(1, -1); } }
        else if (/^'.*'$/.test(v)) v = v.slice(1, -1).replace(/''/g, "'");
        else if (v === 'true' || v === 'false') v = v === 'true';
        else if (/^\d+$/.test(v)) v = Number(v);
        data[kv[1]] = v;
      });
    }
    return { data: data, body: body.replace(/^\n+/, '') };
  }
  function buildMd(d, body) {
    var lines = ['---',
      'title: ' + JSON.stringify(d.title),
      'kategori: ' + JSON.stringify(d.kategori),
      'menit: ' + (Number(d.menit) || 5),
      'date: ' + d.date,
      'deskripsi: ' + JSON.stringify(d.deskripsi || ''),
      'draft: ' + (d.draft ? 'true' : 'false')];
    if (d.urutan) lines.push('urutan: ' + d.urutan);
    if (d.candaan) lines.push('candaan: ' + JSON.stringify(d.candaan));
    lines.push('---', '', body.replace(/\s+$/, ''), '');
    return lines.join('\n');
  }

  // ---------- load ----------
  function loadAll() {
    return Promise.all([getFile(P_PROYEK), getFile(P_LOG), gh('/contents/' + D_TUT + '?ref=' + BRANCH), getFile(P_PENULIS).catch(function () { return null; })]).then(function (r) {
      if (r[3]) { state.penulis = JSON.parse(b64dec(r[3].content)); state.penulisSha = r[3].sha; }
      state.proyek = JSON.parse(b64dec(r[0].content)); state.proyekSha = r[0].sha;
      state.log = JSON.parse(b64dec(r[1].content)); state.logSha = r[1].sha;
      var mds = r[2].filter(function (f) { return /\.md$/.test(f.name); });
      return Promise.all(mds.map(function (f) {
        return getFile(f.path).then(function (x) {
          var p = parseMd(b64dec(x.content));
          return { path: f.path, sha: x.sha, slug: f.name.replace(/\.md$/, ''), data: p.data, body: p.body };
        });
      }));
    }).then(function (tuts) {
      state.tut = tuts.sort(function (a, b) { return String(b.data.date).localeCompare(String(a.data.date)); });
      state.dirty = { proyek: false, log: false }; state.uploads = [];
      renderAll();
    });
  }

  // ---------- render ----------
  function renderAll() { renderProj(); renderLog(); renderTut(); renderSavebar(); }

  function renderProj() {
    var html = '';
    ['live', 'prog', 'plan'].forEach(function (s) {
      var items = state.proyek.map(function (p, i) { return { p: p, i: i }; }).filter(function (x) { return x.p.status === s; });
      html += '<div class="grp"><h4><span class="dot ' + s + '"></span>' + STATUS[s] + ' <span class="muted">' + items.length + '</span></h4>';
      if (!items.length) html += '<p class="empty">Belum ada.</p>';
      items.forEach(function (x) {
        var p = x.p, img = pendingImg(p.gambar) || ('/img/' + p.gambar);
        html += '<div class="row" data-i="' + x.i + '">' +
          '<img class="thumb" src="' + esc(img) + '" alt="" loading="lazy">' +
          '<div class="row-main"><b>' + esc(p.judul) + '</b><span class="muted mono">' + esc(p.id) + ' · ' + esc(p.jenis) + '</span></div>' +
          '<select class="st-sel" aria-label="Status ' + esc(p.judul) + '">' +
            Object.keys(STATUS).map(function (k) { return '<option value="' + k + '"' + (k === p.status ? ' selected' : '') + '>' + STATUS[k] + '</option>'; }).join('') +
          '</select>' +
          '<div class="row-act"><button type="button" class="icon" data-act="up" title="Naikkan">↑</button><button type="button" class="icon" data-act="down" title="Turunkan">↓</button><button type="button" class="btn small" data-act="edit">Ubah</button></div>' +
        '</div>';
      });
      html += '</div>';
    });
    $('#proj-list').innerHTML = html;
  }

  function renderLog() {
    var html = state.log.length ? '' : '<p class="empty">Belum ada log.</p>';
    state.log.forEach(function (l, i) {
      html += '<div class="row log-row" data-i="' + i + '"><span class="mono muted">' + esc(l.tanggal) + '</span><span class="dot ' + (l.status === 'wip' ? 'prog' : 'live') + '"></span>' +
        '<div class="row-main"><span>' + esc(l.pesan) + '</span>' + (l.proyek ? '<span class="muted mono">' + esc(l.proyek) + '</span>' : '') + '</div>' +
        '<div class="row-act"><button type="button" class="btn small" data-act="edit">Ubah</button></div></div>';
    });
    $('#log-list').innerHTML = html;
  }

  function renderTut() {
    var html = state.tut.length ? '' : '<p class="empty">Belum ada tutorial.</p>';
    state.tut.forEach(function (t, i) {
      html += '<div class="row" data-i="' + i + '"><span class="pill ' + (t.data.draft ? 'draft' : 'pub') + '">' + (t.data.draft ? 'Draft' : 'Terbit') + '</span>' +
        '<div class="row-main"><b>' + esc(t.data.title) + '</b><span class="muted mono">' + esc(t.data.kategori) + ' · ' + esc(t.data.menit) + ' menit · ' + esc(t.data.date) + '</span></div>' +
        '<div class="row-act">' + (t.data.draft ? '' : '<a class="btn small ghost" href="/tutorial/' + esc(t.slug) + '/" target="_blank" rel="noopener">Lihat</a>') +
        '<button type="button" class="btn small" data-act="edit">Ubah</button></div></div>';
    });
    $('#tut-list').innerHTML = html;
  }

  function renderSavebar() {
    var n = (state.dirty.proyek ? 1 : 0) + (state.dirty.log ? 1 : 0);
    $('#savebar').hidden = !n;
    $('#savebar-txt').textContent = 'Perubahan belum disimpan: ' + [state.dirty.proyek && 'karya', state.dirty.log && 'log'].filter(Boolean).join(' & ');
  }
  function pendingImg(name) { var u = state.uploads.find(function (x) { return x.name === name; }); return u && u.dataUrl; }

  // ---------- karya ----------
  var editIdx = -1;
  function nextId() {
    var max = state.proyek.reduce(function (m, p) { var n = parseInt(String(p.id).replace(/\D/g, ''), 10); return isNaN(n) ? m : Math.max(m, n); }, 0);
    return 'PRJ-' + String(max + 1).padStart(2, '0');
  }
  function openProj(i) {
    editIdx = i;
    var f = $('#proj-form'), p = i >= 0 ? state.proyek[i] : { id: nextId(), status: 'live', jenis: 'INFRA', label: [], ilustrasi: false };
    f.reset();
    $('#proj-dlg-title').textContent = i >= 0 ? 'Ubah karya' : 'Tambah karya';
    $('#proj-del').hidden = i < 0;
    f.judul.value = p.judul || ''; f.status.value = p.status; f.jenis.value = p.jenis || ''; f.id.value = p.id;
    f.label1.value = (p.label || [])[0] || ''; f.label2.value = (p.label || [])[1] || '';
    f.ringkasan.value = p.ringkasan || ''; f.ilustrasi.checked = !!p.ilustrasi;
    f.teknologi.value = (p.teknologi || []).join(', '); f.tautan.value = p.tautan || '';
    f.cerita.value = (p.cerita || []).join('\n\n'); f.poin.value = (p.poin || []).join('\n');
    var prev = $('#proj-img-prev');
    if (p.gambar) { prev.src = pendingImg(p.gambar) || '/img/' + p.gambar; prev.hidden = false; } else prev.hidden = true;
    f.file.required = !p.gambar;
    $('#proj-dlg').showModal();
  }
  function toWebp(file) {
    return new Promise(function (res, rej) {
      var img = new Image();
      img.onload = function () {
        var w = Math.min(1280, img.naturalWidth), h = Math.round(img.naturalHeight * w / img.naturalWidth);
        var c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        res(c.toDataURL('image/webp', 0.82));
        URL.revokeObjectURL(img.src);
      };
      img.onerror = function () { rej(new Error('Gambar tidak bisa dibaca.')); };
      img.src = URL.createObjectURL(file);
    });
  }
  $('#proj-form').file.addEventListener('change', function (e) {
    var file = e.target.files[0]; if (!file) return;
    var prev = $('#proj-img-prev'); prev.src = URL.createObjectURL(file); prev.hidden = false;
  });
  $('#proj-dlg').addEventListener('close', function () {
    if ($('#proj-dlg').returnValue !== 'ok') return;
    var f = $('#proj-form');
    var old = editIdx >= 0 ? state.proyek[editIdx] : {};
    var slug = old.slug || slugify(f.judul.value);
    var p = Object.assign({}, old, {
      id: f.id.value.trim(), slug: slug, judul: f.judul.value.trim(), jenis: f.jenis.value.trim().toUpperCase(), status: f.status.value,
      label: [f.label1.value.trim(), f.label2.value.trim()].filter(Boolean), ringkasan: f.ringkasan.value.trim(),
      ilustrasi: f.ilustrasi.checked,
    });
    var opt = {
      teknologi: f.teknologi.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean),
      tautan: f.tautan.value.trim(),
      cerita: f.cerita.value.split(/\n\s*\n/).map(function (s) { return s.trim(); }).filter(Boolean),
      poin: f.poin.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean),
    };
    Object.keys(opt).forEach(function (k) { if (opt[k].length) p[k] = opt[k]; else delete p[k]; });

    var file = f.file.files[0];
    var done = function () {
      if (editIdx >= 0) state.proyek[editIdx] = p; else state.proyek.unshift(p);
      state.dirty.proyek = true; renderProj(); renderSavebar();
    };
    if (!file) return done();
    toWebp(file).then(function (dataUrl) {
      p.gambar = slug + '.webp';
      state.uploads = state.uploads.filter(function (u) { return u.name !== p.gambar; }).concat({ name: p.gambar, dataUrl: dataUrl });
      done();
    }, function (e) { toast(e.message, true); });
  });
  $('#proj-del').addEventListener('click', function () {
    var p = state.proyek[editIdx];
    if (!confirm('Hapus karya "' + p.judul + '" dari website?')) return;
    state.proyek.splice(editIdx, 1); state.dirty.proyek = true;
    $('#proj-dlg').close(); renderProj(); renderSavebar();
  });
  $('#add-proj').addEventListener('click', function () { openProj(-1); });
  $('#proj-list').addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    var i = +b.closest('.row').dataset.i, act = b.dataset.act;
    if (act === 'edit') return openProj(i);
    // naik/turun di antara karya dengan status yang sama
    var s = state.proyek[i].status, idxs = state.proyek.map(function (p, k) { return p.status === s ? k : -1; }).filter(function (k) { return k >= 0; });
    var pos = idxs.indexOf(i), j = idxs[pos + (act === 'up' ? -1 : 1)];
    if (j == null) return;
    var t = state.proyek[i]; state.proyek[i] = state.proyek[j]; state.proyek[j] = t;
    state.dirty.proyek = true; renderProj(); renderSavebar();
  });
  $('#proj-list').addEventListener('change', function (e) {
    if (!e.target.classList.contains('st-sel')) return;
    state.proyek[+e.target.closest('.row').dataset.i].status = e.target.value;
    state.dirty.proyek = true; renderProj(); renderSavebar();
  });

  // ---------- log ----------
  var logIdx = -1;
  function openLog(i) {
    logIdx = i;
    var f = $('#log-form'), l = i >= 0 ? state.log[i] : { tanggal: today(), status: 'ok', pesan: '', proyek: '' };
    $('#log-proj').innerHTML = '<option value="">(tidak ada)</option>' + state.proyek.map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.id + ' · ' + p.judul) + '</option>'; }).join('');
    f.tanggal.value = l.tanggal; f.status.value = l.status || 'ok'; f.pesan.value = l.pesan; f.proyek.value = l.proyek || '';
    $('#log-del').hidden = i < 0;
    $('#log-dlg').showModal();
  }
  $('#log-dlg').addEventListener('close', function () {
    if ($('#log-dlg').returnValue !== 'ok') return;
    var f = $('#log-form'), l = { tanggal: f.tanggal.value, pesan: f.pesan.value.trim() };
    if (f.proyek.value) l.proyek = f.proyek.value;
    l.status = f.status.value;
    if (logIdx >= 0) state.log[logIdx] = l; else state.log.push(l);
    state.log.sort(function (a, b) { return b.tanggal.localeCompare(a.tanggal); });
    state.dirty.log = true; renderLog(); renderSavebar();
  });
  $('#log-del').addEventListener('click', function () {
    if (!confirm('Hapus log ini?')) return;
    state.log.splice(logIdx, 1); state.dirty.log = true;
    $('#log-dlg').close(); renderLog(); renderSavebar();
  });
  $('#add-log').addEventListener('click', function () { openLog(-1); });
  $('#log-list').addEventListener('click', function (e) { var b = e.target.closest('[data-act="edit"]'); if (b) openLog(+b.closest('.row').dataset.i); });

  // ---------- simpan karya & log ----------
  function saveData() {
    var btn = $('#save'); btn.disabled = true; btn.textContent = 'Menyimpan…';
    var steps = Promise.resolve();
    state.uploads.forEach(function (u) {
      steps = steps.then(function () {
        var path = D_IMG + '/' + u.name;
        return getFile(path).then(function (x) { return x.sha; }, function () { return null; })
          .then(function (sha) { return putFile(path, u.dataUrl.split(',')[1], sha, 'Admin: gambar ' + u.name); });
      });
    });
    if (state.dirty.proyek) steps = steps.then(function () {
      return putFile(P_PROYEK, b64enc(JSON.stringify(state.proyek, null, 2) + '\n'), state.proyekSha, 'Admin: perbarui karya')
        .then(function (r) { state.proyekSha = r.content.sha; });
    });
    if (state.dirty.log) steps = steps.then(function () {
      return putFile(P_LOG, b64enc('[\n' + state.log.map(function (l) { return '  ' + JSON.stringify(l); }).join(',\n') + '\n]\n'), state.logSha, 'Admin: perbarui log pekerjaan')
        .then(function (r) { state.logSha = r.content.sha; });
    });
    steps.then(function () {
      state.dirty = { proyek: false, log: false }; state.uploads = [];
      renderSavebar(); toast('Tersimpan. Website sedang di-build…'); watchBuild();
    }, function (e) { toast(errMsg(e), true); })
      .then(function () { btn.disabled = false; btn.textContent = 'Simpan ke website'; });
  }
  $('#save').addEventListener('click', saveData);
  $('#discard').addEventListener('click', function () { if (confirm('Batalkan semua perubahan yang belum disimpan?')) loadAll(); });
  window.addEventListener('beforeunload', function (e) { if (state.dirty.proyek || state.dirty.log) { e.preventDefault(); e.returnValue = ''; } });

  // ---------- tutorial ----------
  var tutIdx = -1;
  function openTut(i) {
    tutIdx = i;
    var f = $('#tut-form'), t = i >= 0 ? state.tut[i] : { slug: '', data: { title: '', kategori: '', menit: 5, date: today(), deskripsi: '', draft: true }, body: '## Masalah yang diselesaikan\n\n## Yang dibutuhkan\n\n## Langkah-langkah\n\n1. \n\n## Hasil akhir\n' };
    f.title.value = t.data.title || ''; f.kategori.value = t.data.kategori || ''; f.menit.value = t.data.menit || 5;
    f.date.value = t.data.date || today(); f.deskripsi.value = t.data.deskripsi || ''; f.slug.value = t.slug;
    f.slug.readOnly = i >= 0; f.body.value = t.body; f.terbit.checked = !t.data.draft;
    fillJokes(t.data.candaan || '');
    $('#tut-del').hidden = i < 0;
    $('#tut-dlg').showModal();
  }
  // Koleksi joke dari src/_data/penulis.json, dikelompokkan per tema.
  function jokeGroups() { var c = state.penulis.candaan || {}; return Array.isArray(c) ? { Lainnya: c } : c; }
  function jokeKnown(txt) { var g = jokeGroups(); return Object.keys(g).some(function (k) { return g[k].indexOf(txt) >= 0; }); }
  function fillJokes(current) {
    var g = jokeGroups(), sel = $('#joke-pilih'), f = $('#tut-form');
    sel.innerHTML = '<option value="">Otomatis (dipilihkan sistem)</option>' + Object.keys(g).map(function (k) {
      return '<optgroup label="' + esc(k) + '">' + g[k].map(function (j) { return '<option' + (j === current ? ' selected' : '') + '>' + esc(j) + '</option>'; }).join('') + '</optgroup>';
    }).join('');
    f.candaan.value = current; f.jokeSimpan.checked = false; syncJokeSave();
  }
  function syncJokeSave() { var v = $('#tut-form').candaan.value.trim(); $('#joke-simpan-row').hidden = !v || jokeKnown(v); }
  $('#joke-pilih').addEventListener('change', function (e) { $('#tut-form').candaan.value = e.target.value; syncJokeSave(); });
  $('#tut-form').candaan.addEventListener('input', function (e) {
    var v = e.target.value.trim(); $('#joke-pilih').value = jokeKnown(v) ? v : '';
    if (!v) $('#joke-pilih').value = '';
    syncJokeSave();
  });
  function saveJoke(txt) {
    var p = JSON.parse(JSON.stringify(state.penulis)), g = Array.isArray(p.candaan) ? { Lainnya: p.candaan } : (p.candaan || {});
    (g.Lainnya = g.Lainnya || []).push(txt); p.candaan = g;
    return putFile(P_PENULIS, b64enc(JSON.stringify(p, null, 2) + '\n'), state.penulisSha, 'Admin: tambah joke ke koleksi').then(function (r) {
      state.penulis = p; state.penulisSha = r.content.sha;
    });
  }
  $('#tut-form').title.addEventListener('input', function (e) { var f = $('#tut-form'); if (!f.slug.readOnly) f.slug.value = slugify(e.target.value); });
  $('#tut-form').addEventListener('submit', function (e) {
    if (e.submitter && e.submitter.value !== 'ok') return;
    e.preventDefault();
    var f = $('#tut-form'), old = tutIdx >= 0 ? state.tut[tutIdx] : null;
    var slug = f.slug.value, path = D_TUT + '/' + slug + '.md';
    if (!old && state.tut.some(function (t) { return t.slug === slug; })) return toast('Alamat halaman itu sudah dipakai tutorial lain.', true);
    var data = { title: f.title.value.trim(), kategori: f.kategori.value.trim(), menit: f.menit.value, date: f.date.value, deskripsi: f.deskripsi.value.trim(), draft: !f.terbit.checked, urutan: old && old.data.urutan, candaan: f.candaan.value.trim() };
    var tambahJoke = f.jokeSimpan.checked && data.candaan && !jokeKnown(data.candaan);
    var btn = e.submitter; btn.disabled = true; btn.textContent = 'Menyimpan…';
    putFile(path, b64enc(buildMd(data, f.body.value)), old && old.sha, 'Admin: ' + (old ? 'ubah' : 'tulis') + ' tutorial ' + slug).then(function (r) {
      var t = { path: path, sha: r.content.sha, slug: slug, data: data, body: f.body.value };
      if (old) state.tut[tutIdx] = t; else state.tut.unshift(t);
      return tambahJoke ? saveJoke(data.candaan) : null;
    }).then(function () {
      $('#tut-dlg').close(); renderTut(); toast('Tutorial tersimpan. Website sedang di-build…'); watchBuild();
    }, function (err) { toast(errMsg(err), true); }).then(function () { btn.disabled = false; btn.textContent = 'Simpan ke website'; });
  });
  $('#tut-del').addEventListener('click', function () {
    var t = state.tut[tutIdx];
    if (!confirm('Hapus tutorial "' + t.data.title + '" dari website?')) return;
    delFile(t.path, t.sha, 'Admin: hapus tutorial ' + t.slug).then(function () {
      state.tut.splice(tutIdx, 1); $('#tut-dlg').close(); renderTut(); toast('Tutorial dihapus. Website sedang di-build…'); watchBuild();
    }, function (err) { toast(errMsg(err), true); });
  });
  $('#add-tut').addEventListener('click', function () { openTut(-1); });
  $('#tut-list').addEventListener('click', function (e) { var b = e.target.closest('[data-act="edit"]'); if (b) openTut(+b.closest('.row').dataset.i); });

  // ---------- status build ----------
  function watchBuild() {
    var box = $('#build'), started = Date.now();
    box.hidden = false; box.className = 'build run'; box.innerHTML = '<span class="spin"></span> Website sedang di-build di GitHub…';
    clearTimeout(watchBuild.t);
    (function poll() {
      gh('/actions/runs?branch=' + BRANCH + '&per_page=1').then(function (r) {
        var run = r.workflow_runs && r.workflow_runs[0];
        var fresh = run && new Date(run.created_at).getTime() > started - 60000;
        if (fresh && run.status === 'completed') {
          if (run.conclusion === 'success') {
            box.className = 'build ok';
            box.innerHTML = '✓ Build selesai. Buka <b>cPanel → Git Deploy Manager</b> lalu klik <b>Deploy</b> agar perubahan tayang. <button type="button" class="link" id="build-x">Tutup</button>';
          } else {
            box.className = 'build bad';
            box.innerHTML = '✗ Build gagal. <a href="' + run.html_url + '" target="_blank" rel="noopener">Lihat detail di GitHub</a>. <button type="button" class="link" id="build-x">Tutup</button>';
          }
          $('#build-x').onclick = function () { box.hidden = true; };
          return;
        }
        if (Date.now() - started > 5 * 60000) { box.className = 'build'; box.innerHTML = 'Status build tidak terbaca. Cek tab Actions di GitHub.'; return; }
        watchBuild.t = setTimeout(poll, 5000);
      }, function () {
        box.className = 'build'; box.innerHTML = 'Tersimpan. Tunggu ±1 menit, lalu klik <b>Deploy</b> di cPanel Git Deploy Manager.';
      });
    })();
  }

  // ---------- tab & login ----------
  document.querySelectorAll('[role="tab"]').forEach(function (t) {
    t.addEventListener('click', function () {
      document.querySelectorAll('[role="tab"]').forEach(function (x) { x.setAttribute('aria-selected', x === t ? 'true' : 'false'); });
      document.querySelectorAll('[data-panel]').forEach(function (p) { p.hidden = p.dataset.panel !== t.dataset.tab; });
    });
  });

  function start() {
    $('#login').hidden = true; $('#app').hidden = false;
    $('#proj-list').innerHTML = '<p class="empty">Memuat…</p>';
    return loadAll();
  }
  $('#login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    token = $('#token').value.trim();
    var err = $('#login-err'); err.hidden = true;
    gh('').then(function (repo) {
      if (!repo.permissions || !repo.permissions.push) throw Object.assign(new Error(''), { status: 403 });
      try { localStorage.setItem('pf-token', token); } catch (x) {}
      return start();
    }).catch(function (x) { err.textContent = errMsg(x); err.hidden = false; $('#app').hidden = true; $('#login').hidden = false; });
  });
  $('#logout').addEventListener('click', function () {
    try { localStorage.removeItem('pf-token'); } catch (x) {}
    location.reload();
  });

  try { token = localStorage.getItem('pf-token') || ''; } catch (x) {}
  if (token) start().catch(function (x) { $('#app').hidden = true; $('#login').hidden = false; var err = $('#login-err'); err.textContent = errMsg(x); err.hidden = false; });
  else $('#login').hidden = false;
})();
