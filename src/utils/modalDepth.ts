import { useEffect, useState, type RefObject } from 'react';

/**
 * Profundidade de modais abertos, DERIVADA do DOM (`[aria-modal="true"]`).
 *
 * Por que do DOM e não de um contador: os ~30 modais/folhas do app montam e
 * desmontam por caminhos diferentes (filas, portais, condicionais). Um contador
 * incrementado por efeito vaza quando alguém esquece o cleanup; o DOM nunca
 * mente — modal desmontado some da consulta. Um único MutationObserver
 * (criado quando o 1º voltar assina, desligado quando o último sai) avisa quem
 * lê. Regra do dono: com modal aberto, o VOLTAR do nível de baixo esmaece e
 * não responde; só o controle do modal de cima age.
 */
const SEL = '[aria-modal="true"]';
const listeners = new Set<() => void>();
let observer: MutationObserver | null = null;

function emit() { listeners.forEach(l => l()); }

function subscribe(l: () => void): () => void {
  listeners.add(l);
  if (!observer && typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
    observer = new MutationObserver(emit);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-modal'] });
  }
  return () => {
    listeners.delete(l);
    if (listeners.size === 0 && observer) { observer.disconnect(); observer = null; }
  };
}

/**
 * Quantos modais abertos estão POR CIMA de `el` (sem `el`: todos).
 *
 * "Por cima" = não contém `el` E vem DEPOIS do modal do próprio `el` na ordem do documento (os de dentro dele contam,
 * os portais abertos depois dele também). Um modal ANTERIOR que não contém `el` é o nível de BAIXO: a folha do Bosque
 * (`GroveFolha`, portal no `<body>`) abre de dentro da `AreaSheet` do Salão, e contar a `AreaSheet` desabilitava o
 * ÚNICO voltar da folha — o jogador ficava preso (hotfix 13/11/2026). `el` fora de qualquer modal: todo modal conta.
 */
export function modalsAbove(el?: Element | null, ignorarDentroDe?: Element | null): number {
  if (typeof document === 'undefined') return 0;
  const proprio = el?.closest?.(SEL) ?? null;
  let n = 0;
  document.querySelectorAll(SEL).forEach(m => {
    if (el && m.contains(el)) return;
    // Tela interna da MESMA folha (ex.: Porta da Hexsmith dentro da `AreaSheet`): não conta como "outro modal por cima".
    if (ignorarDentroDe && ignorarDentroDe.contains(m)) return;
    if (proprio && !(proprio.compareDocumentPosition(m) & Node.DOCUMENT_POSITION_FOLLOWING)) return;
    n++;
  });
  return n;
}

/** Quantos modais há abertos agora (para testes e leitura pontual). */
export const modalDepth = (): number => modalsAbove(null);

/**
 * `true` quando há um modal aberto POR CIMA do elemento: o voltar da tela fica
 * desabilitado; o voltar de dentro do próprio modal só esmaece se outro modal
 * abrir sobre ele — nunca por causa do modal de BAIXO que o abriu (ver `modalsAbove`).
 */
export function useBackDimmed(ref: RefObject<Element | null>, ignorarDentroDe?: (el: Element | null) => Element | null): boolean {
  const [dimmed, setDimmed] = useState(false);
  useEffect(() => {
    const read = () => setDimmed(modalsAbove(ref.current, ignorarDentroDe?.(ref.current)) > 0);
    read();
    return subscribe(read);
  }, [ref, ignorarDentroDe]);
  return dimmed;
}

/** Quantos modais há abertos agora, reativo (re-renderiza quando abre/fecha um). Base do gate ocioso (`hooks/useOcioso`). */
export function useModalDepth(): number {
  const [n, setN] = useState(() => modalDepth());
  useEffect(() => {
    const read = () => setN(modalDepth());
    read();
    return subscribe(read);
  }, []);
  return n;
}
