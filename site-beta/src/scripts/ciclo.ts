// Cena participativa do ciclo: tarefa -> chama -> cristal -> nova forma.
// Sem GSAP (aparelho fraco ou falha de rede) a cena continua funcionando, só sem a corrida.
type Strs = { forma: string; de: string; alt: string; formas: string[] };

export async function iniciar(S: Strs, fraco: boolean) {
  const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
  const secao = $('#ciclo'); const palco = $('[data-palco]');
  const criatura = $<HTMLImageElement>('[data-criatura]'); const placa = $('[data-placa]');
  const chama = $('[data-chama]'); const clarao = $('[data-clarao]'); const anuncio = $('[data-anuncio]');
  const fim = $('[data-fim]'); const blocoTarefas = $('[data-tarefas]');
  const cristal = $('.cristal'); const botoes = [...document.querySelectorAll<HTMLButtonElement>('[data-tarefa]')];

  S.formas.forEach((f) => { new Image().src = `/sprites/planta-${f}.webp`; });

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
    criatura.src = `/sprites/planta-${f}.webp`;
    const rotulo = `${S.forma} ${estagio + 1} ${S.de} 5`; // nomes internos das formas nunca saem na tela nem em aria
    criatura.alt = `${S.alt} ${rotulo}`;
    placa.textContent = rotulo;
    anuncio.textContent = `${rotulo}.`;
  };
  const concluir = () => {
    aplicarForma();
    if (estagio === S.formas.length - 1) { blocoTarefas.hidden = true; fim.hidden = false; }
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
    const base = palco.getBoundingClientRect();
    const caixa = b.querySelector('.caixa')!.getBoundingClientRect();
    const cr = cristal.getBoundingClientRect();
    const px = (v: number) => Math.round(v / 4) * 4;
    const x0 = px(caixa.left + caixa.width / 2 - base.left - 12);
    const y0 = px(caixa.top + caixa.height / 2 - base.top - 16);
    const x1 = px(cr.left + cr.width / 2 - base.left - 12);
    const y1 = px(cr.top + cr.height / 2 - base.top - 16);
    const tl = gsap.timeline({ onComplete: () => { correndo = false; const p = fila.shift(); if (p !== undefined) correr(p); } });
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

  function marcar(i: number) {
    if (botoes[i].getAttribute('aria-checked') === 'true' || fila.includes(i)) return;
    if (correndo) fila.push(i); else correr(i);
  }

  botoes.forEach((b, i) => b.addEventListener('click', () => marcar(i)));
  document.querySelector('[data-recomecar]')!.addEventListener('click', () => {
    estagio = 0; aplicarForma(); anuncio.textContent = '';
    botoes.forEach((b) => { marcado(b, false); b.removeAttribute('aria-disabled'); });
    fim.hidden = true; blocoTarefas.hidden = false; setCristal('apagado'); botoes[0].focus();
  });
  setCristal('apagado');

  if (!gsap || !ST) { secao.classList.add('sem-pin'); return; }

  // Rolar também avança, para quem não toca. Cabe só com tela alta o bastante (ver CSS).
  if (getComputedStyle(palco).position === 'sticky') {
    ST.create({
      trigger: secao, start: 'top top', end: 'bottom bottom',
      onUpdate: (self) => {
        const alvo = Math.min(4, Math.floor(self.progress * 5.2));
        for (let i = 0; i < botoes.length && estagio + fila.length < alvo; i++) {
          if (botoes[i].getAttribute('aria-checked') !== 'true' && !fila.includes(i)) marcar(i);
        }
      },
    });
  }
}
