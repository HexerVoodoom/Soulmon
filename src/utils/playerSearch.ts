/**
 * BUSCA DE JOGADORES POR PREFIXO (13/11/2026, pedido do dono, REGISTRO §321): o convite do clã (Salão → "Convidar") e o
 * "Convidar" da aba Amigos. A busca de verdade é do SERVIDOR (`functions/api/community.js` › `action=playerSearch`, índice
 * `nickf:` em `_profile.js`); aqui ficam a régua de dobra (espelho do servidor, com teste de paridade), o mínimo de caracteres
 * (o cliente não gasta chamada que o servidor recusaria) e o cliente HTTP.
 *
 * Regra: casa o COMEÇO do nome, na ordem, sem acento e sem caixa — "JOA" acha "João" e "Joana", não "Ana Joaquina".
 */
import { authHeaders } from './auth';
import { reagirContaExcluida } from './cloudSave';

/** Mínimo de caracteres (depois de dobrar). Espelho de `PLAYER_SEARCH_MIN` do servidor. */
export const PLAYER_SEARCH_MIN = 2;
/** Máximo de resultados que o servidor devolve. Espelho de `PLAYER_SEARCH_MAX`. */
export const PLAYER_SEARCH_MAX = 10;
/** Espera depois da última tecla antes de buscar (pedido do dono: ~200 ms). */
export const PLAYER_SEARCH_DEBOUNCE_MS = 200;

/** Nome → forma de busca: sem diacrítico, minúsculo, espaço colapsado. ESPELHO de `functions/api/_profile.js` › `foldNome`. */
export function foldPlayerName(raw: unknown): string {
  return String(raw ?? '').normalize('NFKD').replace(/\p{M}/gu, '').normalize('NFKC')
    .replace(/\p{C}/gu, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

/** O termo já serve para buscar (≥ `PLAYER_SEARCH_MIN` caracteres depois de dobrado). */
export const isSearchableQuery = (q: string): boolean => Array.from(foldPlayerName(q)).length >= PLAYER_SEARCH_MIN;

/** O nome começa com o termo (mesma régua do servidor). Termo curto demais nunca casa. */
export function nameStartsWith(name: unknown, q: string): boolean {
  if (!isSearchableQuery(q)) return false;
  return foldPlayerName(name).startsWith(foldPlayerName(q));
}

/** Um resultado: SÓ a vista pública (o servidor não manda mais nada — e o saneamento abaixo descarta o que vier a mais). */
export interface PlayerSearchHit {
  /** pid público (nunca o saveId). */
  id: string;
  name: string;
  /** Ausente = sem clã. */
  guildName?: string;
  stage: string;
  spriteUrl?: string;
  artLine?: string;
}

const PID = /^[a-zA-Z0-9_-]{8,64}$/;
const texto = (v: unknown, max: number): string => (typeof v === 'string' ? Array.from(v.trim()).slice(0, max).join('') : '');

/** Resposta do servidor → lista segura. Campo desconhecido (e-mail, saveId, aparelho…) NUNCA passa daqui. */
export function sanitizePlayerSearch(raw: unknown): PlayerSearchHit[] {
  const list = raw && typeof raw === 'object' && Array.isArray((raw as { players?: unknown }).players) ? (raw as { players: unknown[] }).players : [];
  const out: PlayerSearchHit[] = [];
  for (const it of list) {
    if (!it || typeof it !== 'object') continue;
    const o = it as Record<string, unknown>;
    const id = typeof o.id === 'string' && PID.test(o.id) ? o.id : '';
    const name = texto(o.name, 40);
    if (!id || !name) continue;
    const guildName = texto(o.guildName, 40);
    const stage = typeof o.stage === 'string' && /^[A-Za-z0-9_.-]{1,40}$/.test(o.stage) ? o.stage : 'rookie';
    const spriteUrl = texto(o.spriteUrl, 400);
    const artLine = typeof o.artLine === 'string' && /^[a-z0-9_-]{1,40}$/i.test(o.artLine) ? o.artLine : '';
    out.push({ id, name, stage, ...(guildName ? { guildName } : {}), ...(spriteUrl ? { spriteUrl } : {}), ...(artLine ? { artLine } : {}) });
    if (out.length >= PLAYER_SEARCH_MAX) break;
  }
  return out;
}

/** Por que a busca falhou — cada tipo tem a sua frase na tela. */
export type PlayerSearchErrorKind = 'offline' | 'rate' | 'login' | 'server';
export class PlayerSearchError extends Error {
  constructor(public readonly kind: PlayerSearchErrorKind, public readonly status: number) {
    super(`player-search:${kind}:${status}`);
    this.name = 'PlayerSearchError';
  }
}

/**
 * Busca no servidor. Termo curto devolve `[]` SEM chamar (o servidor recusaria com 400).
 * `signal` cancela a chamada velha quando a pessoa continua digitando.
 */
export async function searchPlayers(saveId: string, q: string, signal?: AbortSignal): Promise<PlayerSearchHit[]> {
  if (!isSearchableQuery(q)) return [];
  const qs = new URLSearchParams({ action: 'playerSearch', id: saveId, q: q.trim().slice(0, 40) });
  let res: Response;
  try {
    const auth = await authHeaders();
    res = await fetch(`/api/community?${qs.toString()}`, { headers: auth, signal });
  } catch (e) {
    if ((e as { name?: string } | null)?.name === 'AbortError') throw e;
    throw new PlayerSearchError('offline', 0);
  }
  if (res.status === 410) {
    void reagirContaExcluida({});
    throw new PlayerSearchError('login', 410);
  }
  if (res.status === 429) throw new PlayerSearchError('rate', 429);
  if (res.status === 401 || res.status === 403) throw new PlayerSearchError('login', res.status);
  if (!res.ok) throw new PlayerSearchError('server', res.status);
  let data: unknown;
  try { data = await res.json(); } catch { throw new PlayerSearchError('server', res.status); }
  return sanitizePlayerSearch(data);
}
