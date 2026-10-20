/**
 * O PLANEJADOR DOS PUSHES DO DIA (REGISTRO §113/§114): fome na faixa mediana,
 * energia cheia, cocô e o fechamento do dia — mais o TETO de `PUSH_DAILY_CAP`
 * somando TUDO o que o dia pode mandar (refeições, lembrete de deitar, convites
 * de hora fixa).
 *
 * ## O que decide aqui, e o que NÃO decide
 *
 *  · Decide QUAIS pushes valem hoje e a HORA de cada um (todos projetados do
 *    estado: a fome desce por timestamp, a energia regenera por timestamp, o cocô
 *    já está agendado no save). Quem ENTREGA é o `NotificationManager` (alarme do
 *    APK / timer da PWA aberta) e, para refeição e lembrete de deitar, o worker.
 *  · A copy é de `functions/api/_pushCopy.js` (uma fonte; convite, nunca culpa ou
 *    medo). O teto e a prioridade são de `functions/api/_pushBudget.js`.
 *  · NADA aqui lê o que a pessoa FEZ no dia (tarefas, meta, HP, constância): o
 *    corte é por tipo e por hora. Convite que muda de tom com o desempenho é
 *    cobrança com boas maneiras.
 *
 * ## Travas (todas com teste em `petPushEvents.test.ts`)
 *  1. Nunca em D0, nunca dentro da janela de descanso, nunca com o app sem permissão.
 *  2. Cada evento 1×/dia (a `ledger` lembra o que já saiu hoje) e só quando é verdade:
 *     fome só com comida na pastinha; energia só se ainda não está cheia.
 *  3. Progresso: no máximo 1×/dia, no fechamento, e só se SOBRAR vaga no teto.
 *  4. O que o teto corta de refeição/lembrete de deitar volta em `serverSkip`, para
 *     o worker não mandar o que o cliente cancelou (campo `x` da inscrição).
 *
 * Funções PURAS: `nowMs` por parâmetro, sem React, sem storage.
 */

import { capPushes } from '../../functions/api/_pushBudget.js';
import type { PushCandidate } from '../../functions/api/_pushBudget.js';
import {
  energyStatus, msToFullEnergy,
} from './hunger';
import type { EnergyClock, HungerRecord } from './hunger';
import {
  energyFullCopy, hungerInviteCopy, mealInviteCopy, mealPushKind, poopPushCopy, progressCopy, pushCopy,
  sleepReminderCopy,
} from '../../functions/api/_pushCopy.js';
import type { PushCopy } from '../../functions/api/_pushCopy.js';
import { mealMinutes } from '../../functions/api/_mealRhythm.js';
import { MEAL_KEYS, PUSH_DAILY_CAP, inRestArc, restArc } from './mealRhythm';
import type { MealRhythmSettings } from './mealRhythm';

export type { PushCandidate };

const MIN_MS = 60_000;

/** Hora local (minutos desde 00:00) do instante. */
function minutesOfDay(ms: number): number {
  const d = new Date(ms);
  return d.getHours() * 60 + d.getMinutes();
}

/** Início do dia LOCAL de `ms`. */
export function localDayStart(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Início do dia local SEGUINTE (seguro com horário de verão). */
export function localDayEnd(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d.getTime();
}

/** `YYYY-MM-DD` local — o mesmo formato do `dayKeyLocal` do worker (sem fuso UTC no meio). */
export function localDayKey(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Ids dos candidatos que são de EVENTO (entram e saem do ledger). */
const EVENT_KINDS = new Set(['poop', 'hunger', 'energyFull', 'progress']);

export interface PetPushState {
  hunger?: HungerRecord;
  energyPoints: number;
  energyClock?: EnergyClock;
  evolutionStage?: string;
  dungeonAway?: { since: number } | null;
  poopEventsScheduled?: number[];
  poopEventsShown?: number[];
  /** Soma da comida na pastinha (o texto da fome só é verdade com comida lá). */
  foodCount: number;
}

/** O que já saiu hoje (persistido pelo chamador): evento nunca repete no mesmo dia. */
export interface PetPushLedger {
  day: string;
  /** Ids de evento cuja hora já passou. */
  fired: string[];
  /** Ids de evento agendados na última passada, com a hora (viram `fired` quando a hora passa). */
  pending: Array<{ id: string; at: number }>;
  /** Chaves de refeição/lembrete (`breakfast`/`lunch`/`dinner`/`sleep`) que o teto CORTOU hoje: se a
   *  hora delas já passou, não saíram — e então não contam como entregues. */
  skipped: string[];
}

export interface PetPushInput {
  nowMs: number;
  petName: string;
  language: 'pt-BR' | 'en-US';
  /** Notificações ligadas (e com permissão): sem isto o plano é vazio. */
  enabled: boolean;
  isSleeping: boolean;
  /** Dias de vida; `0` = D0 (nunca push) e `null` = não sabe (não trava). */
  ageDays: number | null;
  restWindow?: { start: string; end: string } | null;
  mealRhythm?: MealRhythmSettings;
  /** Lembrete de deitar ligado (a janela é a de `restWindow`). */
  sleepReminderOn: boolean;
  state: PetPushState;
  ledger?: PetPushLedger;
  cap?: number;
}

export interface PlannedPush extends PushCandidate {
  title: string;
  body: string;
  tag: string;
  /** O worker é quem manda (refeição, lembrete de deitar, hora fixa): cortar exige `serverSkip`. */
  fromServer: boolean;
}

export interface PetPushPlan {
  day: string;
  /** O que fica, por hora. Os de `at` > agora ainda vão acontecer. */
  kept: PlannedPush[];
  dropped: PlannedPush[];
  /** Chaves (`breakfast`/`lunch`/`dinner`/`sleep`) que o worker NÃO deve mandar hoje. */
  serverSkip: string[];
}

/** O minuto local do fechamento do dia (push de progresso): 2 h antes do sono, até as 21h; nunca antes das 17h. */
export function progressSlotMinute(restWindow: { start: string; end: string } | null | undefined): number | null {
  const arc = restArc(restWindow);
  let m = 21 * 60;
  if (arc) m = Math.min(m, (arc[0] - 120 + 1440) % 1440);
  return m >= 17 * 60 ? m : null;
}

function at(dayStart: number, minute: number): number {
  return dayStart + minute * MIN_MS;
}

/** Ledger novo do dia: o que passou da hora vira `fired`; mudou o dia, zera. */
export function rollLedger(ledger: PetPushLedger | undefined, nowMs: number): PetPushLedger {
  const day = localDayKey(nowMs);
  if (!ledger || ledger.day !== day) return { day, fired: [], pending: [], skipped: [] };
  const fired = new Set(ledger.fired);
  const pending: PetPushLedger['pending'] = [];
  for (const p of ledger.pending) (p.at <= nowMs ? fired.add(p.id) : pending.push(p));
  return { day, fired: [...fired], pending, skipped: ledger.skipped ?? [] };
}

/** Grava no ledger o que o plano agendou para o futuro (eventos só). */
export function ledgerWithPlan(ledger: PetPushLedger, plan: PetPushPlan, nowMs: number): PetPushLedger {
  // O que foi cortado fica lembrado (para a hora que passar não contar como entregue); o que o plano
  // novo RESGATOU (voltou a caber) deixa de estar cortado.
  const kept = new Set(plan.kept.filter(p => p.fromServer && p.at > nowMs).map(p => (p.kind === 'sleep' ? 'sleep' : p.id.slice('meal-'.length))));
  const skipped = [...new Set([...(ledger.skipped ?? []), ...plan.serverSkip])].filter(k => !kept.has(k));
  return {
    ...ledger,
    skipped,
    pending: plan.kept
      .filter(p => EVENT_KINDS.has(p.kind) && p.at > nowMs)
      .map(p => ({ id: p.id, at: p.at })),
  };
}

/** Sanitiza o ledger lido do storage (lixo vira `undefined`). */
export function sanitizeLedger(v: unknown): PetPushLedger | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const o = v as Record<string, unknown>;
  if (typeof o.day !== 'string') return undefined;
  const fired = Array.isArray(o.fired) ? o.fired.filter((x): x is string => typeof x === 'string') : [];
  const pending = Array.isArray(o.pending)
    ? o.pending.filter((p): p is { id: string; at: number } =>
      !!p && typeof (p as { id?: unknown }).id === 'string' && Number.isFinite((p as { at?: unknown }).at))
    : [];
  const skipped = Array.isArray(o.skipped) ? o.skipped.filter((x): x is string => typeof x === 'string') : [];
  return { day: o.day, fired, pending, skipped };
}

const empty = (day: string): PetPushPlan => ({ day, kept: [], dropped: [], serverSkip: [] });

/**
 * O plano do dia LOCAL de `nowMs`: candidatos → teto → o que fica e o que sai.
 * Quem já passou da hora conta como entregue (`committed`) para o teto: não dá
 * para desenviar.
 */
export function planDayPushes(inp: PetPushInput): PetPushPlan {
  const now = inp.nowMs;
  const day = localDayKey(now);
  if (!inp.enabled || inp.ageDays === 0) return empty(day);

  const dayStart = localDayStart(now);
  const dayEnd = localDayEnd(now);
  const rest = restArc(inp.restWindow);
  const inRest = (ms: number) => inRestArc(minutesOfDay(ms), rest);
  const inToday = (ms: number) => ms >= dayStart && ms < dayEnd;
  const lang = inp.language;
  const name = inp.petName;
  const ledger = rollLedger(inp.ledger, now);
  const fired = new Set(ledger.fired);
  const skipped = new Set(ledger.skipped);
  const out: PlannedPush[] = [];

  const push = (id: string, kind: PlannedPush['kind'], atMs: number, copy: PushCopy, fromServer: boolean, committed = false) =>
    out.push({ id, kind, at: atMs, committed, title: copy.title, body: copy.body, tag: copy.tag, fromServer });

  // ── o que o WORKER / o alarme diário já mandam (hora fixa do dia) ──────────
  const mealPush = inp.mealRhythm?.push === true;
  if (mealPush && inp.mealRhythm) {
    const mins = mealMinutes(inp.mealRhythm.times);
    MEAL_KEYS.forEach((meal, i) => {
      if (inRestArc(mins[i], rest)) return;
      const t = at(dayStart, mins[i]);
      if (t <= now && skipped.has(meal)) return;
      push(`meal-${meal}`, 'meal', t, mealInviteCopy(meal, mealPushKind(meal, day), name, lang), true, t <= now);
    });
  }
  const sleepStart = rest ? rest[0] : null;
  if (inp.sleepReminderOn && sleepStart !== null) {
    const t = at(dayStart, (sleepStart - 30 + 1440) % 1440);
    // Já passou E o teto o tinha cortado: não saiu, então nem é candidato nem conta.
    if (!(t <= now && skipped.has('sleep'))) push('sleep', 'sleep', t, sleepReminderCopy(name, lang), true, t <= now);
  }
  // Convites de hora fixa (10h/16h/22h): só para quem NÃO tem o ritmo; cedem como no worker (`cedeAoRitmo`).
  // São inevitáveis (o worker os manda para todos): contam no teto, não se cortam.
  const generic: Array<[number, boolean]> = [
    [10, !mealPush],
    [16, !mealPush],
    [22, !(inp.sleepReminderOn && sleepStart !== null) && !(mealPush && rest !== null)],
  ];
  for (const [h, on] of generic) {
    const c = on ? pushCopy(h, name, lang, inp.ageDays) : null;
    if (c) push(`generic-${h}`, 'generic', at(dayStart, h * 60), c, true, true);
  }

  // ── cocô: a agenda do save (D-04). Só o que AINDA vai aparecer, acordado ──
  const sched = inp.state.poopEventsScheduled ?? [];
  const shown = inp.state.poopEventsShown ?? [];
  sched.forEach((t, i) => {
    if (!Number.isFinite(t) || shown.includes(i) || t <= now || !inToday(t) || inRest(t)) return;
    push(`poop-${i}`, 'poop', t, poopPushCopy(name, lang, i), false);
  });

  // ── fome (D-02): só o CRUZAR da faixa mediana (60), com comida na pastinha ─
  const hs = { ...inp.state } as Parameters<typeof energyStatus>[0];
  const st = energyStatus(hs, now);
  if (!fired.has('hunger') && inp.state.foodCount > 0 && st.tier === 'fed' && st.msToHungerDrop !== null) {
    const t = now + st.msToHungerDrop;
    if (inToday(t) && !inRest(t)) push('hunger', 'hunger', t, hungerInviteCopy(name, lang), false);
  }

  // ── energia cheia (D-03): 1×/dia, projetada com a fome descendo ─────────
  if (!fired.has('energyFull') && (st.mode === 'regen' || st.mode === 'slow')) {
    const ms = msToFullEnergy(hs, now);
    if (ms !== null && ms > 0) {
      const t = now + ms;
      if (inToday(t) && !inRest(t)) push('energyFull', 'energyFull', t, energyFullCopy(name, lang), false);
    }
  }

  // ── progresso (D-06): 1×/dia, no fechamento, só se sobrar vaga ───────────
  const slot = progressSlotMinute(inp.restWindow);
  if (!fired.has('progress') && slot !== null) {
    const t = at(dayStart, slot);
    if (t > now && !inRest(t)) push('progress', 'progress', t, progressCopy(name, lang), false);
  }

  // O que já saiu hoje e não é mais candidato (evento disparado) CONTA no teto.
  const already: PlannedPush[] = [...fired].map(id => ({
    id: `sent:${id}`, kind: id.startsWith('poop') ? 'poop' : (id as PlannedPush['kind']), at: dayStart,
    committed: true, title: '', body: '', tag: id, fromServer: false,
  }));

  const { kept, dropped } = capPushes([...out, ...already], inp.cap ?? PUSH_DAILY_CAP);
  const real = (l: PlannedPush[]) => l.filter(p => !p.id.startsWith('sent:'));
  const serverSkip = dropped
    .filter(p => p.fromServer && (p.kind === 'meal' || p.kind === 'sleep'))
    .map(p => (p.kind === 'sleep' ? 'sleep' : p.id.slice('meal-'.length)));
  return { day, kept: real(kept), dropped: real(dropped), serverSkip };
}

/**
 * O campo `x` da inscrição de push: o que o worker NÃO deve mandar HOJE porque o
 * teto cortou. Carrega o dia local para vencer sozinho (amanhã vale o plano novo).
 * `null` quando não há nada a cortar (nada vai para o servidor).
 */
export type ServerSkip = { d: string; k: string[] };

export function serverSkipPayload(plan: PetPushPlan): ServerSkip | null {
  return plan.serverSkip.length ? { d: plan.day, k: [...plan.serverSkip] } : null;
}

/**
 * A AGENDA DE COCÔ DO DIA na inscrição de push (REGISTRO §144): `{ d, tz, t }` — o
 * dia local, o fuso (min a leste de UTC) e os pares `[slot, instante]` dos cocôs que
 * AINDA vão aparecer hoje e FICARAM no teto. Só instantes, nenhum dado pessoal: é o
 * que o worker lê para avisar com o app/PWA FECHADO (ele não lê o save).
 *
 * O plano já tirou o que cai na janela de descanso, o que passou da hora e o que o
 * teto cortou (cocô tem a maior prioridade, então na prática nada). `null` quando
 * não sobra nenhum — e aí o campo some da inscrição (o servidor regrava o registro
 * inteiro), que é também o que acontece ao desligar as notificações (DELETE).
 */
export type ServerPoop = { d: string; tz: number; t: Array<[number, number]> };

export function serverPoopPayload(plan: PetPushPlan, tzOffsetMin: number): ServerPoop | null {
  const t: Array<[number, number]> = [];
  for (const p of plan.kept) {
    if (p.kind !== 'poop') continue;
    const slot = Number(p.id.slice('poop-'.length));
    if (Number.isInteger(slot) && slot >= 0 && slot <= 3) t.push([slot, p.at]);
  }
  if (!t.length) return null;
  t.sort((a, b) => a[1] - b[1]);
  return { d: plan.day, tz: tzOffsetMin, t };
}
