// Cena participativa do ciclo: tarefa -> chama no cabo -> cristal -> nova forma.
// Sem GSAP (aparelho fraco ou falha de rede) a cena continua funcionando, só sem a corrida.
type Strs = { forma: string; de: string; alt: string; formas: string[] };

export async function iniciar(S: Strs, fraco: boolean) {
  const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
  const secao = $('#ciclo'); const palco = $('[data-palco]');
  const criatura = $<HTMLImageElement>('[data-criatura]'); const placa = $('[data-placa]');
  const chama = $('[data-chama]'); const clarao = $('[data-clarao]'); const anuncio = $('[data-anuncio]');
  const fim = $('[data-fim]'); const blocoTarefas = $('[data-tarefas]'); const carga = $('[data-carga]');
  const cristal = $('.cristal'); const botoes = [...document.querySelectorAll<HTMLButtonElement>('[data-tarefa]')];

  S.formas.forEach((f) => { new Image().src = `/sprites/fogo-${f}.webp`; });

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
    criatura.src = `/sprites/fogo-${f}.webp`;
    const rotulo = `${S.forma} ${estagio + 1} ${S.de} 5`; // nomes internos das formas nunca saem na tela nem em aria
    criatura.alt = `${S.alt} ${rotulo}`;
    placa.textContent = rotulo;
    anuncio.textContent = `${rotulo}.`;
  };
  const concluir = () => {
    aplicarForma();
    if (estagio === S.formas.length - 1) { blocoTarefas.hidden = true; fim.hidden = false; }
  };

  function correr(i: number) {
    const b = botoes[i];
    b.setAttribute('aria-pressed', 'true'); b.disabled = true;
    estagio += 1;
    if (!gsap) { setCristal('aceso'); concluir(); return; }
    correndo = true;
    const base = palco.getBoundingClientRect();
    const caixa = b.querySelector('.caixa')!.getBoundingClientRect();
    const trilho = blocoTarefas.querySelector('.trilho')!.getBoundingClientRect();
    const cr = cristal.getBoundingClientRect();
    const px = (v: number) => Math.round(v / 4) * 4;
    const meia = 12; const altura = 16;
    const x0 = px(caixa.left + caixa.width / 2 - base.left - meia);
    const y0 = px(caixa.top + caixa.height / 2 - base.top - altura);
    const xr = px(trilho.left + trilho.width / 2 - base.left - meia);
    const yc = px(cr.top + cr.height / 2 - base.top - altura);
    const tl = gsap.timeline({ onComplete: () => { correndo = false; const p = fila.shift(); if (p !== undefined) correr(p); } });
    tl.set(chama, { x: x0, y: y0, opacity: 1 })
      .to(chama, { x: xr, duration: Math.max(0.12, Math.abs(xr - x0) / 500), ease: 'none', snap: { x: 4 } })
      .to(chama, { y: yc, duration: 0.42, ease: 'power1.in', snap: { y: 4 } })
      .fromTo(carga, { scaleY: 0 }, { scaleY: 1, duration: 0.42, ease: 'power1.in' }, '<')
      .call(() => setCristal('acendendo'))
      .set(chama, { opacity: 0 })
      .to(cristal, { y: -4, duration: 0.06, repeat: 3, yoyo: true, ease: 'none' })
      .call(() => setCristal('aceso'))
      .to(clarao, { opacity: 1, duration: 0.1, ease: 'none' })
      .call(concluir)
      .fromTo(criatura, { y: 8 }, { y: 0, duration: 0.3, ease: 'steps(4)' })
      .to(clarao, { opacity: 0, duration: 0.32, ease: 'none' }, '<')
      .set(carga, { scaleY: 0 });
  }

  function marcar(i: number) {
    if (botoes[i].disabled || fila.includes(i)) return;
    if (correndo) fila.push(i); else correr(i);
  }

  botoes.forEach((b, i) => b.addEventListener('click', () => marcar(i)));
  document.querySelector('[data-recomecar]')!.addEventListener('click', () => {
    estagio = 0; aplicarForma(); anuncio.textContent = '';
    botoes.forEach((b) => { b.disabled = false; b.setAttribute('aria-pressed', 'false'); });
    fim.hidden = true; blocoTarefas.hidden = false; setCristal('apagado'); botoes[0].focus();
    if (ST) ST.refresh();
  });
  setCristal('apagado');

  if (!gsap || !ST) { secao.classList.add('sem-pin'); return; }

  // Cabo por trecho: só o trecho na viewport anima.
  document.querySelectorAll<HTMLElement>('.cabo > i').forEach((i) => {
    gsap!.fromTo(i, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: i.parentElement, start: 'top 75%', end: 'bottom 75%', scrub: true } });
  });

  // Fallback: rolar também avança, para quem não toca. Cabe só com tela alta o bastante (ver CSS).
  if (getComputedStyle(palco).position === 'sticky') {
    ST.create({
      trigger: secao, start: 'top top', end: 'bottom bottom',
      onUpdate: (self) => {
        const alvo = Math.min(4, Math.floor(self.progress * 5.2));
        for (let i = 0; i < botoes.length && estagio + fila.length < alvo; i++) {
          if (!botoes[i].disabled && !fila.includes(i)) marcar(i);
        }
      },
    });
  }
}
