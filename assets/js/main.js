/* FRIXOS ANDREOU — drawing-set behaviors.
   All geometry is generated from one parametric golden-spiral definition:
   r = r0 · e^(−B·θ), B = ln(φ)/(π/2) — the "golden" in golden ram is literal. */
(function () {
  'use strict';
  var PHI = (1 + Math.sqrt(5)) / 2;
  var B = Math.log(PHI) / (Math.PI / 2);
  var D2R = Math.PI / 180;
  var H = { cx: 332, cy: 252, rRoot: 140, startAngle: -102, sweepTurns: 1.18,
            wRoot: 34, wTip: 1.5, taperPow: 1.4, widthCap: 0.52 };
  var FACE = 'M228 158L284 158L279 296L256 414L233 296L228 158Z';
  var NS = 'http://www.w3.org/2000/svg';
  var snap = /[?&]snap/.test(location.search);
  if (snap) {
    document.documentElement.classList.add('snap');
    addEventListener('DOMContentLoaded', function () {
      document.querySelectorAll('img[loading="lazy"]').forEach(function (i) { i.loading = 'eager'; });
    });
  }
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || snap;

  function hornPt(t, mirror) {
    var th = H.sweepTurns * 2 * Math.PI * t;
    var r = H.rRoot * Math.exp(-B * th);
    var a = H.startAngle * D2R + th;
    var x = H.cx + r * Math.cos(a), y = H.cy + r * Math.sin(a);
    if (mirror) x = 512 - x;
    return [x, y, r, a];
  }
  function ribbon(mirror) {
    var o = [], n = [], S = 110, i, t, p, w, s, nx, ny;
    for (i = 0; i <= S; i++) {
      t = i / S; p = hornPt(t, mirror);
      w = H.wRoot + (H.wTip - H.wRoot) * Math.pow(t, H.taperPow);
      w = Math.min(w, H.widthCap * p[2]);
      s = mirror ? -1 : 1; nx = Math.cos(p[3]) * s; ny = Math.sin(p[3]);
      o.push([p[0] + nx * w, p[1] + ny * w]);
      n.push([p[0] - nx * w, p[1] - ny * w]);
    }
    var pts = o.concat(n.reverse());
    return 'M' + pts.map(function (q) { return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join('L') + 'Z';
  }
  function centerline(mirror) {
    var p = [], i, q;
    for (i = 0; i <= 110; i++) { q = hornPt(i / 110, mirror); p.push(q[0].toFixed(1) + ' ' + q[1].toFixed(1)); }
    return 'M' + p.join('L');
  }
  function el(parent, name, attrs) {
    var e = document.createElementNS(NS, name), k;
    for (k in attrs) e.setAttribute(k, attrs[k]);
    parent.appendChild(e); return e;
  }

  /* ---- shared sigil symbol (nav + footer) ---- */
  var mark = document.getElementById('sigil-mark');
  if (mark) {
    el(mark, 'path', { d: ribbon(false) });
    el(mark, 'path', { d: ribbon(true) });
    el(mark, 'path', { d: FACE });
  }

  /* ---- hero construction drawing ---- */
  var hero = document.getElementById('hero-drawing');
  if (hero) {
    var ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#141414';
    var gold = getComputedStyle(document.documentElement).getPropertyValue('--gold').trim() || '#C89B3C';
    var m, ccx, radii = [H.rRoot, H.rRoot / PHI, H.rRoot / (PHI * PHI), H.rRoot / (PHI * PHI * PHI)];
    [false, true].forEach(function (mir) {
      ccx = mir ? 512 - H.cx : H.cx;
      radii.forEach(function (r) {
        el(hero, 'circle', { cx: ccx, cy: H.cy, r: r, fill: 'none', stroke: '#A6A29A',
          'stroke-width': 0.7, 'stroke-dasharray': '3 5', opacity: 0.55, 'class': 'con' });
      });
      el(hero, 'line', { x1: ccx - 6, y1: H.cy, x2: ccx + 6, y2: H.cy, stroke: '#A6A29A', 'stroke-width': 0.8, 'class': 'con' });
      el(hero, 'line', { x1: ccx, y1: H.cy - 6, x2: ccx, y2: H.cy + 6, stroke: '#A6A29A', 'stroke-width': 0.8, 'class': 'con' });
    });
    el(hero, 'line', { x1: 256, y1: -10, x2: 256, y2: 530, stroke: '#A6A29A', 'stroke-width': 0.7,
      'stroke-dasharray': '10 6 2 6', opacity: 0.6, 'class': 'con' });
    var t1 = el(hero, 'text', { x: 474, y: 118, 'class': 'note', 'text-anchor': 'start' }); t1.textContent = 'r·φ⁻¹ / 90°';
    var t2 = el(hero, 'text', { x: 38, y: 118, 'class': 'note', 'text-anchor': 'end' }); t2.textContent = 'b = ln φ / ½π';
    el(hero, 'line', { x1: 430, y1: 132, x2: 468, y2: 114, stroke: '#A6A29A', 'stroke-width': 0.7, 'class': 'con' });
    el(hero, 'line', { x1: 84, y1: 132, x2: 44, y2: 114, stroke: '#A6A29A', 'stroke-width': 0.7, 'class': 'con' });

    var lines = [false, true].map(function (mir) {
      return el(hero, 'path', { d: centerline(mir), fill: 'none', stroke: ink, 'stroke-width': 1.4 });
    });
    var fills = [ribbon(false), ribbon(true), FACE].map(function (d) {
      return el(hero, 'path', { d: d, fill: gold });
    });

    if (!reduce) {
      lines.forEach(function (p) {
        var L = p.getTotalLength();
        p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
        p.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(.4,0,.2,1) .3s';
      });
      fills.forEach(function (f, i) {
        f.style.opacity = 0;
        f.style.transition = 'opacity .9s ease ' + (1.6 + i * 0.15) + 's';
      });
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        lines.forEach(function (p) { p.style.strokeDashoffset = 0; });
        fills.forEach(function (f) { f.style.opacity = 1; });
      }); });
      setTimeout(function () {
        hero.querySelectorAll('.con').forEach(function (c) {
          c.style.transition = 'opacity 1s ease'; c.style.opacity = 0.28;
        });
      }, 2600);
    }
  }

  /* ---- constellation (FIG II) ---- */
  var cons = document.getElementById('constellation');
  if (cons) {
    var ts = [0, 0.06, 0.14, 0.24, 0.35, 0.47, 0.59, 0.71, 0.82, 0.91, 1];
    var chainR = ts.map(function (t) { var p = hornPt(t, false); return [p[0], p[1]]; });
    var chainL = ts.map(function (t) { var p = hornPt(t, true); return [p[0], p[1]]; });
    var face = [[256, 152], [284, 158], [279, 296], [256, 414], [233, 296], [228, 158], [256, 152]];
    var chains = [chainR, chainL, face];
    var delay = 0.1;
    chains.forEach(function (chain) {
      var i, a, b, l, len;
      for (i = 0; i < chain.length - 1; i++) {
        a = chain[i]; b = chain[i + 1];
        l = el(cons, 'line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1],
          stroke: '#D4A843', 'stroke-width': 1, opacity: 0.45 });
        if (!reduce) {
          len = Math.hypot(b[0] - a[0], b[1] - a[1]);
          l.style.strokeDasharray = len; l.style.strokeDashoffset = len;
          l.style.transition = 'stroke-dashoffset .45s ease ' + delay + 's';
          delay += 0.055;
        }
      }
    });
    var seed = 11;
    var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    chains.forEach(function (chain) {
      chain.forEach(function (pt) {
        var major = rnd() < 0.33;
        el(cons, 'circle', { cx: pt[0], cy: pt[1], r: major ? 3 : 1.7,
          fill: major ? '#EFCB6E' : '#D4A843' });
        if (major) [[8, 0], [-8, 0], [0, 8], [0, -8]].forEach(function (d) {
          el(cons, 'line', { x1: pt[0], y1: pt[1], x2: pt[0] + d[0], y2: pt[1] + d[1],
            stroke: '#EFCB6E', 'stroke-width': 0.6, opacity: 0.6 });
        });
      });
    });
    // animate the line-draw only when the plate scrolls into view
    if (!reduce && 'IntersectionObserver' in window) {
      var armed = false;
      var lines2 = cons.querySelectorAll('line');
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && !armed) {
            armed = true;
            lines2.forEach(function (l) { l.style.strokeDashoffset = 0; });
            io.disconnect();
          }
        });
      }, { threshold: 0.3 });
      io.observe(cons);
    } else {
      cons.querySelectorAll('line').forEach(function (l) { l.style.strokeDashoffset = 0; });
    }
  }


  /* ---- wordmark decode: locked letters stay one text node so kerning survives ---- */
  var nameEl = document.querySelector('.hero h1');
  if (nameEl && !reduce) {
    nameEl.setAttribute('aria-label', 'Frixos Andreou');
    var GLYPHS = 'ΦΡΙΞΟΣΑΝΔΕΥ<>/=+*#0147';
    var words = [];
    nameEl.querySelectorAll('span').forEach(function (word) {
      word.setAttribute('aria-hidden', 'true');
      words.push({ el: word, text: word.textContent });
    });
    var starts = [], total = 0;
    words.forEach(function (w) { starts.push(total); total += w.text.length; });
    var running = false;
    var runDecode = function () {
      if (running) return;
      running = true;
      var t0 = performance.now();
      var tick = setInterval(function () {
        var elapsed = performance.now() - t0;
        var locked = elapsed < 450 ? 0 : Math.min(Math.floor((elapsed - 450) / 85) + 1, total);
        words.forEach(function (w, wi) {
          var n = Math.min(Math.max(locked - starts[wi], 0), w.text.length);
          if (n >= w.text.length) {
            if (w.el.firstElementChild) w.el.textContent = w.text;
            return;
          }
          var cyc = '';
          for (var k = n; k < w.text.length; k++) {
            cyc += GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
          }
          w.el.textContent = w.text.slice(0, n);
          var s = document.createElement('span');
          s.className = 'cycling'; s.textContent = cyc;
          w.el.appendChild(s);
        });
        if (locked >= total) { clearInterval(tick); running = false; }
      }, 46);
    };
    runDecode();
    nameEl.addEventListener('click', runDecode);
  }

  /* ---- static starfield behind the night plate ---- */
  var night = document.querySelector('.plate-night');
  if (night) {
    var sc = document.createElement('canvas');
    sc.className = 'stars'; sc.setAttribute('aria-hidden', 'true');
    night.insertBefore(sc, night.firstChild);
    var drawStars = function () {
      var dpr = Math.min(devicePixelRatio || 1, 2);
      var w = night.clientWidth, h = night.clientHeight;
      sc.width = w * dpr; sc.height = h * dpr;
      sc.style.width = w + 'px'; sc.style.height = h + 'px';
      var c = sc.getContext('2d'); c.scale(dpr, dpr);
      var sd = 21;
      var rr = function () { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
      for (var i = 0; i < Math.floor(w * h / 9000); i++) {
        var x = rr() * w, y = rr() * h, r = rr() * 1.1 + 0.2, a = rr() * 0.4 + 0.08;
        c.beginPath(); c.arc(x, y, r, 0, 7);
        c.fillStyle = 'rgba(220,225,240,' + a.toFixed(3) + ')'; c.fill();
      }
    };
    drawStars();
    var rsz; addEventListener('resize', function () { clearTimeout(rsz); rsz = setTimeout(drawStars, 200); });
  }

  /* ---- fleece specimen: upgrade still to video when appropriate ---- */
  var fleece = document.getElementById('fleece-media');
  var conn = navigator.connection || {};
  if (fleece && !reduce && !conn.saveData) {
    var v = document.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    v.poster = fleece.src; v.width = 1280; v.height = 720;
    v.setAttribute('aria-label', fleece.alt);
    var s = document.createElement('source');
    s.src = 'assets/media/fleece.mp4'; s.type = 'video/mp4';
    v.appendChild(s);
    v.addEventListener('loadeddata', function () { fleece.replaceWith(v); });
    v.addEventListener('error', function () { /* keep the still */ }, true);
    if ('IntersectionObserver' in window) {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { v.load(); vio.disconnect(); }
        });
      }, { rootMargin: '400px' });
      vio.observe(fleece);
    } else { v.load(); }
  }

  /* ---- scroll reveals ---- */
  var revealEls = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (e) { e.classList.add('in'); });
  } else {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); rio.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (e) { rio.observe(e); });
    // safety: nothing stays hidden if IO misfires
    setTimeout(function () { revealEls.forEach(function (e) { e.classList.add('in'); }); }, 3000);
  }

  /* ---- nav current-section ---- */
  var navLinks = document.querySelectorAll('.nav ul a');
  if ('IntersectionObserver' in window && navLinks.length) {
    var map = {};
    navLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var nio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var a = map[en.target.id];
        if (a) {
          if (en.isIntersecting) {
            navLinks.forEach(function (x) { x.removeAttribute('aria-current'); });
            a.setAttribute('aria-current', 'true');
          }
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(map).forEach(function (id) {
      var s = document.getElementById(id); if (s) nio.observe(s);
    });
  }
})();
