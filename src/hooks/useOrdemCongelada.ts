import { useEffect, useRef, useState } from 'react';

/**
 * A ORDEM DA LISTA NÃO SALTA SOB O DEDO (QA L06-07, decisão do dono 21/10/2026): ao concluir um item da Home os concluídos
 * migram para o fim, e o toque seguinte no MESMO ponto acertava OUTRO item. Este gancho devolve os ids recém-concluídos,
 * que ficam "congelados" na posição de antes por `ms` (o padrão, 2 s) antes de descer. Pura em relação ao resto: só olha
 * a lista de ids concluídos e o relógio de `setTimeout`.
 *
 * Itens que JÁ estavam concluídos na primeira pintura nunca congelam (só há congelamento depois de uma conclusão ao vivo).
 */
export const ORDEM_CONGELADA_MS = 2000;

export function useOrdemCongelada(doneIds: readonly string[], ms: number = ORDEM_CONGELADA_MS): ReadonlySet<string> {
  const anterior = useRef<ReadonlySet<string> | null>(null);
  const timers = useRef<number[]>([]);
  const [congelados, setCongelados] = useState<ReadonlySet<string>>(() => new Set());
  const chave = [...doneIds].sort().join('|');
  useEffect(() => {
    const agora = new Set(doneIds);
    const antes = anterior.current;
    anterior.current = agora;
    if (!antes) return; // 1ª pintura: nada congela
    const novos = doneIds.filter(id => !antes.has(id));
    if (novos.length === 0) return;
    setCongelados(prev => new Set([...prev, ...novos]));
    // Um prazo POR conclusão: a limpeza do efeito NÃO cancela os prazos pendentes (uma 2ª conclusão não pode
    // deixar a 1ª congelada para sempre); eles só caem junto com o componente.
    const t = window.setTimeout(() => {
      timers.current = timers.current.filter(x => x !== t); // o prazo que venceu sai da lista (não acumula numa sessão longa)
      setCongelados(prev => { const n = new Set(prev); novos.forEach(id => n.delete(id)); return n; });
    }, ms);
    timers.current.push(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, ms]);
  useEffect(() => () => { timers.current.forEach(t => window.clearTimeout(t)); timers.current = []; }, []);
  return congelados;
}
