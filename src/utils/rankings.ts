// Cliente do ranking genérico (`functions/api/_rankings.js` / `rankings.js`, BACKLOG-BETA3 M8).
// Mesmo contrato para todo jogo: `submitScore(game, saveId, score)` e `fetchRanking(game, saveId)`.
import { authHeaders } from './auth';

export type RankedGame = 'dino' | 'ppt' | 'match3' | 'eco' | 'rogue-dungeon';
export type RankingPeriod = 'weekly' | 'monthly';
export type RankingTierId = 'madeira' | 'bronze' | 'prata' | 'ouro' | 'platina' | 'diamante';

export interface RankingRow { rank: number; name: string; score: number; me: boolean }
export interface RankingMe { score: number; tier: RankingTierId; rank: number | null }
export interface RankingBoard {
  game: RankedGame;
  period: RankingPeriod;
  periodKey: string;
  top: RankingRow[];
  me: RankingMe | null;
}
export interface SubmitResult extends RankingBoard { improved: boolean; best: number }

const BASE = '/api/rankings';

/** Nomes das faixas (mesma escada de `tournamentTiers.ts`). */
export const RANKING_TIER_NAMES: Record<RankingTierId, { pt: string; en: string }> = {
  madeira: { pt: 'Madeira', en: 'Wood' },
  bronze: { pt: 'Bronze', en: 'Bronze' },
  prata: { pt: 'Prata', en: 'Silver' },
  ouro: { pt: 'Ouro', en: 'Gold' },
  platina: { pt: 'Platina', en: 'Platinum' },
  diamante: { pt: 'Diamante', en: 'Diamond' },
};

async function parse<T>(res: Response): Promise<T> {
  let data: unknown;
  try { data = await res.json(); } catch { throw new Error(`resposta ilegível (${res.status})`); }
  if (!res.ok) throw new Error((data as { error?: string } | null)?.error || `request failed (${res.status})`);
  return data as T;
}

/** Envia o score do fim da partida. O servidor guarda só o MELHOR do período. */
export async function submitScore(game: RankedGame, saveId: string, score: number, period: RankingPeriod = 'weekly'): Promise<SubmitResult> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify({ id: saveId, game, period, score: Math.max(0, Math.floor(score)) }),
  });
  return parse<SubmitResult>(res);
}

export async function fetchRanking(game: RankedGame, saveId: string, period: RankingPeriod = 'weekly', top = 10): Promise<RankingBoard> {
  const qs = new URLSearchParams({ game, period, id: saveId, top: String(top) });
  const res = await fetch(`${BASE}?${qs.toString()}`, { headers: await authHeaders() });
  return parse<RankingBoard>(res);
}
