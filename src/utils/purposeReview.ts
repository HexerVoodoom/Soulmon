import { normalizeSchedule } from '../types/taskModel';
import type { Schedule } from '../types/taskModel';
import type { HabitRhythm } from './habitRhythm';
import { dayKeyOf } from './habitRhythm';
import {
  emptyPurpose, localDayKey, monthKeyOf, trimReviews,
  type MilestoneStatus, type MonthCell, type ObstacleKey, type Perceived, type Purpose, type PurposeMilestone, type PurposeReview, type ReviewDecision, type ReviewKind,
} from './purpose';
import { sumMonths } from './purposeAgg';

/**
 * REVISÕES DO OBJETIVO (E6-E9, docs/PLANO-OBJETIVO-ANUAL.md §4)
 * ============================================================
 *
 * Puro: o tempo entra por parâmetro e o dia é o LOCAL do aparelho. Regras:
 *  - A profundidade cresce com o intervalo: semanal (anotação de 1 toque), mensal
 *    no dia 1 (card até o dia 7), semestral e anual no mês do aniversário do objetivo.
 *  - Revisão perdida NÃO vira dívida: o card some no dia 8 e não acumula.
 *  - Ao completar a semestral, o cosmético é concedido UMA vez por semestre do objetivo
 *    (id de concessão idempotente), para QUALQUER resposta (não é prêmio por resultado).
 */

/**
 * A pergunta "Você quer rever suas tarefas?" da revisão mensal (decisão do dono, 12/11/2026). `'always'` = SEMPRE (vale hoje);
 * `'only_if_all_done'` = só quando todas as tarefas do mês foram feitas. Uma constante só, para trocar fácil se o dono corrigir.
 * Aceitar = Satisfação/Ressurgimento refazem a escolha de tarefas pelas 3 cartas; Ambição não vê as cartas, exceto pela opção
 * explícita "meus planos mudaram". (A tela das cartas e o refazer da escolha ainda não existem: TODO da etapa das cartas.)
 */
export type ReviewTasksAskMode = 'always' | 'only_if_all_done';
export const REVIEW_TASKS_ASK_MODE: ReviewTasksAskMode = 'always';
export function shouldAskReviewTasks(allDone: boolean, mode: ReviewTasksAskMode = REVIEW_TASKS_ASK_MODE): boolean {
  return mode === 'always' ? true : allDone;
}

export type OfferKind = 'month' | 'semester' | 'year';

export interface ReviewOffer {
  kind: OfferKind;
  /** `YYYY-MM` do mês avaliado (mês anterior ao de `today`) para `month`; `C<n>` (ciclo de 6 meses) para semestral/anual. */
  period: string;
  /** O mês avaliado (`YYYY-MM`): sempre o mês anterior ao de `today`. */
  monthKey: string;
  /** Semestral/anual: o número do ciclo de 6 meses (1, 2, 3…). */
  cycle?: number;
}

/** O cosmético do semestre. PLACEHOLDER: moldura de evento já existente. TODO(arte): peça própria (aparência ou memória do Soulmon) pedida na fila de assets. */
export const SEMESTER_REWARD_FRAME_ID = 'evento-lua-colheita';

/** O dia do mês até o qual o card de revisão fica (a partir do dia 1). */
export const REVIEW_WINDOW_LAST_DAY = 7;

function monthIndex(d: Date): number { return d.getFullYear() * 12 + d.getMonth(); }

function prevMonthKey(today: Date): string {
  return monthKeyOf(new Date(today.getFullYear(), today.getMonth() - 1, 1));
}

/** Meses completos entre o mês da âncora e o mês de `today`. */
export function monthsSinceAnchor(p: Purpose | undefined, today: Date): number | null {
  const a = p?.firstCreatedAt;
  const m = a ? /^(\d{4})-(\d{2})-\d{2}$/.exec(a) : null;
  if (!m) return null;
  return monthIndex(today) - (Number(m[1]) * 12 + Number(m[2]) - 1);
}

/** A grade de ids de concessão e de revisão. */
export function grantIdFor(p: Purpose, cycle: number): string { return `semester:${p.firstCreatedAt ?? 'x'}:C${cycle}`; }

/** Existe revisão a oferecer agora? (Do dia 1 ao 7; nunca acumula.) */
export function reviewOffer(p: Purpose | undefined, today: Date): ReviewOffer | null {
  if (!p?.goal || p.goal.status !== 'active') return null;
  if (today.getDate() > REVIEW_WINDOW_LAST_DAY) return null;
  const since = monthsSinceAnchor(p, today);
  if (since === null || since < 1) return null;
  const monthKey = prevMonthKey(today);
  let offer: ReviewOffer;
  if (since >= 6 && since % 6 === 0) {
    const cycle = since / 6;
    offer = { kind: cycle % 2 === 0 ? 'year' : 'semester', period: `C${cycle}`, monthKey, cycle };
  } else {
    offer = { kind: 'month', period: monthKey, monthKey };
  }
  if (p.reviews.some(r => r.kind === offer.kind && r.period === offer.period)) return null;
  if (p.dismissed.includes(`${offer.kind}:${offer.period}`)) return null;
  return offer;
}

/** Dispensar: o card some e só volta no próximo ciclo. */
export function dismissReview(p: Purpose | undefined, offer: ReviewOffer): Purpose {
  const cur = p ?? emptyPurpose();
  return { ...cur, dismissed: [...cur.dismissed, `${offer.kind}:${offer.period}`].slice(-20) };
}

// ── evidência ───────────────────────────────────────────────────────────────

/** Os `n` meses que terminam em `monthKey` (inclusive), do mais antigo ao mais novo. */
export function monthsEndingAt(monthKey: string, n: number): string[] {
  const m = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!m) return [];
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(monthKeyOf(new Date(Number(m[1]), Number(m[2]) - 1 - i, 1)));
  return out;
}

export interface EvidenceRow { id: string; done: number; due: number }
export interface Evidence { rows: EvidenceRow[]; total: MonthCell; /** há algum registro? */ has: boolean }

/** Feitas / oportunidades por hábito nos meses dados (as prioridades primeiro, se houver). */
export function evidence(p: Purpose | undefined, months: string[]): Evidence {
  const agg = p?.monthlyAgg ?? {};
  const ids = new Set<string>();
  for (const mk of months) for (const id of Object.keys(agg[mk] ?? {})) ids.add(id);
  const pri = p?.priorities ?? [];
  const order = [...pri.filter(id => ids.has(id)), ...[...ids].filter(id => !pri.includes(id))];
  const rows = order.map(id => ({ id, ...sumMonths(agg, months, [id]) })).filter(r => r.due > 0 || r.done > 0);
  const total = sumMonths(agg, months);
  return { rows, total, has: rows.length > 0 };
}

// ── conclusão ───────────────────────────────────────────────────────────────

export interface ReviewInput {
  perceived?: Perceived;
  obstacles?: ObstacleKey[];
  decision?: ReviewDecision;
  note?: string;
  /** Mensal/semestral: o status da meta ANTERIOR ainda aberta. */
  previousStatus?: MilestoneStatus;
  /** Mensal/semestral: a meta do próximo período (opcional). */
  nextMilestone?: string;
  /** Anual: guardar o objetivo e liberar um novo. */
  archiveGoal?: boolean;
  /** "Você quer rever suas tarefas?" (`REVIEW_TASKS_ASK_MODE`): a resposta. Quem age é o App. */
  reviewTasks?: boolean;
  /** Ambição: a opção explícita "meus planos mudaram" (reabre as 3 cartas). */
  plansChanged?: boolean;
}

export function openMilestone(p: Purpose | undefined, period: 'month' | 'semester'): PurposeMilestone | undefined {
  return [...(p?.milestones ?? [])].reverse().find(m => m.period === period && m.status === 'open');
}

/** Registra a revisão. Idempotente no id: concluir duas vezes o mesmo período não duplica nem concede de novo. */
export function completeReview(
  p: Purpose | undefined, offer: ReviewOffer, input: ReviewInput, today: Date,
): { purpose: Purpose; grantedFrame?: string } {
  const cur = p ?? emptyPurpose();
  const id = `${offer.kind}-${offer.period}`;
  if (cur.reviews.some(r => r.id === id)) return { purpose: cur };
  const at = localDayKey(today);
  const note = input.note?.trim().slice(0, 300);
  const review: PurposeReview = {
    id, kind: offer.kind as ReviewKind, at, period: offer.period,
    obstacles: [...new Set(input.obstacles ?? [])].slice(0, 4),
    ...(input.perceived ? { perceived: input.perceived } : {}),
    ...(input.decision ? { decision: input.decision } : {}),
    ...(note ? { note } : {}),
  };
  const mPeriod: 'month' | 'semester' = offer.kind === 'month' ? 'month' : 'semester';
  let milestones = cur.milestones;
  const prev = openMilestone(cur, mPeriod);
  if (prev && input.previousStatus && input.previousStatus !== 'open') {
    milestones = milestones.map(m => (m.id === prev.id ? { ...m, status: input.previousStatus! } : m));
  }
  const label = input.nextMilestone?.trim().slice(0, 120);
  if (label) milestones = [...milestones, { id: `m-${mPeriod}-${at}`, period: mPeriod, label, status: 'open' as const, createdAt: at }].slice(-40);

  let next: Purpose = { ...cur, reviews: trimReviews([...cur.reviews, review]), milestones };

  if (offer.kind === 'year' && input.archiveGoal && cur.goal) {
    // Arquiva e libera um novo objetivo: a âncora recomeça com ele.
    const { goal: _g, firstCreatedAt: _f, ...rest } = next;
    next = { ...rest, history: [...cur.history, { ...cur.goal, status: 'archived' as const }].slice(-20), priorities: cur.priorities };
  }

  let grantedFrame: string | undefined;
  if (offer.kind === 'semester' && offer.cycle !== undefined) {
    const gid = grantIdFor(cur, offer.cycle);
    if (!cur.grants.includes(gid)) {
      next = { ...next, grants: [...next.grants, gid].slice(-20) };
      grantedFrame = SEMESTER_REWARD_FRAME_ID;
    }
  }
  return { purpose: next, grantedFrame };
}

// ── semanal (domingo) ───────────────────────────────────────────────────────

export const isWeeklyDay = (d: Date): boolean => d.getDay() === 0;

export interface WeekRow { id: string; done: number; due: number }

function windowKeys(today: Date, n: number): Date[] {
  const out: Date[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(new Date(today.getFullYear(), today.getMonth(), today.getDate() - i));
  return out;
}

/** "X de Y" de cada prioridade nos últimos 7 dias (incluindo hoje). */
export function weekEvidence(
  priorities: string[],
  rhythms: Record<string, HabitRhythm> | undefined,
  schedules: Record<string, { schedule?: Schedule; weekDays?: number[] }>,
  today: Date,
): WeekRow[] {
  const days = windowKeys(today, 7);
  const keys = new Set(days.map(dayKeyOf));
  return priorities.map(id => {
    const r = rhythms?.[id];
    const doneDays = new Set([...(r?.done ?? []), ...(r?.shielded ?? [])].filter(k => keys.has(k)));
    const done = doneDays.size;
    const s = normalizeSchedule(schedules[id] ?? {});
    let due: number;
    if (s.kind === 'weekdays') due = days.filter(d => s.days.includes(d.getDay())).length;
    else if (s.kind === 'timesPerWeek') due = s.target;
    else due = new Set([...doneDays, ...(r?.missed ?? []).filter(k => keys.has(k))]).size;
    return { id, done, due: Math.max(due, done) };
  });
}

/** A pergunta da semana: só 1 por semana (id = domingo da semana). */
export function recordWeekly(p: Purpose | undefined, obstacles: ObstacleKey[], today: Date): Purpose {
  const cur = p ?? emptyPurpose();
  const period = `W${localDayKey(today)}`;
  const id = `week-${period}`;
  if (cur.reviews.some(r => r.id === id)) return cur;
  return { ...cur, reviews: trimReviews([...cur.reviews, { id, kind: 'week', at: localDayKey(today), period, obstacles: obstacles.slice(0, 1) }]) };
}

export function weeklyAnswered(p: Purpose | undefined, today: Date): boolean {
  return !!p?.reviews.some(r => r.id === `week-W${localDayKey(today)}`);
}
