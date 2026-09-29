import { useEffect, useRef } from 'react';

/**
 * PILHA DE "VOLTAR" DAS CAMADAS ABERTAS — folha de lote, minijogo, duelo.
 *
 * O grafo de telas (`navigation.ts` › `viewBack`) só conhece Home/Mapa/área. O
 * que abre POR CIMA de uma tela (a `AreaSheet`, um jogo em tela cheia) não é
 * uma view — então, antes, o botão voltar do Android pulava a folha e levava
 * direto ao Mapa. Aqui cada camada aberta se registra, e o voltar (botão
 * físico do Android e `popstate` do navegador) fecha primeiro a MAIS RECENTE;
 * só sem camada aberta é que o grafo de telas decide.
 */
const stack: Array<() => void> = [];

/** Registra uma camada; devolve a função que a tira da pilha. */
export function pushBackLayer(close: () => void): () => void {
  stack.push(close);
  return () => {
    const i = stack.lastIndexOf(close);
    if (i >= 0) stack.splice(i, 1);
  };
}

/** Fecha a camada do topo. `true` se havia uma (o voltar já foi consumido). */
export function closeTopBackLayer(): boolean {
  const top = stack[stack.length - 1];
  if (!top) return false;
  top();
  return true;
}

export function hasBackLayer(): boolean {
  return stack.length > 0;
}

/** Enquanto `active`, o voltar do sistema chama `close` em vez de mudar de tela. */
export function useBackLayer(active: boolean, close: () => void): void {
  const ref = useRef(close);
  ref.current = close;
  useEffect(() => {
    if (!active) return;
    return pushBackLayer(() => ref.current());
  }, [active]);
}
