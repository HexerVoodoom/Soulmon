/**
 * MISSÃO ESPECIAL DIÁRIA (dono, 19/10/2026, REGISTRO §104)
 * ========================================================
 *
 * 1 missão especial por dia. Com sensor de passos (consentido) alterna
 * estritamente por dia entre `steps` e `rest`; sem sensor é SEMPRE `rest` (a de
 * passos some).
 *  - steps: meta escolhida pelo jogador (padrão `DEFAULT_STEP_GOAL`).
 *  - rest: "deitar na sua janela" — cumprida quando existe em `rest.nights` uma
 *    noite com `date === dia` (noite nomeada pela MANHÃ, dia do jogador) e
 *    `onTime === true`. Sem duração, sem sensor, sem punição.
 *
 * IMPACTO: pesa como UM hábito diário (`HABIT_WEIGHT`) SÓ no gauge de evolução,
 * creditado na virada (`computeDailyReset`) como BÔNUS ACIMA do teto diário
 * (guard-rail G-01: não reduz o peso das tarefas reais). NÃO entra no selo "dia
 * completo", nem em coração/HP, nem em `dailyGoalFor`/`registeredForDay`.
 * Não fazer = zero perda.
 *
 * Funções PURAS (sem `Date.now`). Nenhuma função devolve número que diminui.
 */
import { HABIT_WEIGHT } from '../types/taskModel';
import { parseDayKeyLocal } from './dayKeyParse';
import { sanitizeStepGoal } from './steps';
import { morningKey } from './restWindow';
import type { RestState } from './restWindow';

export type SpecialMissionKind = 'steps' | 'rest';

export const SPECIAL_MISSION_GAUGE_WEIGHT = HABIT_WEIGHT; // 1
export const SPECIAL_MISSIONS_PER_DAY = 1;

export interface SpecialMissionState {
  /** Dia do jogador (playerDayKey). */
  day: string;
  kind: SpecialMissionKind;
  done: boolean;
  /** Dias cumpridos (únicos, mais recentes, teto 7; sobrevivem à troca de dia). */
  doneDays?: string[];
  /** Dias já creditados no gauge (anti-duplo; únicos, teto 7). */
  creditedDays?: string[];
}

export interface SpecialMissionInputs {
  /** Sensor disponível + consentimento + permissão. */
  hasSteps: boolean;
  steps?: { date: string; today: number };
  /** `stepsDayKey(now)` — convenção do StepsRecord. */
  stepsDayKey: string;
  stepGoal?: unknown;
  rest?: { nights: { date: string; onTime: boolean; sleptAt?: string }[]; playerDayTz?: RestState['playerDayTz'] };
}

export function specialMissionKindFor(day: string, hasSteps: boolean): SpecialMissionKind {
  if (!hasSteps) return 'rest';
  const d = parseDayKeyLocal(day);
  if (!d) return 'rest';
  const idx = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  return idx % 2 === 0 ? 'steps' : 'rest';
}

export function specialMissionReached(
  state: { day: string; kind: SpecialMissionKind },
  inp: SpecialMissionInputs,
): boolean {
  if (state.kind === 'steps') {
    return (
      inp.hasSteps &&
      !!inp.steps &&
      inp.steps.date === inp.stepsDayKey &&
      inp.steps.today >= sanitizeStepGoal(inp.stepGoal)
    );
  }
  const rest = inp.rest;
  return !!rest?.nights?.some((n) => {
    if (n.date !== state.day || n.onTime !== true) return false;
    // A noite tem que ter começado na véspera: cochilo dentro da janela no próprio dia não conta.
    const t = n.sleptAt ? new Date(n.sleptAt) : undefined;
    if (!t || Number.isNaN(t.getTime())) return true;
    return morningKey(t, undefined, rest.playerDayTz) === state.day;
  });
}

const MAX_DAYS = 7;

function addDay(list: readonly string[] | undefined, day: string): string[] {
  const out = (list ?? []).filter((d) => d !== day);
  out.push(day);
  return out.slice(-MAX_DAYS);
}

function build(
  day: string,
  kind: SpecialMissionKind,
  done: boolean,
  doneDays?: string[],
  creditedDays?: string[],
): SpecialMissionState {
  return {
    day,
    kind,
    done,
    ...(doneDays && doneDays.length ? { doneDays } : {}),
    ...(creditedDays && creditedDays.length ? { creditedDays } : {}),
  };
}

/** Devolve a MESMA referência quando nada mudou (chamada em efeito React). */
export function resolveSpecialMission(
  prev: SpecialMissionState | undefined,
  day: string,
  inp: SpecialMissionInputs,
): SpecialMissionState {
  let cur: SpecialMissionState;
  if (!prev || prev.day !== day) {
    cur = build(day, specialMissionKindFor(day, inp.hasSteps), false, prev?.doneDays, prev?.creditedDays);
  } else if (prev.kind === 'steps' && !prev.done && !inp.hasSteps) {
    cur = build(day, 'rest', false, prev.doneDays, prev.creditedDays);
  } else {
    cur = prev;
  }
  if (!cur.done && specialMissionReached(cur, inp)) {
    return build(day, cur.kind, true, addDay(cur.doneDays, day), cur.creditedDays);
  }
  return cur;
}

/** Dia julgado que cumpriu e ainda não foi creditado (o primeiro da lista). */
function payingDay(s: SpecialMissionState | undefined, judged: readonly string[]): string | undefined {
  if (!s?.doneDays) return undefined;
  return judged.find((k) => s.doneDays!.includes(k) && !(s.creditedDays ?? []).includes(k));
}

/** Bônus de gauge da virada: no máximo 1 (teto), uma vez por dia cumprido. */
export function specialMissionGaugeBonus(
  s: SpecialMissionState | undefined,
  judgedDayKeys: readonly string[],
): number {
  return payingDay(s, judgedDayKeys) !== undefined ? SPECIAL_MISSION_GAUGE_WEIGHT : 0;
}

export function markSpecialMissionCredited(
  s: SpecialMissionState,
  judgedDayKeys: readonly string[],
): SpecialMissionState {
  const d = payingDay(s, judgedDayKeys);
  if (d === undefined) return s;
  return { ...s, creditedDays: addDay(s.creditedDays, d) };
}

/** Tipo da missão de amanhã (cartão: "hoje à noite conta para amanhã"). */
export function tomorrowSpecialKind(day: string, hasSteps: boolean): SpecialMissionKind {
  const d = parseDayKeyLocal(day);
  if (!d) return 'rest';
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  return specialMissionKindFor(next.toDateString(), hasSteps);
}

function days(v: unknown, legacy: unknown): string[] | undefined {
  const src = Array.isArray(v) ? v : typeof legacy === 'string' ? [legacy] : [];
  const out: string[] = [];
  for (const x of src) {
    const k = key(x);
    if (k !== undefined && !out.includes(k)) out.push(k);
  }
  return out.length ? out.slice(-MAX_DAYS) : undefined;
}

function key(v: unknown): string | undefined {
  return typeof v === 'string' && v.length >= 1 && v.length <= 40 ? v : undefined;
}

export function sanitizeSpecialMission(raw: unknown): SpecialMissionState | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const day = key(r.day);
  if (!day) return undefined;
  if (r.kind !== 'steps' && r.kind !== 'rest') return undefined;
  return build(day, r.kind, r.done === true, days(r.doneDays, r.lastDone), days(r.creditedDays, r.lastCredited));
}
