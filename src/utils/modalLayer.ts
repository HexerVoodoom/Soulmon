/**
 * CAMADA DOS MODAIS × BOTÃO VOLTAR (pedido do dono, 09/11/2026): o voltar da página (`AreaTopBar`/`BackCircleButton`, canto
 * superior esquerdo, `position: fixed`) coincidia com o "Fechar" à esquerda de qualquer modal. Regra: o modal fica SEMPRE uma
 * camada acima do voltar e, enquanto houver modal aberto, o voltar da PÁGINA esmaece e não recebe toque
 * (`body[data-modal-open]` + regra em `index.css`). O voltar que mora DENTRO do próprio modal/folha continua vivo.
 *
 * Um observador único (montado no `App`) liga e desliga o atributo — nenhum modal precisa saber disto.
 */
export const MODAL_SELECTOR = '[aria-modal="true"], [role="dialog"], [role="alertdialog"]';
/** Todo overlay de tela cheia fica acima do voltar da página (`zIndex: 45` em `AreaTopBar`). */
export const Z_ABOVE_BACK = 60;

/** Liga/desliga `data-modal-open` no `body` conforme haja um modal no DOM (ignora os ocultos). Devolve o novo estado. */
export function syncModalFlag(doc: Document = document): boolean {
  const open = Array.from(doc.querySelectorAll<HTMLElement>(MODAL_SELECTOR)).some(el => !el.hidden && el.getAttribute('aria-hidden') !== 'true');
  if (open) doc.body.setAttribute('data-modal-open', ''); else doc.body.removeAttribute('data-modal-open');
  return open;
}

/** Começa a observar o DOM; devolve a função que para. */
export function watchModalLayer(doc: Document = document): () => void {
  syncModalFlag(doc);
  const win = doc.defaultView;
  if (!win || typeof win.MutationObserver !== 'function') return () => undefined;
  let raf = 0;
  const run = () => { raf = 0; syncModalFlag(doc); };
  const obs = new win.MutationObserver(() => { if (!raf) raf = win.requestAnimationFrame ? win.requestAnimationFrame(run) : (win.setTimeout(run, 16) as unknown as number); });
  obs.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-modal', 'role', 'hidden', 'aria-hidden'] });
  return () => { obs.disconnect(); doc.body.removeAttribute('data-modal-open'); };
}
