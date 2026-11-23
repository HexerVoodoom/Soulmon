/**
 * ⚠️ EXCEÇÃO DE TESTE, TEMPORÁRIA (pedido do dono, 10/11/2026) — uma flag só, fácil de reverter.
 *
 * Com `GLITCHTAMA_TESTE_ON = true`:
 *  1. o Desfeito (Guilda) VENDE o 🌀 por `GLITCHTAMA_TESTE_PRECO_BITS` Bit, no máximo `GLITCHTAMA_TESTE_COMPRAS_POR_DIA` por dia do jogador.
 *
 * O princípio "Glitchtama nunca é vendido" (01-VISAO §2, 02 §48) fica SUSPENSO enquanto a flag estiver ligada. Para voltar ao
 * normal: `GLITCHTAMA_TESTE_ON = false` (nada mais; os testes seguem a flag). A compra é registrada no SAVE (`glitchtamaBuy`),
 * não no localStorage, no dia do jogador.
 */
import { playerDayKey, type PlayerDayAnchor } from './playerDay';
import { spendBitsPaidFirst, type BitsOriginState } from './bitsOrigin';
import { GLITCHTAMA_EMOJI } from './shop';

export const GLITCHTAMA_TESTE_ON = false;
export const GLITCHTAMA_TESTE_PRECO_BITS = 1;
export const GLITCHTAMA_TESTE_COMPRAS_POR_DIA = 3;

export interface GlitchtamaBuy { day: string; used: number }

export interface GlitchtamaBuyState extends BitsOriginState {
  gamePoints: number;
  foodInventory: Record<string, number>;
  glitchtamaBuy?: GlitchtamaBuy;
  playerDayTz?: PlayerDayAnchor;
}

export type GlitchtamaBuyRefusal = 'off' | 'bits' | 'daily-cap';

/** Sanitização do save (idempotente): ausente/lixo = nenhuma compra registrada. */
export function sanitizeGlitchtamaBuy(v: unknown): GlitchtamaBuy | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const o = v as { day?: unknown; used?: unknown };
  if (typeof o.day !== 'string' || !o.day) return undefined;
  const used = typeof o.used === 'number' && Number.isFinite(o.used) && o.used > 0 ? Math.min(Math.floor(o.used), 1000) : 0;
  return { day: o.day, used };
}

/** Quantos já foram comprados HOJE (dia do jogador). Dia diferente = 0. */
export function glitchtamaBoughtToday(state: Pick<GlitchtamaBuyState, 'glitchtamaBuy' | 'playerDayTz'>, now: Date): number {
  const r = state.glitchtamaBuy;
  return r && r.day === playerDayKey(now, state.playerDayTz) ? Math.max(0, r.used) : 0;
}

/** Quantas ainda dá para comprar hoje. */
export function glitchtamaBuysLeft(state: Pick<GlitchtamaBuyState, 'glitchtamaBuy' | 'playerDayTz'>, now: Date): number {
  return Math.max(0, GLITCHTAMA_TESTE_COMPRAS_POR_DIA - glitchtamaBoughtToday(state, now));
}

export function glitchtamaBuyRefusal(state: GlitchtamaBuyState, now: Date): GlitchtamaBuyRefusal | undefined {
  if (!GLITCHTAMA_TESTE_ON) return 'off';
  if (glitchtamaBoughtToday(state, now) >= GLITCHTAMA_TESTE_COMPRAS_POR_DIA) return 'daily-cap';
  if ((state.gamePoints ?? 0) < GLITCHTAMA_TESTE_PRECO_BITS) return 'bits';
  return undefined;
}

/**
 * A compra, PURA (roda dentro do updater do `setGameState`): reconfere tudo no `prev` (dois toques no mesmo lote não compram com
 * um saldo), debita Bits (pago primeiro), entrega 1 🌀 na mochila e soma 1 ao contador do dia no MESMO retorno.
 */
export function buyGlitchtama<T extends GlitchtamaBuyState>(prev: T, now: Date): { state: T; refused?: GlitchtamaBuyRefusal } {
  const refused = glitchtamaBuyRefusal(prev, now);
  if (refused) return { state: prev, refused };
  const next: T = {
    ...prev,
    gamePoints: prev.gamePoints - GLITCHTAMA_TESTE_PRECO_BITS,
    foodInventory: { ...prev.foodInventory, [GLITCHTAMA_EMOJI]: (prev.foodInventory[GLITCHTAMA_EMOJI] ?? 0) + 1 },
    glitchtamaBuy: { day: playerDayKey(now, prev.playerDayTz), used: glitchtamaBoughtToday(prev, now) + 1 },
  };
  return { state: spendBitsPaidFirst(next, GLITCHTAMA_TESTE_PRECO_BITS) };
}
