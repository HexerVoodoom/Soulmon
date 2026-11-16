/**
 * ⚔️ CONVITE DE DUELO (REGISTRO §458, pedido do dono, 16/11/2026): a "ficha" da Arena livre (Duelo).
 *
 * Cada run de Duelo gasta 1 convite (`spendDuelInvite`, ao começar a run; "Lutar de novo" gasta outro). O estoque vai de 0 a
 * `DUEL_INVITE_MAX` (7). O jogador troca 1 energia por convites: `DUEL_INVITE_PER_ENERGY` (5) e, na conta paga
 * (`accountTier:'paid'`), `DUEL_INVITE_PER_ENERGY_PAID` (7). O estoque nunca passa de 7.
 *
 * ⚠️ DECISÃO DO DONO, ciente da linha "nada pago dá vantagem de combate": o pagante recebe MAIS CONVITES POR ENERGIA (volume de
 * lutas por energia gasta), nunca poder, atributo, drop ou chance. O teto de Bits por categoria (§456) vale igual para todos.
 *
 * Nunca tranca ninguém: save antigo (sem o campo) começa com `DUEL_INVITE_INITIAL` (7); com 0 convites o caminho é a troca por
 * energia, e a energia volta com o tempo (`hunger.ts`). Esgotar convites nunca custa coração nem bloqueia outra atividade.
 *
 * Campo do save `duelInvites: {n, at}` (aditivo; ausente = estoque inicial 7). Funções PURAS, rodam dentro do updater do
 * `setGameState`; recusa devolve a MESMA referência. Espelho no servidor: `functions/api/_duelInvites.js` (paridade em
 * `duelInvites.parity.test.js`).
 */
import { setEnergy, settleEnergy, type HungerState } from './hunger';

export const DUEL_INVITE_MAX = 7;
export const DUEL_INVITE_INITIAL = 7;
export const DUEL_INVITE_PER_ENERGY = 5;
export const DUEL_INVITE_PER_ENERGY_PAID = 7;
export const DUEL_INVITE_ENERGY_COST = 1;
/** Folga mínima entre duas trocas aceitas pelo servidor (ms). A troca legítima só acontece com estoque < 7, ou seja, depois de lutar. */
export const DUEL_INVITE_MIN_GAP_MS = 60_000;

export interface DuelInvites { n: number; at: number }
export interface DuelInviteState extends HungerState { duelInvites?: DuelInvites; accountTier?: string }

/** Lixo → `undefined`. `n` inteiro em 0..7; `at` finito ≥ 0 (ausente = 0). Idempotente. */
export function sanitizeDuelInvites(raw: unknown): DuelInvites | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const { n, at } = raw as { n?: unknown; at?: unknown };
  if (typeof n !== 'number' || !Number.isFinite(n)) return undefined;
  const a = typeof at === 'number' && Number.isFinite(at) && at >= 0 ? Math.floor(at) : 0;
  return { n: Math.min(DUEL_INVITE_MAX, Math.max(0, Math.floor(n))), at: a };
}

export function duelInviteCount(state: { duelInvites?: unknown }): number {
  return sanitizeDuelInvites(state.duelInvites)?.n ?? DUEL_INVITE_INITIAL;
}

export function duelInvitesPerEnergy(state: { accountTier?: string }): number {
  return state.accountTier === 'paid' ? DUEL_INVITE_PER_ENERGY_PAID : DUEL_INVITE_PER_ENERGY;
}

export type DuelInviteRefusal = 'full' | 'no-energy';

export function duelInviteExchangeRefusal(state: DuelInviteState, nowMs: number): DuelInviteRefusal | undefined {
  if (duelInviteCount(state) >= DUEL_INVITE_MAX) return 'full';
  const energy = settleEnergy(state, nowMs).energyPoints;
  if (Math.floor(Number(energy) || 0) < DUEL_INVITE_ENERGY_COST) return 'no-energy';
  return undefined;
}

/** Troca 1 energia por convites (5; 7 na conta paga), sem passar de 7. Recusa = mesma referência. */
export function exchangeDuelInvites<T extends DuelInviteState>(prev: T, nowMs: number): T {
  if (duelInviteExchangeRefusal(prev, nowMs)) return prev;
  const gasto = setEnergy(prev, nowMs, (cur) => cur - DUEL_INVITE_ENERGY_COST);
  const atual = sanitizeDuelInvites(prev.duelInvites);
  const n = Math.min(DUEL_INVITE_MAX, duelInviteCount(prev) + duelInvitesPerEnergy(prev));
  const at = Math.max(Math.floor(nowMs), (atual?.at ?? 0) + DUEL_INVITE_MIN_GAP_MS + 1);
  return { ...gasto, duelInvites: { n, at } };
}

/** Gasta 1 convite ao começar uma run. Sem convite = mesma referência. */
export function spendDuelInvite<T extends DuelInviteState>(prev: T): T {
  const n = duelInviteCount(prev);
  if (n < 1) return prev;
  return { ...prev, duelInvites: { n: n - 1, at: sanitizeDuelInvites(prev.duelInvites)?.at ?? 0 } };
}
