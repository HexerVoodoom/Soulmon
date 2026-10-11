// DONO ÚNICO do RITMO DAS REFEIÇÕES — as três janelas do dia em que o Soulmon
// convida a pessoa a passar rapidinho (depois do café, do almoço e do jantar).
//
// Por que mora em `functions/api/` (ESM puro, sem dependência): a MESMA conta
// de horário é feita em três árvores com ciclos de deploy diferentes — o
// cliente (`src/utils/mealRhythm.ts`, `NotificationManager.tsx`), o worker de
// push (`workers/push-scheduler.js`, deploy manual) e a rota de inscrição
// (`subscribe.js`/`fcm-subscribe.js`). É o mesmo motivo de `_pushCopy.js`
// (footgun 9: regra copiada diverge em silêncio). `workers/mealRhythm.parity.test.js`
// trava as três.
//
// O QUE ISTO É — e a régua que o define (docs/PLANO-EVOLUCAO.md, "essência"):
// um CONVITE, nunca uma cobrança. Três coisas decorrem disso e estão aqui:
//  · o ritmo é OPT-IN no push (`push` começa desligado) e editável;
//  · há um TETO diário de pushes (`PUSH_DAILY_CAP`) que o teste do worker prova
//    varrendo o dia inteiro, e o horário nunca cai dentro da janela de
//    descanso da pessoa;
//  · NADA aqui lê quanto a pessoa fez no dia. Convite que muda de tom conforme
//    o desempenho é cobrança com boas maneiras.

/** As três refeições, em ordem do dia. A ordem importa: o índice vai para a KV e para a telemetria. */
export const MEAL_KEYS = ['breakfast', 'lunch', 'dinner'];

/** Passo do relógio: horário editável só de 30 em 30 min — é a resolução do cron. */
export const MEAL_STEP_MIN = 30;

/** Quanto tempo a janela fica ABERTA no app, a partir do horário da refeição. */
export const MEAL_WINDOW_MIN = 120;

/** Distância mínima entre refeições. Menos que isto as janelas de 2h se sobrepõem. */
export const MEAL_MIN_GAP_MIN = 180;

/** Defaults (hora local do jogador): ~café, almoço, jantar. */
export const DEFAULT_MEAL_TIMES = { breakfast: '09:00', lunch: '13:30', dinner: '20:00' };

/** Faixa editável de cada refeição (minutos desde 00:00). Fora dela volta ao default. */
export const MEAL_RANGE_MIN = {
  breakfast: [6 * 60, 11 * 60],
  lunch: [11 * 60 + 30, 15 * 60 + 30],
  dinner: [17 * 60, 22 * 60],
};

/**
 * TETO DE PUSH AGENDADO POR DIA, para quem ligou o ritmo: 3 convites de refeição
 * + 1 fechamento (o "boa noite" das 22h OU o lembrete de deitar — nunca os
 * dois). Antes do ritmo o teto efetivo era 3 (10h/16h/22h); aqui os convites de
 * 10h e 16h CEDEM a vez aos de refeição em vez de somar. Quem prova é o teste do
 * worker, varrendo as 48 passadas do cron.
 */
export const PUSH_DAILY_CAP = 4;

/** O cron das refeições: uma passada a cada 30 min (a resolução de `MEAL_STEP_MIN`). */
export const MEAL_TICK_CRON = '*/30 * * * *';

const MIN_PER_DAY = 1440;

/** `'13:30'` → 810. `NaN` se não for 'HH:MM'. */
export function parseHHMM(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm ?? '').trim());
  if (!m) return NaN;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return NaN;
  return h * 60 + min;
}

/** 810 → `'13:30'`. */
export function formatHHMM(minutes) {
  const m = ((Math.round(minutes) % MIN_PER_DAY) + MIN_PER_DAY) % MIN_PER_DAY;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function snap(min) {
  return Math.round(min / MEAL_STEP_MIN) * MEAL_STEP_MIN;
}

/**
 * Horários válidos ou os defaults. NUNCA lança, NUNCA devolve horário fora da
 * faixa ou desordenado: save/inscrição malformados caem no padrão em vez de
 * derrubar o load ou mandar push às 3h.
 *
 * Cada refeição inválida volta ao default DELA; se a ordem/distância mínima
 * falhar, volta tudo — um conjunto pela metade é pior que o padrão.
 */
export function normalizeMealTimes(input) {
  const out = {};
  for (const key of MEAL_KEYS) {
    const [lo, hi] = MEAL_RANGE_MIN[key];
    const raw = parseHHMM(input && typeof input === 'object' ? input[key] : undefined);
    const snapped = Number.isNaN(raw) ? NaN : snap(raw);
    out[key] = Number.isNaN(snapped) || snapped < lo || snapped > hi
      ? DEFAULT_MEAL_TIMES[key]
      : formatHHMM(snapped);
  }
  const mins = MEAL_KEYS.map(k => parseHHMM(out[k]));
  for (let i = 1; i < mins.length; i++) {
    if (mins[i] - mins[i - 1] < MEAL_MIN_GAP_MIN) return { ...DEFAULT_MEAL_TIMES };
  }
  return out;
}

/** Os três horários em minutos, na ordem de `MEAL_KEYS`. */
export function mealMinutes(times) {
  const t = normalizeMealTimes(times);
  return MEAL_KEYS.map(k => parseHHMM(t[k]));
}

/** Minutos desde 00:00 locais de `at` (UTC) para um fuso em minutos a leste de UTC. */
export function localMinutes(at, tzOffsetMin) {
  const utcMin = at.getUTCHours() * 60 + at.getUTCMinutes();
  return (((utcMin + Math.round(tzOffsetMin)) % MIN_PER_DAY) + MIN_PER_DAY) % MIN_PER_DAY;
}

/** A janela de descanso `[start, end]` (minutos) cobre `minute`? Atravessa meia-noite. */
export function inRestArc(minute, rest) {
  if (!Array.isArray(rest) || rest.length !== 2) return false;
  const [s, e] = rest;
  if (!Number.isFinite(s) || !Number.isFinite(e) || s === e) return false;
  return s < e ? minute >= s && minute < e : minute >= s || minute < e;
}

/**
 * Qual refeição o relógio local acabou de atingir? Compara o minuto local
 * ARREDONDADO ao passo de 30 min com o horário da refeição — o cron roda em
 * :00 e :30 mas pode atrasar uns minutos, e o arredondamento absorve o atraso
 * sem permitir dois disparos para a mesma refeição (a passada seguinte já cai
 * no passo seguinte).
 */
export function mealAtTick(localMin, times) {
  const tick = snap(localMin) % MIN_PER_DAY;
  const mins = mealMinutes(times);
  const i = mins.indexOf(tick);
  return i === -1 ? null : MEAL_KEYS[i];
}

/**
 * Qual janela está ABERTA agora no app? `[horário, horário + MEAL_WINDOW_MIN)`.
 * `null` fora de todas. Não conhece a janela de descanso — quem chama filtra.
 */
export function openMealWindow(localMin, times) {
  const mins = mealMinutes(times);
  for (let i = 0; i < mins.length; i++) {
    if (localMin >= mins[i] && localMin < mins[i] + MEAL_WINDOW_MIN) return MEAL_KEYS[i];
  }
  return null;
}

/** Escolha determinística por semente: o mesmo dia/refeição dá o mesmo convite, em qualquer aparelho. */
export function seededIndex(seed, length) {
  let h = 2166136261;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return length > 0 ? (h >>> 0) % length : 0;
}
