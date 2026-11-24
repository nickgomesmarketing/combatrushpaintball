/*
 * Efeito de tiros de paintball · Combat Rush
 *
 * 1. Tiro de abertura: a bolinha sai do cano da arma da foto principal,
 *    vem na direção de quem está lendo e estoura na tela.
 * 2. Tiros ao rolar: conforme a pessoa desce a página, algumas bolinhas
 *    estouram na "tela", escorregam um pouco e somem sozinhas.
 * 3. Clique na área principal (cursor de mira) também dispara.
 *
 * Nada disso bloqueia cliques (pointer-events: none) e tudo é desligado
 * para quem pediu "menos movimento" no sistema.
 */
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Posição da ponta do cano na foto original (750 x 1000 px)
  var PHOTO_W = 750, PHOTO_H = 1000, MUZZLE_X = 212, MUZZLE_Y = 414;
  var PHOTO_SELECTOR = 'img[alt^="Jogador mirando"]';

  var live = 0, MAX_LIVE = 10;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function isMobile() { return window.innerWidth < 700; }

  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.max(0, Math.min(255, (n >> 16) + amt));
    var g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
    var b = Math.max(0, Math.min(255, (n & 255) + amt));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // ---------- estilos ----------
  var st = document.createElement('style');
  st.textContent =
    '.crfx{position:fixed;left:0;top:0;pointer-events:none;z-index:9000;will-change:transform,opacity}' +
    '.crfx-splat{transform:translate(-50%,-50%);animation:crfx-hit .3s cubic-bezier(.18,1.45,.4,1) both;filter:drop-shadow(0 6px 14px rgba(0,0,0,.35))}' +
    '.crfx-splat.crfx-out{transition:opacity .9s ease;opacity:0}' +
    '@keyframes crfx-hit{0%{transform:translate(-50%,-50%) scale(.25);opacity:0}' +
    '35%{opacity:1}100%{transform:translate(-50%,-50%) scale(1);opacity:1}}' +
    '.crfx-ball{border-radius:50%;transform:translate(-50%,-50%)}' +
    '.crfx-puff{border-radius:50%;transform:translate(-50%,-50%);' +
    'background:radial-gradient(circle,rgba(255,255,255,.95) 0,rgba(255,255,255,.55) 35%,rgba(255,255,255,0) 70%)}';
  document.head.appendChild(st);

  // ---------- manchas (imagens em /respingos) ----------
  // tilt: quanto pode girar (a de escorrido fica quase reta para a tinta descer)
  var SPLATS = [
    { src: 'respingos/pink-a.webp', color: '#ED0671', tilt: 180 },
    { src: 'respingos/blue-a.webp', color: '#0067F3', tilt: 180 },
    { src: 'respingos/yellow.webp', color: '#FCC802', tilt: 180 },
    { src: 'respingos/orange.webp', color: '#FC5E02', tilt: 180 },
    { src: 'respingos/pink-drip.webp', color: '#E9056E', tilt: 8 },
    { src: 'respingos/blue-b.webp', color: '#0068F7', tilt: 180 }
  ];
  var lastIdx = -1;
  function preload() { SPLATS.forEach(function (sp) { var i = new Image(); i.src = sp.src; }); }
  function randomSplat() {
    var i;
    do { i = Math.floor(Math.random() * SPLATS.length); } while (i === lastIdx);
    lastIdx = i;
    return SPLATS[i];
  }

  // Estoura uma mancha na posição (x, y) da tela
  function splat(x, y, opts) {
    if (live >= MAX_LIVE) return;
    opts = opts || {};
    var sp = opts.splat || randomSplat();
    var size = opts.size || 200, stay = opts.stay || 1900;
    var wrap = document.createElement('div');
    wrap.className = 'crfx crfx-splat';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.left = x + 'px';
    wrap.style.top = y + 'px';
    var img = document.createElement('img');
    img.src = sp.src;
    img.alt = '';
    img.width = img.height = Math.round(size);
    var rot = opts.rotate != null ? opts.rotate : rnd(-sp.tilt, sp.tilt);
    var flip = opts.flip ? -1 : 1;
    img.style.cssText = 'display:block;width:' + Math.round(size) + 'px;height:auto;transform:rotate(' + rot.toFixed(1) + 'deg) scaleX(' + flip + ')';
    wrap.appendChild(img);
    document.body.appendChild(wrap);
    live++;
    // tinta molhada escorregando devagar pela "tela"
    wrap.animate([
      { marginTop: '0px' },
      { marginTop: Math.round(size * 0.06) + 'px' }
    ], { duration: stay + 900, delay: 300, easing: 'cubic-bezier(.5,0,.9,.6)', fill: 'forwards' });
    setTimeout(function () {
      wrap.classList.add('crfx-out');
      setTimeout(function () { wrap.remove(); live--; }, 950);
    }, stay);
  }

  // Bolinha vindo na direção da tela: cresce rápido e estoura
  function incoming(fromX, fromY, toX, toY, color, dur, done) {
    var ball = document.createElement('div');
    ball.className = 'crfx crfx-ball';
    ball.setAttribute('aria-hidden', 'true');
    var s = 20;
    ball.style.width = ball.style.height = s + 'px';
    ball.style.background = 'radial-gradient(circle at 34% 30%, #fff 0, ' + shade(color, 60) + ' 18%, ' + color + ' 55%, ' + shade(color, -60) + ' 100%)';
    ball.style.boxShadow = '0 0 18px ' + color + '88';
    document.body.appendChild(ball);
    var anim = ball.animate([
      { transform: 'translate(' + (fromX - s / 2) + 'px,' + (fromY - s / 2) + 'px) scale(.5)' },
      { transform: 'translate(' + (fromX + (toX - fromX) * 0.35 - s / 2) + 'px,' + (fromY + (toY - fromY) * 0.35 - s / 2) + 'px) scale(1.4)', offset: 0.55 },
      { transform: 'translate(' + (toX - s / 2) + 'px,' + (toY - s / 2) + 'px) scale(6)' }
    ], { duration: dur, easing: 'cubic-bezier(.55,0,1,.45)', fill: 'forwards' });
    ball.style.transform = 'none';
    anim.onfinish = function () { ball.remove(); done && done(); };
  }

  // Sopro de ar/flash na boca do cano
  function puff(x, y) {
    var p = document.createElement('div');
    p.className = 'crfx crfx-puff';
    p.setAttribute('aria-hidden', 'true');
    p.style.width = p.style.height = '40px';
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    document.body.appendChild(p);
    p.animate([
      { transform: 'translate(-50%,-50%) scale(.2)', opacity: 1 },
      { transform: 'translate(-50%,-50%) scale(2.6)', opacity: 0 }
    ], { duration: 320, easing: 'ease-out', fill: 'forwards' }).onfinish = function () { p.remove(); };
  }

  // Onde está a ponta do cano agora, na tela (considera recorte e rotação da foto)
  function muzzlePoint() {
    var img = document.querySelector(PHOTO_SELECTOR);
    if (!img) return null;
    var box = img.parentElement;
    var W = box.offsetWidth, H = box.offsetHeight;
    if (!W || !H) return null;
    var sc = Math.max(W / PHOTO_W, H / PHOTO_H);
    var ox = (W - PHOTO_W * sc) * 0.5, oy = (H - PHOTO_H * sc) * 0.38; // object-position: center 38%
    var lx = ox + MUZZLE_X * sc - W / 2, ly = oy + MUZZLE_Y * sc - H / 2;
    var ang = 0, tf = getComputedStyle(box).transform;
    if (tf && tf !== 'none') {
      var mm = tf.match(/matrix\(([^)]+)\)/);
      if (mm) { var v = mm[1].split(',').map(parseFloat); ang = Math.atan2(v[1], v[0]); }
    }
    var r = box.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var x = cx + lx * Math.cos(ang) - ly * Math.sin(ang);
    var y = cy + lx * Math.sin(ang) + ly * Math.cos(ang);
    var vh = window.innerHeight;
    // só dispara com o cano bem à vista (nem colado no topo, nem no rodapé da tela)
    return { x: x, y: y, visible: y > vh * 0.15 && y < vh * 0.75 && x > 0 && x < window.innerWidth };
  }

  // ---------- 1. tiro de abertura ----------
  var openingDone = false;
  function openingShot() {
    if (openingDone) return;
    var m = muzzlePoint();
    if (!m || !m.visible) return;
    openingDone = true;
    var sp = SPLATS[3]; // laranja
    var color = sp.color;
    // a bolinha vem "para fora" da foto, em direção ao leitor
    var tx = m.x + (window.innerWidth / 2 - m.x) * 0.18;
    var ty = m.y + (window.innerHeight / 2 - m.y) * 0.18 + 10;
    var size = isMobile() ? 360 : 560;
    // mantém a mancha quase toda dentro da tela
    var margin = Math.min(size * 0.38, window.innerWidth / 2);
    tx = Math.max(margin, Math.min(window.innerWidth - margin, tx));
    puff(m.x, m.y);
    incoming(m.x, m.y, tx, ty, color, 420, function () {
      splat(tx, ty, { splat: sp, size: size, stay: 2800, rotate: rnd(-10, 10), flip: tx > m.x });
    });
  }

  // ---------- 2. tiros ao longo da leitura ----------
  var shotsAtScroll = [0.9, 2.1, 3.4, 4.8, 6.4, 8.2, 10.2];
  var nextShot = 0, maxDepth = 0, lastShot = 0;
  function randomScreenShot() {
    var w = window.innerWidth, h = window.innerHeight, x;
    if (isMobile()) x = rnd(0.12, 0.88) * w;
    else x = Math.random() < 0.5 ? rnd(0.04, 0.2) * w : rnd(0.8, 0.96) * w; // nas laterais, longe do texto
    var y = rnd(0.22, 0.72) * h;
    var sp = randomSplat();
    incoming(x + rnd(-40, 40), y + rnd(-40, 40), x, y, sp.color, 170, function () {
      splat(x, y, { splat: sp, size: isMobile() ? rnd(150, 200) : rnd(210, 300), stay: isMobile() ? 1500 : 1900 });
    });
  }
  function onScroll() {
    if (!openingDone) openingShot();
    var depth = window.scrollY / window.innerHeight;
    if (depth <= maxDepth) return;
    maxDepth = depth;
    var limit = isMobile() ? 4 : shotsAtScroll.length;
    if (nextShot < limit && depth >= shotsAtScroll[nextShot] && Date.now() - lastShot > 2500) {
      nextShot++;
      lastShot = Date.now();
      setTimeout(randomScreenShot, 200);
    }
  }

  // ---------- 3. clique na área principal ----------
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('.cr-hero')) return;
    if (e.target.closest('a,button,input,select,textarea,label')) return;
    splat(e.clientX, e.clientY, { size: isMobile() ? 150 : 200, stay: 1500 });
  });

  function start() {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; onScroll(); });
    }, { passive: true });
    preload();
    setTimeout(openingShot, 900);
  }

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();
