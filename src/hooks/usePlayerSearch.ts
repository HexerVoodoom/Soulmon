/**
 * Busca enquanto digita (REGISTRO §321): espera `PLAYER_SEARCH_DEBOUNCE_MS` depois da última tecla, cancela a chamada
 * anterior (só a resposta do termo ATUAL chega à tela) e guarda o resultado de cada termo na sessão da folha
 * (apagar uma letra e digitar de novo não chama o servidor outra vez).
 *
 * Estados (cada um tem a sua tela, nada de "carregando" eterno):
 *  - `short`   — menos de 2 caracteres: nenhuma chamada, a dica do mínimo;
 *  - `loading` — esperando o servidor (ou a pausa da digitação);
 *  - `ready`   — `hits` pode ser vazio ("ninguém com esse começo");
 *  - `error`   — `errorKind`: sem rede, muitas buscas, sem conta, servidor.
 */
import { useEffect, useRef, useState } from 'react';
import {
  PLAYER_SEARCH_DEBOUNCE_MS, PlayerSearchError, foldPlayerName, isSearchableQuery, searchPlayers,
  type PlayerSearchErrorKind, type PlayerSearchHit,
} from '../utils/playerSearch';

export type PlayerSearchState =
  | { status: 'short' }
  | { status: 'loading' }
  | { status: 'ready'; hits: PlayerSearchHit[] }
  | { status: 'error'; errorKind: PlayerSearchErrorKind };

/** `search` é injetável só para teste; o padrão é o cliente real. */
export function usePlayerSearch(
  saveId: string,
  query: string,
  { search = searchPlayers, debounceMs = PLAYER_SEARCH_DEBOUNCE_MS }: { search?: typeof searchPlayers; debounceMs?: number } = {},
): { state: PlayerSearchState; retry: () => void } {
  const [state, setState] = useState<PlayerSearchState>({ status: 'short' });
  /** "Tentar de novo" depois de um erro: o mesmo termo, outra chamada. */
  const [tentativa, setTentativa] = useState(0);
  const cache = useRef(new Map<string, PlayerSearchHit[]>());
  const termo = foldPlayerName(query);

  useEffect(() => {
    if (!isSearchableQuery(termo)) { setState({ status: 'short' }); return; }
    const guardado = cache.current.get(termo);
    if (guardado) { setState({ status: 'ready', hits: guardado }); return; }
    setState({ status: 'loading' });
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) { setState({ status: 'error', errorKind: 'offline' }); return; }
      search(saveId, termo, ctrl.signal)
        .then(hits => {
          if (ctrl.signal.aborted) return;
          cache.current.set(termo, hits);
          setState({ status: 'ready', hits });
        })
        .catch((e: unknown) => {
          if (ctrl.signal.aborted || (e as { name?: string } | null)?.name === 'AbortError') return;
          setState({ status: 'error', errorKind: e instanceof PlayerSearchError ? e.kind : 'server' });
        });
    }, debounceMs);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [saveId, termo, search, debounceMs, tentativa]);

  return { state, retry: () => setTentativa(n => n + 1) };
}
