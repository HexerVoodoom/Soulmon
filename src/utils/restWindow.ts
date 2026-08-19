/**
 * A JANELA DE DESCANSO (sono) + a coleção de SONHOS
 * =================================================
 *
 * Parte 3 do `docs/PLANO-TAREFAS.md`. Funções PURAS: `now: Date` (ou os
 * instantes envolvidos) SEMPRE entram por parâmetro, nunca por `Date.now()`
 * dentro da regra — é o que torna cada linha daqui testável e o que impede que
 * a mecânica se comporte diferente no app, no desktop e no teste.
 *
 * SEM SENSOR — E ISSO É DECISÃO DE ARQUITETURA, NÃO LIMITAÇÃO
 * -----------------------------------------------------------
 * Nada aqui lê Health Connect, HealthKit, acelerômetro, microfone ou qualquer
 * permissão de saúde. A única entrada é o gesto que o app JÁ tem: o usuário
 * põe o pet para dormir. Consequências, todas desejadas:
 *
 *  - Roda IDÊNTICO na PWA e no APK Android. Não existe ponte web para Health
 *    Connect, então qualquer mecânica dependente de sensor seria conteúdo de
 *    segunda classe para a maior parte da base.
 *  - Nenhum dado sensível sob a LGPD art. 11 é coletado, logo nenhum
 *    consentimento específico e destacado é necessário, nem conta de
 *    organização verificada no Play Console (enforcement de jan/2026), nem
 *    política de privacidade dedicada de health app.
 *  - Google Fit está morrendo em 2026 (cadastros novos fechados desde
 *    01/05/2024, APIs suportadas só até o fim de 2026): não há uma linha
 *    escrita contra ele, de propósito.
 *
 * O princípio do `PLANO-EVOLUCAO.md` continua de pé: **declarado pontua;
 * inferido, se um dia existir, apenas confirma**. Nunca o inverso.
 *
 * REGRAS INEGOCIÁVEIS
 * -------------------
 * 1. **Premie o COMPORTAMENTO (deitar no horário), nunca o RESULTADO (dormir
 *    bem).** Comportamento é controlável; resultado fisiológico não — ninguém
 *    comanda o próprio sono às 3h da manhã. Premiar resultado é a definição
 *    operacional de como se fabrica ortossonia.
 * 2. **Nunca punir sono ruim. Só recompensar sono bom.** Não existe perda
 *    nesta mecânica: nenhuma função deste arquivo devolve dano, multa, streak
 *    zerado ou qualquer número que possa DIMINUIR. Há teste travando isso.
 * 3. **Sem score 0–100 de qualidade de sono.** Oura/Whoop produzem exatamente
 *    o número que gera ortossonia. O que existe aqui é uma razão de
 *    regularidade, e ela alimenta RARIDADE DE SONHO — recompensa —, não
 *    veredito.
 * 4. **Feedback só de MANHÃ.** Nada aqui gera notificação noturna sobre
 *    desempenho: a ortossonia é ansiedade ANTES de dormir. O único lembrete
 *    possível é o de DEITAR (ver `sleepReminderAt`).
 * 5. **`hideMetrics` esconde os NÚMEROS e PRESERVA as RECOMPENSAS.** O switch
 *    é de apresentação. `restConstancy`, `dreamRarity` e os sonhos continuam
 *    valendo igual — quem não quer ver métrica não deve por isso colecionar
 *    menos.
 * 6. **Noite sem registro é NEUTRA**, nunca uma falha (ver `restConstancy`).
 *
 * CONTEXTO DE RISCO (por que as regras acima não são preciosismo)
 * --------------------------------------------------------------
 * A ortossonia — a busca ansiosa pelo sono perfeito, alimentada por métrica —
 * atinge 3–14% da população geral, com escores de insônia mais altos. O
 * gradiente etário é brutal: ~23% dos usuários de 18 a 35 anos relatam que
 * apps de sono os deixam estressados com o próprio sono, contra 2,4% acima dos
 * 66. O público deste app está INTEIRO na faixa de risco.
 *
 * Textos de sonho vêm em EN e PT-BR (`labelEn`/`labelPt`), como todo texto do
 * app — a UI escolhe pelo padrão `language === 'pt-BR' ? … : …`.
 */

import {
  DEFAULT_REST_WINDOW,
  REST_WINDOW_GRACE_MIN,
  REST_WINDOW_DAYS,
} from '../types/taskModel';

// ---------------------------------------------------------------------------
// Modelo
// ---------------------------------------------------------------------------

export interface RestWindow {
  /** 'HH:MM' */
  start: string;
  /** 'HH:MM' — pode ser menor que `start`: a janela cruza a meia-noite. */
  end: string;
}

export interface RestNight {
  /** dayKey da MANHÃ (`Date.prototype.toDateString`). */
  date: string;
  /** ISO — quando o pet foi dormir. */
  sleptAt?: string;
  /** ISO — quando acordou. */
  wokeAt?: string;
  /** Entrou na janela (com tolerância). Único bit que a mecânica premia. */
  onTime: boolean;
}

export interface RestState {
  window: RestWindow;
  /** Teto de 30 noites. */
  nights: RestNight[];
  /** Ids de sonhos coletados. */
  dreams: string[];
  /** O switch "não quero ver métricas" — esconde números, preserva prêmios. */
  hideMetrics?: boolean;
}

export const MAX_NIGHTS = 30;

/** Minutos ANTES do início da janela para o lembrete de deitar. */
export const SLEEP_REMINDER_LEAD_MIN = 30;

const MINUTES_PER_DAY = 24 * 60;

export function createRestState(window: RestWindow = { ...DEFAULT_REST_WINDOW }): RestState {
  return { window: { ...window }, nights: [], dreams: [] };
}

// ---------------------------------------------------------------------------
// 1. Horários
// ---------------------------------------------------------------------------

/** `'23:00'` → 1380. Minutos desde a meia-noite; `NaN` se não for 'HH:MM'. */
export function parseTime(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm ?? '').trim());
  if (!m) return NaN;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return NaN;
  return h * 60 + min;
}

/** A janela atravessa a meia-noite (23:00–07:00 é o caso normal, não a exceção). */
export function crossesMidnight(window: RestWindow): boolean {
  const s = parseTime(window.start);
  const e = parseTime(window.end);
  if (Number.isNaN(s) || Number.isNaN(e)) return false;
  return e <= s;
}

function minutesOfDay(at: Date): number {
  return at.getHours() * 60 + at.getMinutes();
}

/**
 * O instante `at` está dentro da janela?
 *
 * A tolerância se aplica ao **INÍCIO**: deitar um pouco ANTES do horário
 * combinado conta (o começo recua `graceMin`), e deitar um pouco DEPOIS já
 * está dentro da janela por construção. Isto não é um app de pontualidade — o
 * que se está medindo é regularidade, e exigir o minuto exato transformaria a
 * mecânica no cronômetro ansioso que ela existe para evitar.
 *
 * Janela que cruza a meia-noite é tratada como arco no círculo de 24h.
 */
export function isWithinWindow(
  window: RestWindow,
  at: Date,
  graceMin: number = REST_WINDOW_GRACE_MIN,
): boolean {
  const rawStart = parseTime(window.start);
  const end = parseTime(window.end);
  if (Number.isNaN(rawStart) || Number.isNaN(end)) return false;

  const grace = Math.max(0, Math.round(graceMin));
  const start = ((rawStart - grace) % MINUTES_PER_DAY + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const at_ = minutesOfDay(at);

  // Janela + tolerância cobrindo o dia inteiro: tudo conta (nunca "fora").
  const span = ((end - rawStart) % MINUTES_PER_DAY + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const effective = (span === 0 ? MINUTES_PER_DAY : span) + grace;
  if (effective >= MINUTES_PER_DAY) return true;

  return start <= end ? at_ >= start && at_ <= end : at_ >= start || at_ <= end;
}

// ---------------------------------------------------------------------------
// 2. Registro das noites
// ---------------------------------------------------------------------------

function dayKey(d: Date): string {
  return d.toDateString();
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d.getTime());
  out.setDate(out.getDate() + n);
  return out;
}

/**
 * O dayKey da MANHÃ de uma noite.
 *
 * Deitou de noite (meio-dia em diante) → a manhã é a do dia seguinte. Deitou de
 * madrugada (antes do meio-dia) → a manhã já é a do mesmo dia civil. Se houver
 * `wokeAt`, ele manda: é literalmente a manhã.
 */
export function morningKey(sleptAt: Date, wokeAt?: Date): string {
  if (wokeAt) return dayKey(wokeAt);
  return sleptAt.getHours() >= 12 ? dayKey(addDays(sleptAt, 1)) : dayKey(sleptAt);
}

/**
 * Registra uma noite. **Idempotente por dayKey da manhã** — chamar duas vezes
 * para a mesma manhã atualiza o registro, nunca cria um segundo. Poda em
 * `MAX_NIGHTS` mantendo as mais recentes.
 *
 * Não existe caminho aqui que devolva penalidade: o pior resultado possível é
 * uma noite com `onTime: false`, que apenas não rende prêmio.
 */
export function recordNight(state: RestState, sleptAt: Date, wokeAt?: Date): RestState {
  const key = morningKey(sleptAt, wokeAt);
  const night: RestNight = {
    date: key,
    sleptAt: sleptAt.toISOString(),
    ...(wokeAt ? { wokeAt: wokeAt.toISOString() } : {}),
    onTime: isWithinWindow(state.window, sleptAt),
  };

  const others = state.nights.filter((n) => n.date !== key);
  const nights = [...others, night].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  return { ...state, nights: nights.slice(-MAX_NIGHTS) };
}

// ---------------------------------------------------------------------------
// 3. Constância — a média móvel "5 das últimas 7"
// ---------------------------------------------------------------------------

export interface RestConstancy {
  /** Noites REGISTRADAS na janela que entraram no horário. */
  onTime: number;
  /** Denominador: noites REGISTRADAS na janela (nunca `windowDays` cru). */
  window: number;
  /** `onTime / window`, ou 0 quando não há registro nenhum. */
  ratio: number;
}

/**
 * A média móvel de regularidade nas últimas `windowDays` manhãs.
 *
 * **Noite SEM REGISTRO é NEUTRA — sai do denominador, nunca conta como falha.**
 * Isto é obrigatório e é o coração do desenho:
 *
 *  - elimina o incentivo que produz o exploit famoso do Pokémon Sleep (gente
 *    forjando semanas de sono para não perder progresso);
 *  - elimina a ansiedade de dormir com o celular na cama só para "registrar";
 *  - e é honesto: o app não sabe se a pessoa dormiu mal ou só não abriu o app.
 *    Chutar "falhou" seria inventar um dado ruim sobre a vida de alguém.
 *
 * Também não existe streak que zera: uma noite fora custa ~1/7 da razão, não
 * 100% do progresso — a mesma tese de `CONSTANCY_WINDOW_DAYS` nos hábitos.
 */
export function restConstancy(
  state: RestState,
  now: Date,
  windowDays: number = REST_WINDOW_DAYS,
): RestConstancy {
  const days = Math.max(1, Math.round(windowDays));
  const keys = new Set<string>();
  for (let i = 0; i < days; i++) keys.add(dayKey(addDays(now, -i)));

  const inWindow = state.nights.filter((n) => keys.has(n.date));
  const onTime = inWindow.filter((n) => n.onTime).length;
  const total = inWindow.length;

  return { onTime, window: total, ratio: total === 0 ? 0 : onTime / total };
}

// ---------------------------------------------------------------------------
// 4. Sonhos
// ---------------------------------------------------------------------------

export type DreamRarity = 'common' | 'rare' | 'legendary';

export interface Dream {
  id: string;
  emoji: string;
  labelEn: string;
  labelPt: string;
  rarity: DreamRarity;
}

/**
 * O Sleep Style Dex do Soulmon.
 *
 * Cada noite dentro da janela o pet SONHA, e o sonho é uma cena colecionável do
 * próprio pet. É a peça que converte um comportamento passivo e invisível
 * (deitar no horário) em COLETA — a mesma ideia que sustenta o Sleep Style Dex
 * do Pokémon Sleep, sem o incentivo perverso, porque aqui a raridade vem da
 * regularidade e não da duração medida por sensor.
 *
 * Barra de completude, nunca barra de desempenho: o Dex só cresce.
 */
export const DREAM_CATALOG: readonly Dream[] = [
  // --- common ---
  { id: 'dream-pillow-cloud', emoji: '☁️', labelEn: 'Napping on a cloud', labelPt: 'Cochilando numa nuvem', rarity: 'common' },
  { id: 'dream-flower-field', emoji: '🌼', labelEn: 'Curled in a flower field', labelPt: 'Enroscado num campo de flores', rarity: 'common' },
  { id: 'dream-rainy-window', emoji: '🌧️', labelEn: 'Sleeping under the rain', labelPt: 'Dormindo sob a chuva', rarity: 'common' },
  { id: 'dream-warm-blanket', emoji: '🛏️', labelEn: 'Buried in blankets', labelPt: 'Enterrado nos cobertores', rarity: 'common' },
  { id: 'dream-campfire', emoji: '🔥', labelEn: 'Dozing by the campfire', labelPt: 'Cochilando na fogueira', rarity: 'common' },
  { id: 'dream-window-sun', emoji: '🌤️', labelEn: 'Sunbeam on the floor', labelPt: 'No quadrado de sol do chão', rarity: 'common' },
  { id: 'dream-old-couch', emoji: '🛋️', labelEn: 'Sprawled on the couch', labelPt: 'Esparramado no sofá', rarity: 'common' },
  { id: 'dream-quiet-library', emoji: '📚', labelEn: 'Asleep in a library', labelPt: 'Dormindo numa biblioteca', rarity: 'common' },

  // --- rare ---
  { id: 'dream-little-boat', emoji: '⛵', labelEn: 'Adrift on a little boat', labelPt: 'À deriva num barquinho', rarity: 'rare' },
  { id: 'dream-lantern-river', emoji: '🏮', labelEn: 'Among floating lanterns', labelPt: 'Entre lanternas flutuantes', rarity: 'rare' },
  { id: 'dream-snow-hollow', emoji: '❄️', labelEn: 'Snug in a snow hollow', labelPt: 'Aninhado numa toca de neve', rarity: 'rare' },
  { id: 'dream-treetop-nest', emoji: '🌳', labelEn: 'Nested in a treetop', labelPt: 'Num ninho na copa da árvore', rarity: 'rare' },
  { id: 'dream-tide-pool', emoji: '🐚', labelEn: 'Beside a tide pool', labelPt: 'Ao lado de uma poça de maré', rarity: 'rare' },
  { id: 'dream-night-train', emoji: '🚃', labelEn: 'On the night train', labelPt: 'No trem noturno', rarity: 'rare' },

  // --- legendary ---
  { id: 'dream-on-the-moon', emoji: '🌙', labelEn: 'Sleeping on the moon', labelPt: 'Dormindo numa lua', rarity: 'legendary' },
  { id: 'dream-between-stars', emoji: '✨', labelEn: 'Drifting between stars', labelPt: 'Boiando entre estrelas', rarity: 'legendary' },
  { id: 'dream-aurora', emoji: '🌌', labelEn: 'Under the aurora', labelPt: 'Sob a aurora', rarity: 'legendary' },
  { id: 'dream-whale-sky', emoji: '🐋', labelEn: 'Riding a sky whale', labelPt: 'Montado numa baleia do céu', rarity: 'legendary' },
] as const;

export const DREAMS_BY_RARITY: Record<DreamRarity, readonly Dream[]> = {
  common: DREAM_CATALOG.filter((d) => d.rarity === 'common'),
  rare: DREAM_CATALOG.filter((d) => d.rarity === 'rare'),
  legendary: DREAM_CATALOG.filter((d) => d.rarity === 'legendary'),
};

/** A partir de quantas noites registradas a razão é considerada legível. */
export const RARITY_MIN_NIGHTS = 3;
export const RARITY_RARE_AT = 0.5;
export const RARITY_LEGENDARY_AT = 0.8;

/**
 * A raridade do sonho da noite.
 *
 * **Ligada à REGULARIDADE (a razão da média móvel), NUNCA à duração do sono.**
 *
 * A escolha não é estética, é a leitura mais bem embasada que existe: no UK
 * Biobank (n=60.977), o Sleep Regularity Index previu mortalidade por todas as
 * causas MELHOR que a duração — os quatro quintis mais regulares tiveram 20–48%
 * menos mortalidade que o quintil mais irregular, e o efeito SOBREVIVE ao
 * controle por duração. Ou seja, a métrica cientificamente mais forte é também
 * a única mensurável sem sensor nenhum e a que menos gera ansiedade, porque
 * mede um comportamento sob controle do usuário em vez de um resultado
 * fisiológico que ele não pode comandar às 3h da manhã.
 *
 * Premiar duração faria o oposto: ensinaria a pessoa a perseguir um número que
 * ela não controla — que é, literalmente, como se fabrica ortossonia.
 *
 * Piso é `'common'`. Não existe raridade negativa: pouca regularidade rende
 * menos prêmio, jamais castigo.
 */
export function dreamRarity(state: RestState, now: Date): DreamRarity {
  const { ratio, window } = restConstancy(state, now);
  if (window < RARITY_MIN_NIGHTS) return 'common';
  if (ratio >= RARITY_LEGENDARY_AT) return 'legendary';
  if (ratio >= RARITY_RARE_AT) return 'rare';
  return 'common';
}

/** Hash inteiro estável — nada de `Math.random()` dentro de função pura. */
function hashSeed(seed: number): number {
  let x = Math.floor(Math.abs(seed)) + 1;
  x = (x ^ 61) ^ (x >>> 16);
  x = (x + (x << 3)) >>> 0;
  x = x ^ (x >>> 4);
  x = (x * 0x27d4eb2d) >>> 0;
  x = x ^ (x >>> 15);
  return x >>> 0;
}

/**
 * Sorteia o sonho da noite. **Determinístico por `seed`** — mesmo estado, mesma
 * raridade e mesma seed devolvem sempre o mesmo id. A aleatoriedade mora em
 * quem chama (a seed costuma ser derivada do dayKey da manhã), nunca aqui.
 *
 * Prefere um sonho ainda NÃO coletado da faixa — o Dex avança em vez de
 * devolver repetido enquanto houver o que descobrir.
 */
export function rollDream(state: RestState, rarity: DreamRarity, seed: number): string {
  const pool = DREAMS_BY_RARITY[rarity] ?? DREAMS_BY_RARITY.common;
  if (pool.length === 0) return DREAM_CATALOG[0].id;

  const owned = new Set(state.dreams);
  const start = hashSeed(seed) % pool.length;

  for (let i = 0; i < pool.length; i++) {
    const candidate = pool[(start + i) % pool.length];
    if (!owned.has(candidate.id)) return candidate.id;
  }
  return pool[start].id;
}

/** Guarda o sonho no Dex. Idempotente: coletar de novo não duplica nem tira nada. */
export function collectDream(state: RestState, dreamId: string): RestState {
  if (!DREAM_CATALOG.some((d) => d.id === dreamId)) return state;
  if (state.dreams.includes(dreamId)) return state;
  return { ...state, dreams: [...state.dreams, dreamId] };
}

/** Completude do Dex. Só cresce — é barra de coleção, não de desempenho. */
export function dexProgress(state: RestState): { collected: number; total: number } {
  const known = new Set(DREAM_CATALOG.map((d) => d.id));
  const collected = new Set(state.dreams.filter((id) => known.has(id))).size;
  return { collected, total: DREAM_CATALOG.length };
}

// ---------------------------------------------------------------------------
// 5. Lembrete
// ---------------------------------------------------------------------------

/**
 * Quando lembrar de DEITAR — `SLEEP_REMINDER_LEAD_MIN` antes do início da
 * janela, sempre a próxima ocorrência a partir de `now`. `null` se a janela for
 * inválida.
 *
 * **Só existe lembrete de deitar.** NUNCA notificação noturna sobre
 * desempenho ("você dormiu tarde", "sua regularidade caiu"), e nunca nada
 * disparado durante a noite. A ortossonia é ansiedade ANTES de dormir: um push
 * de cobrança às 23h45 é exatamente o estímulo que atrapalha o sono que ele
 * alega proteger. Todo feedback desta mecânica é de MANHÃ, dentro do app, e
 * vem em forma de sonho colecionado — recompensa, não veredito.
 */
export function sleepReminderAt(window: RestWindow, now: Date): Date | null {
  const start = parseTime(window.start);
  if (Number.isNaN(start)) return null;

  const target = start - SLEEP_REMINDER_LEAD_MIN;
  const at = new Date(now.getTime());
  at.setHours(0, 0, 0, 0);
  at.setMinutes(target);
  if (at.getTime() <= now.getTime()) at.setDate(at.getDate() + 1);
  return at;
}
