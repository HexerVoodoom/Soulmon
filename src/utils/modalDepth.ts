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

/** Quantos modais abertos NÃO contêm `el` (sem `el`: todos). */
export function modalsAbove(el?: Element | null): number {
  if (typeof document === 'undefined') return 0;
  let n = 0;
  document.querySelectorAll(SEL).forEach(m => { if (!el || !m.contains(el)) n++; });
  return n;
}

/** Quantos modais há abertos agora (para testes e leitura pontual). */
export const modalDepth = (): number => modalsAbove(null);

/**
 * `true` quando há um modal aberto POR CIMA do elemento: o voltar da tela fica
 * desabilitado; o voltar de dentro do próprio modal só esmaece se outro modal
 * abrir sobre ele.
 */
export function useBackDimmed(ref: RefObject<Element | null>): boolean {
  const [dimmed, setDimmed] = useState(false);
  useEffect(() => {
    const read = () => setDimmed(modalsAbove(ref.current) > 0);
    read();
    return subscribe(read);
  }, [ref]);
  return dimmed;
}
