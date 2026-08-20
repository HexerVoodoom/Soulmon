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
 *  5. **Trava o fundo** — o scroll e a árvore de acessibilidade (ver abaixo).
 *
 * Uso (o componente segue podendo fazer `if (!open) return null`; o hook, como
 * todo hook, é chamado ANTES do retorno condicional):
 *
 *     const dialogRef = useDialogA11y<HTMLDivElement>(open, onClose);
 *     ...
 *     <div role="dialog" aria-modal="true" ref={dialogRef}> … </div>
 *
 * O que ele NÃO faz, de propósito: não renderiza véu e não desenha nada. Cada
 * diálogo daqui já tem o próprio véu com o z-index e a cor que a tela pede — um
 * hook que também desenhasse obrigaria os quatro a se converterem para caber
 * nele.
 *
 * O FUNDO TRAVADO — por que `aria-modal` sozinho é uma promessa quebrada
 * ---------------------------------------------------------------------
 * Medido no app rodando: com um diálogo aberto, `body { overflow: visible }` e
 * o `#root` sem `inert` nem `aria-hidden`. Ou seja: a página ROLAVA atrás do
 * véu no toque, e o leitor de tela alcançava a lista de tarefas de trás — `role
 * ="dialog" aria-modal="true"` promete o contrário. Três peças resolvem, e cada
 * uma cobre um buraco que as outras não cobrem:
 *
 *  · **`overflow: hidden` em `<html>` e `<body>`** — cobre o caso em que o
 *    documento é o que rola (páginas fora da Home, desktop, PWA no navegador).
 *  · **Guarda de `touchmove`/`wheel` em captura no `document`** — porque nesta
 *    app o scroller **não é o body**: é a `div.flex-1.overflow-y-auto` do
 *    `App.tsx`. Travar só o body não pararia nada no celular. A guarda deixa
 *    passar todo evento nascido DENTRO de um diálogo aberto (o próprio sheet
 *    rola) e cancela o resto. É `passive: false` de propósito — sem isso o
 *    `preventDefault` é ignorado.
 *  · **Inertizar os IRMÃOS, não o `#root`.** Os diálogos daqui **não são
 *    portais**: eles renderizam dentro do `#root`, junto da página. Marcar o
 *    `#root` inteiro inertizaria o próprio diálogo. Então subimos do nó do
 *    diálogo até o `<body>` marcando, em cada nível, só os irmãos que **não**
 *    contêm o diálogo — a mesma tática do `aria-hidden` do `focus-lock`.
 *
 * Os três cuidados que o código carrega, e que a versão ingênua erra:
 *
 *  (a) **Diálogos empilhados**: tudo é por CONTAGEM DE REFERÊNCIA — o scroll
 *      (`lockCount`) e cada elemento inertizado (`inertRefs`). Fechar o de cima
 *      devolve o fundo ao estado do de baixo, não ao estado destravado.
 *  (b) **Restauro exato**: os valores originais de `overflow` são guardados na
 *      PRIMEIRA trava e devolvidos na última (string vazia devolve a folha de
 *      estilo, não um "visible" inventado); a posição de scroll do documento é
 *      relida e reposta se o navegador a tiver mexido.
 *  (c) **`inert` não existe em todo lugar** (WebView antigo de fabricante):
 *      com suporte, `el.inert = true` já tira do foco E do leitor; sem suporte,
 *      cai em `aria-hidden="true"` + o trap de Tab que já existe aqui. O que
 *      desmarcamos é só o que MARCAMOS (o valor fica no `data-sm2-inert`), pra
 *      não apagar um `aria-hidden` que era da aplicação.
 *  (d) **Desmontagem abrupta**: nada mora em estado de React — a soltura toda
 *      acontece no cleanup do efeito, que o React roda sempre, e as contagens
 *      são saneadas (`Math.max(0, …)`) pra um cleanup a mais nunca deixar o app
 *      travado com o body sem scroll.
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

/* ───────────────────────── o fundo travado ─────────────────────────────── */

/** Diálogos abertos AGORA. A guarda de scroll deixa passar o que nasce neles. */
const openDialogs = new Set<HTMLElement>();

/** Quantos diálogos seguram a trava de scroll. Nunca fica negativo. */
let lockCount = 0;

/** `overflow` original de `<html>`/`<body>`, guardado na primeira trava. */
let savedOverflow: { html: string; body: string } | null = null;

/** Contagem por elemento inertizado — irmão pode ser marcado por 2 diálogos. */
const inertRefs = new Map<Element, number>();

const supportsInert = () =>
  typeof HTMLElement !== 'undefined' && 'inert' in HTMLElement.prototype;

/** Nada disto é visível nem focável; marcar só suja o DOM. */
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'TEMPLATE', 'NOSCRIPT', 'TITLE']);

function markInert(el: Element) {
  const n = inertRefs.get(el) ?? 0;
  if (n === 0) {
    if (supportsInert()) {
      (el as HTMLElement & { inert: boolean }).inert = true;
      el.setAttribute('data-sm2-inert', 'inert');
    } else if (el.hasAttribute('aria-hidden')) {
      // Já estava escondido pela aplicação: não mexemos, e não devolvemos nada.
      el.setAttribute('data-sm2-inert', 'kept');
    } else {
      el.setAttribute('aria-hidden', 'true');
      el.setAttribute('data-sm2-inert', 'aria');
    }
  }
  inertRefs.set(el, n + 1);
}

function unmarkInert(el: Element) {
  const n = inertRefs.get(el) ?? 0;
  if (n > 1) {
    inertRefs.set(el, n - 1);
    return;
  }
  inertRefs.delete(el);
  const how = el.getAttribute('data-sm2-inert');
  if (how === 'inert') (el as HTMLElement & { inert: boolean }).inert = false;
  else if (how === 'aria') el.removeAttribute('aria-hidden');
  el.removeAttribute('data-sm2-inert');
}

/**
 * Marca como inerte tudo que NÃO é ancestral nem descendente de `node`.
 * Devolve a função que desfaz exatamente o que esta chamada fez.
 */
function hideOthers(node: HTMLElement): () => void {
  const marked: Element[] = [];
  let cur: Element = node;
  const body = document.body;
  while (cur.parentElement && cur !== body) {
    const parent = cur.parentElement;
    for (const sibling of Array.from(parent.children)) {
      if (sibling === cur || SKIP_TAGS.has(sibling.tagName)) continue;
      markInert(sibling);
      marked.push(sibling);
    }
    cur = parent;
  }
  return () => { for (const el of marked) unmarkInert(el); };
}

/**
 * Cancela rolagem nascida FORA de qualquer diálogo aberto. É o que segura o
 * scroller interno do `App.tsx` — `overflow: hidden` no body não o alcança.
 */
function scrollGuard(e: Event) {
  const target = e.target as Node | null;
  if (target) {
    for (const dialog of openDialogs) {
      if (dialog === target || dialog.contains(target)) return;
    }
  }
  if (e.cancelable) e.preventDefault();
}

function lockBackground(): () => void {
  if (typeof document === 'undefined' || !document.body) return () => {};
  const html = document.documentElement;
  const body = document.body;

  if (lockCount === 0) {
    savedOverflow = { html: html.style.overflow, body: body.style.overflow };
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    document.addEventListener('touchmove', scrollGuard, { passive: false, capture: true });
    document.addEventListener('wheel', scrollGuard, { passive: false, capture: true });
  }
  lockCount += 1;
  // Posição do documento: relida DEPOIS de travar, porque é travar que pode
  // fazer o navegador saltar para o topo.
  const x = typeof window === 'undefined' ? 0 : window.scrollX;
  const y = typeof window === 'undefined' ? 0 : window.scrollY;

  let released = false;
  return () => {
    if (released) return; // cleanup duplicado não pode destravar o de baixo
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount > 0) return;
    document.removeEventListener('touchmove', scrollGuard, true);
    document.removeEventListener('wheel', scrollGuard, true);
    html.style.overflow = savedOverflow ? savedOverflow.html : '';
    body.style.overflow = savedOverflow ? savedOverflow.body : '';
    savedOverflow = null;
    // (b) devolve o scroll EXATAMENTE onde estava, e só se saiu do lugar.
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function'
        && (window.scrollX !== x || window.scrollY !== y)) {
      try { window.scrollTo(x, y); } catch { /* jsdom não implementa; tudo bem */ }
    }
  };
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

    // (5) O fundo para de existir: sem rolagem, sem leitor de tela. Antes do
    // foco inicial — inertizar depois roubaria o foco que acabamos de dar.
    openDialogs.add(node);
    const releaseScroll = lockBackground();
    const releaseInert = hideOthers(node);

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
      // (5') Solta o fundo. Primeiro o inerte, depois o scroll: devolver o foco
      // a um elemento ainda inerte é o jeito de perder o foco para o `<body>`.
      openDialogs.delete(node);
      releaseInert();
      releaseScroll();
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
