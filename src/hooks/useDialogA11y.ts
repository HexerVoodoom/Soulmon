import { useEffect, useRef } from 'react';

/**
 * FOCUS-TRAP, ESCAPE E DEVOLUÇÃO DE FOCO — o contrato de um diálogo modal
 * ======================================================================
 *
 * POR QUE ESTE ARQUIVO EXISTE
 * ---------------------------
 * Uma auditoria de acessibilidade rodou `grep useFocusTrap|trapFocus|returnFocus`
 * no repositório e não achou NADA. Os quatro diálogos do motor de rituais
 * declaravam `role="dialog" aria-modal="true"` — que é uma PROMESSA ao leitor de
 * tela: "nada fora daqui existe agora" — e nenhum deles cumpria:
 *
 *  · `MorningCheckIn` e `TriagePile`: sem Escape, sem trap, sem foco inicial.
 *    Abrir o check-in com teclado deixava o foco na página ATRÁS do véu: Tab
 *    passeava pela lista de tarefas invisível, e não havia como sair sem mouse.
 *  · `MorningDream`: o Escape funcionava POR ACIDENTE — o handler estava numa
 *    `div` não focável e só chegava lá porque o `autoFocus` do botão OK fazia o
 *    evento borbulhar. Tirar o `autoFocus` (ou o usuário dar um Tab) matava o
 *    Escape sem quebrar teste nenhum.
 *  · `NightmareBattle`: o handler existia, mas nada recebia foco na abertura —
 *    então o `keydown` nascia no `<body>`, fora da árvore do diálogo, e o
 *    Escape já nascia morto.
 *
 * Um hook só, e não quatro cópias: regra copiada é regra que diverge em
 * silêncio (footgun 9 do CLAUDE.md). As quatro telas têm exatamente o mesmo
 * contrato de teclado, então ele mora num lugar só.
 *
 * O QUE ELE FAZ
 * -------------
 *  1. **Foco inicial** no primeiro focável de dentro do diálogo (o container
 *     recebe `tabIndex=-1` como último recurso: um diálogo sem nenhum controle
 *     ainda precisa ser o dono do foco, senão o Escape não tem de onde subir).
 *  2. **Trap**: Tab no último volta ao primeiro; Shift+Tab no primeiro vai ao
 *     último. A lista de focáveis é remedida a cada Tab — o conteúdo destes
 *     diálogos MUDA (a carta da triagem troca, o combate muda de fase).
 *  3. **Escape fecha**, por listener de `keydown` na captura do `document`:
 *     independe de onde o foco está e não depende de borbulhamento.
 *  4. **Devolve o foco** a quem abriu, ao fechar ou desmontar. Sem isso, quem
 *     navega por teclado volta para o começo do documento a cada modal.
 *
 * Uso (o componente segue podendo fazer `if (!open) return null`; o hook, como
 * todo hook, é chamado ANTES do retorno condicional):
 *
 *     const dialogRef = useDialogA11y<HTMLDivElement>(open, onClose);
 *     ...
 *     <div role="dialog" aria-modal="true" ref={dialogRef}> … </div>
 *
 * O que ele NÃO faz, de propósito: não renderiza véu, não bloqueia o scroll do
 * body e não desenha nada. Cada diálogo daqui já tem o próprio véu com o
 * z-index e a cor que a tela pede — um hook que também desenhasse obrigaria os
 * quatro a se converterem para caber nele.
 */

/** Seletor do que o navegador considera focável, menos o que está escondido. */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    // `offsetParent === null` pega display:none e ancestral escondido; o
    // `getClientRects` cobre o caso de `position: fixed`, em que o offsetParent
    // é nulo mesmo com o elemento visível na tela.
    el => el.offsetParent !== null || el.getClientRects().length > 0,
  );
}

export function useDialogA11y<T extends HTMLElement = HTMLElement>(
  open: boolean,
  onClose: () => void,
) {
  const ref = useRef<T | null>(null);
  // O handler mais recente sem re-armar o listener a cada render: o `onClose`
  // dos chamadores costuma ser uma lambda inline.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const node = ref.current;
    if (!node || typeof document === 'undefined') return;

    const opener = document.activeElement as HTMLElement | null;

    // (1) Foco inicial. O container é o último recurso — e por isso precisa ser
    // programaticamente focável.
    if (!node.hasAttribute('tabindex')) node.setAttribute('tabindex', '-1');
    // Se o diálogo já escolheu o próprio ponto de entrada (`autoFocus` no botão
    // primário do MorningDream, por exemplo), respeita — o hook existe para
    // GARANTIR foco de entrada, não para sequestrar o que a tela decidiu.
    if (!node.contains(document.activeElement)) {
      const first = focusables(node)[0];
      (first ?? node).focus();
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab') return;

      const list = focusables(node);
      if (list.length === 0) {
        // Diálogo sem controle nenhum: o foco fica no container em vez de
        // escapar para a página atrás do véu.
        e.preventDefault();
        node.focus();
        return;
      }
      const firstEl = list[0];
      const lastEl = list[list.length - 1];
      const active = document.activeElement as HTMLElement | null;

      // Foco fora do diálogo (aconteceu de o usuário clicar no véu): traz de
      // volta em vez de deixar o Tab continuar na página.
      if (!active || !node.contains(active)) {
        e.preventDefault();
        firstEl.focus();
        return;
      }
      if (e.shiftKey && active === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    // Captura: o Escape tem que valer mesmo se o foco tiver escorregado, e não
    // pode depender de o evento borbulhar até a div do véu (era exatamente o
    // que tornava o Escape do MorningDream um acidente).
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      // (4) Devolução do foco. `isConnected` porque o elemento que abriu pode
      // ter saído do DOM enquanto o diálogo estava aberto.
      if (opener && opener.isConnected && typeof opener.focus === 'function') {
        opener.focus();
      }
    };
  }, [open]);

  return ref;
}

export default useDialogA11y;
