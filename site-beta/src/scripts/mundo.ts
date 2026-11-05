// Parallax do mundo: cenários instalados trocam com o scroll, cada camada em sua velocidade.
// Só transform e opacity. Quem não roda isto (movimento reduzido, aparelho fraco, sem JS) vê as cenas empilhadas.
export async function iniciar() {
  const [g, s] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
  const { gsap } = g; const { ScrollTrigger } = s;
  gsap.registerPlugin(ScrollTrigger);
  const cenas = [...document.querySelectorAll<HTMLElement>('[data-cn]')];
  const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '#mundo', start: 'top top', end: 'bottom bottom', scrub: 0.4 } });
  document.querySelectorAll<HTMLElement>('[data-frente] [data-v]').forEach((l) => {
    const v = Number(l.dataset.v);
    tl.fromTo(l, { y: -v }, { y: v, duration: cenas.length }, 0);
  });
  cenas.forEach((c, i) => {
    if (i > 0) { gsap.set(c, { opacity: 0 }); tl.to(c, { opacity: 1, duration: 0.25 }, i - 0.125); }
    c.querySelectorAll<HTMLElement>('[data-v]').forEach((l) => {
      const v = Number(l.dataset.v);
      tl.fromTo(l, { y: -v / 2 }, { y: v / 2, duration: 1.25 }, Math.max(0, i - 0.125));
    });
    if (i < cenas.length - 1) tl.to(c, { opacity: 0, duration: 0.25 }, i + 0.875);
  });
}
