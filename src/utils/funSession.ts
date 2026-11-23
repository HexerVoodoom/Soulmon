/**
 * 🎟️ Jogos do Salão que passam pelo funil de custo. A SESSÃO (1 energia = 3 rodadas em 30 min, 04/11/2026) foi SUBSTITUÍDA pelos
 * TICKETS em 09/11/2026 — a regra viva mora em `utils/funTickets.ts`. Aqui ficou o que ainda é compartilhado:
 * a lista de jogos e o sanitizador do campo `funSession`, que segue lido do save antigo (leitura tolerante, ninguém o escreve mais).
 */
export type FunGame = 'dino' | 'ppt' | 'match3' | 'barrage';
export const FUN_GAMES: readonly FunGame[] = ['dino', 'ppt', 'match3', 'barrage'];
export function isFunGame(g: unknown): g is FunGame {
  return typeof g === 'string' && (FUN_GAMES as readonly string[]).includes(g);
}

/** Legado do save: quando a sessão abriu (ms) e quantas rodadas já começaram nela. */
export interface FunSession { startedAt: number; rounds: number }
const LEGACY_ROUNDS = 3;

/** Lixo → `undefined`. */
export function sanitizeFunSession(raw: unknown): FunSession | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = raw as { startedAt?: unknown; rounds?: unknown };
  if (typeof r.startedAt !== 'number' || !Number.isFinite(r.startedAt) || r.startedAt < 0) return undefined;
  if (typeof r.rounds !== 'number' || !Number.isFinite(r.rounds)) return undefined;
  return { startedAt: Math.floor(r.startedAt), rounds: Math.min(LEGACY_ROUNDS, Math.max(0, Math.floor(r.rounds))) };
}

/** mm:ss (arredonda para cima, nunca negativo). */
export function formatMmSs(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
