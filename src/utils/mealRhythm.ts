/**
 * O RITMO DAS REFEIÇÕES — três janelas por dia (depois do café, do almoço e do
 * jantar) em que o Soulmon convida a pessoa a passar rapidinho e fazer UMA
 * coisa pequena.
 *
 * ## O que isto é, e o que NÃO é
 *
 * É um CONVITE de presença: o jogo fica na cabeça sem virar tarefa. A régua do
 * produto (docs/PLANO-EVOLUCAO.md — "um avatar que evolui COM o usuário e o
 * encoraja, nunca um cobrador") se traduz aqui em cinco travas, todas com teste:
 *
 *  1. **Não cobra.** Nada neste módulo lê quanto a pessoa fez no dia (meta,
 *     HP, constância). O convite é o mesmo para quem fechou tudo e para quem
 *     não abriu nada — convite que muda de tom com o desempenho é cobrança com
 *     boas maneiras. Janela não cumprida não deixa rastro: o registro é do DIA
 *     e se esvazia sozinho na virada, sem contador, sem sequência, sem "perdeu".
 *  2. **Não cria fonte nova de nada.** A micro-ação é uma das que o jogo JÁ tem
 *     (comida da pastinha, limpar cocô, carinho) e cada uma passa pelo seu dono
 *     e pelo seu teto (`careRules`/`careUpdaters`/`poopDrain`). O que este
 *     módulo registra é só "a janela de hoje foi atendida" — não concede
 *     energia, HP, Bits, Emblemas nem XP. A recompensa é a reação do bicho ao
 *     gesto que a pessoa acabou de fazer (L11). O dono aprovou o XP de Vínculo
 *     pequeno em 28/10/2026.
 *  3. **Opt-in no que interrompe.** O cartão dentro do app vem ligado (não
 *     interrompe nada: só aparece com o app já aberto); o PUSH começa
 *     DESLIGADO e só existe com a permissão de notificação concedida.
 *  4. **Respeita a noite.** Nenhuma janela abre dentro da janela de descanso
 *     da pessoa, nem com o pet dormindo.
 *  5. **Teto.** 1 cartão por janela, 3 por dia; no push, `PUSH_DAILY_CAP`.
 *
 * Funções PURAS (sem React, sem localStorage); `now: Date` por parâmetro.
 * Horário e janela são do DONO ÚNICO `functions/api/_mealRhythm.js` — o mesmo
 * que o worker de push importa. Nada de constante de horário aqui.
 */

import {
  DEFAULT_MEAL_TIMES, MEAL_KEYS, MEAL_WINDOW_MIN, PUSH_DAILY_CAP,
  formatHHMM, inRestArc, mealMinutes, normalizeMealTimes, openMealWindow, parseHHMM,
} from '../../functions/api/_mealRhythm.js';
import type { MealKey, MealTimes } from '../../functions/api/_mealRhythm.js';
import type { MealInviteKind } from '../../functions/api/_pushCopy.js';
import { playerDayKey, type PlayerDayAnchor } from './playerDay';

export { DEFAULT_MEAL_TIMES, MEAL_KEYS, MEAL_WINDOW_MIN, PUSH_DAILY_CAP, normalizeMealTimes };
export type { MealKey, MealTimes, MealInviteKind };

// ---------------------------------------------------------------------------
// Configuração (mora no save: viaja entre aparelhos, como a janela de descanso)
// ---------------------------------------------------------------------------

export interface MealRhythmSettings {
  /** Cartão dentro do app nas janelas. Padrão: ligado (não interrompe ninguém). */
  inApp: boolean;
  /** Push/alarme nas janelas. Padrão: LIGADO desde 18/10/2026 (dono, B4: tudo de notificação nasce ligado); só vale com as notificações ligadas e a permissão do sistema. */
  push: boolean;
  /** Horários locais, na grade de 30 min e dentro da faixa de cada refeição. */
  times: MealTimes;
}

export const DEFAULT_MEAL_RHYTHM: MealRhythmSettings = {
  inApp: true,
  push: true,
  times: { ...DEFAULT_MEAL_TIMES },
};

/** Lixo vira o padrão; nunca derruba o load (mesma regra de `sanitizeRefugeInvite`). */
export function sanitizeMealRhythm(v: unknown): MealRhythmSettings {
  if (!v || typeof v !== 'object') return { ...DEFAULT_MEAL_RHYTHM, times: { ...DEFAULT_MEAL_TIMES } };
  const o = v as Record<string, unknown>;
  return {
    inApp: o.inApp !== false,
    push: o.push !== false,
    times: normalizeMealTimes(o.times),
  };
}

// ---------------------------------------------------------------------------
// O registro do dia
// ---------------------------------------------------------------------------

/**
 * Quais janelas de HOJE já foram atendidas ou dispensadas. É do DIA DO
 * JOGADOR (`playerDayKey`) e se esvazia sozinho quando o dia vira — não existe
 * histórico, contagem acumulada nem sequência. `lastKind` existe só para a
 * telemetria (qual micro-ação fechou a última janela).
 */
export interface MealRitualRecord {
  day: string;
  done: MealKey[];
  skipped: MealKey[];
  lastKind?: MealInviteKind;
}

/** Tipos de micro-ação, na ordem em que viram código de telemetria (0..3). */
export const MEAL_KIND_CODE: Record<MealInviteKind, number> = { snack: 0, poop: 1, pet: 2, tenSeconds: 3 };

export function sanitizeMealRitual(v: unknown): MealRitualRecord | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const o = v as Record<string, unknown>;
  if (typeof o.day !== 'string' || !o.day) return undefined;
  const keep = (a: unknown): MealKey[] =>
    Array.isArray(a) ? MEAL_KEYS.filter(k => a.includes(k)) : [];
  const kinds = Object.keys(MEAL_KIND_CODE) as MealInviteKind[];
  return {
    day: o.day,
    done: keep(o.done),
    skipped: keep(o.skipped),
    ...(kinds.includes(o.lastKind as MealInviteKind) ? { lastKind: o.lastKind as MealInviteKind } : {}),
  };
}

function recordFor(rec: MealRitualRecord | undefined, day: string): MealRitualRecord {
  return rec && rec.day === day ? rec : { day, done: [], skipped: [] };
}

/** Minutos desde 00:00 no relógio do APARELHO — a refeição é onde a pessoa está. */
export function deviceMinutes(now: Date): number {
  return now.getHours() * 60 + now.getMinutes();
}

/** `[início, fim]` da janela de descanso em minutos, ou `null` sem janela. */
export function restArc(window: { start: string; end: string } | null | undefined): [number, number] | null {
  if (!window) return null;
  const s = parseHHMM(window.start);
  const e = parseHHMM(window.end);
  if (Number.isNaN(s) || Number.isNaN(e) || s === e) return null;
  return [s, e];
}

export interface MealGateInput {
  settings?: MealRhythmSettings;
  record?: MealRitualRecord;
  restWindow?: { start: string; end: string } | null;
  isSleeping?: boolean;
  playerDayTz?: PlayerDayAnchor;
}

/**
 * A janela de refeição ABERTA agora e ainda sem resposta, ou `null`.
 *
 * Fecha por: ritmo desligado no app, pet dormindo, relógio dentro da janela de
 * descanso, janela já atendida ou dispensada hoje.
 */
export function openInvite(now: Date, g: MealGateInput): MealKey | null {
  const s = g.settings ?? DEFAULT_MEAL_RHYTHM;
  if (!s.inApp || g.isSleeping) return null;
  const minute = deviceMinutes(now);
  if (inRestArc(minute, restArc(g.restWindow))) return null;
  const meal = openMealWindow(minute, s.times) as MealKey | null;
  if (!meal) return null;
  const rec = recordFor(g.record, playerDayKey(now, g.playerDayTz));
  if (rec.done.includes(meal) || rec.skipped.includes(meal)) return null;
  return meal;
}

/**
 * Atende a janela aberta (se houver) com o tipo de gesto que a fechou.
 * IDEMPOTENTE: sem janela aberta ou já atendida devolve a MESMA referência —
 * então entra direto num updater de `setGameState` (footgun 6) e pode ser
 * chamado por qualquer gesto de cuidado sem checar nada antes.
 *
 * Atende MESMO com o cartão escondido ou com o ritmo do app desligado? Não: o
 * ritmo desligado não registra nada (o registro é do convite, e sem convite não
 * há o que atender). Dormindo/janela de descanso também não — nada abre ali.
 */
export function markMealDone<T extends { mealRitual?: MealRitualRecord; mealRhythm?: MealRhythmSettings; rest?: { window?: { start: string; end: string } | null }; playerDayTz?: PlayerDayAnchor }>(
  state: T,
  now: Date,
  kind: MealInviteKind,
  isSleeping = false,
): T {
  const meal = openInvite(now, {
    settings: state.mealRhythm,
    record: state.mealRitual,
    restWindow: state.rest?.window ?? null,
    isSleeping,
    playerDayTz: state.playerDayTz,
  });
  if (!meal) return state;
  const day = playerDayKey(now, state.playerDayTz);
  const rec = recordFor(state.mealRitual, day);
  return { ...state, mealRitual: { ...rec, done: [...rec.done, meal], lastKind: kind } };
}

/** "Agora não": dispensa a janela inteira — o convite não volta até a próxima refeição. */
export function skipMeal<T extends { mealRitual?: MealRitualRecord; playerDayTz?: PlayerDayAnchor }>(
  state: T,
  meal: MealKey,
  now: Date,
): T {
  const day = playerDayKey(now, state.playerDayTz);
  const rec = recordFor(state.mealRitual, day);
  if (rec.skipped.includes(meal) || rec.done.includes(meal)) return state;
  return { ...state, mealRitual: { ...rec, skipped: [...rec.skipped, meal] } };
}

// ---------------------------------------------------------------------------
// A micro-ação: UMA coisa pequena, que o jogo já tem
// ---------------------------------------------------------------------------

export interface MicroActionContext {
  /** Há cocô na tela agora (o que é REAL, nunca inventado para ter o que pedir). */
  poopPending: boolean;
  /** Comida COMUM na pastinha, a janela horária de comida com vaga E energia com espaço. */
  canFeed: boolean;
  /** Carinho é sempre possível (a animação não tem teto; o teto é só da CURA). */
  canPet?: boolean;
}

/**
 * Escolhe o convite. Ordem de verdade: cocô na tela > comida que cabe > o
 * resto. Entre os que sobram, a escolha rotaciona por (dia, refeição) para o
 * cartão não ser o mesmo três vezes ao dia. `tenSeconds` ("diga oi") é o piso:
 * sempre existe, não gasta nada de ninguém — é o que torna o convite honesto
 * mesmo com a pastinha vazia e sem cocô.
 *
 * NUNCA devolve `snack` se comer queimaria a comida à toa (energia cheia ou
 * janela horária de comida cheia): convidar para gastar item sem efeito seria
 * pedir desperdício.
 */
export function pickMicroAction(ctx: MicroActionContext, seed: string): MealInviteKind {
  if (ctx.poopPending) return 'poop';
  const pool: MealInviteKind[] = [];
  if (ctx.canFeed) pool.push('snack');
  if (ctx.canPet !== false) pool.push('pet');
  pool.push('tenSeconds');
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return pool[(h >>> 0) % pool.length];
}

// ---------------------------------------------------------------------------
// O que vai para o servidor (push) — só com opt-in
// ---------------------------------------------------------------------------

export interface ServerMeals {
  t: number[];
  tz: number;
  rest?: number[];
}

/**
 * O campo `meals` da inscrição de push, ou `null` quando a pessoa não ligou o
 * aviso (aí NADA do ritmo vai para o servidor — nem horário, nem fuso). O fuso
 * é o OFFSET do aparelho agora, em minutos a leste de UTC: reenviado a cada
 * abertura com push ligado, então horário de verão se corrige na próxima vez
 * que o app abre (se a pessoa passar a mudança sem abrir, o push desliza 1 h
 * até lá — declarado em REGISTRO-DE-DECISOES).
 */
export function serverMeals(
  settings: MealRhythmSettings | undefined,
  restWindow: { start: string; end: string } | null | undefined,
  now: Date,
): ServerMeals | null {
  if (!settings?.push) return null;
  const rest = restArc(restWindow);
  return {
    t: mealMinutes(settings.times),
    tz: -now.getTimezoneOffset(),
    ...(rest ? { rest } : {}),
  };
}

// ---------------------------------------------------------------------------
// Cocô: alinhar o horário SORTEADO ao pós-refeição, sem mexer na regra
// ---------------------------------------------------------------------------

/**
 * A regra do cocô (CLAUDE.md 💩) não muda: até 2×/dia, o 1º entre 07h (10h com
 * Madrugador) e 15h, o 2º de 8 a 10 h depois do 1º APARECER, nunca dormindo,
 * com o mesmo dreno e o mesmo teto. O que muda é a DISTRIBUIÇÃO dentro desses
 * limites: em vez de uniforme, o horário cai de preferência na janela
 * pós-refeição (de 15 min a 1h45 depois da refeição) — que é quando um bicho
 * faz cocô de verdade e quando o cartão da refeição pode oferecer o banho.
 *
 * `AFTER_MEAL_FROM_H`/`_TO_H`: a janela pós-refeição, em horas depois do horário.
 */
export const POOP_AFTER_MEAL_FROM_H = 0.25;
export const POOP_AFTER_MEAL_TO_H = 1.75;

function pickInRanges(ranges: Array<[number, number]>, rand: () => number): number | null {
  const valid = ranges.filter(([a, b]) => b > a);
  if (valid.length === 0) return null;
  const total = valid.reduce((s, [a, b]) => s + (b - a), 0);
  let pick = rand() * total;
  for (const [a, b] of valid) {
    if (pick < b - a) return a + pick;
    pick -= b - a;
  }
  const [a, b] = valid[valid.length - 1];
  return a + (b - a) * rand();
}

/**
 * Hora do dia (decimal) do 1º cocô: dentro de `[earliest, latest)` e, quando
 * possível, na janela pós-café ou pós-almoço. Sem interseção (ex.: Madrugador
 * num horário de café muito cedo) cai no sorteio uniforme de sempre.
 */
export function alignedFirstPoopHour(
  rand: () => number,
  earliest: number,
  latest: number,
  times: MealTimes | undefined,
): number {
  const mins = mealMinutes(times ?? DEFAULT_MEAL_TIMES);
  const windows: Array<[number, number]> = [mins[0], mins[1]].map(m => [
    Math.max(earliest, m / 60 + POOP_AFTER_MEAL_FROM_H),
    Math.min(latest, m / 60 + POOP_AFTER_MEAL_TO_H),
  ]);
  return pickInRanges(windows, rand) ?? earliest + rand() * (latest - earliest);
}

/**
 * Intervalo (em horas) até o 2º cocô: 8–10 h depois do 1º APARECER, como
 * sempre, preferindo cair na janela pós-jantar do MESMO dia. `firstAt` é o
 * instante em que o 1º apareceu.
 */
export function alignedSecondGapHours(
  rand: () => number,
  firstAt: number,
  times: MealTimes | undefined,
): number {
  const mins = mealMinutes(times ?? DEFAULT_MEAL_TIMES);
  const midnight = new Date(firstAt);
  midnight.setHours(0, 0, 0, 0);
  const dinnerH = mins[2] / 60;
  const startH = (midnight.getTime() + (dinnerH + POOP_AFTER_MEAL_FROM_H) * 3600000 - firstAt) / 3600000;
  const endH = (midnight.getTime() + (dinnerH + POOP_AFTER_MEAL_TO_H) * 3600000 - firstAt) / 3600000;
  return pickInRanges([[Math.max(8, startH), Math.min(10, endH)]], rand) ?? 8 + rand() * 2;
}

// ---------------------------------------------------------------------------
// Cocô 2×/dia GARANTIDO, sempre com o pet ACORDADO (REGISTRO §114, D-05)
// ---------------------------------------------------------------------------

/** Distância mínima entre os dois cocôs do dia quando o dia acordado é curto (h). */
export const POOP_MIN_GAP_H = 4;
/** O 2º cocô sempre cai pelo menos isto ANTES do início do sono (h): dá tempo de limpar. */
export const POOP_SLEEP_MARGIN_H = 0.75;
/** Sem janela de descanso (save de teste/legado) o dia acordado termina aqui (h). */
const POOP_FALLBACK_SLEEP_H = 22;

/**
 * O trecho ACORDADO do dia, em horas desde 00:00: do despertar (fim da janela de
 * descanso) até o início do sono. Janela que atravessa a meia-noite (23:00–07:00)
 * dá [7, 23]; janela dentro do mesmo dia (01:00–07:00) dá [7, 24]. Sem janela:
 * [0, 22]. A janela de descanso é obrigatória desde o §99, então o caso "sem
 * janela" é só rede de segurança.
 */
export function awakeSpanHours(window: { start: string; end: string } | null | undefined): [number, number] {
  const arc = restArc(window);
  if (!arc) return [0, POOP_FALLBACK_SLEEP_H];
  const [s, e] = arc;
  return s > e ? [e / 60, s / 60] : [e / 60, 24];
}

function intersect(a: [number, number], b: [number, number]): [number, number] {
  return [Math.max(a[0], b[0]), Math.min(a[1], b[1])];
}

/**
 * Intervalo (h) até o 2º cocô, contado do instante em que o 1º foi AGENDADO/apareceu
 * (`firstAt`). Preferência: 8–10 h depois (a regra de sempre), de preferência no
 * pós-jantar (com o ritmo ligado); mas SEMPRE antes de
 * `início do sono − POOP_SLEEP_MARGIN_H`, para o 2º nunca cair com o pet dormindo
 * (antes ele caía no sono e o dia saía com 1 só). Se 8 h não cabem, usa o que cabe,
 * com piso de `POOP_MIN_GAP_H`. Se nem isso cabe (1º tarde demais), devolve o resto
 * até o sono (mín. 15 min): nunca inventa cocô com o pet dormindo — quem decide
 * isso é `isSleeping` no aparecimento.
 */
export function awakeSecondGapHours(
  rand: () => number,
  firstAt: number,
  times: MealTimes | undefined,
  restWindow: { start: string; end: string } | null | undefined,
  aligned: boolean,
): number {
  const midnight = new Date(firstAt);
  midnight.setHours(0, 0, 0, 0);
  return secondGapFromHour(rand, (firstAt - midnight.getTime()) / 3600000, times, restWindow, aligned);
}

/** Núcleo de `awakeSecondGapHours`, com o 1º já em hora do dia (sem depender do fuso do aparelho). */
function secondGapFromHour(
  rand: () => number,
  firstH: number,
  times: MealTimes | undefined,
  restWindow: { start: string; end: string } | null | undefined,
  aligned: boolean,
): number {
  const [, sleepH] = awakeSpanHours(restWindow);
  const limitGap = sleepH - POOP_SLEEP_MARGIN_H - firstH;
  const pref: [number, number] = [8, Math.min(10, limitGap)];
  const ranges: Array<[number, number]> = [];
  if (aligned) {
    const dinnerH = mealMinutes(times ?? DEFAULT_MEAL_TIMES)[2] / 60;
    const dinner: [number, number] = [
      dinnerH + POOP_AFTER_MEAL_FROM_H - firstH,
      dinnerH + POOP_AFTER_MEAL_TO_H - firstH,
    ];
    ranges.push(intersect(pref, dinner));
  }
  ranges.push(pref, [POOP_MIN_GAP_H, limitGap]);
  for (const r of ranges) {
    const pick = pickInRanges([r], rand);
    if (pick !== null) return pick;
  }
  return Math.max(0.25, limitGap);
}

export interface DailyPoopPlanOptions {
  /** Hora mais cedo do 1º (07h; 10h com Madrugador). */
  earliest: number;
  /** Hora limite do 1º (15h, a regra de sempre). */
  latest: number;
  times?: MealTimes;
  restWindow?: { start: string; end: string } | null;
  /** Ritmo das refeições ligado: o sorteio prefere o pós-refeição. */
  aligned: boolean;
}

/**
 * A agenda do dia inteiro, de uma vez: `[t1, t2]` em horas desde 00:00. O 1º cai
 * entre `earliest` e `latest` (e depois do despertar), o 2º segue
 * `awakeSecondGapHours`. Os dois ficam no save (`poopEventsScheduled`) já no
 * começo do dia — é o que deixa o push de cocô saber a hora (D-04). `applyPoopDrain`
 * e o dreno não mudam: só a AGENDA.
 */
export function planDailyPoops(rand: () => number, o: DailyPoopPlanOptions): [number, number] {
  const [wakeH, sleepH] = awakeSpanHours(o.restWindow);
  const lo = Math.max(o.earliest, wakeH);
  const hi = Math.max(lo, Math.min(o.latest, sleepH - POOP_SLEEP_MARGIN_H - POOP_MIN_GAP_H));
  const t1 = o.aligned
    ? alignedFirstPoopHour(rand, lo, hi, o.times)
    : (hi > lo ? lo + rand() * (hi - lo) : lo);
  const first = Math.min(Math.max(t1, lo), hi);
  const gap = secondGapFromHour(rand, first, o.times, o.restWindow, o.aligned);
  return [first, first + gap];
}

export { formatHHMM, inRestArc, parseHHMM };
