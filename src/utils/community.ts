// Cliente da API de comunidade (functions/api/community.js): perfil público,
// Tournament (PvP assíncrono) e Biblioteca (diretório + amigos + presentes).
import { authHeaders } from './auth';

const BASE = '/api/community';

// TODA chamada leva o token — inclusive as GET. O servidor autoriza o ATOR de
// `friends`/`gift`/`match`/`trophies`/`gifts` (o `claim=1` das duas últimas é
// destrutivo), e não só o `profile`. Sem o header aqui, essas rotas passam a
// responder 401 no instante em que o FIREBASE_PROJECT_ID for ligado.
async function call<T>(action: string, opts: { method?: 'GET' | 'POST'; params?: Record<string, string>; body?: unknown } = {}): Promise<T> {
  const method = opts.method ?? 'GET';
  const qs = new URLSearchParams({ action, ...(opts.params ?? {}) });
  const auth = await authHeaders();
  const res = await fetch(`${BASE}?${qs.toString()}`, {
    method,
    headers: method === 'POST' ? { 'Content-Type': 'application/json', ...auth } : auth,
    body: method === 'POST' ? JSON.stringify(opts.body ?? {}) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `request failed (${res.status})`);
  return data as T;
}

export interface PublicProfileInput {
  id: string;
  name: string;
  stage: string;
  petName?: string;
  unlockedStages?: string[];
  pvpEnabled: boolean;
  attrs?: { virus: number; data: number; vaccine: number };
  tasksDone?: number;
}

/**
 * O que o servidor RESPONDE ao gravar o perfil — e não é só `ok`.
 *
 * O tipo antigo era `{ ok: true }`, e essa mentira de tipo custava
 * comportamento: `POST profile` aceita `pvpEnabled` do cliente mas tem um gate
 * de Vínculo (`BOND_PVP_MIN_LEVEL`, `functions/api/community.js`), e quando ele
 * barra, o perfil é gravado com `pvpEnabled: false` e a resposta traz o porquê.
 * O comentário do servidor diz para que esses campos existem, na letra: *"para
 * o app poder explicar em vez de sumir com o botão em silêncio"*. Enquanto o
 * tipo não os declarava, ninguém os lia.
 *
 * `pvpEnabled` é o que FOI GRAVADO, que pode divergir do que foi pedido — é o
 * campo a acreditar, porque o servidor é quem decide (o cliente é editável).
 */
export interface ProfilePushResult {
  ok: true;
  /** O estado REAL no servidor depois da gravação. */
  pvpEnabled?: boolean;
  /** Só aparece quando um pedido de LIGAR o PvP foi recusado pelo gate. */
  pvpBlocked?: boolean;
  /** O nível de Vínculo que o servidor apurou. `null` quando não chegou a apurar. */
  bondLevel?: number | null;
  /** O nível exigido, dito pelo servidor — nunca reimplementado aqui. */
  minBondLevel?: number;
}

export const pushProfile = (p: PublicProfileInput) =>
  call<ProfilePushResult>('profile', { method: 'POST', body: p });

/**
 * O que o diretório devolve de OUTRA pessoa. `rankPoints` e `tasksDone` saíram
 * em 06/09/2026 (WP4.11 / proibição #21): desempenho alheio não trafega, e o
 * corte é no servidor justamente para que uma UI futura não consiga
 * reintroduzi-lo por descuido. O que resta é presença — quem é, que criatura
 * tem, há quanto tempo joga.
 */
export interface DirectoryPlayer {
  id: string; name: string; petName: string; stage: string;
  unlockedStages: string[]; pvpEnabled: boolean; daysPlaying: number;
}
export const listPlayers = (search = '') =>
  call<{ players: DirectoryPlayer[] }>('players', { params: search ? { search } : {} });

export interface PlayerDetail extends DirectoryPlayer {
  friends: string[]; wins: number; losses: number;
}
export const getPlayer = (id: string) =>
  call<{ found: boolean; player?: PlayerDetail }>('player', { params: { id } });

export interface Opponent { id: string; name: string; petName: string; stage: string }
export const getOpponents = (id: string) =>
  call<{ opponents: Opponent[]; matchesLeft: number }>('opponents', { params: { id } });

export interface MatchResult {
  won: boolean; myScore: number; oppScore: number; points: number; matchesLeft: number;
  opponent: { name: string; petName: string; stage: string };
}
export const playMatch = (id: string, opponentId: string) =>
  call<MatchResult>('match', { method: 'POST', body: { id, opponentId } });

export interface RankRow {
  id: string; name: string; petName: string; stage: string;
  points: number; wins: number; losses: number;
  /** WP4.13 — pontos LIFETIME, que só somam. É deles que sai a FAIXA; os
   *  `points` acima são da season e caem (derrota, ser sorteado, virada de
   *  mês). Save antigo do servidor pode não trazer: `?? 0`, nunca `points`. */
  lifetime?: number;
}
export const getRank = (season?: string) =>
  call<{ season: string; rank: RankRow[] }>('rank', { params: season ? { season } : {} });
export const getSeasonResult = (season: string) =>
  call<{ season: string; top3: RankRow[] }>('seasonResult', { params: { season } });

export const addFriend = (id: string, friendId: string) =>
  call<{ ok: true; friends: string[] }>('friends', { method: 'POST', body: { id, friendId } });
export const removeFriend = (id: string, friendId: string) =>
  call<{ ok: true; friends: string[] }>('friends', { method: 'POST', body: { id, friendId, remove: true } });

export const sendGift = (id: string, friendId: string) =>
  call<{ ok: true }>('gift', { method: 'POST', body: { id, friendId } });
export const getGifts = (id: string, claim = false) =>
  call<{ gifts: Array<{ from: string; bits: number; at: number }> }>('gifts', { params: { id, ...(claim ? { claim: '1' } : {}) } });

export const getPendingTrophies = (id: string, claim = false) =>
  call<{ trophies: Array<{ season: string; place: 1 | 2 | 3 }> }>('trophies', { params: { id, ...(claim ? { claim: '1' } : {}) } });
