import { useEffect, useState } from 'react';

/**
 * Oferta PENDENTE com gate ocioso (12/11/2026): a fila guarda o que quer falar com o jogador; a cabeça só ENTRA na tela quando
 * `ocioso` é verdadeiro e, uma vez na tela, FICA até ser dispensada (o próprio modal da oferta abre um `aria-modal` e derrubaria
 * o ócio no meio da conversa). Devolve o id da oferta na tela, ou `null`. `onMostrar(id)` roda UMA vez, quando ela entra
 * (é onde se grava o "já ofereci"). Dispensar = tirar o id da fila; a próxima precisa do ócio de novo.
 */
export function useOfertaPendente(fila: readonly string[], ocioso: boolean, onMostrar?: (id: string) => void): string | null {
  const head = fila[0] ?? null;
  const [ativa, setAtiva] = useState<string | null>(null);
  useEffect(() => {
    if (head && ocioso && ativa !== head) { setAtiva(head); onMostrar?.(head); }
    else if (ativa !== null && ativa !== head) setAtiva(null);
    // `onMostrar` é leitura pontual; não deve reentrar a oferta
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [head, ocioso, ativa]);
  return head !== null && ativa === head ? head : null;
}
