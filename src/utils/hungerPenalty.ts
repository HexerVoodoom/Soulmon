// 🍽️ PENALIDADE DE FOME (pedido do dono por voz, 14/10/2026 — REGISTRO §45). PEQUENA e calma.
//
// Regra: enquanto o Soulmon está FAMINTO (fome < `HUNGER_FAIR_MIN`), ele perde MEIO coração (0,5) a cada 12 h CONTÍNUAS de fome.
// Comer (sair do faminto) zera a contagem. Função PURA: `now` por parâmetro, sem React, sem localStorage.
//
// ## Por que não há punição dupla nem timer de tela
//  · A âncora é `starvingSince(hunger)` — o instante em que o REGISTRO PERSISTIDO cruzou "faminto". Comer troca o registro,
//    então a âncora muda e a contagem recomeça sem nenhum código de "zerar".
//  · `hungerPenalty.paid` guarda quantas janelas de 12 h DESSA fome já foram cobradas (ou perdoadas). Reabrir, recarregar,
//    trocar de aparelho ou rodar o tick mil vezes lê o mesmo `paid` e não cobra de novo. No máximo 1 perda por janela.
//  · OFFLINE com teto: ao voltar, no máximo `HUNGER_PENALTY_MAX_PER_RETURN` (2) perdas são cobradas; as janelas além do teto
//    são PERDOADAS (`paid` avança até o total), não guardadas para a próxima leitura — senão o teto só adiaria a conta.
//  · PISO: nunca abaixo de `HUNGER_PENALTY_HP_FLOOR` (1 coração). Não mata, não degenera, não bloqueia nada. (A regra de vida do jogo
//    tem piso 1 só na raiz da árvore; aqui o piso vale para TODO estágio, porque o pedido é "não mata".) HP já ≤ 1 → não cobra,
//    mas as janelas contam como pagas (nada de dívida retroativa se o HP subir depois).
//  · Ausência longa NÃO é perdoada além do teto de 2: o pedido do dono fixou "máx. 2 perdas por retorno" (ver REGISTRO §45).
//  · O HP do jogo já aceita frações de 0,5 (CLAUDE.md, Corações); nenhum save muda de forma: o campo `hungerPenalty` é novo e opcional.
import { starvingSince } from './hunger';

/** Horas CONTÍNUAS de fome para cada perda (decisão do dono). */
export const HUNGER_PENALTY_WINDOW_HOURS = 12;
export const HUNGER_PENALTY_WINDOW_MS = HUNGER_PENALTY_WINDOW_HOURS * 3_600_000;
/** Corações perdidos por janela (decisão do dono: meio coração). */
export const HUNGER_PENALTY_HEARTS = 0.5;
/** Teto de perdas cobradas de uma vez (ao voltar de uma ausência). */
export const HUNGER_PENALTY_MAX_PER_RETURN = 2;
/** Nunca cai abaixo disto por causa da fome. */
export const HUNGER_PENALTY_HP_FLOOR = 1;

/** O que fica no save. */
export interface HungerPenaltyRecord {
  /** A âncora da fome a que `paid` se refere (`starvingSince`). Outra âncora = outra fome = contagem nova. */
  since: number;
  /** Janelas de 12 h dessa fome já resolvidas (cobradas ou perdoadas). */
  paid: number;
  /** Corações tirados pela fome desde o último resumo do dia (a virada lê e zera). */
  unreported: number;
}

export interface HungerPenaltyState {
  healthPoints: number;
  hunger?: { v: number; at: number };
  hungerPenalty?: HungerPenaltyRecord;
}

/** Lixo → `undefined` (sem dívida retroativa). */
export function sanitizeHungerPenalty(raw: unknown): HungerPenaltyRecord | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = raw as Record<string, unknown>;
  if (typeof r.since !== 'number' || !Number.isFinite(r.since) || typeof r.paid !== 'number' || !Number.isFinite(r.paid)) return undefined;
  const un = typeof r.unreported === 'number' && Number.isFinite(r.unreported) ? r.unreported : 0;
  return {
    since: Math.max(0, Math.floor(r.since)),
    paid: Math.min(1000, Math.max(0, Math.floor(r.paid))),
    unreported: Math.min(10, Math.max(0, Math.round(un * 2) / 2)),
  };
}

/** Quantas janelas de 12 h completas de fome contínua existem em `now` (0 se não está faminto). */
export function starvingWindows(hunger: HungerPenaltyState['hunger'], now: number): number {
  const since = starvingSince(hunger);
  if (since === null || !(now > since)) return 0;
  return Math.floor((now - since) / HUNGER_PENALTY_WINDOW_MS);
}

/** Ms até a PRÓXIMA perda se nada mudar; `null` se não está faminto ou se a próxima janela já cobraria 0 (HP no piso). */
export function msToNextHungerLoss(state: HungerPenaltyState, now: number): number | null {
  const since = starvingSince(state.hunger);
  if (since === null || now < since) return null;
  const paid = state.hungerPenalty?.since === since ? state.hungerPenalty.paid : 0;
  const w = Math.max(starvingWindows(state.hunger, now), paid);
  if (state.healthPoints <= HUNGER_PENALTY_HP_FLOOR) return null;
  return since + (w + 1) * HUNGER_PENALTY_WINDOW_MS - now;
}

/**
 * Aplica a penalidade. Devolve a MESMA referência quando nada muda (cabe em tick/updater sem re-render).
 */
export function applyHungerPenalty<T extends HungerPenaltyState>(state: T, now: number): T {
  const since = starvingSince(state.hunger);
  if (since === null) return state;
  const windows = starvingWindows(state.hunger, now);
  const rec = state.hungerPenalty;
  const paid = rec && rec.since === since ? rec.paid : 0;
  const owed = windows - paid;
  if (owed <= 0) return state;

  const hp = Number.isFinite(state.healthPoints) ? state.healthPoints : 0;
  const wanted = Math.min(owed, HUNGER_PENALTY_MAX_PER_RETURN) * HUNGER_PENALTY_HEARTS;
  // sempre em passos de 0,5 e nunca abaixo do piso
  const room = Math.max(0, Math.floor((hp - HUNGER_PENALTY_HP_FLOOR) / HUNGER_PENALTY_HEARTS) * HUNGER_PENALTY_HEARTS);
  const lost = Math.min(wanted, room);
  const prevUnreported = rec && rec.since === since ? rec.unreported : (rec?.unreported ?? 0);
  return {
    ...state,
    healthPoints: hp - lost,
    // `paid` vai até o total: o excedente do teto é perdoado, não adiado
    hungerPenalty: { since, paid: windows, unreported: Math.min(10, prevUnreported + lost) },
  };
}
