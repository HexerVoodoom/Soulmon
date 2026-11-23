// Árvore "O que você faz influencia": trilho com scroll-snap (swipe, arrasto com mouse, setas) e modal do Soulmon revelado.
const q = <T extends Element>(s: string, r: ParentNode = document) => r.querySelector<T>(s);

function trilho() {
  const bloco = q<HTMLElement>('[data-trilho]'); if (!bloco) return;
  const palco = q<HTMLElement>('.arvore-palco', bloco); const ant = q<HTMLButtonElement>('[data-linha-ant]', bloco); const prox = q<HTMLButtonElement>('[data-linha-prox]', bloco);
  const arvores = [...bloco.querySelectorAll<HTMLElement>('ol.arvore[data-linha]')];
  if (!palco || !ant || !prox || !arvores.length) return;
  const rail = document.createElement('div'); rail.className = 'arvore-trilho';
  palco.insertBefore(rail, prox); // entre as setas
  arvores.forEach((a) => { a.hidden = false; rail.appendChild(a); });
  ant.hidden = prox.hidden = false;
  const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const atual = () => Math.round(rail.scrollLeft / Math.max(1, rail.clientWidth));
  const ir = (k: number) => { const n = (k + arvores.length) % arvores.length; rail.scrollTo({ left: n * rail.clientWidth, behavior: reduzido ? 'auto' : 'smooth' }); };
  ant.addEventListener('click', () => ir(atual() - 1)); prox.addEventListener('click', () => ir(atual() + 1));
  // Foco em um nó fora da página visível: leva a página junto.
  rail.addEventListener('focusin', (e) => { const o = (e.target as Element).closest('ol.arvore'); const i = o ? arvores.indexOf(o as HTMLElement) : -1; if (i >= 0 && i !== atual()) ir(i); });
  // Arrastar com mouse (touch e caneta já rolam nativamente)
  let x0 = 0, s0 = 0, down = false, moveu = false;
  rail.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse' || e.button !== 0) return; down = true; moveu = false; x0 = e.clientX; s0 = rail.scrollLeft; });
  addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - x0;
    if (!moveu && Math.abs(dx) > 4) { moveu = true; rail.classList.add('arrastando'); }
    if (moveu) rail.scrollLeft = s0 - dx;
  });
  const solta = () => {
    if (!down) return; down = false;
    if (moveu) { rail.classList.remove('arrastando'); rail.scrollTo({ left: Math.round(rail.scrollLeft / rail.clientWidth) * rail.clientWidth, behavior: reduzido ? 'auto' : 'smooth' }); }
  };
  addEventListener('pointerup', solta); addEventListener('pointercancel', solta);
  rail.addEventListener('click', (e) => { if (moveu) { e.stopPropagation(); e.preventDefault(); moveu = false; } }, true);
  rail.addEventListener('dragstart', (e) => e.preventDefault());
}

function modal() {
  const d = q<HTMLDialogElement>('[data-ramo-modal]'); if (!d) return;
  const img = q<HTMLImageElement>('[data-ramo-img]', d)!; const nome = q('[data-ramo-nome]', d)!; const est = q('[data-ramo-est]', d)!;
  const elw = q<HTMLElement>('[data-ramo-elw]', d)!; const elimg = q<HTMLImageElement>('[data-ramo-elimg]', d)!; const elnome = q('[data-ramo-elnome]', d)!;
  const nomes = JSON.parse(d.dataset.nomes || '[]') as string[]; const els = JSON.parse(d.dataset.els || '{}') as Record<string, string>;
  const fechar = q<HTMLButtonElement>('[data-ramo-fechar]', d)!;
  let origem: HTMLElement | null = null;
  elimg.addEventListener('error', () => { elimg.hidden = true; });
  elimg.addEventListener('load', () => { elimg.hidden = false; });
  document.addEventListener('click', (e) => {
    const bt = (e.target as Element).closest<HTMLElement>('[data-ramo]'); if (!bt) return;
    const i = Number(bt.dataset.ramoI); const el0 = bt.dataset.ramoEl || ''; const el = el0 === 'noturno' ? 'sombra' : el0; // Noturno usa o elemento Sombra (dono, 09/11)
    origem = bt;
    const si = bt.querySelector('img');
    img.src = si?.currentSrc || si?.src || ''; img.alt = bt.dataset.ramoNome || '';
    nome.textContent = bt.dataset.ramoNome || '';
    est.textContent = `${d.dataset.estagio} ${i + 1} · ${nomes[i] ?? ''}`;
    const enome = els[el];
    elw.hidden = !enome; elnome.textContent = enome || '';
    elimg.hidden = false; elimg.src = `${d.dataset.base}${el}.webp`;
    d.showModal();
    fechar.focus();
  });
  fechar.addEventListener('click', () => d.close());
  d.addEventListener('click', (e) => { if (!fechar.contains(e.target as Node)) d.close(); }); // toque em qualquer ponto do overlay
  d.addEventListener('keydown', (e) => { if (e.key === 'Tab') { e.preventDefault(); fechar.focus(); } });
  d.addEventListener('close', () => { origem?.focus(); origem = null; });
}

trilho(); modal();
