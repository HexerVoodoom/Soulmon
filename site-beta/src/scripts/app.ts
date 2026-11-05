// JS inicial do site. GSAP só entra por import dinâmico, em ciclo.ts e mundo.ts.
import { limparUtm } from '../../functions/_lib/utm.js'; // mesma allowlist do servidor
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];

const form = $<HTMLFormElement>('[data-form]');
const S = form ? JSON.parse(form.dataset.strings!) : null;

const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } };
const fraco = (nav.deviceMemory ?? 8) <= 2 || !!nav.connection?.saveData || /(^|-)2g$/.test(nav.connection?.effectiveType ?? '');

// Tudo que não é LCP espera o load: peças do ciclo, GSAP.
function depoisDoLoad(fn: () => void) {
  if (document.readyState === 'complete') setTimeout(fn, 0); else addEventListener('load', () => setTimeout(fn, 0), { once: true });
}

// ---------- Sprites: cada pixel do sprite ocupa um número inteiro de pixels de TELA ----------
// O tamanho em CSS px vira k * natural / devicePixelRatio. A caixa de layout não muda (a diferença
// vai para a margem), então nada ao redor se mexe. Se o espaço é menor que o sprite nativo, fica como está.
function ajustarSprites() {
  const imgs = $$<HTMLImageElement>('img.sprite');
  for (const img of imgs) { const st = img.style; st.width = st.height = st.marginTop = st.marginRight = st.marginBottom = st.marginLeft = ''; }
  const dpr = devicePixelRatio || 1;
  const plano = imgs.map((img) => {
    if (img.closest('.disco-caixa, .cena')) return null; // posicionados em absoluto: a caixa manda
    const n = Number(img.getAttribute('width'));
    const cs = getComputedStyle(img);
    const w = img.getBoundingClientRect().width || (cs.width.endsWith('px') ? parseFloat(cs.width) : 0);
    if (!n || !w || w * dpr < n) return null;
    const alvo = Math.round((w * dpr) / n) * n / dpr;
    if (Math.abs(alvo - w) < 0.01) return null;
    const d = (w - alvo) / 2;
    return { img, alvo, mt: parseFloat(cs.marginTop) + d, mb: parseFloat(cs.marginBottom) + d, ml: parseFloat(cs.marginLeft) + d, mr: parseFloat(cs.marginRight) + d };
  });
  for (const p of plano) {
    if (!p) continue;
    const st = p.img.style;
    st.width = st.height = p.alvo + 'px';
    st.marginTop = p.mt + 'px'; st.marginBottom = p.mb + 'px'; st.marginLeft = p.ml + 'px'; st.marginRight = p.mr + 'px';
  }
}
let tRes = 0;
addEventListener('resize', () => { clearTimeout(tRes); tRes = window.setTimeout(ajustarSprites, 120); });

function quandoVisivel(el: Element | null, fn: () => void, margem = '0px') {
  if (!el) return;
  const io = new IntersectionObserver((es) => {
    if (es.some((x) => x.isIntersecting)) { io.disconnect(); fn(); }
  }, { rootMargin: margem });
  io.observe(el);
}

// ---------- Barra lateral: progresso da página, só transform ----------
function barra() {
  const cheio = $('[data-barra-cheio]'); const nos = $$('[data-no]');
  if (!cheio) return;
  let pedido = 0;
  const aplicar = () => {
    pedido = 0;
    const total = document.documentElement.scrollHeight - innerHeight;
    const p = total > 0 ? Math.min(1, scrollY / total) : 0;
    cheio.style.transform = `scaleY(${p})`;
    nos.forEach((n, i) => n.classList.toggle('aceso', p >= i / (nos.length - 1) - 0.001));
  };
  addEventListener('scroll', () => { if (!pedido) pedido = requestAnimationFrame(aplicar); }, { passive: true });
  addEventListener('resize', aplicar);
  depoisDoLoad(aplicar);
}

// ---------- Botão fixo: depois do hero, some quando o formulário está visível ----------
function botaoFixo() {
  const fixo = $('[data-fixo]'); const hero = $('.hero'); const alvo = $('#inscrever');
  if (!fixo || !hero || !alvo) return;
  let passou = false; let formVisto = false; let naCena = false;
  const aplicar = () => { fixo.hidden = !passou || formVisto || naCena; };
  const palco = document.documentElement.classList.contains('ciclo-js') ? $('#ciclo') : null;
  if (palco) new IntersectionObserver(([x]) => { naCena = x.isIntersecting; aplicar(); }, { rootMargin: '-40% 0px -40% 0px' }).observe(palco);
  new IntersectionObserver(([x]) => { passou = !x.isIntersecting; aplicar(); }).observe(hero);
  new IntersectionObserver(([x]) => { formVisto = x.isIntersecting; aplicar(); }).observe(alvo);
}

// ---------- Estado da rodada (LEVA_ESTADO): sem contador, só troca o texto ----------
let estadoLeva: 'abertas' | 'espera' = 'abertas';
async function lerEstado() {
  const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 4000);
  try {
    const r = await fetch('/api/vagas', { signal: ctl.signal, cache: 'no-store', headers: { accept: 'application/json' } });
    if (r.ok) estadoLeva = (await r.json()).estado === 'espera' ? 'espera' : 'abertas';
  } catch { /* falhou: fica o último estado conhecido */ } finally { clearTimeout(to); }
}
function vagas() {
  const slot = $('[data-vagas]'); if (!slot || !form) return;
  depoisDoLoad(async () => {
    await lerEstado();
    if (estadoLeva !== 'espera') return;
    slot.hidden = false;
    const micro = $('[data-micro]'); if (micro) micro.textContent = S.microCompleta;
  });
}

// ---------- Turnstile discreto: só aparece se precisar de interação ----------
type TS = { render: (el: Element, o: Record<string, unknown>) => string; reset: (id?: string) => void };
let tsToken = ''; let tsId: string | undefined;
function turnstile() {
  if (!form) return;
  const sitekey = form.dataset.sitekey; const el = $('#turnstile')!;
  const contatoErro = () => mostrarErro(S.erros.ts, true);
  if (!sitekey) return;
  quandoVisivel(form, () => {
    const sc = document.createElement('script');
    sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    sc.async = true;
    sc.onerror = contatoErro;
    sc.onload = () => {
      const ts = (window as unknown as { turnstile: TS }).turnstile;
      tsId = ts.render(el, {
        sitekey, action: 'inscrever', theme: 'dark', language: form.dataset.idioma === 'en' ? 'en' : 'pt-br', size: 'flexible', appearance: 'interaction-only',
        callback: (tk: string) => { tsToken = tk; },
        'expired-callback': () => { tsToken = ''; },
        'error-callback': () => { tsToken = ''; contatoErro(); },
      });
    };
    document.head.append(sc);
  }, '300px');
}
function resetTs() { tsToken = ''; (window as unknown as { turnstile?: TS }).turnstile?.reset(tsId); }
// A verificação invisível pode ainda estar rodando quando a pessoa toca no botão: espera um pouco.
async function esperarToken(ms = 8000) {
  const fim = Date.now() + ms;
  while (!tsToken && Date.now() < fim) await new Promise((r) => setTimeout(r, 150));
  return tsToken;
}

// ---------- Formulário ----------
function mostrarErro(msg: string, comContato = false) {
  const el = $('[data-erro]')!; el.textContent = msg;
  if (comContato) {
    const a = document.createElement('a'); a.href = `mailto:${S.contato}`; a.textContent = S.contato;
    el.append(' ', a);
  }
  el.hidden = false;
}

function utm() {
  const q = new URLSearchParams(location.search);
  const limpo = limparUtm({ source: q.get('utm_source'), medium: q.get('utm_medium'), campaign: q.get('utm_campaign') });
  return Object.fromEntries(Object.entries(limpo).filter(([, v]) => v !== null));
}

async function postar(corpo: unknown) {
  // rede hostil: 12 s por tentativa, uma nova tentativa só em falha de rede
  for (let i = 0; ; i++) {
    const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 12000);
    try {
      return await fetch('/api/inscrever', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(corpo), signal: ctl.signal });
    } catch (err) {
      if (i >= 1) throw err;
      await new Promise((r) => setTimeout(r, 1500));
    } finally { clearTimeout(to); }
  }
}

function abrirPopup(espera: boolean, foco: HTMLElement) {
  const d = $<HTMLDialogElement>('[data-popup]')!;
  $('[data-popup-h]')!.textContent = espera ? S.esperaH : S.okH;
  $('[data-popup-p]')!.textContent = espera ? S.espera : S.ok;
  d.addEventListener('close', () => foco.focus(), { once: true });
  d.showModal(); // prende o foco, fecha com Esc
  $<HTMLButtonElement>('[data-popup-fechar]')!.focus();
}

function formulario() {
  if (!form) return;
  const email = form.elements.namedItem('email') as HTMLInputElement;
  const erro = $('[data-erro]')!; const btn = $<HTMLButtonElement>('[data-enviar]')!; const feito = $('[data-feito]')!;
  const d = $<HTMLDialogElement>('[data-popup]')!;
  $('[data-popup-fechar]')!.addEventListener('click', () => d.close());
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (btn.getAttribute('aria-busy') === 'true') return;
    erro.hidden = true; email.removeAttribute('aria-invalid');
    const val = email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { email.setAttribute('aria-invalid', 'true'); mostrarErro(S.erros.email); email.focus(); return; }
    if (!form.dataset.sitekey) { mostrarErro(S.erros.ts, true); return; }
    const rotulo = btn.textContent; btn.textContent = S.enviando; btn.setAttribute('aria-busy', 'true');
    try {
      if (!(await esperarToken())) { mostrarErro(S.erros.verificando); return; }
      // Tocar no botão, com a linha legal à vista, é o aceite (PLANO §18).
      const r = await postar({
        email: val, idioma: form.dataset.idioma, aceitePrivacidade: true, maior18: true, novidades: false,
        turnstile: tsToken, site: (form.elements.namedItem('site') as HTMLInputElement).value, utm: utm(),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) {
        await lerEstado(); // o pop-up nunca promete 24 h com a rodada fechada
        form.reset(); resetTs(); feito.textContent = S.feito; feito.hidden = false;
        abrirPopup(estadoLeva === 'espera', btn);
        return;
      }
      if (r.status === 400 && j.erro === 'email') { email.setAttribute('aria-invalid', 'true'); mostrarErro(S.erros.email); email.focus(); }
      else if (r.status === 400) mostrarErro(S.erros.corpo);
      else if (r.status === 403) { resetTs(); mostrarErro(S.erros.turnstile); }
      else if (r.status === 429) mostrarErro(S.erros.limite);
      else mostrarErro(S.erros.indisponivel, true);
      if (r.status !== 403) resetTs();
    } catch {
      mostrarErro(S.erros.rede);
    } finally {
      btn.textContent = rotulo; btn.removeAttribute('aria-busy');
    }
  });
}

// ---------- Abas do universo: padrão ARIA tabs. Sem JS, os painéis ficam empilhados ----------
function abas() {
  const lista = $('[data-abas]'); if (!lista) return;
  const bts = $$<HTMLButtonElement>('[data-aba]', lista); const pns = $$('[data-painel]');
  lista.hidden = false;
  lista.setAttribute('role', 'tablist'); lista.setAttribute('aria-label', lista.dataset.rotulo!);
  pns.forEach((p, i) => { p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', `aba-${i}`); p.tabIndex = 0; p.querySelector('.painel-h')?.setAttribute('hidden', ''); });
  const ver = (n: number, foco = false) => {
    bts.forEach((b, i) => { const a = i === n; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(a)); b.setAttribute('aria-controls', `painel-${i}`); b.tabIndex = a ? 0 : -1; });
    pns.forEach((p, i) => { p.hidden = i !== n; });
    if (foco) bts[n].focus();
    ajustarSprites();
  };
  lista.addEventListener('click', (e) => { const b = (e.target as Element).closest<HTMLElement>('[data-aba]'); if (b) ver(Number(b.dataset.aba)); });
  lista.addEventListener('keydown', (e) => {
    const k = (e as KeyboardEvent).key; const atual = bts.findIndex((b) => b.tabIndex === 0); const n = bts.length;
    const alvo = k === 'ArrowRight' ? (atual + 1) % n : k === 'ArrowLeft' ? (atual - 1 + n) % n : k === 'Home' ? 0 : k === 'End' ? n - 1 : -1;
    if (alvo >= 0) { e.preventDefault(); ver(alvo, true); }
  });
  ver(0);
}

// ---------- Vídeo da abertura: poster só perto da tela, sem som automático ----------
function abertura() {
  const v = $<HTMLVideoElement>('[data-abertura]'); if (!v) return;
  quandoVisivel(v, () => { v.poster = v.dataset.poster!; }, '400px');
}

// ---------- Cenas com scroll ----------
function ciclo() {
  if (reduzido || !S) return; // lista estática
  depoisDoLoad(() => quandoVisivel($('#ciclo'), () => {
    import('./ciclo').then((m) => m.iniciar(S, fraco)).catch(() => {});
  }, '100% 0px'));
}
if (!reduzido && $('#ciclo')) {
  // já troca para a cena antes de o ciclo aparecer, para não piscar a lista
  document.documentElement.classList.add('ciclo-js');
  $('[data-cena]')!.hidden = false;
}
const comParallax = !reduzido && !fraco && innerHeight >= 560;
if (comParallax && $('#mundo')) document.documentElement.classList.add('mundo-js');
function mundo() {
  if (!comParallax) return;
  const voltar = () => document.documentElement.classList.remove('mundo-js');
  depoisDoLoad(() => quandoVisivel($('#mundo'), () => {
    import('./mundo').then((m) => m.iniciar()).catch(voltar);
  }, '150% 0px'));
}

// ---------- Compartilhar ----------
function partilha() {
  const sh = $('[data-share]'); const cp = $('[data-copiar]'); const msg = $('[data-partilha-msg]');
  if (!cp || !msg) return;
  const url = location.origin + location.pathname;
  if (typeof navigator.share === 'function' && sh) {
    sh.hidden = false;
    sh.addEventListener('click', () => { navigator.share({ title: 'Soulmon', text: S.share, url }).catch(() => {}); });
  }
  cp.hidden = false;
  cp.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(url); msg.textContent = S.copiado; }
    catch { msg.textContent = `${S.falhaCopia} ${url}`; }
  });
}

// ---------- Âncoras: salto direto e corrigido até a posição estabilizar (seções abaixo renderizam na hora) ----------
function ancoras() {
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest?.<HTMLAnchorElement>('a[href^="#"]');
    const alvo = a && document.getElementById(a.hash.slice(1));
    if (!alvo) return;
    e.preventDefault();
    let n = 0;
    const passo = () => { alvo.scrollIntoView({ block: 'start', behavior: 'instant' as ScrollBehavior }); if (++n < 8) requestAnimationFrame(passo); else { alvo.setAttribute('tabindex', '-1'); alvo.focus({ preventScroll: true }); } };
    passo();
    history.replaceState(null, '', a.hash);
  });
}

// Só com JS: sem ele, o form faria GET com o e-mail na URL.
if (form) form.hidden = false;
$('[data-barra]')?.removeAttribute('hidden');
$('[data-abertura]')?.removeAttribute('hidden');
ancoras(); partilha(); barra(); botaoFixo(); vagas(); formulario(); turnstile(); abas(); abertura(); ciclo(); mundo();
ajustarSprites();
depoisDoLoad(() => {
  document.documentElement.classList.add('tarde');
  $$<HTMLImageElement>('img[data-tarde-src]').forEach((i) => { i.src = i.dataset.tardeSrc!; });
  ajustarSprites();
});
