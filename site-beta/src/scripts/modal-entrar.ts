// Modal guiado "Entrar no beta" (3 passos). <dialog> nativo: showModal() prende o foco e fecha com Esc.
// Sem JS os CTAs seguem como link para #entrar. Cliques medidos pelo tracker (data-sa nos botões, host nos links)
// e pelo data-clique do passo 1 (/api/clique), sem dado pessoal.
const d = document.querySelector<HTMLDialogElement>('[data-entrar-modal]');
// O CTA principal sempre abre o modal (a lista de espera, se voltar, fica dentro do modal ou em outro botão).
if (d) {
  const q = <T extends Element = HTMLElement>(s: string) => d.querySelector<T>(s)!;
  const passos = [...d.querySelectorAll<HTMLElement>('[data-em-passo]')];
  const h = q('[data-em-h]'); const tx = q('[data-em-tx]'); const cont = q('[data-em-contagem]'); const voltar = q<HTMLButtonElement>('[data-em-voltar]');
  let atual = 0; let origem: HTMLElement | null = null;
  const ir = (n: number, foco = true) => {
    atual = Math.max(0, Math.min(passos.length - 1, n));
    passos.forEach((p, i) => { p.hidden = i !== atual; });
    h.textContent = passos[atual].dataset.h ?? ''; tx.textContent = passos[atual].dataset.tx ?? '';
    cont.textContent = (cont.dataset.fmt ?? '').replace('{n}', String(atual + 1));
    voltar.hidden = atual === 0;
    if (foco) passos[atual].querySelector<HTMLElement>('.botao')?.focus();
  };
  const abrir = (de: HTMLElement) => { origem = de; ir(0, false); d.showModal(); (passos[0].querySelector('.botao') as HTMLElement).focus(); };
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href="#entrar"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault(); abrir(a); // captura: roda antes de ancoras() (app.ts), que então vê defaultPrevented e não rola até #entrar
  }, true);
  d.querySelectorAll('[data-em-ok]').forEach((b) => b.addEventListener('click', () => ir(atual + 1)));
  voltar.addEventListener('click', () => ir(atual - 1));
  q('[data-em-fechar]').addEventListener('click', () => d.close());
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); }); // clique no fundo (backdrop)
  d.addEventListener('close', () => { origem?.focus(); });
  // Passo 2 e 3 são links externos: a pessoa volta e toca em "Já sou testador"; o 3º só abre a Play.
}
