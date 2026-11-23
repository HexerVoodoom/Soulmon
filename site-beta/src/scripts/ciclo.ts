// Cena participativa do ciclo: tarefa -> chama -> cristal -> nova forma.
// Sem GSAP (aparelho fraco ou falha de rede) a cena continua funcionando, só sem a corrida.
type Strs = { forma: string; de: string; alt: string; formas: string[]; nomes: string[] };
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export async function iniciar(S: Strs, fraco: boolean) {
  const LIN = document.querySelector<HTMLElement>('#ciclo')?.dataset.linhaDemo || 'fogo';
  const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
  const secao = $('#ciclo'); const palco = $('[data-palco]');
  const criatura = $<HTMLImageElement>('[data-criatura]'); const placa = $('[data-placa]');
  const chama = $('[data-chama]'); const clarao = $('[data-clarao]'); const anuncio = $('[data-anuncio]');
  const fim = $('[data-fim]'); const blocoTarefas = $('[data-tarefas]');
  const cristal = $('.cristal'); const botoes = [...document.querySelectorAll<HTMLButtonElement>('[data-tarefa]')];

  S.formas.forEach((f) => { new Image().src = `${BASE}/sprites/${LIN}-${f}.webp`; });

  let gsap: typeof import('gsap').gsap | null = null;
  let ST: typeof import('gsap/ScrollTrigger').ScrollTrigger | null = null;
  if (!fraco) {
    try {
      const [g, s] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
      gsap = g.gsap; ST = s.ScrollTrigger; gsap.registerPlugin(ST);
    } catch { /* segue sem animação */ }
  }

  let estagio = 0; let correndo = false; const fila: number[] = [];

  const setCristal = (estado: string) => {
    cristal.querySelectorAll<HTMLElement>('[data-c]').forEach((i) => { i.classList.toggle('on', i.dataset.c === estado); });
  };
  const aplicarForma = () => {
    const f = S.formas[estagio];
    criatura.src = `${BASE}/sprites/${LIN}-${f}.webp`;
    const rotulo = S.nomes[estagio]; // nome da forma na tela (pedido do dono, 09/11)
    document.querySelector<HTMLElement>('[data-ico-forma]')?.setAttribute('data-forma', f);
    criatura.alt = `${S.alt} ${rotulo}`;
    placa.textContent = rotulo;
    anuncio.textContent = `${rotulo}.`;
  };
  const concluir = () => {
    aplicarForma();
    if (estagio === S.formas.length - 1) {
      // a lista some: o foco não pode se perder junto com ela; vai para o CTA do fim da demo
      const tinhaFoco = blocoTarefas.contains(document.activeElement);
      blocoTarefas.hidden = true; fim.hidden = false;
      if (tinhaFoco) fim.querySelector<HTMLElement>('a, button')?.focus();
    }
  };
  const missao = document.querySelector<HTMLElement>('[data-missao]');
  const contar = () => { if (missao) missao.textContent = `${botoes.filter((x) => x.getAttribute('aria-checked') === 'true').length}/${botoes.length}`; };
  const marcado = (b: HTMLButtonElement, v: boolean) => { b.setAttribute('aria-checked', String(v)); b.closest('.linha')!.classList.toggle('feita', v); contar(); };

  function correr(i: number) {
    const b = botoes[i];
    marcado(b, true); b.setAttribute('aria-disabled', 'true');
    estagio += 1;
    if (!gsap) { setCristal('aceso'); concluir(); return; }
    correndo = true;
    const base = ((chama.offsetParent as HTMLElement | null) ?? palco).getBoundingClientRect();
    const caixa = b.querySelector('.caixa')!.getBoundingClientRect();
    const cr = cristal.getBoundingClientRect();
    const px = (v: number) => Math.round(v / 4) * 4;
    const x0 = px(caixa.left + caixa.width / 2 - base.left - 12);
    const y0 = px(caixa.top + caixa.height / 2 - base.top - 16);
    const x1 = px(cr.left + cr.width / 2 - base.left - 12);
    const y1 = px(cr.top + cr.height / 2 - base.top - 16);
    const tl = gsap.timeline({ onComplete: () => { correndo = false; const p = fila.shift(); if (p !== undefined) correr(p); } });
    if (fila.length) tl.timeScale(2.5); // toques em sequência: a animação acelera em vez de fazer esperar
    tl.set(chama, { x: x0, y: y0, opacity: 1 })
      .to(chama, { x: x1, y: y1, duration: 0.5, ease: 'power1.in', snap: { x: 4, y: 4 } })
      .call(() => setCristal('acendendo'))
      .set(chama, { opacity: 0 })
      .to(cristal, { y: -4, duration: 0.06, repeat: 3, yoyo: true, ease: 'none' })
      .call(() => setCristal('aceso'))
      .to(clarao, { opacity: 1, duration: 0.1, ease: 'none' })
      .call(concluir)
      .fromTo(criatura, { y: 8 }, { y: 0, duration: 0.3, ease: 'steps(4)' })
      .to(clarao, { opacity: 0, duration: 0.32, ease: 'none' }, '<');
  }

  const mao = document.querySelector<HTMLElement>('[data-mao]');
  function marcar(i: number) {
    mao?.classList.add('some');
    if (botoes[i].getAttribute('aria-checked') === 'true' || fila.includes(i)) return;
    // toque rápido nunca é ignorado: marca na hora (feedback) e entra na fila da animação, que acelera
    if (correndo) { marcado(botoes[i], true); fila.push(i); gsap?.globalTimeline.getChildren(false, false, true).forEach((t) => t.timeScale(2.5)); } else correr(i);
  }

  botoes.forEach((b, i) => b.addEventListener('click', () => marcar(i)));
  document.querySelector('[data-recomecar]')!.addEventListener('click', () => {
    estagio = 0; aplicarForma(); anuncio.textContent = '';
    botoes.forEach((b) => { marcado(b, false); b.removeAttribute('aria-disabled'); });
    mao?.classList.remove('some'); fim.hidden = true; blocoTarefas.hidden = false; setCristal('apagado'); botoes[0].focus();
  });
  setCristal('apagado');

  secao.classList.add('sem-pin');
  // Fechar (topo) e Continuar (fim): saem da demo e seguem para a próxima seção (dono, 09/11).
  let sairModo = () => {};
  const sair = () => { sairModo(); const prox = secao.nextElementSibling as HTMLElement | null; (prox ?? secao).scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  document.querySelector('[data-demo-fechar]')?.addEventListener('click', sair);
  if (matchMedia('(max-width: 1023px)').matches) modoFoco(); else travarRolagem();

  // Celular (dono, 09/11): ao chegar na demo a tela escurece e a cena sobe sozinha na frente:
  // só a lista e o Soulmon na plataforma de evolução do jogo, mão grande apontando.
  // Tocar marca e evolui; tentar rolar fecha na hora e a página segue, sem trava.
  function modoFoco() {
    const cena = document.querySelector<HTMLElement>('[data-cena]')!;
    const disco = cena.querySelector<HTMLImageElement>('.disco');
    if (disco) { const ped = BASE + '/el/pedestal.webp'; disco.dataset.tardeSrc = ped; disco.src = ped; disco.width = 384; disco.height = 146; }
    let aberto = false; let fechado = false; let y0 = 0;
    const fechar = () => {
      if (!aberto) return; aberto = false; fechado = true;
      secao.classList.remove('foco'); palco.style.minHeight = '';
    };
    const abrir = () => {
      if (aberto || fechado) return; aberto = true;
      palco.style.minHeight = palco.offsetHeight + 'px';
      secao.classList.add('foco');
    };
    new IntersectionObserver(([x]) => { if (x.isIntersecting) abrir(); }, { threshold: 0.35 }).observe(cena);
    addEventListener('touchstart', (e) => { y0 = e.touches[0].clientY; }, { passive: true });
    addEventListener('touchmove', (e) => { if (aberto && Math.abs(e.touches[0].clientY - y0) > 14) fechar(); }, { passive: true });
    addEventListener('wheel', () => { if (aberto) fechar(); }, { passive: true });
    fim.querySelector('[data-cta]')?.addEventListener('click', fechar);
    sairModo = fechar;
  }

  // Trava da rolagem (dono, 09/11): ao chegar na demo, rolar para baixo NÃO move a página;
  // cada gesto marca uma tarefa e evolui o Soulmon. Só no Ultra a página volta a rolar.
  // Para cima sempre rola; "Pular" solta na hora; nunca com movimento reduzido (este módulo nem carrega).
  function travarRolagem() {
    // Cabe na tela (desktop): enquadra a seção inteira, com título e celular; senão (celular), a demo.
    const cena = document.querySelector<HTMLElement>('[data-cena]')!;
    let ancora = cena;
    const escolher = () => { ancora = palco.offsetHeight <= innerHeight + 4 ? palco : cena; };
    escolher(); addEventListener('resize', escolher);
    const pular = document.querySelector<HTMLButtonElement>('[data-pular-demo]');
    let solto = false; let ultimo = 0; let toqueY = 0;
    const topoH = () => (ancora === palco ? 0 : (document.querySelector<HTMLElement>('[data-topo]')?.offsetHeight ?? 0) + 8);
    const alvoY = () => Math.round(scrollY + ancora.getBoundingClientRect().top - topoH());
    const naZona = () => { const r = ancora.getBoundingClientRect(); return r.top <= topoH() + 2 && r.bottom > innerHeight * 0.3; };
    const soltar = () => { solto = true; secao.classList.remove('travada'); if (pular) pular.hidden = true; };
    sairModo = soltar;
    const avancar = () => {
      const agora = Date.now(); if (agora - ultimo < 420) return; ultimo = agora;
      const i = botoes.findIndex((b, k) => b.getAttribute('aria-checked') !== 'true' && !fila.includes(k));
      if (i >= 0) marcar(i);
    };
    const prender = (ev: Event, desce: boolean) => {
      if (solto || !desce) return;
      if (!naZona()) return;
      ev.preventDefault();
      if (Math.abs(scrollY - alvoY()) > 2) scrollTo({ top: alvoY(), behavior: 'instant' as ScrollBehavior });
      secao.classList.add('travada'); if (pular) pular.hidden = false;
      avancar();
    };
    addEventListener('wheel', (e) => prender(e, e.deltaY > 0), { passive: false });
    addEventListener('touchstart', (e) => { toqueY = e.touches[0].clientY; }, { passive: true });
    addEventListener('touchmove', (e) => { const y = e.touches[0].clientY; const desce = toqueY - y > 4; if (desce) prender(e, true); }, { passive: false });
    addEventListener('keydown', (e) => { if (['ArrowDown', 'PageDown', ' ', 'End'].includes(e.key) && !(e.target as Element).closest('input, textarea, button, a')) prender(e, true); });
    // Rolagem rápida (barra, arrastar) que passa da demo: volta para ela uma vez.
    addEventListener('scroll', () => {
      if (solto) return;
      const r = ancora.getBoundingClientRect();
      if (r.top < topoH() - 4 && r.bottom > 0) { scrollTo({ top: alvoY(), behavior: 'instant' as ScrollBehavior }); secao.classList.add('travada'); if (pular) pular.hidden = false; }
    }, { passive: true });
    pular?.addEventListener('click', soltar);
    const obs = new MutationObserver(() => { if (placa.textContent === S.nomes[S.nomes.length - 1]) soltar(); });
    obs.observe(document.querySelector('[data-placa]')!, { childList: true, characterData: true, subtree: true });
  }
}