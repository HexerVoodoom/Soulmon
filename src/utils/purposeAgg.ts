import { normalizeSchedule } from '../types/taskModel';
import type { Schedule } from '../types/taskModel';
import type { HabitRhythm } from './habitRhythm';
import { dayKeyToDate } from './habitRhythm';
import { monthKeyOf, parseLocalDay, type MonthCell, type MonthlyAgg, type Purpose, emptyPurpose } from './purpose';

/**
 * AGREGADO MENSAL "feitas / oportunidades" (E10, docs/PLANO-OBJETIVO-ANUAL.md 8b.1)
 * ================================================================================
 *
 * `habitRhythms` guarda no máximo `HISTORY_CAP` (120) dias e só os feitos; o app
 * só calcula quando é aberto. Por isso o fechamento é RETROATIVO e idempotente:
 * a cada abertura (e a cada virada), todo mês INTEIRO já passado e sem registro
 * é calculado a partir do ritmo. Um app fechado por 150 dias fecha todos os
 * meses do vão de uma vez, na volta.
 *
 * Dia = data LOCAL do aparelho (mesma de `habitRhythm`). Oportunidade (`due`):
 *  - weekdays: dias do mês cuja semana-dia está na agenda;
 *  - timesPerWeek: a meta semanal, proporcional aos dias do mês na semana;
 *  - a cada N dias: os dias que ficaram registrados (feito/perdido/protegido).
 * Fora da conta: antes do 1º registro do hábito e os dias "de volta" (o app
 * fechado: não há dia perdido, e o app nunca cobrou por eles) — é o "pausado".
 * Dia protegido por escudo conta como feito (igual à constância).
 */

export interface AggActivity { id: string; schedule?: Schedule; weekDays?: number[] }

const DAY_MS = 86_400_000;

function startOfMonth(y: number, m: number): Date { return new Date(y, m, 1); }

/** Dias do mês `[y,m]` como Date local (meia-noite). */
function daysOfMonth(y: number, m: number): Date[] {
  const out: Date[] = [];
  const n = new Date(y, m + 1, 0).getDate();
  for (let d = 1; d <= n; d++) out.push(new Date(y, m, d));
  return out;
}

function keyToTime(key: string): number | null {
  const d = dayKeyToDate(key);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

function inMonth(key: string, y: number, m: number): boolean {
  const d = dayKeyToDate(key);
  return !Number.isNaN(d.getTime()) && d.getFullYear() === y && d.getMonth() === m;
}

/** O hábito conta como pausado neste dia? (`away` = intervalo [from,to] em ms, inclusive.) */
function isAway(t: number, away?: { from: number; to: number }): boolean {
  return !!away && t >= away.from && t <= away.to;
}

export function monthCell(
  act: AggActivity,
  rhythm: HabitRhythm,
  y: number,
  m: number,
  away?: { from: number; to: number },
): MonthCell | null {
  const recorded = [...rhythm.done, ...rhythm.shielded, ...rhythm.missed];
  const times = recorded.map(keyToTime).filter((t): t is number => t !== null);
  if (times.length === 0) return null;
  const first = Math.min(...times);
  const monthEnd = new Date(y, m + 1, 0).getTime();
  if (first > monthEnd) return null; // o hábito ainda não existia

  const doneKeys = new Set([...rhythm.done, ...rhythm.shielded].filter(k => inMonth(k, y, m)));
  const recordedKeys = new Set(recorded.filter(k => inMonth(k, y, m)));
  const done = doneKeys.size;

  const s = normalizeSchedule({ schedule: act.schedule, weekDays: act.weekDays });
  const days = daysOfMonth(y, m).filter(d => d.getTime() >= first && !isAway(d.getTime(), away));
  let due = 0;
  if (s.kind === 'weekdays') {
    due = days.filter(d => s.days.includes(d.getDay())).length;
  } else if (s.kind === 'timesPerWeek') {
    // Semana começa no domingo (igual a `weekStart`): meta × fração de dias válidos.
    const byWeek = new Map<number, number>();
    for (const d of days) {
      const wk = Math.floor((d.getTime() - d.getDay() * DAY_MS + 12 * 3_600_000) / (7 * DAY_MS));
      byWeek.set(wk, (byWeek.get(wk) ?? 0) + 1);
    }
    for (const n of byWeek.values()) due += (s.target * n) / 7;
    due = Math.round(due);
  } else {
    due = recordedKeys.size;
  }
  // Feito fora do previsto (dia extra) nunca deixa done > due.
  due = Math.max(due, done);
  if (due === 0 && done === 0) return { done: 0, due: 0 };
  return { done, due };
}

export interface CloseArgs {
  rhythms: Record<string, HabitRhythm> | undefined;
  activities: AggActivity[];
  purpose: Purpose | undefined;
  /** "hoje" local. */
  today: Date;
  /** Último dia em que o app virou (`lastResetDate`, dayKey). Os dias entre ele e hoje são "de volta". */
  lastSeen?: string;
}

/**
 * Fecha, retroativamente, todo mês inteiro anterior ao mês de `today` que ainda
 * não tem registro. Devolve o MESMO objeto se nada mudou (barato de comparar).
 */
export function closePastMonths({ rhythms, activities, purpose, today, lastSeen }: CloseArgs): Purpose | undefined {
  if (!rhythms || Object.keys(rhythms).length === 0) return purpose;
  const agg: MonthlyAgg = purpose?.monthlyAgg ?? {};
  const curMonth = monthKeyOf(today);

  let earliest = Infinity;
  for (const r of Object.values(rhythms)) {
    for (const k of [...r.done, ...r.shielded, ...r.missed]) {
      const t = keyToTime(k);
      if (t !== null && t < earliest) earliest = t;
    }
  }
  if (!Number.isFinite(earliest)) return purpose;

  let away: { from: number; to: number } | undefined;
  const seen = lastSeen ? (parseLocalDay(lastSeen) ?? dayKeyToDate(lastSeen)) : null;
  if (seen && !Number.isNaN(seen.getTime())) {
    const from = new Date(seen.getFullYear(), seen.getMonth(), seen.getDate() + 1).getTime();
    const to = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() - 1;
    if (to > from) away = { from, to };
  }

  const byId = new Map(activities.map(a => [String(a.id), a]));
  const add: MonthlyAgg = {};
  const e = new Date(earliest);
  let y = e.getFullYear();
  let m = e.getMonth();
  for (let guard = 0; guard < 240; guard++) {
    const mk = monthKeyOf(startOfMonth(y, m));
    if (mk >= curMonth) break;
    if (!agg[mk]) {
      const row: Record<string, MonthCell> = {};
      for (const [id, rhythm] of Object.entries(rhythms)) {
        const cell = monthCell(byId.get(id) ?? { id }, rhythm, y, m, away);
        if (cell && (cell.due > 0 || cell.done > 0)) row[id] = cell;
      }
      add[mk] = row; // mês sem nada também é gravado: "fechado, vazio"
    }
    m += 1;
    if (m > 11) { m = 0; y += 1; }
  }
  if (Object.keys(add).length === 0) return purpose;
  const base = purpose ?? emptyPurpose();
  return { ...base, monthlyAgg: { ...base.monthlyAgg, ...add } };
}

/** Soma de feitas/oportunidades de um conjunto de meses (revisões semestral/anual). */
export function sumMonths(agg: MonthlyAgg, months: string[], ids?: string[]): MonthCell {
  let done = 0; let due = 0;
  for (const mk of months) {
    for (const [id, c] of Object.entries(agg[mk] ?? {})) {
      if (ids && !ids.includes(id)) continue;
      done += c.done; due += c.due;
    }
  }
  return { done, due };
}
