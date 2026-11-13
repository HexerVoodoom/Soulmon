/* site-analytics tracker. Anonymous, no cookies, no localStorage.
   Session id lives only in sessionStorage (dies with the tab). Source: E:/Projetos/site-analytics/tracker/a.js */
(function () {
  'use strict';
  if (window.__sa) return; window.__sa = 1;
  var EP = 'https://site-analytics.mateus-sprnd.workers.dev/e';
  var MAXQ = 40;

  function rid() {
    try { if (crypto.randomUUID) return crypto.randomUUID().replace(/-/g, ''); } catch (e) {}
    var a = new Uint8Array(16); crypto.getRandomValues(a);
    return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }
  var sid;
  try { sid = sessionStorage.getItem('_sa_sid'); if (!sid) { sid = rid(); sessionStorage.setItem('_sa_sid', sid); } }
  catch (e) { sid = rid(); }

  function refHost() { try { return document.referrer ? new URL(document.referrer).host : ''; } catch (e) { return ''; } }
  var u = new URLSearchParams(location.search);
  var ctx, pv, q = [], timer = null;
  var seen, eng, visSince, maxPct, sentMax, sentEng;

  function startPage() {
    pv = rid();
    ctx = { sid: sid, pv: pv, path: location.pathname, ref: refHost(),
      us: u.get('utm_source') || '', um: u.get('utm_medium') || '', uc: u.get('utm_campaign') || '',
      vw: window.innerWidth || 0 };
    seen = {}; eng = 0; maxPct = 0; sentMax = -1; sentEng = -1;
    visSince = document.visibilityState === 'visible' ? Date.now() : 0;
    push('pageview', 'p', '', '', 0); flush();
    measureScroll();
  }

  function push(t, idSuffix, x, k, v) {
    q.push({ t: t, id: pv + ':' + idSuffix, x: String(x || '').slice(0, 200), k: k || '', v: +v || 0 });
    if (q.length >= MAXQ) flush(); else if (!timer) timer = setTimeout(flush, 3000);
  }
  function flush() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (!q.length) return;
    var body = JSON.stringify({ c: ctx, e: q.splice(0, MAXQ) });
    var ok = false;
    try { ok = navigator.sendBeacon(EP, new Blob([body], { type: 'text/plain' })); } catch (e) {}
    if (!ok) { try { fetch(EP, { method: 'POST', body: body, keepalive: true, mode: 'no-cors', credentials: 'omit' }); } catch (e) {} }
    if (q.length) flush();
  }

  // Scroll depth: milestones 25/50/75/100 sent as they are reached, max % sent when the page is hidden.
  function measureScroll() {
    var d = document.documentElement, h = Math.max(d.scrollHeight, document.body ? document.body.scrollHeight : 0);
    var pct = h <= window.innerHeight ? 100 : Math.round((window.scrollY + window.innerHeight) / h * 100);
    pct = Math.max(0, Math.min(100, pct));
    if (pct > maxPct) {
      [25, 50, 75, 100].forEach(function (m) { if (pct >= m && maxPct < m) push('scroll', 's' + m, '', '', m); });
      maxPct = pct;
    }
  }
  var ticking = false;
  addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { ticking = false; measureScroll(); });
  }, { passive: true });

  // Engaged time: only while visible. Cumulative per page view (server keeps the max, so re-sends are idempotent).
  function onHide() {
    if (visSince) { eng += Date.now() - visSince; visSince = 0; }
    var s = Math.round(eng / 1000);
    if (s !== sentEng) { push('engaged', 'e', '', '', s); sentEng = s; }
    if (maxPct !== sentMax) { push('scrollmax', 'm', '', '', maxPct); sentMax = maxPct; }
    flush();
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') onHide(); else if (!visSince) visSince = Date.now();
  });
  addEventListener('pagehide', onHide);
  addEventListener('pageshow', function (ev) { if (ev.persisted) startPage(); });

  // Clicks on links and buttons.
  document.addEventListener('click', function (ev) {
    var el = ev.target && ev.target.closest ? ev.target.closest('a[href],button,[role="button"],input[type="submit"]') : null;
    if (!el) return;
    var x, k;
    if (el.tagName === 'A') {
      var href = el.getAttribute('href') || '', a;
      try { a = new URL(href, location.href); } catch (e) { return; }
      if (a.protocol === 'mailto:') { k = 'mailto'; x = 'mailto'; }
      else if (a.protocol === 'tel:') { k = 'tel'; x = 'tel'; }
      else {
        var cv = el.hasAttribute('download') || /\.pdf$/i.test(a.pathname) || /(^|[\/_-])(cv|resume|curriculo)/i.test(a.pathname);
        var internal = a.host === location.host;
        k = cv ? 'cv' : internal ? 'internal' : 'external';
        x = internal ? a.pathname + a.hash : a.host + a.pathname;
      }
    } else {
      k = 'button';
      x = (el.getAttribute('aria-label') || el.getAttribute('data-sa') || el.textContent || el.value || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    }
    push('click', 'c' + rid().slice(0, 8), x, k, 0);
    if (el.tagName === 'A') flush(); // the page may be about to unload
  }, true);

  // Section reach: section[id] crossing the middle band of the viewport.
  function observeSections() {
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = (en.target.id || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 60);
        if (!id || seen[id]) return; seen[id] = 1;
        push('section', 'x' + id, id, '', 0);
      });
    }, { rootMargin: '-40% 0px -40% 0px' });
    document.querySelectorAll('section[id]').forEach(function (s) { io.observe(s); });
  }

  // Demo iframe interaction: focus moves into an iframe (a click inside it blurs the window).
  addEventListener('blur', function () {
    setTimeout(function () {
      var f = document.activeElement;
      if (f && f.tagName === 'IFRAME') {
        var src = f.getAttribute('src') || f.getAttribute('data-src') || '';
        try { src = new URL(src, location.href); src = src.host + src.pathname; } catch (e) {}
        push('iframe', 'f' + rid().slice(0, 8), src, '', 0); flush();
      }
    }, 0);
  });

  startPage();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observeSections); else observeSections();
})();
