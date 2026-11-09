(function () {
  // Tab status karya
  var chips = document.querySelectorAll('.chip');
  var groups = document.querySelectorAll('.group');
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      var f = c.dataset.f;
      chips.forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
      groups.forEach(function (g) {
        var show = g.dataset.g === f;
        g.hidden = !show;
        if (show) g.querySelectorAll('.card').forEach(function (card, i) {
          card.classList.remove('in'); void card.offsetWidth;
          card.style.animationDelay = (i * 0.05) + 's'; card.classList.add('in');
        });
      });
    });
  });

  // Tombol "Lihat semua karya" per status
  document.querySelectorAll('[data-more]').forEach(function (b) {
    var label = b.firstChild.textContent;
    b.addEventListener('click', function () {
      var extra = b.closest('.group').querySelectorAll('.card[data-extra]');
      var buka = b.getAttribute('aria-expanded') !== 'true';
      extra.forEach(function (c, i) {
        c.hidden = !buka;
        if (buka) { c.classList.remove('in'); void c.offsetWidth; c.style.animationDelay = (i * 0.05) + 's'; c.classList.add('in'); }
      });
      b.setAttribute('aria-expanded', buka ? 'true' : 'false');
      b.firstChild.textContent = buka ? 'Tampilkan lebih sedikit ' : label;
      b.querySelector('.n').hidden = buka;
    });
  });

  // Tombol salin email / WhatsApp
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var done = function () { b.textContent = 'Tersalin'; setTimeout(function () { b.textContent = 'Salin'; }, 1500); };
      var sel = function () { var r = document.createRange(); r.selectNodeContents(b.previousElementSibling.querySelector('strong')); var s = getSelection(); s.removeAllRanges(); s.addRange(r); };
      try { navigator.clipboard.writeText(b.dataset.copy).then(done, sel); } catch (e) { sel(); }
    });
  });
})();
