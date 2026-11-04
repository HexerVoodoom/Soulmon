/**
 * 🎟️ SESSÃO DOS MINIJOGOS DE DIVERSÃO (pedido do dono, 04/11/2026 — REGISTRO §"Sessão de diversão").
 *
 * Os jogos do Salão (Corrida, PPT, Elemental Fusion, Chuva de Almas) custam a ENERGIA da Home, a mesma da Masmorra — para limitar o
 * tempo de tela e empurrar para as outras atividades, sem ser duro: 1 energia abre uma SESSÃO de `FUN_SESSION_ROUNDS` rodadas (de
 * qualquer jogo do Salão) que vale por `FUN_SESSION_MS`. Acabaram as rodadas ou o tempo → a próxima rodada cobra mais 1 energia.
 *
 * NÃO valem aqui: Ateliê da Mente (eco/zip/patches), Refúgio (respiração/bolhas), Masmorra (já cobra por camada).
 *
 * A porta ÚNICA é `startFunRound`: PURA, roda dentro do updater do `setGameState` e reconfere sobre `prev` (energia já com a
 * regeneração acertada). Recusa devolve a MESMA referência: dois toques no mesmo lote não cobram duas vezes. A energia mora no save
 * do aparelho (o servidor só guarda o save, não valida energia) — o mesmo caminho da Masmorra (`spendLayer`, `setEnergy`).
 * Save antigo sem `funSession` = nenhuma sessão aberta.
 */
import { setEnergy, settleEnergy, type HungerState } from './hunger';

export const FUN_SESSION_COST = 1;
export const FUN_SESSION_ROUNDS = 3;
export const FUN_SESSION_MS = 30 * 60 * 1000;

export type FunGame = 'dino' | 'ppt' | 'match3' | 'barrage';
export const FUN_GAMES: readonly FunGame[] = ['dino', 'ppt', 'match3', 'barrage'];
export function isFunGame(g: unknown): g is FunGame {
  return typeof g === 'string' && (FUN_GAMES as readonly string[]).includes(g);
}

/** No save: quando a sessão abriu (ms) e quantas rodadas já começaram nela. */
export interface FunSession { startedAt: number; rounds: number }

export interface FunSessionState extends HungerState { funSession?: FunSession }

/** Lixo → `undefined` (= nenhuma sessão). */
export function sanitizeFunSession(raw: unknown): FunSession | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = raw as { startedAt?: unknown; rounds?: unknown };
  if (typeof r.startedAt !== 'number' || !Number.isFinite(r.startedAt) || r.startedAt < 0) return undefined;
  if (typeof r.rounds !== 'number' || !Number.isFinite(r.rounds)) return undefined;
  return { startedAt: Math.floor(r.startedAt), rounds: Math.min(FUN_SESSION_ROUNDS, Math.max(0, Math.floor(r.rounds))) };
}

/** A sessão que ainda vale AGORA (com rodada sobrando e dentro do prazo). Relógio que voltou antes da abertura = não vale. */
export function activeFunSession(state: { funSession?: unknown }, nowMs: number): FunSession | undefined {
  const s = sanitizeFunSession(state.funSession);
  if (!s) return undefined;
  if (nowMs < s.startedAt || nowMs - s.startedAt >= FUN_SESSION_MS) return undefined;
  if (s.rounds >= FUN_SESSION_ROUNDS) return undefined;
  return s;
}

export interface FunSessionStatus {
  active: boolean;
  roundsLeft: number;
  /** ms até a sessão expirar (0 sem sessão). */
  msLeft: number;
  /** A próxima rodada vai cobrar energia? */
  costsEnergy: boolean;
  /** Dá para jogar agora (sessão aberta ou energia para abrir uma)? */
  canPlay: boolean;
}

export function funSessionStatus(state: FunSessionState, nowMs: number): FunSessionStatus {
  const s = activeFunSession(state, nowMs);
  if (s) return { active: true, roundsLeft: FUN_SESSION_ROUNDS - s.rounds, msLeft: s.startedAt + FUN_SESSION_MS - nowMs, costsEnergy: false, canPlay: true };
  const energy = settleEnergy(state, nowMs).energyPoints;
  return { active: false, roundsLeft: 0, msLeft: 0, costsEnergy: true, canPlay: Math.floor(Number(energy) || 0) >= FUN_SESSION_COST };
}

export type FunRoundRefusal = 'no-energy';

export function funRoundRefusal(state: FunSessionState, nowMs: number): FunRoundRefusal | undefined {
  return funSessionStatus(state, nowMs).canPlay ? undefined : 'no-energy';
}

/** Começa UMA rodada: dentro da sessão só conta; fora dela cobra `FUN_SESSION_COST` e abre outra. Recusa = mesma referência. */
export function startFunRound<T extends FunSessionState>(prev: T, nowMs: number): T {
  const s = activeFunSession(prev, nowMs);
  if (s) return { ...prev, funSession: { startedAt: s.startedAt, rounds: s.rounds + 1 } };
  if (funRoundRefusal(prev, nowMs)) return prev;
  const gasto = setEnergy(prev, nowMs, (cur) => cur - FUN_SESSION_COST);
  return { ...gasto, funSession: { startedAt: nowMs, rounds: 1 } };
}

/** mm:ss (arredonda para cima, nunca negativo). */
export function formatMmSs(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
