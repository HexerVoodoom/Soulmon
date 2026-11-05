// JS inicial do site. GSAP só entra por import dinâmico, em ciclo.ts.
import { limparUtm } from '../../functions/_lib/utm.js'; // mesma allowlist do servidor
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];

const form = $<HTMLFormElement>('[data-form]');
const S = form ? JSON.parse(form.dataset.strings!) : null;

const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } };
const fraco = (nav.deviceMemory ?? 8) <= 2 || !!nav.connection?.saveData || /(^|-)2g$/.test(nav.connection?.effectiveType ?? '');

// Tudo que não é LCP espera o load: peças do ciclo, fonte de pixel, GSAP.
function depoisDoLoad(fn: () => void) {
  if (document.readyState === 'complete') setTimeout(fn, 0); else addEventListener('load', () => setTimeout(fn, 0), { once: true });
}

// ---------- Sprites: cada pixel do sprite ocupa um número inteiro de pixels de TELA ----------
// O tamanho em CSS px vira k * natural / devicePixelRatio. A caixa de layout não muda (a diferença
// vai para a margem), então nada ao redor se mexe. Se o espaço é menor que o sprite nativo, fica como está.
function ajustarSprites() {
  const imgs = $$<HTMLImageElement>('img.sprite');
  // em lote (zera tudo, mede tudo, grava tudo): uma única passagem de layout, não uma por imagem
  for (const img of imgs) { const st = img.style; st.width = st.height = st.marginTop = st.marginRight = st.marginBottom = st.marginLeft = ''; }
  const dpr = devicePixelRatio || 1;
  const plano = imgs.map((img) => {
    const n = Number(img.getAttribute('width')); // o atributo width é o tamanho nativo: não espera a imagem carregar
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

// ---------- Botão fixo: depois do hero, some quando o formulário está visível ----------
function botaoFixo() {
  const fixo = $('[data-fixo]'); const hero = $('.hero'); const alvo = $('.form-coluna');
  if (!fixo || !hero || !alvo) return;
  let passou = false; let formVisto = false; let naCena = false;
  // Na cena do ciclo o botão cobriria as tarefas em tela de 570 px; ela tem CTA próprio ao fim.
  const aplicar = () => { fixo.hidden = !passou || formVisto || naCena; };
  const palco = document.documentElement.classList.contains('ciclo-js') ? $('#ciclo') : null;
  if (palco) new IntersectionObserver(([x]) => { naCena = x.isIntersecting; aplicar(); }, { rootMargin: '-40% 0px -40% 0px' }).observe(palco);
  new IntersectionObserver(([x]) => { passou = !x.isIntersecting; aplicar(); }).observe(hero);
  new IntersectionObserver(([x]) => { formVisto = x.isIntersecting; aplicar(); }).observe(alvo);
}

// ---------- Estado da leva (PLANO §17): sem contador, só troca o texto ----------
function vagas() {
  const slot = $('[data-vagas]'); if (!slot || !form) return;
  const buscar = async () => {
    const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 6000);
    try {
      const r = await fetch('/api/vagas', { signal: ctl.signal, cache: 'no-store', headers: { accept: 'application/json' } });
      if (!r.ok) return;
      const d = await r.json();
      if (d.estado !== 'espera') return; // abertas: vale o texto fixo da regra
      slot.textContent = S.espera; slot.hidden = false;
      $('[data-enviar]')!.textContent = S.enviarEspera;
      const micro = $('[data-micro]'); if (micro) micro.textContent = S.microCompleta;
    } catch { /* falhou: fica o texto fixo e o CTA */ } finally { clearTimeout(to); }
  };
  depoisDoLoad(buscar); // no carregamento, sem bloquear o primeiro conteúdo
}

// ---------- Turnstile, render explícito, só perto do formulário ----------
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
        sitekey, action: 'inscrever', theme: 'dark', language: form.dataset.idioma === 'en' ? 'en' : 'pt-br', size: 'flexible',
        callback: (tk: string) => { tsToken = tk; },
        'expired-callback': () => { tsToken = ''; },
        'error-callback': () => { tsToken = ''; contatoErro(); },
      });
    };
    document.head.append(sc);
  }, '300px');
}
function resetTs() { tsToken = ''; (window as unknown as { turnstile?: TS }).turnstile?.reset(tsId); }

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

function formulario() {
  if (!form) return;
  const email = form.elements.namedItem('email') as HTMLInputElement;
  const erro = $('[data-erro]')!; const btn = $<HTMLButtonElement>('[data-enviar]')!;
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (btn.getAttribute('aria-busy') === 'true') return;
    erro.hidden = true; email.removeAttribute('aria-invalid');
    const val = email.value.trim();
    const ch = (n: string) => (form.elements.namedItem(n) as HTMLInputElement).checked;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { email.setAttribute('aria-invalid', 'true'); mostrarErro(S.erros.email); email.focus(); return; }
    if (!ch('aceitePrivacidade') || !ch('maior18')) { mostrarErro(S.erros.aceite); return; }
    if (!form.dataset.sitekey) { mostrarErro(S.erros.ts, true); return; }
    if (!tsToken) { mostrarErro(S.erros.verificando); return; }
    const rotulo = btn.textContent; btn.textContent = S.enviando; btn.setAttribute('aria-busy', 'true');
    try {
      const r = await postar({
        email: val, idioma: form.dataset.idioma, aceitePrivacidade: true, maior18: true, novidades: ch('novidades'),
        turnstile: tsToken, site: (form.elements.namedItem('site') as HTMLInputElement).value, utm: utm(),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.ok) {
        form.hidden = true; $('.aviso-vaga')!.hidden = true;
        const ok = $('[data-sucesso]')!; ok.hidden = false; ok.focus();
        return;
      }
      if (r.status === 400 && d.erro === 'email') { email.setAttribute('aria-invalid', 'true'); mostrarErro(S.erros.email); email.focus(); }
      else if (r.status === 400 && d.erro === 'aceite') mostrarErro(S.erros.aceite);
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

// ---------- Compartilhar ----------
function partilha() {
  const sh = $('[data-share]'); const cp = $('[data-copiar]'); const msg = $('[data-partilha-msg]');
  if (!cp || !msg) return;
  const url = location.origin + location.pathname;
  if (navigator.share && sh) {
    sh.hidden = false;
    sh.addEventListener('click', () => { navigator.share({ title: 'Soulmon', text: S.shareTxt, url }).catch(() => {}); });
  }
  cp.hidden = false;
  cp.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(url); msg.textContent = S.copiado; }
    catch { msg.textContent = `${S.falhaCopia} ${url}`; }
  });
}

// ---------- Seletor de elementos: sem JS, os quatro visores ficam empilhados ----------
function elementos() {
  const raiz = $('[data-elementos]'); const sel = $('[data-seletor]');
  if (!raiz || !sel) return;
  raiz.classList.add('com-js'); sel.hidden = false;
  const ver = (id: string) => {
    $$('.elemento', raiz).forEach((f) => { f.hidden = f.dataset.el !== id; });
    $$('button', sel).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ver === id)));
    ajustarSprites();
  };
  ver($$('.elemento', raiz)[0].dataset.el!);
  sel.addEventListener('click', (e) => { const b = (e.target as Element).closest<HTMLElement>('button'); if (b) ver(b.dataset.ver!); });
}

// ---------- Ciclo ----------
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

// utm_content: troca só a frase de apoio, por allowlist. O H1 é fixo.
const angulo = new URLSearchParams(location.search).get('utm_content');
if (S && angulo && Object.hasOwn(S.angulos, angulo)) { const ap = $('.apoio'); if (ap) ap.textContent = S.angulos[angulo]; }

botaoFixo(); vagas(); formulario(); turnstile(); partilha(); elementos(); ciclo();
ajustarSprites();
depoisDoLoad(() => {
  document.documentElement.classList.add('tarde');
  $$<HTMLImageElement>('img[data-tarde-src]').forEach((i) => { i.src = i.dataset.tardeSrc!; });
  ajustarSprites();
});
