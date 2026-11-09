// JS inicial do site. GSAP só entra por import dinâmico, em ciclo.ts.
import { proximoSorteio } from '../lib/sorteio';
import { limparUtm } from '../../functions/_lib/utm.js'; // mesma allowlist do servidor
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];

const form = $<HTMLFormElement>('[data-form]');
const S = form ? JSON.parse(form.dataset.strings!) : null;

const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } };
const poupar = !!nav.connection?.saveData;
const fraco = (nav.deviceMemory ?? 8) <= 2 || poupar || /(^|-)2g$/.test(nav.connection?.effectiveType ?? '');

// Tudo que não é LCP espera o load: elenco, peças do ciclo, GSAP.
// Espera também o primeiro quadro pintado depois do load (dois rAF): o elenco e os mapas de baixo nunca entram na janela do LCP.
// O load pode vir antes do primeiro conteúdo pintado; por isso espera os dois (com teto de 3 s).
let fcp: Promise<void> | null = null;
function primeiroConteudo() {
  if (fcp) return fcp;
  fcp = new Promise<void>((ok) => {
    if (performance.getEntriesByName('first-contentful-paint').length) { ok(); return; }
    const t = setTimeout(ok, 3000);
    try { new PerformanceObserver((l, o) => { if (l.getEntriesByName('first-contentful-paint').length) { o.disconnect(); clearTimeout(t); ok(); } }).observe({ type: 'paint', buffered: true }); } catch { clearTimeout(t); ok(); }
  });
  return fcp;
}
function depoisDoLoad(fn: () => void) {
  const pintado = () => primeiroConteudo().then(() => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(fn, 0))));
  if (document.readyState === 'complete') pintado(); else addEventListener('load', pintado, { once: true });
}

// ---------- Sprites em fluxo: cada pixel do arquivo ocupa um número inteiro de pixels de TELA ----------
// A caixa de layout não muda (a diferença vai para a margem). Sprites posicionados (elenco, disco, ficha) ficam no tamanho do token.
function ajustarSprites() {
  const imgs = $$<HTMLImageElement>('img.sprite').filter((i) => !i.closest('.cria, .disco-caixa, .ficha-palco, .no, .passo-arte, .chip, .sorteio-palco, .npc-modal'));
  for (const img of imgs) { const st = img.style; st.width = st.height = st.marginTop = st.marginRight = st.marginBottom = st.marginLeft = ''; }
  const dpr = devicePixelRatio || 1;
  const plano = imgs.map((img) => {
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
let tRes = 0; let iniciado = false;
addEventListener('resize', () => { clearTimeout(tRes); tRes = window.setTimeout(ajustarSprites, 120); });

function quandoVisivel(el: Element | null, fn: () => void, margem = '0px') {
  if (!el) return;
  const io = new IntersectionObserver((es) => {
    if (es.some((x) => x.isIntersecting)) { io.disconnect(); fn(); }
  }, { rootMargin: margem });
  io.observe(el);
}

// ---------- Barra superior, CTA compacto e CTA fixo ----------
function topoECta() {
  const topo = $('[data-topo]'); const hero = $('.hero'); const heroCta = $('[data-hero-cta]');
  const compacto = $('[data-topo-cta]'); const fixo = $('[data-fixo]'); const alvo = $('#inscricao') ?? $('#inscrever'); // o formulário em si, não a seção
  if (!topo || !hero || !heroCta || !alvo) return;
  let heroFora = false; let ctaFora = false; let formVisto = false; let teclado = false; let popup = false; let naDemo = false;
  const aplicar = () => {
    topo.classList.toggle('rolada', heroFora);
    if (compacto) compacto.hidden = !ctaFora || formVisto;
    if (fixo) fixo.hidden = !ctaFora || formVisto || teclado || popup || naDemo;
  };
  new IntersectionObserver(([x]) => { heroFora = x.intersectionRatio < 0.2; aplicar(); }, { threshold: [0, 0.2, 1] }).observe(hero);
  new IntersectionObserver(([x]) => { ctaFora = !x.isIntersecting; aplicar(); }).observe(heroCta);
  new IntersectionObserver(([x]) => { formVisto = x.isIntersecting; aplicar(); }, { rootMargin: '0px 0px -10% 0px' }).observe(alvo);
  // A lista da demo fica no meio da tela durante o pin: o CTA fixo não pode cobrir as caixinhas.
  if (document.documentElement.classList.contains('ciclo-js')) new IntersectionObserver(([x]) => { naDemo = x.isIntersecting; aplicar(); }, { rootMargin: '-45% 0px -45% 0px' }).observe($('#ciclo')!);
  const vv = window.visualViewport;
  if (vv) { const alto = innerHeight; vv.addEventListener('resize', () => { teclado = vv.height < alto * 0.75; aplicar(); }); }
  const d = $<HTMLDialogElement>('[data-popup]');
  if (d) new MutationObserver(() => { popup = d.open; aplicar(); }).observe(d, { attributes: true, attributeFilter: ['open'] });
}

// ---------- Estado da rodada (LEVA_ESTADO): sem contador, só troca o texto ----------
let estadoLeva: 'abertas' | 'espera' = 'abertas';
async function lerEstado() {
  const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 4000);
  try {
    const r = await fetch('/api/vagas', { signal: ctl.signal, cache: 'no-store', headers: { accept: 'application/json' } });
    if (r.ok) estadoLeva = (await r.json()).estado === 'espera' ? 'espera' : 'abertas';
  } catch { /* falhou: fica o último estado conhecido (abertas) e o texto da regra */ } finally { clearTimeout(to); }
}
function vagas() {
  const slot = $('[data-vagas]'); if (!slot || !form) return;
  depoisDoLoad(async () => {
    await lerEstado();
    if (estadoLeva !== 'espera') return;
    slot.hidden = false;
    const linha = $('[data-vagas-linha]'); if (linha) { linha.textContent = S.vagasEspera; linha.classList.add('espera'); }
    $$('[data-cta]').forEach((a) => { a.textContent = S.ctaEspera; });
    const tx = $('[data-enviar-tx]'); if (tx) tx.textContent = S.enviarEspera;
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
function mostrarErro(msg: string, comContato = false, info = false) {
  const el = $('[data-erro]')!; el.textContent = msg;
  el.classList.toggle('info', info);
  el.setAttribute('role', 'alert');
  if (comContato) {
    const a = document.createElement('a'); a.href = `mailto:${S.contato}`; a.textContent = S.contato;
    el.append(' ', a);
  }
  el.hidden = false;
  const email = $<HTMLInputElement>('#email');
  if (email && !info) email.setAttribute('aria-describedby', 'email-dica email-erro');
}

function utm() {
  const q = new URLSearchParams(location.search);
  const limpo = limparUtm({ source: q.get('utm_source'), medium: q.get('utm_medium'), campaign: q.get('utm_campaign') });
  return Object.fromEntries(Object.entries(limpo).filter(([, v]) => v !== null));
}

async function postar(corpo: unknown) {
  // rede hostil: 12 s por tentativa, uma nova tentativa só em falha de rede, com recuo
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

// ---------- Compartilhar: Web Share; sem ela, copia o link; sem cópia, mostra o link ----------
async function compartilhar(msg: HTMLElement) {
  const url = location.origin + location.pathname;
  if (typeof navigator.share === 'function') {
    try { await navigator.share({ title: 'Soulmon', text: S.share, url }); return; } catch (e) { if ((e as Error).name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(url); msg.textContent = S.copiado; }
  catch { msg.textContent = `${S.falhaCopia} ${url}`; }
}

function abrirPopup(espera: boolean, foco: HTMLElement) {
  const d = $<HTMLDialogElement>('[data-popup]')!;
  $('[data-popup-h]')!.textContent = espera ? S.esperaH : S.okH;
  $('[data-popup-p]')!.textContent = espera ? S.espera : S.ok;
  $('[data-popup-msg]')!.textContent = '';
  d.addEventListener('close', () => foco.focus(), { once: true });
  d.showModal(); // prende o foco, fecha com Esc
  $<HTMLButtonElement>('[data-popup-share]')!.focus();
}

function formulario() {
  if (!form) return;
  const email = form.elements.namedItem('email') as HTMLInputElement;
  const erro = $('[data-erro]')!; const btn = $<HTMLButtonElement>('[data-enviar]')!; const btnTx = $('[data-enviar-tx]')!; const feito = $('[data-feito]')!;
  const d = $<HTMLDialogElement>('[data-popup]')!;
  $('[data-popup-fechar]')!.addEventListener('click', () => d.close());
  $('[data-popup-share]')!.addEventListener('click', () => compartilhar($('[data-popup-msg]')!));
  d.addEventListener('click', (e) => { if (e.target === d) { const r = d.getBoundingClientRect(); const ev = e as MouseEvent; if (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom) d.close(); } });
  let enviado = false;
  const validar = (v: string) => (!v ? S.erros.vazio : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : S.erros.email);
  const limpar = () => { erro.hidden = true; erro.removeAttribute('role'); email.removeAttribute('aria-invalid'); email.setAttribute('aria-describedby', 'email-dica'); };
  // Depois do primeiro envio, valida a cada saída do campo; nunca a cada tecla.
  email.addEventListener('blur', () => { if (!enviado) return; const m = validar(email.value.trim()); if (m) { email.setAttribute('aria-invalid', 'true'); mostrarErro(m); } else limpar(); });
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (btn.getAttribute('aria-busy') === 'true') return;
    enviado = true; limpar();
    const val = email.value.trim();
    const m = validar(val);
    if (m) { email.setAttribute('aria-invalid', 'true'); mostrarErro(m); email.focus(); return; }
    if (!form.dataset.sitekey) { mostrarErro(S.erros.ts, true); return; }
    const rotulo = btnTx.textContent; btn.style.width = btn.offsetWidth + 'px';
    btnTx.textContent = S.enviando; btn.setAttribute('aria-busy', 'true'); email.readOnly = true;
    try {
      if (!(await esperarToken())) { mostrarErro(S.erros.verificando); return; }
      // Tocar no botão, com a linha legal à vista, é o aceite (PLANO §18).
      const r = await postar({
        email: val, idioma: form.dataset.idioma, aceitePrivacidade: true, maior18: true,
        turnstile: tsToken, site: (form.elements.namedItem('site') as HTMLInputElement).value, utm: utm(),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) {
        await lerEstado(); // o pop-up nunca promete 24 h com a rodada fechada
        form.reset(); resetTs(); form.hidden = true; feito.hidden = false;
        const sh = $('[data-share]'); if (sh) sh.hidden = false; // compartilhar no fecho só depois da inscrição
        abrirPopup(estadoLeva === 'espera', feito);
        return;
      }
      if (r.status === 400 && j.erro === 'email') { email.setAttribute('aria-invalid', 'true'); mostrarErro(S.erros.email); email.focus(); }
      else if (r.status === 400) mostrarErro(S.erros.corpo);
      else if (r.status === 403) { resetTs(); mostrarErro(S.erros.turnstile); }
      else if (r.status === 429) mostrarErro(S.erros.limite);
      else mostrarErro(S.erros.indisponivel, true);
      if (r.status !== 403) resetTs();
    } catch {
      mostrarErro(S.erros.rede); email.focus();
    } finally {
      btnTx.textContent = rotulo; btn.removeAttribute('aria-busy'); btn.style.width = ''; email.readOnly = false;
    }
  });
}

// ---------- Abas do universo: padrão ARIA tabs, ativação automática. Sem JS, os painéis ficam empilhados ----------
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
    if (iniciado) requestAnimationFrame(ajustarSprites);
  };
  lista.addEventListener('click', (e) => { const b = (e.target as Element).closest<HTMLElement>('[data-aba]'); if (b) ver(Number(b.dataset.aba)); });
  lista.addEventListener('keydown', (e) => {
    const k = (e as KeyboardEvent).key; const atual = bts.findIndex((b) => b.tabIndex === 0); const n = bts.length;
    const alvo = k === 'ArrowRight' ? (atual + 1) % n : k === 'ArrowLeft' ? (atual - 1 + n) % n : k === 'Home' ? 0 : k === 'End' ? n - 1 : -1;
    if (alvo >= 0) { e.preventDefault(); ver(alvo, true); }
  });
  ver(0);
}

// ---------- Sorteio: um botão, um Soulmon aleatório do elenco elegível, nunca o mesmo duas vezes seguidas. Sem GSAP, sem giro ----------
function sorteio() {
  const raiz = $('[data-sorteio]'); if (!raiz) return;
  const pool = JSON.parse(raiz.dataset.pool!) as [string, string, number][];
  const els = JSON.parse(raiz.dataset.els!) as Record<string, string>;
  const bt = $<HTMLButtonElement>('[data-sortear]', raiz)!; const img = $<HTMLImageElement>('[data-sort-img]', raiz)!;
  const sombra = $('[data-sort-sombra]', raiz)!; const info = $('[data-sort-info]', raiz)!;
  bt.hidden = false;
  let ant = -1;
  bt.addEventListener('click', () => {
    const i = proximoSorteio(pool.length, ant); ant = i;
    const [id, el, forma] = pool[i];
    const nome = el.split(',').map((e) => els[e] ?? e).join(' + ');
    // Duas linhas (pedido do dono, 09/11): elemento com o ícone dele; forma com o ícone dela (PROVISÓRIO: .ico-forma vazio até o anexo).
    const nomesF = JSON.parse(raiz.dataset.nomes!) as string[];
    const nomeForma = forma ? nomesF[forma - 1] ?? '' : '';
    const pronto = () => {
      img.alt = `${raiz.dataset.alt} ${nome}${nomeForma ? `, ${nomeForma}` : ''}`;
      img.hidden = false; sombra.hidden = true;
      info.replaceChildren();
      const l1 = document.createElement('span'); l1.className = 'sort-linha';
      for (const e of el.split(',')) { const ic = document.createElement('img'); ic.src = `${raiz.dataset.elBase}${e}.webp`; ic.width = ic.height = 32; ic.alt = ''; ic.className = 'ico-el'; l1.append(ic); }
      l1.append(nome); info.append(l1);
      if (nomeForma) { const l2 = document.createElement('span'); l2.className = 'sort-linha'; const ic = document.createElement('span'); ic.className = 'ico-forma'; ic.dataset.forma = ['rookie', 'champion', 'ultimate', 'mega', 'ultra'][forma - 1]; l2.append(ic, nomeForma); info.append(l2); }
      raiz.scrollIntoView({ block: 'nearest', behavior: reduzido ? 'auto' : 'smooth' });
      if (!reduzido) { img.classList.remove('surge'); void img.offsetWidth; img.classList.add('surge'); }
    };
    const novo = new Image(); novo.onload = () => { img.src = novo.src; pronto(); }; novo.onerror = pronto;
    novo.src = `${raiz.dataset.base}${id}.webp`;
  });
}

// ---------- Árvore: seletor de linha (Planta, Fada, Fogo). Sem JS, as três aparecem empilhadas ----------
function linhasArvore() {
  const arvores = $$('ol.arvore[data-linha]'); const ant = $<HTMLButtonElement>('[data-linha-ant]'); const prox = $<HTMLButtonElement>('[data-linha-prox]');
  if (!arvores.length || !ant || !prox) return;
  ant.hidden = prox.hidden = false;
  let n = 0;
  const ver = (k: number) => { n = (k + arvores.length) % arvores.length; arvores.forEach((x, i) => { x.hidden = i !== n; }); if (iniciado) requestAnimationFrame(ajustarSprites); };
  ant.addEventListener('click', () => ver(n - 1)); prox.addEventListener('click', () => ver(n + 1));
  ver(0);
}
// ---------- Modal do NPC (Universo e Habitantes): <dialog> nativo prende o foco e fecha com Esc; o foco volta ao botão que abriu ----------
function modalNpc() {
  const d = $<HTMLDialogElement>('[data-npc-modal]'); if (!d) return;
  const falas = JSON.parse(d.dataset.falas!) as Record<string, { fala: string; habita: string; npc: string }>;
  const img = $<HTMLImageElement>('[data-npc-img]', d)!; const h = $('[data-npc-h]', d)!; const p = $('[data-npc-p]', d)!;
  let origem: HTMLElement | null = null;
  const abrir = (bt: HTMLElement, habita: boolean) => {
    const f = falas[bt.dataset.lugar!]; if (!f) return;
    origem = bt;
    img.src = habita && bt.dataset.npc ? bt.dataset.npc : f.npc;
    const lugar = (bt.querySelector('strong')?.textContent ?? bt.getAttribute('aria-label')?.split(': ').pop() ?? '').trim();
    h.textContent = habita ? `${d.dataset.morador} · ${lugar}` : lugar;
    p.textContent = habita ? f.habita : f.fala;
    d.showModal();
    $<HTMLButtonElement>('[data-npc-fechar]', d)!.focus();
  };
  document.addEventListener('click', (e) => {
    const bt = (e.target as Element).closest<HTMLElement>('.area-bt, .npc-bt'); if (!bt) return;
    const jm = $<HTMLDialogElement>('[data-jogos-modal]');
    if (bt.dataset.lugar === 'jogos' && jm && !bt.classList.contains('npc-bt')) {
      origem = bt; jm.showModal(); $<HTMLButtonElement>('[data-jogos-fechar]', jm)!.focus();
      jm.addEventListener('close', () => { origem?.focus(); origem = null; }, { once: true });
      return;
    }
    abrir(bt, bt.classList.contains('npc-bt'));
  });
  $('[data-npc-fechar]', d)!.addEventListener('click', () => d.close());
  const jm = $<HTMLDialogElement>('[data-jogos-modal]');
  if (jm) {
    $('[data-jogos-fechar]', jm)!.addEventListener('click', () => jm.close());
    jm.addEventListener('click', (e) => { if (e.target === jm) jm.close(); });
  }
  d.addEventListener('click', (e) => { if (e.target === d) { const r = d.getBoundingClientRect(); const ev = e as MouseEvent; if (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom) d.close(); } });
  d.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Tab') { e.preventDefault(); $<HTMLButtonElement>('[data-npc-fechar]', d)!.focus(); } }); // um só controle: o foco não sai
  d.addEventListener('close', () => { origem?.focus(); origem = null; });
}

// ---------- Loop real (hero e "Faz a tarefa"): o mp4 só é pedido no play(), depois do load e com o aparelho visível ----------
// Autoplay só se: muted + playsinline (no HTML), sem movimento reduzido, sem Save-Data, conexão 4g (ou API ausente).
// Senão: poster + botão de play. Nunca mais de um loop tocando: o que começa pausa os outros.
const rapida = !nav.connection?.effectiveType || nav.connection.effectiveType === '4g';
const loops: HTMLVideoElement[] = [];
function loopReal() {
  for (const fig of $$('[data-loop]')) {
    const v = $<HTMLVideoElement>('[data-video]', fig)!; const erro = $('[data-video-erro]', fig)!;
    // Aparelho "limpo" (pedido do dono, 09/11): sem botão; toca sozinho e um toque na tela pausa/retoma.
    const bt = $<HTMLButtonElement>('[data-play]', fig) ?? Object.assign(fig, {}) as unknown as HTMLButtonElement;
    const icoPlay = $('[data-ico-play]', bt); const icoPausa = $('[data-ico-pausa]', bt);
    loops.push(v);
    if (bt !== (fig as unknown)) bt.hidden = false;
    const auto = fig.dataset.auto === '1' && !reduzido && !poupar && rapida;
    let querTocar = auto; let visivel = false; let liberado = false;
    const estado = () => {
      const tocando = !v.paused;
      if (!icoPlay || !icoPausa) return;
      bt.setAttribute('aria-label', tocando ? S.pausar : S.tocar);
      icoPlay.toggleAttribute('hidden', tocando); icoPausa.toggleAttribute('hidden', !tocando);
    };
    const tocar = () => {
      if (!v.getAttribute('src')) v.src = v.dataset.src!; // primeiro pedido do mp4 acontece aqui
      for (const o of loops) if (o !== v && !o.paused) o.pause();
      v.play().catch(() => estado());
    };
    depoisDoLoad(() => { liberado = true; if (visivel && querTocar) tocar(); });
    v.addEventListener('play', estado); v.addEventListener('pause', estado);
    v.addEventListener('error', () => { erro.hidden = false; });
    bt.addEventListener('click', () => { if (v.paused) { querTocar = true; tocar(); } else { querTocar = false; v.pause(); } });
    new IntersectionObserver(([x]) => {
      visivel = x.intersectionRatio >= 0.5;
      if (visivel && querTocar && liberado) tocar(); else if (!visivel && !v.paused) v.pause();
    }, { threshold: [0, 0.5] }).observe(fig);
    estado();
  }
}

// ---------- Trailer: poster só depois do load e perto da tela (celular pega o de 640); nunca toca sozinho ----------
function trailer() {
  const v = $<HTMLVideoElement>('[data-trailer]'); const capa = $<HTMLButtonElement>('[data-trailer-capa]'); if (!v || !capa) return;
  capa.hidden = false;
  capa.addEventListener('click', () => {
    v.hidden = false; capa.hidden = true; capa.closest('.trailer-moldura')?.classList.add('tocando');
    for (const o of loops) o.pause();
    v.play().catch(() => {}); v.focus();
  });
}

// ---------- Profundidade: o mapa (com o elenco) anda mais devagar que o texto. Só >= 768, sem redução, sem Save-Data ----------
function profundidade() {
  if (reduzido || fraco || innerWidth < 768) return;
  const artes = $$<HTMLElement>('.cena:not(.ciclo) [data-arte]');
  if (!artes.length) return;
  document.documentElement.classList.add('px');
  let pedido = 0;
  const aplicar = () => {
    pedido = 0;
    const vh = innerHeight;
    for (const a of artes) {
      const r = a.parentElement!.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) continue;
      const d = (r.top + r.height / 2 - vh / 2) * -0.3; // mapa a 0,7x da rolagem
      a.style.setProperty('--py', `${Math.round(Math.max(-80, Math.min(80, d)))}px`);
    }
  };
  addEventListener('scroll', () => { if (!pedido) pedido = requestAnimationFrame(aplicar); }, { passive: true });
  addEventListener('resize', aplicar);
  depoisDoLoad(aplicar);
}

// ---------- Mapas fora do hero: pedidos só depois do load e a até uma tela de distância ----------
function mapasTarde() {
  const ps = $$('[data-mapa-tarde]'); if (!ps.length) return;
  const carregar = (p: Element) => {
    p.querySelectorAll<HTMLSourceElement | HTMLImageElement>('[data-srcset]').forEach((x) => { x.srcset = x.dataset.srcset!; });
    const img = p.querySelector<HTMLImageElement>('img[data-src]'); if (img) img.src = img.dataset.src!;
  };
  // observa a seção (a imagem ainda é um 1x1); carrega o mapa dela quando chega a uma tela de distância
  const porSecao = new Map(ps.map((p) => [p.closest('.ciclo-palco, .cena') ?? p, p] as const));
  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) { io.unobserve(e.target); const p = porSecao.get(e.target); if (p) carregar(p); }
  }, { rootMargin: '100% 0px' });
  porSecao.forEach((_, sec) => io.observe(sec));
}

// ---------- Cena do ciclo com scroll ----------
function ciclo() {
  if (reduzido || !S) return; // lista estática, os 5 estágios visíveis
  depoisDoLoad(() => quandoVisivel($('#ciclo'), () => {
    import('./ciclo').then((m) => m.iniciar(S, fraco)).catch(() => {});
  }, '100% 0px'));
}
if (!reduzido && $('#ciclo')) {
  // já troca para a cena antes de o ciclo aparecer, para não piscar a lista
  document.documentElement.classList.add('ciclo-js');
  $('[data-cena]')!.hidden = false;
}

// ---------- Compartilhar na seção final (depois da inscrição) ----------
function partilha() {
  const sh = $('[data-share]'); const msg = $('[data-partilha-msg]');
  if (!sh || !msg) return;
  // só aparece depois da inscrição (formulario())
  sh.addEventListener('click', () => compartilhar(msg));
}

// ---------- Âncoras: salto direto e corrigido até a posição estabilizar; foca o campo ao chegar no formulário ----------
function ancoras() {
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest?.<HTMLAnchorElement>('a[href^="#"]');
    const alvo = a && document.getElementById(a.hash.slice(1));
    if (!alvo) return;
    e.preventDefault();
    let n = 0;
    const campo = alvo.id === 'inscrever' ? $<HTMLInputElement>('#email') : null;
    const passo = () => {
      alvo.scrollIntoView({ block: 'start', behavior: 'instant' as ScrollBehavior });
      if (++n < 8) { requestAnimationFrame(passo); return; }
      if (campo && !campo.closest('[hidden]')) campo.focus({ preventScroll: true });
      else { if (!alvo.hasAttribute('tabindex')) alvo.setAttribute('tabindex', '-1'); alvo.focus({ preventScroll: true }); }
    };
    passo();
    history.replaceState(null, '', a.hash);
  });
}

// Só com JS: sem ele, o form faria GET com o e-mail na URL.
if (form) form.hidden = false;
ancoras(); partilha(); topoECta(); vagas(); formulario(); turnstile(); abas(); sorteio(); linhasArvore(); modalNpc(); loopReal(); trailer(); ciclo(); profundidade();
// ajustarSprites lê o layout da página inteira: só depois do load, nunca na janela do primeiro quadro.
depoisDoLoad(() => {
  document.documentElement.classList.add('tarde');
  mapasTarde(); iniciado = true;
  $$<HTMLImageElement>('img[data-tarde-src]').forEach((i) => { i.src = i.dataset.tardeSrc!; });
  ajustarSprites();
});
