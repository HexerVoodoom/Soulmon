// JS só da Versão B: demo de evolução por toque e barra fixa que some quando já há um CTA ou o modal na tela.
// Sem JS: a demo vira uma lista de tarefas estática e o CTA fixo continua sendo um link para #entrar.
const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;

function demo() {
  const raiz = document.querySelector<HTMLElement>('[data-vb-demo]'); if (!raiz) return;
  const base = raiz.dataset.base!; const linha = raiz.dataset.linha!;
  const formas = JSON.parse(raiz.dataset.formas!) as string[]; const nomes = JSON.parse(raiz.dataset.nomes!) as string[];
  const img = raiz.querySelector<HTMLImageElement>('[data-vb-img]')!; const est = raiz.querySelector('[data-vb-estagio]')!; const nome = raiz.querySelector('[data-vb-nome]')!;
  const barra = raiz.querySelector<HTMLElement>('[data-vb-barra]')!; const estado = raiz.querySelector('[data-vb-estado]')!;
  const reiniciar = raiz.querySelector<HTMLButtonElement>('[data-vb-recomecar]')!;
  const caixas = [...raiz.querySelectorAll<HTMLInputElement>('[data-vb-tarefa]')];
  const total = caixas.length;
  let pre = false;
  const precarregar = () => { if (pre) return; pre = true; for (const fm of formas) new Image().src = `${base}${linha}-${fm}.webp`; };
  const atualizar = () => {
    const n = caixas.filter((x) => x.checked).length;
    const i = Math.min(formas.length - 1, Math.round((n / total) * (formas.length - 1)));
    img.src = `${base}${linha}-${formas[i]}.webp`; img.alt = `${raiz.dataset.alt} ${nomes[i]}`;
    est.textContent = raiz.dataset.estagio!.replace('{n}', String(i + 1)); nome.textContent = nomes[i];
    barra.style.transform = `scaleX(${n / total})`;
    estado.textContent = n === total ? raiz.dataset.fim! : raiz.dataset.progresso!.replace('{n}', String(n)).replace('{total}', String(total));
    reiniciar.hidden = n === 0;
    if (!reduzido && n > 0) { img.classList.remove('vb-surge'); void img.offsetWidth; img.classList.add('vb-surge'); }
  };
  caixas.forEach((x) => x.addEventListener('change', () => { precarregar(); atualizar(); }));
  raiz.addEventListener('pointerenter', precarregar, { once: true });
  reiniciar.addEventListener('click', () => { caixas.forEach((x) => { x.checked = false; }); atualizar(); caixas[0].focus(); });
}

// A barra fixa (mobile) já some sobre #entrar (app.ts). Aqui: some também com o CTA do hero, a seção do Treinador Fundador e o modal abertos.
function fixo() {
  const barra = document.querySelector<HTMLElement>('[data-fixo]'); if (!barra) return;
  const motivos = new Set<string>();
  const aplicar = () => barra.toggleAttribute('data-vb-off', motivos.size > 0);
  const vigiar = (el: Element | null, id: string, opts?: IntersectionObserverInit) => {
    if (!el) return;
    new IntersectionObserver(([x]) => { if (x.isIntersecting) motivos.add(id); else motivos.delete(id); aplicar(); }, opts).observe(el);
  };
  vigiar(document.querySelector('[data-vb-hero-cta]'), 'hero');
  vigiar(document.querySelector('[data-vb-fundador]'), 'fundador', { rootMargin: '0px 0px -10% 0px' });
  const m = document.querySelector<HTMLDialogElement>('[data-entrar-modal]');
  if (m) new MutationObserver(() => { if (m.open) motivos.add('modal'); else motivos.delete('modal'); aplicar(); }).observe(m, { attributes: true, attributeFilter: ['open'] });
}

demo(); fixo();
