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

  // Tombol salin email / WhatsApp
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var done = function () { b.textContent = 'Tersalin'; setTimeout(function () { b.textContent = 'Salin'; }, 1500); };
      var sel = function () { var r = document.createRange(); r.selectNodeContents(b.previousElementSibling.querySelector('strong')); var s = getSelection(); s.removeAllRanges(); s.addRange(r); };
      try { navigator.clipboard.writeText(b.dataset.copy).then(done, sel); } catch (e) { sel(); }
    });
  });
})();
