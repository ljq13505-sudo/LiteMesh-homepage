/* LiteMesh — motion layer
   Grammar borrowed from the Q Industrial build: Lenis-style eased scrolling,
   GSAP/ScrollTrigger-style scroll choreography, a WebGL object replaced here by
   a canvas point cloud rendered from the actual optimizer output.            */
(function () {
  'use strict';

  var params = new URLSearchParams(location.search);
  var STILL = params.has('still');                 /* skip the preloader */
  var FORCE_P = params.has('p') ? parseFloat(params.get('p')) : null; /* freeze scroll progress */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hoverable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var root = document.documentElement;
  root.classList.add('js');

  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var easeOutCubic = function (t) { return 1 - Math.pow(1 - t, 3); };

  /* ---------------------------------------------------------------- intro */
  function intro() {
    var pre = document.getElementById('preloader');
    var done = function () {
      document.body.classList.add('ready');
      if (pre) {
        pre.classList.add('gone');
        window.setTimeout(function () { pre.remove(); }, 1200);
      }
    };
    if (!pre || reduce || STILL) {
      if (pre) pre.remove();
      done();
      return;
    }

    var num = pre.querySelector('.pre-count');
    var bar = pre.querySelector('.pre-bar span');
    var t0 = performance.now();
    var DUR = 1100;

    (function tick(now) {
      var p = clamp((now - t0) / DUR, 0, 1);
      var e = easeOutCubic(p);
      if (num) num.textContent = String(Math.round(e * 100)).padStart(3, '0');
      if (bar) bar.style.transform = 'scaleX(' + e + ')';
      if (p < 1) requestAnimationFrame(tick);
      else window.setTimeout(done, 120);
    })(t0);
  }

  /* ----------------------------------------------------- scroll smoothing */
  /* A light Lenis: we never take the wheel away, we only ease the *input* of
     the scroll-linked animations, which is what actually reads as "smooth".  */
  var smoother = (function () {
    if (reduce) return null;
    var y = window.scrollY, t = window.scrollY, raf = null;
    var ticks = 0, dead = false, probe = null;
    function limit() {
      return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    }
    function tick() {
      ticks++;
      y += (t - y) * 0.105;
      if (Math.abs(t - y) < 0.4) y = t;
      window.scrollTo(0, y);
      if (t !== y) raf = requestAnimationFrame(tick);
      else raf = null;
    }
    function kick() { if (raf === null) raf = requestAnimationFrame(tick); }
    window.addEventListener('wheel', function (e) {
      if (dead || e.ctrlKey || e.metaKey) return;  /* leave pinch-zoom alone */
      var d = e.deltaMode === 1 ? e.deltaY * 18 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
      if (!d) return;
      e.preventDefault();
      t = clamp(t + d, 0, limit());
      kick();
      /* if rAF never runs in this environment, hand scrolling back to the browser */
      if (!probe) {
        var before = ticks;
        probe = window.setTimeout(function () {
          probe = null;
          if (ticks === before) { dead = true; window.scrollTo(0, window.scrollY + d); }
        }, 320);
      }
    }, { passive: false });
    window.addEventListener('scroll', function () {
      if (raf === null) { y = t = window.scrollY; }
    }, { passive: true });
    window.addEventListener('resize', function () { t = clamp(t, 0, limit()); }, { passive: true });
    return {
      to: function (v) { y = window.scrollY; t = clamp(v, 0, limit()); kick(); },
      busy: function () { return raf !== null; }
    };
  })();

  var smoothed = { y: window.scrollY, target: window.scrollY };

  function readScroll() {
    smoothed.target = window.scrollY;
  }
  window.addEventListener('scroll', readScroll, { passive: true });
  window.addEventListener('resize', readScroll, { passive: true });

  /* --------------------------------------------------------- scroll hero */
  var hero = document.querySelector('.hero');
  var heroWords = document.querySelectorAll('.hero-word');

  function heroChoreo() {
    if (!hero) return;
    var h = hero.offsetHeight || 1;
    var p = FORCE_P !== null ? FORCE_P : clamp(smoothed.y / (h * 0.85), 0, 1);
    hero.style.setProperty('--p', p.toFixed(4));
    if (!reduce) {
      var out = p * 20;                 /* vw */
      var wfade = clamp(1 - p * 1.05, 0.10, 1);
      if (heroWords[0]) { heroWords[0].style.transform = 'translate3d(' + (-out) + 'vw,0,0)'; heroWords[0].style.opacity = wfade; }
      if (heroWords[1]) { heroWords[1].style.transform = 'translate3d(' + out + 'vw,0,0)'; heroWords[1].style.opacity = wfade; }
      var fade = clamp(1 - (p - 0.58) / 0.42, 0, 1);
      var sub = hero.querySelector('.hero-bottom');
      if (sub) {
        sub.style.opacity = fade;
        sub.style.transform = 'translate3d(0,' + (-p * 34).toFixed(1) + 'px,0)';
      }
    }
  }

  /* ------------------------------------------------------------ point cloud */
  function cloud() {
    var canvas = document.getElementById('cloud');
    var data = window.LITEMESH_POINTS;
    if (!canvas || !data) return;

    var ctx = canvas.getContext('2d', { alpha: true });
    var pts = [];
    for (var i = 0; i < data.length; i += 3) pts.push([data[i], data[i + 1], data[i + 2]]);
    var edges = window.LITEMESH_EDGES || [];

    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    function size() {
      var r = canvas.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    window.addEventListener('resize', size, { passive: true });

    var yaw = -0.35, pitch = 0.18, yawT = yaw, pitchT = pitch;
    var spin = 0;

    if (hoverable && !reduce) {
      window.addEventListener('pointermove', function (e) {
        var nx = (e.clientX / window.innerWidth) * 2 - 1;
        var ny = (e.clientY / window.innerHeight) * 2 - 1;
        yawT = -0.35 + nx * 0.62;
        pitchT = 0.18 + ny * 0.34;
      }, { passive: true });
    }

    function draw(now) {
      var t = now * 0.001;
      if (!reduce) spin = t * 0.22;
      var heroP = parseFloat((hero && hero.style.getPropertyValue('--p')) || '0');
      var baseYaw = yaw + spin + heroP * 1.15;
      var cy = Math.cos(baseYaw), sy = Math.sin(baseYaw);
      var cp = Math.cos(pitch), sp = Math.sin(pitch);

      var f = 2.9, cx = W / 2, cyy = H / 2;
      var scale = Math.min(W, H) * 0.42;   /* margin so the silhouette never clips while it spins */

      ctx.clearRect(0, 0, W, H);

      /* project once, reuse for edges + splats */
      var px = new Float32Array(pts.length), py = new Float32Array(pts.length), pz = new Float32Array(pts.length);
      for (var e0 = 0; e0 < pts.length; e0++) {
        var q0 = pts[e0];
        var a1 = q0[0] * cy + q0[2] * sy;
        var b1 = -q0[0] * sy + q0[2] * cy;
        var c1 = q0[1] * cp - b1 * sp;
        var d1 = q0[1] * sp + b1 * cp;
        var pe = f / (f - d1 * 0.55);
        px[e0] = cx + a1 * scale * pe;
        py[e0] = cyy - c1 * scale * pe;
        pz[e0] = d1;
      }

      /* ghost mesh: the points connect up as the hero is scrolled */
      if (edges.length) {
        var linkA = 0.115 + heroP * 0.30;
        ctx.lineWidth = 0.65;
        ctx.strokeStyle = 'rgba(206,44,36,' + linkA.toFixed(3) + ')';
        ctx.beginPath();
        for (var ei = 0; ei < edges.length; ei++) {
          var pa = edges[ei][0], pb = edges[ei][1];
          ctx.moveTo(px[pa], py[pa]);
          ctx.lineTo(px[pb], py[pb]);
        }
        ctx.stroke();
      }

      /* faint depth-glow pass */
      ctx.globalCompositeOperation = 'lighter';
      for (var k = 0; k < 2; k++) {
        for (var j = 0; j < pts.length; j++) {
          var sx = px[j], sy2 = py[j];
          var depth = clamp((pz[j] + 1) / 2, 0, 1);

          if (k === 0) {
            ctx.fillStyle = 'rgba(214,42,34,' + (0.028 + depth * 0.045).toFixed(3) + ')';
            ctx.beginPath();
            ctx.arc(sx, sy2, (1.5 + depth * 2.2) * 2.3, 0, 6.2832);
            ctx.fill();
          } else {
            var r = 0.75 + depth * 1.35;
            var cr = Math.round(150 + depth * 105);
            var cg = Math.round(34 + depth * 98);
            var cb = Math.round(26 + depth * 70);
            ctx.fillStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + (0.26 + depth * 0.74).toFixed(3) + ')';
            ctx.beginPath();
            ctx.arc(sx, sy2, r, 0, 6.2832);
            ctx.fill();
          }
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    function raf(now) {
      yaw = lerp(yaw, yawT, 0.06);
      pitch = lerp(pitch, pitchT, 0.06);
      draw(now);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  /* -------------------------------------------------------------- reveals */
  function reveals() {
    var items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || reduce) {
      for (var i = 0; i < items.length; i++) items[i].classList.add('in');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------- float parallax */
  function floats() {
    if (reduce) return;
    var els = [].slice.call(document.querySelectorAll('.chapter-head, .glance, .figure figcaption, .teaser-band'));
    if (!els.length) return;
    var amp = function (el) {
      return el.classList.contains('glance') ? 26 : el.classList.contains('figure') ? 10 : 14;
    };
    (function frame() {
      var vh = window.innerHeight || 1;
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        var r = el.getBoundingClientRect();
        if (r.bottom < -240 || r.top > vh + 240) continue;
        var q = (r.top + r.height / 2 - vh / 2) / vh;      /* -0.5 .. 0.5 */
        el.style.transform = 'translate3d(0,' + (q * amp(el)).toFixed(2) + 'px,0)';
      }
      requestAnimationFrame(frame);
    })();
  }

  /* ------------------------------------------------------- authors block */
  /* The words drift apart as the block travels, the three rows slide at
     slightly different rates. It waits for the entry transition to settle
     so the inline transforms do not fight the CSS one.                      */
  function authorsTrack() {
    if (reduce) return;
    var sec = document.getElementById('authors');
    if (!sec) return;
    var dim = sec.querySelector('.col-dim > span');
    var ink = sec.querySelector('.col-ink > span');
    if (!dim || !ink) return;
    var items = [].slice.call(sec.querySelectorAll('.col-list li'));

    /* Everything here is a pure function of scroll position: no one-shot
       classes, no dependency on when the preloader finishes.                */
    function apply() {
      var vh = window.innerHeight || 1;
      var r = sec.getBoundingClientRect();
      if (r.bottom < -300 || r.top > vh + 300) return;

      /* -1 below the fold · 0 centred · +1 gone above */
      var p = (vh * 0.5 - (r.top + r.height * 0.4)) / (vh * 0.9);
      p = Math.max(-1, Math.min(1, p));

      dim.style.transform = 'translate3d(' + (-p * 46).toFixed(1) + 'px,0,0)';
      ink.style.transform = 'translate3d(' + (p * 46).toFixed(1) + 'px,' + (-p * 12).toFixed(1) + 'px,0)';

      for (var i = 0; i < items.length; i++) {
        var li = items[i];
        var body = li.querySelector('.col-body');
        var num = li.querySelector('.col-num');
        if (!body || !num) continue;

        var t = (vh * 0.93 - li.getBoundingClientRect().top) / (vh * 0.34) - i * 0.085;
        var q = Math.max(0, Math.min(1, t));
        q = 1 - (1 - q) * (1 - q);                     /* ease-out quad: soft landing */
        body.style.opacity = q.toFixed(3);
        body.style.transform = 'translate3d(0,' + ((1 - q) * 24).toFixed(1) + 'px,0)';
        num.style.opacity = q.toFixed(3);
        num.style.transform = 'scale(' + (0.66 + 0.34 * q).toFixed(3) + ')';
        li.style.transform = 'translate3d(0,' + (p * (12 - i * 5)).toFixed(1) + 'px,0)';
      }
    }

    window.addEventListener('scroll', apply, { passive: true });
    window.addEventListener('resize', apply);
    (function frame() { apply(); requestAnimationFrame(frame); })();
    apply();
  }

  /* --------------------------------------------------------------- teaser */
  /* It plays itself; the only thing we do is stop decoding while it is off
     screen so a long page does not keep a 16:9 video running in the dark.   */
  function teaser() {
    var v = document.getElementById('teaser');
    if (!v) return;
    v.muted = true;
    v.loop = true;
    if (reduce) { v.pause(); return; }
    var onscreen = true;
    var play = function () {
      var pp = v.play();
      if (pp && pp.catch) pp.catch(function () {});
    };
    play();
    /* some browsers only honour autoplay after the first paint */
    window.setTimeout(play, 260);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          onscreen = en.isIntersecting;
          if (onscreen) play();
          else v.pause();
        });
      }, { threshold: 0.1 }).observe(v);
    }
    v.addEventListener('pause', function () {
      /* keep looping even if something else calls pause() */
      if (!document.hidden && onscreen) window.setTimeout(play, 1600);
    });
  }

  /* --------------------------------------------------------------- cursor */
  function cursor() {
    if (!hoverable || reduce) return;
    var dot = document.createElement('div');
    dot.className = 'cursor';
    dot.setAttribute('aria-hidden', 'true');
    document.body.appendChild(dot);
    var tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    var x = tx, y = ty;
    window.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      dot.classList.add('on');
    }, { passive: true });
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest('[data-hover]');
      dot.classList.toggle('big', !!t);
    }, { passive: true });
    (function follow() {
      x = lerp(x, tx, 0.18); y = lerp(y, ty, 0.18);
      dot.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) translate(-50%,-50%)';
      requestAnimationFrame(follow);
    })();
  }

  /* ---------------------------------------------------------- anchor easing */
  function anchors() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var top = el.getBoundingClientRect().top + window.scrollY - 62;
      if (reduce) { window.scrollTo(0, top); return; }
      if (smoother) { smoother.to(top); return; }
      var from = window.scrollY, dist = top - from, t0 = performance.now(), DUR = Math.min(1100, Math.abs(dist) * 0.55 + 320);
      (function step(now) {
        var p = clamp((now - t0) / DUR, 0, 1);
        var e2 = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        window.scrollTo(0, from + dist * e2);
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  }

  /* ------------------------------------------------------------------ loop */
  var starsDraw = null;
  function loop(now) {
    smoothed.y = lerp(smoothed.y, smoothed.target, smoother ? 0.34 : 0.14);
    heroChoreo();
    if (typeof starsDraw === 'function') starsDraw(now);
    requestAnimationFrame(loop);
  }


  /* ---------------------------------------------------------------- stars
     A constellation layer behind the hero: slow drift, hairlines when two
     nodes come close, and a gentle pull toward the pointer. Nothing here
     is red — it is the quiet field the point cloud sits in. */
  function stars() {
    var canvas = document.getElementById('stars');
    if (!canvas) return;
    var ctx = canvas.getContext('2d', { alpha: true });
    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var nodes = [], LINK = 152, LINK_C = 232;
    /* the pointer is a node of its own: it fades in where the cursor is and
       links to whatever stars are around it */
    var mouse = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, on: false, a: 0 };

    function build() {
      var r = canvas.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var want = Math.round((W * H) / 14500);
      want = Math.max(38, Math.min(96, want));
      nodes = [];
      for (var i = 0; i < want; i++) {
        var depth = 0.35 + Math.random() * 0.65;      /* slower when "further" */
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 7 * depth,
          vy: (Math.random() - 0.5) * 7 * depth,
          r: 0.6 + depth * 1.15,
          a: 0.14 + depth * 0.22,
          d: depth
        });
      }
    }
    build();
    window.addEventListener('resize', build, { passive: true });

    if (hoverable) {
      hero.addEventListener('pointermove', function (e) {
        mouse.tx = e.clientX; mouse.ty = e.clientY;
        if (!mouse.on) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
        mouse.on = true;
      }, { passive: true });
      hero.addEventListener('pointerleave', function () { mouse.on = false; }, { passive: true });
    }

    var last = 0;
    function draw(now) {
      if (!last) last = now;
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      ctx.clearRect(0, 0, W, H);

      var i, k, n, m, dx, dy, dist, al;

      /* the pointer node eases toward the real cursor and fades in/out */
      mouse.a += ((mouse.on ? 1 : 0) - mouse.a) * (reduce ? 1 : 0.18);
      if (mouse.on) {
        if (reduce) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
        else {
          mouse.x += (mouse.tx - mouse.x) * 0.28;
          mouse.y += (mouse.ty - mouse.y) * 0.28;
        }
      }

      /* position */
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        if (!reduce) {
          n.x += n.vx * dt;
          n.y += n.vy * dt;
          if (n.x < -20) n.x = W + 20; else if (n.x > W + 20) n.x = -20;
          if (n.y < -20) n.y = H + 20; else if (n.y > H + 20) n.y = -20;
        }
        if (mouse.on) {                                  /* faint attraction */
          dx = mouse.x - n.x; dy = mouse.y - n.y;
          dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 280) {
            var pull = (1 - dist / 280) * 9 * n.d;
            n.x += (dx / dist) * pull * 0.016;
            n.y += (dy / dist) * pull * 0.016;
          }
        }
      }

      /* hairlines first so the dots sit on top */
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        for (k = i + 1; k < nodes.length; k++) {
          m = nodes[k];
          dx = m.x - n.x; dy = m.y - n.y;
          if (dx > LINK || dx < -LINK || dy > LINK || dy < -LINK) continue;
          dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > LINK) continue;
          al = (1 - dist / LINK) * 0.13 * (0.5 + 0.5 * Math.min(n.d, m.d));
          if (mouse.on) {
            var md = Math.min(
              Math.sqrt(Math.pow(mouse.x - n.x, 2) + Math.pow(mouse.y - n.y, 2)),
              Math.sqrt(Math.pow(mouse.x - m.x, 2) + Math.pow(mouse.y - m.y, 2))
            );
            if (md < 230) al += (1 - md / 230) * 0.13;
          }
          ctx.strokeStyle = 'rgba(226,226,226,' + al.toFixed(3) + ')';
          ctx.lineWidth = 0.7;
          ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y); ctx.stroke();
        }
      }

      /* dots */
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        ctx.beginPath();
        ctx.fillStyle = 'rgba(232,232,232,' + n.a.toFixed(3) + ')';
        ctx.arc(n.x, n.y, n.r, 0, 6.2832);
        ctx.fill();
      }

      /* the pointer node: links first, then the dot itself */
      if (mouse.a > 0.012) {
        for (i = 0; i < nodes.length; i++) {
          n = nodes[i];
          dx = n.x - mouse.x; dy = n.y - mouse.y;
          dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > LINK_C) continue;
          al = (1 - dist / LINK_C) * 0.52 * mouse.a;
          ctx.strokeStyle = 'rgba(240,240,240,' + al.toFixed(3) + ')';
          ctx.lineWidth = 0.75;
          ctx.beginPath(); ctx.moveTo(mouse.x, mouse.y); ctx.lineTo(n.x, n.y); ctx.stroke();
        }
        ctx.beginPath();
        ctx.fillStyle = 'rgba(250,250,250,' + (0.92 * mouse.a).toFixed(3) + ')';
        ctx.arc(mouse.x, mouse.y, 2.4, 0, 6.2832);
        ctx.fill();
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(250,250,250,' + (0.26 * mouse.a).toFixed(3) + ')';
        ctx.lineWidth = 0.7;
        ctx.arc(mouse.x, mouse.y, 9, 0, 6.2832);
        ctx.stroke();
      }
    }
    return draw;
  }

  try {
    intro();
    var starsDraw = stars();
    cloud();
    reveals();
    floats();
    authorsTrack();
    teaser();
    cursor();
    anchors();
  } catch (err) {
    /* never let a broken canvas or a missing asset hide the content */
    var items = document.querySelectorAll('.reveal');
    for (var i = 0; i < items.length; i++) items[i].classList.add('in');
    var pre = document.getElementById('preloader');
    if (pre) pre.remove();
    document.body.classList.add('ready');
    if (window.console) console.warn('motion layer degraded:', err);
  }
  requestAnimationFrame(loop);
})();
