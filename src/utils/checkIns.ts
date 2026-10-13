// ☀️🌤️🌙 OS TRÊS CHECK-INS DO DIA (beta-2 item 4.1 — REGISTRO §40).
//
// Três momentos de retorno, cada um com UM benefício específico, ancorados nas MESMAS três janelas do ritmo das refeições
// (`utils/mealRhythm.ts` — horários editáveis em Configurações, push opt-in e teto já existentes): não há segundo conjunto de
// horários nem segundo canal de notificação.
//
//   · morning   — "preparar o dia"            → enche a FOME (o dia começa com energia correndo)
//   · afternoon — "acompanhar o progresso"     → Bits (um agrado pelo meio do caminho)
//   · night     — "encerrar e preparar amanhã" → XP de Vínculo (`kind: 'checkIn'`, o mesmo XP do check-in da manhã)
//
// REGRAS (todas com teste):
//  1. UMA recompensa por janela por DIA DO JOGADOR (`playerDayIso`, fuso FIXO do save). O registro mora no save (`checkIns`), então
//     reabrir o app, trocar de aparelho ou entrar/sair não repaga. No máximo 3 por dia, por construção (3 janelas).
//  2. Disponibilidade = do horário da janela até o horário da próxima (a noite vai até o fim do dia). Chegar tarde ainda vale dentro
//     do intervalo — o app NÃO precisa estar aberto na hora marcada. Perder a janela não deixa rastro: sem sequência, sem
//     contador de perdidos, sem penalidade, sem texto de cobrança. O progresso do dia nunca depende disto.
//  3. Relógio que VOLTA não reabre o dia (vale o maior entre o dia do relógio e o do registro). Adiantar o relógio por um dia
//     reabre as três janelas daquele dia futuro — e o servidor (`functions/api/_dayCounters.js`) não aceita um dia mais de um dia à
//     frente do dele.
//  4. NENHUMA leitura de desempenho: o convite e a recompensa são os mesmos para quem fechou tudo e para quem não abriu nada.
//  5. Nada aqui concede energia direto, HP, Emblema, nem vantagem paga: pagar nunca deixa mais forte.
//
// Funções PURAS; `nowMs` por parâmetro; a recusa é reconferida sobre o `prev` (roda dentro do updater do `setGameState`).
import { DEFAULT_MEAL_TIMES, formatHHMM, mealMinutes } from '../../functions/api/_mealRhythm.js';
import type { MealTimes } from './mealRhythm';
import { eat } from './hunger';
import { awardBondXP } from './bond';
import { noteFreeBits, type BitsOrigin } from './bitsOrigin';
import { playerDayIso, playerDayKey, type PlayerDayAnchor } from './playerDay';

export const CHECKIN_SLOTS = ['morning', 'afternoon', 'night'] as const;
export type CheckInSlot = (typeof CHECKIN_SLOTS)[number];

/** O que cada janela paga (defaults propostos; o dono decide — REGISTRO §40). */
export const CHECKIN_REWARDS: Readonly<Record<CheckInSlot, { readonly hunger: number; readonly bits: number; readonly xp: number }>> = {
  morning: { hunger: 30, bits: 0, xp: 0 },
  afternoon: { hunger: 0, bits: 10, xp: 0 },
  night: { hunger: 0, bits: 0, xp: 10 },
};

/** O registro no SAVE: o dia do jogador e as janelas já resgatadas. Nada de histórico nem sequência. */
export interface CheckInRecord { day: string; claimed: CheckInSlot[] }

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export function sanitizeCheckIns(raw: unknown): CheckInRecord | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = raw as { day?: unknown; claimed?: unknown };
  if (typeof r.day !== 'string' || !ISO_DAY.test(r.day)) return undefined;
  const claimed = Array.isArray(r.claimed) ? CHECKIN_SLOTS.filter(s => (r.claimed as unknown[]).includes(s)) : [];
  return { day: r.day, claimed };
}

export interface CheckInState {
  checkIns?: CheckInRecord;
  playerDayTz?: PlayerDayAnchor;
  mealRhythm?: { times?: MealTimes };
  // fatia usada pelas recompensas
  energyPoints: number;
  evolutionStage?: string;
  hunger?: import('./hunger').HungerRecord;
  energyClock?: import('./hunger').EnergyClock;
  gamePoints?: number;
  bitsOrigin?: BitsOrigin;
  totalXP: number;
  bondDaily?: { day: string; spent: Record<string, number> };
}

/** O dia que VALE: nunca anterior ao do registro (relógio que voltou não reabre as janelas). */
export function checkInDayOf(state: Pick<CheckInState, 'checkIns' | 'playerDayTz'>, nowMs: number): string {
  const hoje = playerDayIso(new Date(nowMs), state.playerDayTz);
  const rec = sanitizeCheckIns(state.checkIns);
  return rec && rec.day > hoje ? rec.day : hoje;
}

/** Janelas já resgatadas HOJE. */
export function claimedToday(state: Pick<CheckInState, 'checkIns' | 'playerDayTz'>, nowMs: number): CheckInSlot[] {
  const rec = sanitizeCheckIns(state.checkIns);
  return rec && rec.day === checkInDayOf(state, nowMs) ? rec.claimed : [];
}

/** Minutos desde 00:00 no relógio do APARELHO (a refeição é onde a pessoa está, como em `mealRhythm`). */
const deviceMinutes = (nowMs: number): number => { const d = new Date(nowMs); return d.getHours() * 60 + d.getMinutes(); };

/**
 * A janela em curso agora (a do último horário que já passou hoje), ou `null` antes do primeiro horário do dia.
 * Independe de já ter sido resgatada: quem decide isso é `availableCheckIn`.
 */
export function currentSlot(times: MealTimes | undefined, nowMs: number): CheckInSlot | null {
  const [b, l, d] = mealMinutes(times ?? DEFAULT_MEAL_TIMES) as [number, number, number];
  const m = deviceMinutes(nowMs);
  return m >= d ? 'night' : m >= l ? 'afternoon' : m >= b ? 'morning' : null;
}

/** A janela que dá para resgatar AGORA (em curso e ainda não resgatada hoje), ou `null`. */
export function availableCheckIn(state: Pick<CheckInState, 'checkIns' | 'playerDayTz' | 'mealRhythm'>, nowMs: number): CheckInSlot | null {
  const slot = currentSlot(state.mealRhythm?.times, nowMs);
  if (!slot) return null;
  return claimedToday(state, nowMs).includes(slot) ? null : slot;
}

/**
 * Resgata a janela em curso. Recusa (sem janela / já resgatada) devolve a MESMA referência. A recompensa sai TODA daqui, por funis
 * que já existem (`eat`, `noteFreeBits`, `awardBondXP`) — o cliente não escolhe valor.
 */
export function claimCheckIn<T extends CheckInState>(prev: T, nowMs: number): { state: T; slot?: CheckInSlot } {
  const slot = availableCheckIn(prev, nowMs);
  if (!slot) return { state: prev };
  const day = checkInDayOf(prev, nowMs);
  const rw = CHECKIN_REWARDS[slot];
  let s: T = { ...prev, checkIns: { day, claimed: [...claimedToday(prev, nowMs), slot] } };
  if (rw.hunger > 0) s = eat(s, nowMs, rw.hunger);
  if (rw.bits > 0) s = { ...noteFreeBits(s, rw.bits, playerDayKey(new Date(nowMs), prev.playerDayTz)), gamePoints: (s.gamePoints ?? 0) + rw.bits };
  if (rw.xp > 0) s = awardBondXP(s as T & { totalXP: number }, { kind: 'checkIn' }, playerDayKey(new Date(nowMs), prev.playerDayTz));
  return { state: s, slot };
}

/** O estado de uma janela para a folha dos check-ins: já resgatada, aberta agora, ainda por vir, ou que passou sem resgate. */
export type CheckInWindowStatus = 'claimed' | 'open' | 'upcoming' | 'missed';
export interface CheckInWindow { slot: CheckInSlot; from: string; to: string | null; status: CheckInWindowStatus }

/**
 * As três janelas de HOJE com o horário e o estado de cada uma (a folha dos check-ins). Pura e sem leitura de desempenho. `to` é `null`
 * na noite (vai até o fim do dia). "missed" é só um estado neutro de leitura: não cobra nada e não deixa rastro no save.
 */
export function checkInWindows(
  state: Pick<CheckInState, 'checkIns' | 'playerDayTz' | 'mealRhythm'>,
  nowMs: number,
): CheckInWindow[] {
  const mins = mealMinutes(state.mealRhythm?.times ?? DEFAULT_MEAL_TIMES) as [number, number, number];
  const done = claimedToday(state, nowMs);
  const atual = currentSlot(state.mealRhythm?.times, nowMs);
  return CHECKIN_SLOTS.map((slot, i) => {
    const status: CheckInWindowStatus = done.includes(slot)
      ? 'claimed'
      : atual === slot ? 'open'
      : (atual === null || CHECKIN_SLOTS.indexOf(atual) < i) ? 'upcoming' : 'missed';
    return { slot, from: formatHHMM(mins[i]), to: i < 2 ? formatHHMM(mins[i + 1]) : null, status };
  });
}
