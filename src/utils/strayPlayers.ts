/**
 * DESGARRADOS DE JOGADORES (01/11/2026, REGISTRO §213) — cliente.
 *
 * Regra do dono: desgarrado = o Soulmon de um jogador que ficou 90 dias sem entrar. Quem decide é o SERVIDOR
 * (`functions/api/_strays.js`: último acesso no perfil, `community?action=strays`). Aqui só: a forma do que chega, o
 * registro do que a pessoa VIU (vai para o save, `GameState.strayPlayersSeen`, aba Desgarrado da Biblioteca) e a escolha
 * estável do dia no Torneio vazio.
 * - No mundo ele aparece como SELVAGEM (rótulo `wildFoeLabel('rookie')`, sem nome do dono nem do bicho).
 * - Se o dono volta, o servidor o tira do pool (o Soulmon nunca saiu do save dele); quem já viu continua com o registro aqui.
 * - Os desgarrados ANTIGOS (formas fortes do roster, `wildFoeLabel`/`strayFoes.ts`) continuam exatamente como estavam.
 */
import { isSafeSpriteSrc } from './spriteLibrary';
import { mulberry32 } from './combate/rng';

export interface StrayPlayer { sid: string; stage: string; spriteUrl?: string; element?: string }
export interface StrayPlayerSeen extends StrayPlayer { at: string }

/** Teto do registro no save (o mais antigo fica; o novo além do teto não entra). */
export const STRAY_SEEN_MAX = 200;
const SID = /^[a-f0-9]{24}$/;
const STAGE = /^[A-Za-z0-9_.-]{1,40}$/;
const ELEMENT = /^[a-z][a-z0-9_-]{0,31}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Forma segura de UM desgarrado vindo do servidor (ou do save). `null` = descartado. URL só de host permitido. */
export function sanitizeStrayPlayer(raw: unknown): StrayPlayer | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.sid !== 'string' || !SID.test(r.sid)) return null;
  const out: StrayPlayer = { sid: r.sid, stage: typeof r.stage === 'string' && STAGE.test(r.stage) ? r.stage : 'rookie' };
  if (isSafeSpriteSrc(r.spriteUrl) && !String(r.spriteUrl).startsWith('data:')) out.spriteUrl = r.spriteUrl as string;
  if (typeof r.element === 'string' && ELEMENT.test(r.element)) out.element = r.element;
  return out;
}

/** O pool do servidor, saneado e sem repetição. */
export function sanitizeStrayPool(raw: unknown): StrayPlayer[] {
  if (!Array.isArray(raw)) return [];
  const out: StrayPlayer[] = [];
  for (const v of raw) { const s = sanitizeStrayPlayer(v); if (s && !out.some(o => o.sid === s.sid)) out.push(s); }
  return out.slice(0, 50);
}

/** O registro do save: forma de cada item + `at` (AAAA-MM-DD), sem repetir `sid`, teto `STRAY_SEEN_MAX`. Lixo = lista vazia. */
export function sanitizeStrayPlayersSeen(raw: unknown): StrayPlayerSeen[] {
  if (!Array.isArray(raw)) return [];
  const out: StrayPlayerSeen[] = [];
  for (const v of raw) {
    const s = sanitizeStrayPlayer(v);
    if (!s || out.some(o => o.sid === s.sid)) continue;
    const at = (v as Record<string, unknown>).at;
    out.push({ ...s, at: typeof at === 'string' && DAY.test(at) ? at : '1970-01-01' });
    if (out.length >= STRAY_SEEN_MAX) break;
  }
  return out;
}

/** Registra que a pessoa VIU este desgarrado. IDEMPOTENTE (já visto ou teto → o MESMO objeto); só acrescenta no fim. */
export function recordStrayPlayerSeen<T extends { strayPlayersSeen?: StrayPlayerSeen[] }>(prev: T, s: StrayPlayer, day: string): T {
  const have = prev.strayPlayersSeen ?? [];
  if (have.some(x => x.sid === s.sid) || have.length >= STRAY_SEEN_MAX) return prev;
  return { ...prev, strayPlayersSeen: [...have, { ...s, at: DAY.test(day) ? day : '1970-01-01' }] };
}

/** O desgarrado de jogador do dia no Torneio vazio, estável por conta e dia. Pool vazio = nenhum. */
export function strayPlayerForTournament(pool: readonly StrayPlayer[], saveId: string, dayKey: string): StrayPlayer | undefined {
  if (pool.length === 0) return undefined;
  let h = 2166136261;
  for (const ch of `stray-player|${saveId}|${dayKey}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return pool[mulberry32(h | 0)() * pool.length | 0];
}
