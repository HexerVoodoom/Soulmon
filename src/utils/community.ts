// Cliente da API de comunidade (functions/api/community.js): perfil público,
// Tournament (PvP assíncrono) e Biblioteca (diretório + amigos + presentes).
const BASE = '/api/community';

async function call<T>(action: string, opts: { method?: 'GET' | 'POST'; params?: Record<string, string>; body?: unknown } = {}): Promise<T> {
  const method = opts.method ?? 'GET';
  const qs = new URLSearchParams({ action, ...(opts.params ?? {}) });
  const res = await fetch(`${BASE}?${qs.toString()}`, {
    method,
    headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
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
}

export const pushProfile = (p: PublicProfileInput) =>
  call<{ ok: true }>('profile', { method: 'POST', body: p });

export interface DirectoryPlayer {
  id: string; name: string; petName: string; stage: string;
  unlockedStages: string[]; pvpEnabled: boolean; rankPoints: number; daysPlaying: number;
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

export interface RankRow { id: string; name: string; petName: string; stage: string; points: number; wins: number; losses: number }
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
