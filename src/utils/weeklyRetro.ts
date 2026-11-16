/**
 * RETROSPECTIVA SEMANAL (segunda-feira) — dona única da regra (pedido do dono, 16/11/2026).
 *
 * Funções PURAS: todo tempo entra por parâmetro, nada de `Date.now()` implícito.
 *
 *  · a semana contada é a ANTERIOR, de segunda a domingo (dia local);
 *  · a retrospectiva abre na segunda, uma vez por semana, e só com algo a dizer;
 *  · o hábito mais difícil é o de MENOR taxa de conclusão entre os que tinham
 *    dias devidos na semana; ele ganha o BÔNUS DE RETORNO da semana que começa;
 *  · o bônus é real (+1 Fragmento de Alma acima do teto diário por dia em que o
 *    hábito é concluído, pela mesma via da tarefa bônus) e expira no domingo;
 *  · ver o cartão NÃO conclui nada: o bônus só paga na conclusão de verdade;
 *  · QUALIDADE da semana (`retroQuality`, 16/11/2026, define o título e o tom do modal): taxa geral de conclusão
 *    de hábitos = soma dos dias feitos / soma dos dias devidos de TODOS os hábitos da semana. boa >= 70%,
 *    média de 40% a 69%, ruim < 40% (limites em `RETRO_QUALITY_GOOD`/`RETRO_QUALITY_MEDIUM`). Sem nenhum hábito
 *    com dia devido (semana só de tarefas pontuais) não há taxa para julgar: conta como média (reconhece sem
 *    celebrar nem cobrar). Tarefas pontuais NÃO entram na taxa (não têm "dia devido");
 *  · "evoluiu na semana": o save guarda a forma do início de cada semana
 *    (`stageByWeek`); não há data de evolução em outro lugar.
 */
import { parseDayKeyLocal } from './dayKeyParse';
import type { HabitRhythm } from './habitRhythm';
import { getStageLevel } from '../types/progression';

const STAGE_ORDER = ['rookie', 'champion', 'ultimate', 'mega', 'ultra'] as const;

/** Fragmentos de Alma extras, acima do teto diário, por dia concluído com o bônus ativo. */
export const WEEKLY_BONUS_GAUGE_WEIGHT = 1;
/** Quantas semanas de forma ficam no save (a atual, a passada e uma de folga). */
export const STAGE_BY_WEEK_CAP = 3;

export interface WeeklyBonusState {
  activityId: string;
  /** `toDateString` da segunda em que o bônus começa. */
  from: string;
  /** `toDateString` do domingo em que o bônus acaba (inclusive). */
  until: string;
}

export interface StageWeekEntry {
  /** `toDateString` da segunda da semana. */
  week: string;
  stage: string;
}

export interface RetroActivity { id: string; name?: string; emoji?: string }
export interface RetroTask { id: string; name?: string; completedAt?: string }

export interface RetroState {
  activities?: RetroActivity[];
  habitRhythms?: Record<string, HabitRhythm>;
  completedTasks?: RetroTask[];
  lastWeeklyRetroDate?: string;
  stageByWeek?: StageWeekEntry[];
}

export interface RetroHabitLine {
  id: string;
  name: string;
  emoji: string;
  /** Dias feitos (escudo conta como feito). */
  done: number;
  /** Dias devidos registrados na semana. */
  due: number;
  rate: number;
}

export interface WeeklyRetro {
  /** `toDateString` da segunda e do domingo da semana contada. */
  weekFrom: string;
  weekTo: string;
  habits: RetroHabitLine[];
  totalHabitDone: number;
  tasks: { id: string; name: string }[];
  tasksDone: number;
  /** O hábito de menor taxa, ou `null` (sem hábito com meta, ou todos em 100%). */
  hardest: RetroHabitLine | null;
}

const DAY_MS = 86400000;

function midnight(d: Date): Date {
  const x = new Date(d.getTime());
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number): Date {
  const x = midnight(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** A segunda-feira (00:00 local) da semana de `d`. */
export function mondayOf(d: Date): Date {
  const x = midnight(d);
  return addDays(x, -((x.getDay() + 6) % 7));
}

/** Segunda e domingo da semana ANTERIOR à de `now`. */
export function lastWeekRange(now: Date): { from: Date; to: Date } {
  const from = addDays(mondayOf(now), -7);
  return { from, to: addDays(from, 6) };
}

function inRange(key: string, from: Date, to: Date): boolean {
  const d = parseDayKeyLocal(key);
  if (!d) return false;
  const t = midnight(d).getTime();
  return t >= from.getTime() && t <= to.getTime();
}

/**
 * O hábito mais difícil: menor taxa; no empate, o que teve mais dias perdidos;
 * persistindo o empate, o primeiro da lista (ordem do usuário). Taxa 1 em todos
 * → `null` (não há dificuldade a incentivar).
 */
export function pickHardest(lines: readonly RetroHabitLine[]): RetroHabitLine | null {
  let best: RetroHabitLine | null = null;
  for (const l of lines) {
    if (l.due <= 0 || l.rate >= 1) continue;
    if (!best) { best = l; continue; }
    const lMiss = l.due - l.done;
    const bMiss = best.due - best.done;
    if (l.rate < best.rate || (l.rate === best.rate && lMiss > bMiss)) best = l;
  }
  return best;
}

export function weeklyRetro(state: RetroState, now: Date): WeeklyRetro {
  const { from, to } = lastWeekRange(now);
  const rhythms = state.habitRhythms ?? {};
  const habits: RetroHabitLine[] = [];
  for (const a of state.activities ?? []) {
    const r = rhythms[a.id];
    if (!r) continue;
    const done = r.done.filter(k => inRange(k, from, to)).length + r.shielded.filter(k => inRange(k, from, to)).length;
    const due = done + r.missed.filter(k => inRange(k, from, to)).length;
    if (due <= 0) continue;
    habits.push({ id: a.id, name: a.name ?? '', emoji: a.emoji ?? '', done, due, rate: done / due });
  }
  const end = to.getTime() + DAY_MS;
  const tasks = (state.completedTasks ?? []).filter(t => {
    if (!t.completedAt) return false;
    const at = new Date(t.completedAt).getTime();
    return !Number.isNaN(at) && at >= from.getTime() && at < end;
  }).map(t => ({ id: t.id, name: t.name ?? '' }));
  return {
    weekFrom: from.toDateString(),
    weekTo: to.toDateString(),
    habits,
    totalHabitDone: habits.reduce((s, h) => s + h.done, 0),
    tasks,
    tasksDone: tasks.length,
    hardest: pickHardest(habits),
  };
}

export type RetroQuality = 'good' | 'medium' | 'bad';
/** Taxa geral mínima (inclusive) para a semana ser "boa". */
export const RETRO_QUALITY_GOOD = 0.7;
/** Taxa geral mínima (inclusive) para a semana ser "média"; abaixo disso é "ruim". */
export const RETRO_QUALITY_MEDIUM = 0.4;

/** Taxa geral de conclusão de hábitos da semana (0 a 1), ou `null` se nenhum hábito teve dia devido. */
export function overallHabitRate(habits: readonly Pick<RetroHabitLine, 'done' | 'due'>[]): number | null {
  const due = habits.reduce((s, h) => s + h.due, 0);
  if (due <= 0) return null;
  return habits.reduce((s, h) => s + h.done, 0) / due;
}

/** Qualidade da semana contada (ver o cabeçalho do arquivo). Arredonda a taxa a 1e-9 para o 70% exato não cair por ponto flutuante. */
export function retroQuality(retro: Pick<WeeklyRetro, 'habits'>): RetroQuality {
  const rate = overallHabitRate(retro.habits);
  if (rate === null) return 'medium';
  const r = Math.round(rate * 1e9) / 1e9;
  if (r >= RETRO_QUALITY_GOOD) return 'good';
  return r >= RETRO_QUALITY_MEDIUM ? 'medium' : 'bad';
}

/** Segunda-feira, semana ainda não mostrada e com algo a contar. */
export function needsWeeklyRetro(state: RetroState, now: Date): boolean {
  if (now.getDay() !== 1) return false;
  if (state.lastWeeklyRetroDate === mondayOf(now).toDateString()) return false;
  const r = weeklyRetro(state, now);
  return r.habits.length > 0 || r.tasksDone > 0;
}

/** O bônus da semana que começa para o hábito escolhido (segunda a domingo). */
export function makeWeeklyBonus(activityId: string, now: Date): WeeklyBonusState {
  const mon = mondayOf(now);
  return { activityId, from: mon.toDateString(), until: addDays(mon, 6).toDateString() };
}

/** `day` (`toDateString`) está dentro da janela do bônus? */
export function isWeeklyBonusOn(b: WeeklyBonusState | undefined, day: string): boolean {
  if (!b) return false;
  const d = parseDayKeyLocal(day);
  const f = parseDayKeyLocal(b.from);
  const u = parseDayKeyLocal(b.until);
  if (!d || !f || !u) return false;
  const t = midnight(d).getTime();
  return t >= midnight(f).getTime() && t <= midnight(u).getTime();
}

/** Id do hábito com bônus semanal ATIVO hoje (para o selo da Home), ou `undefined`. */
export function weeklyBonusActivityToday(b: WeeklyBonusState | undefined, today: string): string | undefined {
  return isWeeklyBonusOn(b, today) ? b!.activityId : undefined;
}

/** Bônus de gauge da virada: pago só se o hábito foi concluído no dia julgado, dentro da janela. */
export function weeklyBonusGaugeBonus(
  b: WeeklyBonusState | undefined,
  activities: readonly { id: string; completedToday?: boolean; lastCompletedDate?: string }[] | undefined,
  judgedDay: string,
): number {
  if (!isWeeklyBonusOn(b, judgedDay)) return 0;
  const a = (activities ?? []).find(x => x.id === b!.activityId);
  return a && a.completedToday && a.lastCompletedDate === judgedDay ? WEEKLY_BONUS_GAUGE_WEIGHT : 0;
}

export function sanitizeWeeklyBonus(v: unknown): WeeklyBonusState | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const { activityId, from, until } = v as Record<string, unknown>;
  if (typeof activityId !== 'string' || !activityId || typeof from !== 'string' || typeof until !== 'string') return undefined;
  if (!parseDayKeyLocal(from) || !parseDayKeyLocal(until)) return undefined;
  return { activityId, from, until };
}

export function sanitizeStageByWeek(v: unknown): StageWeekEntry[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v.filter((e): e is StageWeekEntry => !!e && typeof e === 'object'
    && typeof (e as StageWeekEntry).week === 'string' && typeof (e as StageWeekEntry).stage === 'string'
    && !!parseDayKeyLocal((e as StageWeekEntry).week)).slice(-STAGE_BY_WEEK_CAP);
  return out.length ? out : undefined;
}

/** Registra a forma do início desta semana (idempotente; devolve a MESMA lista se já existe). */
export function recordWeekStage(list: StageWeekEntry[] | undefined, now: Date, stage: string): StageWeekEntry[] {
  const week = mondayOf(now).toDateString();
  const cur = list ?? [];
  if (cur.some(e => e.week === week)) return cur;
  return [...cur, { week, stage }].slice(-STAGE_BY_WEEK_CAP);
}

/**
 * A forma ANTERIOR se o Soulmon evoluiu durante a semana passada; senão `null`.
 * Compara a forma registrada no início da semana passada com a atual. Sem
 * registro da semana passada (save novo), não há evolução a contar.
 */
export function evolvedLastWeek(list: StageWeekEntry[] | undefined, now: Date, currentStage: string): string | null {
  const lastWeek = addDays(mondayOf(now), -7).toDateString();
  const e = (list ?? []).find(x => x.week === lastWeek);
  if (!e || !e.stage) return null;
  // Só SUBIDA conta: queda de HP (degeneração) não é "evoluí".
  const up = STAGE_ORDER.indexOf(getStageLevel(currentStage)) > STAGE_ORDER.indexOf(getStageLevel(e.stage));
  return up ? e.stage : null;
}
