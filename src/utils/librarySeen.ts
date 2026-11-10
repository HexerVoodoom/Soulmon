/**
 * "JÁ VISTOS" DA BIBLIOTECA (H17) — dono único da lista local de ids de Soulmon de jogadores que a pessoa já viu.
 * Dois caminhos escrevem aqui, com a MESMA regra: abrir a ficha na Biblioteca e ENFRENTAR o oponente (Torneio/Duelo).
 * O cliente não distingue jogador de simulado (o servidor nunca expõe a flag), então todo oponente entra igual.
 * Idempotente (mesmo id nunca duplica) e tolerante a lixo/storage indisponível (`safeStorage`). Chave congelada:
 * `STORAGE_KEYS.LIBRARY_SEEN`.
 *
 * 10/11/2026: a lista passou a viver NO SAVE (`GameState.librarySeen`, vai à nuvem: trocar de aparelho não perde os "vistos").
 * A chave local continua sendo LIDA (migração idempotente na hidratação, por união) e nunca é apagada; sem provider de jogo
 * (testes/uso isolado) `markSeenId` ainda grava nela. Espelho no servidor: `functions/api/_libraryMemory.js`.
 */
import { readJson, writeJson } from './safeStorage';
import { STORAGE_KEYS } from './storageKeys';

/** Os ids já vistos, lidos com defesa (lixo vira lista vazia). */
export function readSeenIds(): string[] {
  const v = readJson<unknown>(STORAGE_KEYS.LIBRARY_SEEN, []);
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

/** Marca `id` como visto. Devolve a lista resultante (a mesma referência de `prev` se já estava). */
export function addSeenId(prev: readonly string[], id: string): readonly string[] {
  return prev.includes(id) ? prev : [...prev, id];
}

/** Lê, marca e grava. Sem efeito para id vazio ou já visto. */
export function markSeenId(id: string | null | undefined): void {
  if (!id || typeof id !== 'string') return;
  const cur = readSeenIds();
  if (cur.includes(id)) return;
  writeJson(STORAGE_KEYS.LIBRARY_SEEN, [...cur, id]);
}

/** Teto de ids vistos no save (a mais antiga sai quando passa disso). Espelho: `SEEN_MAX` em `_libraryMemory.js`. */
export const SEEN_MAX = 500;
/** Id de jogador/simulado seguro (sid hex, `sim_0001`, pid...). Espelho: `ID_JOGADOR` em `_libraryMemory.js`. */
export const ID_JOGADOR = /^[A-Za-z0-9_.:-]{1,64}$/;

/** Lista crua (save, nuvem, localStorage) -> ids seguros, sem repetir, em ordem, no máximo `SEEN_MAX` (os mais recentes ficam). */
export function sanitizeSeenIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const set = new Set<string>();
  for (const x of raw) {
    if (typeof x !== 'string' || !ID_JOGADOR.test(x) || set.has(x)) continue;
    set.add(x);
    out.push(x);
  }
  return out.length > SEEN_MAX ? out.slice(-SEEN_MAX) : out;
}

/** União de listas de ids (a 1ª manda na ordem). Idempotente: `union(union(a,b),b)` == `union(a,b)`. */
export function unionSeenIds(...lists: unknown[]): string[] {
  return sanitizeSeenIds(lists.flatMap(l => (Array.isArray(l) ? l : [])));
}

/** Marca `id` no estado do jogo. Já visto/id inválido = o MESMO objeto (não dispara save em nuvem). */
export function addSeenToState<T extends { librarySeen?: string[] }>(prev: T, id: string | null | undefined): T {
  if (!id || typeof id !== 'string' || !ID_JOGADOR.test(id)) return prev;
  const cur = prev.librarySeen ?? [];
  if (cur.includes(id)) return prev;
  return { ...prev, librarySeen: sanitizeSeenIds([...cur, id]) };
}
