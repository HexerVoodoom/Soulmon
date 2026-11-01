/**
 * AVISO DE ENTRADA NOVA NA BIBLIOTECA (01/11/2026, pedido do dono) — dono único de "o que a Biblioteca ainda não mostrou".
 *
 * As três coleções da Biblioteca só CRESCEM e só ACRESCENTAM no fim: `bestiary` (Selvagem/Desgarrado), `defeatedElements`
 * (Elemento) e `strayPlayersSeen` (desgarrados de jogadores, §213). Então "entrada nova" = posição ≥ o tamanho que a lista tinha
 * na última abertura da Biblioteca. O save guarda só esses três números (`GameState.libraryAck = { b, e, s }`), não uma cópia.
 * - Save sem `libraryAck` (todo save anterior a hoje) nasce com os tamanhos ATUAIS: nada vira "NEW" retroativo.
 * - Abrir a Biblioteca congela o que estava novo para AQUELA visita (selo visível) e grava os tamanhos (`ackLibrary`):
 *   na próxima abertura o selo já não aparece.
 * Espelho de forma no servidor: `functions/api/_libraryAck.js`.
 */
export interface LibraryAck { b: number; e: number; s: number }
export interface LibraryLists { bestiary?: readonly string[]; defeatedElements?: readonly string[]; strayPlayersSeen?: readonly { sid: string }[] }

/** Teto de cada contador (forma; as listas nunca passam disto). */
export const LIBRARY_ACK_MAX = 100_000;

const ZERO: LibraryAck = { b: 0, e: 0, s: 0 };
const len = (l: readonly unknown[] | undefined): number => (Array.isArray(l) ? l.length : 0);
export const libraryLengths = (s: LibraryLists): LibraryAck => ({ b: len(s.bestiary), e: len(s.defeatedElements), s: len(s.strayPlayersSeen) });

const intOr = (v: unknown, fb: number): number => (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= LIBRARY_ACK_MAX ? v : fb);

/** Forma segura. Ausente/lixo = os tamanhos atuais (sem retroativo); contador maior que a lista é cortado no tamanho dela. */
export function sanitizeLibraryAck(raw: unknown, lists: LibraryLists): LibraryAck {
  const cur = libraryLengths(lists);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return cur;
  const r = raw as Record<string, unknown>;
  return { b: Math.min(intOr(r.b, cur.b), cur.b), e: Math.min(intOr(r.e, cur.e), cur.e), s: Math.min(intOr(r.s, cur.s), cur.s) };
}

export interface LibraryNewKeys { bestiary: ReadonlySet<string>; elements: ReadonlySet<string>; strays: ReadonlySet<string>; total: number }

/** As chaves ainda não vistas na Biblioteca. Sem `libraryAck` = estado novo (save antigo já foi hidratado com os tamanhos): tudo conta. */
export function libraryNewKeys(s: LibraryLists & { libraryAck?: LibraryAck }): LibraryNewKeys {
  const ack = s.libraryAck ?? ZERO;
  const bestiary = new Set((s.bestiary ?? []).slice(ack.b));
  const elements = new Set((s.defeatedElements ?? []).slice(ack.e));
  const strays = new Set((s.strayPlayersSeen ?? []).slice(ack.s).map(x => x.sid));
  return { bestiary, elements, strays, total: bestiary.size + elements.size + strays.size };
}

/** Contagem leve (sem montar conjuntos) — o que o aviso global observa. */
export function libraryNewCount(s: LibraryLists & { libraryAck?: LibraryAck }): number {
  const cur = libraryLengths(s);
  const ack = s.libraryAck ?? ZERO;
  return Math.max(0, cur.b - ack.b) + Math.max(0, cur.e - ack.e) + Math.max(0, cur.s - ack.s);
}

/** A Biblioteca foi aberta: tudo o que existe agora conta como visto. IDEMPOTENTE (nada novo → o MESMO objeto). */
export function ackLibrary<T extends LibraryLists & { libraryAck?: LibraryAck }>(prev: T): T {
  const cur = libraryLengths(prev);
  const a = prev.libraryAck;
  if (a && a.b === cur.b && a.e === cur.e && a.s === cur.s) return prev;
  return { ...prev, libraryAck: cur };
}

/** Texto EXATO do aviso (dono, 01/11/2026). O mesmo para 1 ou várias entradas: sem contagem, sem plural. */
export const LIBRARY_NEW_TEXT = 'A new entry has been recorded to the library';
export const LIBRARY_NEW_BADGE = 'NEW';
