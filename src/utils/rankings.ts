// Cliente do ranking genérico (`functions/api/_rankings.js` / `rankings.js`, BACKLOG-BETA3 M8).
// Mesmo contrato para todo jogo: `submitScore(game, saveId, score)` e `fetchRanking(game, saveId)`.
import { authHeaders } from './auth';
import { emitFeat, RANK_TIER_ORDER } from './feats';

// `dino` (sem nível) só existe para cliente antigo; o novo envia `dino-1`/`dino-2`. `zip`/`patches`: TEMPO em ms (menor vence).
export type RankedGame = 'dino' | 'dino-1' | 'dino-2' | 'ppt' | 'match3' | 'eco' | 'endless-rift' | 'rogue-dungeon' | 'soul-barrage' | 'zip' | 'patches';

/** Jogos de tempo (menor é melhor): o score é o tempo de resolução em ms. */
export const TIME_RANKED_GAMES: readonly RankedGame[] = ['zip', 'patches'];
export const isTimeRanked = (game: RankedGame): boolean => TIME_RANKED_GAMES.includes(game);

/** Tamanho de grade em que o tempo vale para o ranking (todos comparam a mesma grade; Zip e Patches sobem de 4 a 8 por nível). */
export const TIME_RANK_SIZE = 6;

/** `m:ss.d` de um tempo em ms. */
export function formatRankTime(ms: number): string {
  const t = Math.max(0, Math.round(ms / 100));
  const m = Math.floor(t / 600);
  const s = Math.floor((t % 600) / 10);
  return `${m}:${String(s).padStart(2, '0')}.${t % 10}`;
}
export type RankingPeriod = 'weekly' | 'monthly';
export type RankingTierId = 'madeira' | 'bronze' | 'prata' | 'ouro' | 'platina' | 'diamante';

export interface RankingRow { rank: number; name: string; score: number; me: boolean; /** Só `endless-rift`: 1..3 = esta linha recebe prêmio (simulados não contam; o rótulo "#4" pode levar o 1º prêmio). */ prizePlace?: number }
/** `tier` é `null` nos jogos de tempo (sem faixa: o tempo se compara só dentro da mesma grade). */
export interface RankingMe { score: number; tier: RankingTierId | null; rank: number | null }
export interface RankingBoard {
  game: RankedGame;
  period: RankingPeriod;
  periodKey: string;
  top: RankingRow[];
  me: RankingMe | null;
  /** Só `endless-rift`: os Créditos que o SERVIDOR já creditou a este jogador no fechamento do mês anterior (só leitura). */
  prize?: { month: string; credits: number; place: number } | null;
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
  const out = await parse<SubmitResult>(res);
  // Conquista "faixa de ouro" (rodada 6): guarda a MAIOR faixa já vista (índice+1: madeira 1 … diamante 6). Só o que o servidor devolveu.
  const faixa = out?.me?.tier ? RANK_TIER_ORDER.indexOf(out.me.tier) + 1 : 0;
  if (faixa > 0) emitFeat('rankTier', faixa);
  return out;
}

export async function fetchRanking(game: RankedGame, saveId: string, period: RankingPeriod = 'weekly', top = 10): Promise<RankingBoard> {
  const qs = new URLSearchParams({ game, period, id: saveId, top: String(top) });
  const res = await fetch(`${BASE}?${qs.toString()}`, { headers: await authHeaders() });
  return parse<RankingBoard>(res);
}
