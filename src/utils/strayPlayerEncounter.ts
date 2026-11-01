/**
 * DESGARRADO DE JOGADOR NOS ENCONTROS (01/11/2026, dono, REGISTRO §213 emenda): o Soulmon de quem está há 90+ dias sem entrar
 * aparece como SELVAGEM nas masmorras (Masmorra, Calabouço), nos minigames com inimigo (Combina 3 / Fenda) e na Arena —
 * NUNCA no Torneio. É só ARTE e rótulo por cima do inimigo sorteado: força, golpes, prêmio e semente seguem do slot (nenhum
 * `rng()` a mais, replays iguais).
 * - Chance rara e DETERMINÍSTICA por encontro (`STRAY_PLAYER_ENCOUNTER_CHANCE`), pela chave do encontro (hash próprio).
 * - Enfrentar = visto → `GameState.strayPlayersSeen` (o App registra o receptor com `setStrayPlayerSeenHandler`).
 * - O pool vem uma vez por sessão de `community?action=strays` (falha = vazio, em silêncio; pool vazio = nunca aparece).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { sanitizeStrayPool, type StrayPlayer } from './strayPlayers';
import { mulberry32 } from './combate/rng';

/** 1 em 40 encontros elegíveis (com pool não vazio). */
export const STRAY_PLAYER_ENCOUNTER_CHANCE = 1 / 40;

function hash(s: string): number {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h | 0;
}

/** Puro: o desgarrado de jogador deste encontro, ou `undefined`. Mesma chave + mesmo pool = mesmo resultado. */
export function strayPlayerForEncounter(pool: readonly StrayPlayer[], key: string | undefined): StrayPlayer | undefined {
  if (!key || pool.length === 0) return undefined;
  const r = mulberry32(hash(`stray-encounter|${key}`));
  if (r() >= STRAY_PLAYER_ENCOUNTER_CHANCE) return undefined;
  return pool[r() * pool.length | 0];
}

let poolPromise: Promise<StrayPlayer[]> | null = null;
/** O pool da sessão (uma chamada; falha = vazio). Import dinâmico: o chunk de entrada não carrega o cliente da comunidade. */
export function loadStrayPool(): Promise<StrayPlayer[]> {
  if (!poolPromise) poolPromise = import('./community').then(m => m.getStrays()).then(r => sanitizeStrayPool(r?.strays)).catch(() => []);
  return poolPromise;
}
/** Só para testes. */
export function resetStrayPoolForTests(pool?: StrayPlayer[]): void { poolPromise = pool ? Promise.resolve(pool) : null; }

let seenHandler: ((s: StrayPlayer) => void) | null = null;
/** O App registra quem grava o "visto" (devolve o desregistro). */
export function setStrayPlayerSeenHandler(fn: ((s: StrayPlayer) => void) | null): () => void {
  seenHandler = fn;
  return () => { if (seenHandler === fn) seenHandler = null; };
}

/**
 * Para cada chave de encontro, o desgarrado de jogador que cobre aquele inimigo (ou `undefined`). `null` na chave = encontro não
 * elegível (ex.: PvP). Cada (chave, desgarrado) é registrado como visto uma vez.
 */
export function useStrayPlayerEncounters(keys: readonly (string | null | undefined)[]): (StrayPlayer | undefined)[] {
  const [pool, setPool] = useState<StrayPlayer[]>([]);
  useEffect(() => { let vivo = true; loadStrayPool().then(p => { if (vivo) setPool(p); }); return () => { vivo = false; }; }, []);
  const sig = keys.join('\u0001');
  const out = useMemo(() => keys.map(k => strayPlayerForEncounter(pool, k ?? undefined)), [pool, sig]); // eslint-disable-line react-hooks/exhaustive-deps
  const reported = useRef(new Set<string>());
  useEffect(() => {
    out.forEach((s, i) => {
      const k = keys[i];
      if (!s || !k || reported.current.has(k)) return;
      reported.current.add(k);
      seenHandler?.(s);
    });
  }, [out]); // eslint-disable-line react-hooks/exhaustive-deps
  return out;
}
