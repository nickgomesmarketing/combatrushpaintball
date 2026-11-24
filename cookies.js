/*
 * Aviso de cookies (LGPD) · Combat Rush Paintball
 *
 * - Mostra o aviso na primeira visita e guarda a escolha por 12 meses
 *   (localStorage, chave "cr-consent").
 * - Qualquer link para "#preferencias-cookies" ou botão com id "cr-reabrir"
 *   abre o aviso de novo.
 * - Hoje o site não carrega nenhuma ferramenta de medição/anúncio.
 *   Se um dia entrar Meta Pixel, Google Analytics etc., carregue o código
 *   DENTRO de crConsent.onAccept(), assim ele só roda para quem aceitou:
 *
 *     window.crConsent.onAccept(function () {
 *       // cole aqui o código do pixel
 *     });
 */
(function () {
  var KEY = 'cr-consent';
  var VERSION = 1;
  var MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 12 meses
  var POLICY = '/politica-de-privacidade.html';
  var listeners = [];
  var box = null;

  function read() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!c || c.v !== VERSION || !c.ts || Date.now() - c.ts > MAX_AGE) return null;
      return c;
    } catch (e) { return null; }
  }

  function save(marketing) {
    var c = { v: VERSION, marketing: !!marketing, ts: Date.now() };
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
    return c;
  }

  function runAccepted() {
    var fns = listeners.slice();
    listeners = [];
    fns.forEach(function (fn) { try { fn(); } catch (e) {} });
  }

  window.crConsent = {
    get: read,
    onAccept: function (fn) {
      var c = read();
      if (c && c.marketing) { try { fn(); } catch (e) {} }
      else listeners.push(fn);
    },
    open: open
  };

  function css() {
    if (document.getElementById('cr-cookie-css')) return;
    var s = document.createElement('style');
    s.id = 'cr-cookie-css';
    s.textContent =
      '#cr-cookie{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:760px;margin:0 auto;' +
      'background:#06172C;color:#C3C6DE;border:1px solid #13243F;border-top:3px solid #EE7F0C;border-radius:14px;' +
      'box-shadow:0 18px 50px rgba(0,0,0,.55);padding:18px 20px;display:flex;flex-wrap:wrap;align-items:center;gap:14px 20px;' +
      "font-family:'Montserrat',system-ui,sans-serif;font-size:14px;line-height:1.5;transform:translateY(0);opacity:1;transition:transform .25s ease,opacity .25s ease}" +
      '#cr-cookie.cr-hide{transform:translateY(16px);opacity:0}' +
      '#cr-cookie p{margin:0;flex:1 1 320px}' +
      '#cr-cookie strong{color:#F4F5FA}' +
      '#cr-cookie a{color:#EE7F0C;font-weight:700;text-underline-offset:3px}' +
      '#cr-cookie .cr-ck-btns{display:flex;flex-wrap:wrap;gap:10px;flex:0 0 auto}' +
      "#cr-cookie button{font-family:'Montserrat',sans-serif;font-weight:800;text-transform:uppercase;letter-spacing:.04em;font-size:13px;" +
      'min-height:44px;padding:12px 18px;border-radius:10px;cursor:pointer;border:2px solid #EE7F0C}' +
      '#cr-cookie .cr-ck-yes{background:#EE7F0C;color:#000C1A}' +
      '#cr-cookie .cr-ck-no{background:transparent;color:#F4F5FA;border-color:#2A3B5C}' +
      '#cr-cookie button:hover{filter:brightness(1.08)}' +
      '#cr-cookie button:focus-visible,#cr-cookie a:focus-visible{outline:3px solid #F4F5FA;outline-offset:2px}' +
      '@media (max-width:560px){#cr-cookie{left:10px;right:10px;bottom:10px;padding:16px}#cr-cookie .cr-ck-btns{width:100%}#cr-cookie button{flex:1 1 0}}' +
      '@media (prefers-reduced-motion:reduce){#cr-cookie{transition:none}}';
    document.head.appendChild(s);
  }

  function close() {
    if (!box) return;
    var el = box;
    box = null;
    el.classList.add('cr-hide');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
  }

  function choose(marketing) {
    save(marketing);
    close();
    if (marketing) runAccepted();
  }

  function open() {
    if (box) return;
    css();
    box = document.createElement('div');
    box.id = 'cr-cookie';
    box.setAttribute('role', 'region');
    box.setAttribute('aria-label', 'Aviso de cookies');
    box.className = 'cr-hide';
    box.innerHTML =
      '<p><strong>Sua privacidade importa.</strong> Usamos só o necessário para o site funcionar. ' +
      'Ferramentas de medição e anúncios só são ativadas se você aceitar. ' +
      '<a href="' + POLICY + '">Política de Privacidade</a></p>' +
      '<div class="cr-ck-btns">' +
      '<button type="button" class="cr-ck-no">Só os necessários</button>' +
      '<button type="button" class="cr-ck-yes">Aceitar</button>' +
      '</div>';
    box.querySelector('.cr-ck-yes').addEventListener('click', function () { choose(true); });
    box.querySelector('.cr-ck-no').addEventListener('click', function () { choose(false); });
    document.body.appendChild(box);
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (box) box.classList.remove('cr-hide'); }); });
  }

  // Links "Preferências de cookies" (também funcionam em conteúdo que o site monta depois)
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('a[href="#preferencias-cookies"], #cr-reabrir') : null;
    if (!t) return;
    e.preventDefault();
    open();
  });

  function init() {
    var c = read();
    if (!c) open();
    else if (c.marketing) runAccepted();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
