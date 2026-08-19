import {
  normalizeSchedule,
  HABIT_MILESTONES,
  HABIT_TIER_BONUS,
  HABIT_TIER_ICONS,
  CONSTANCY_WINDOW_DAYS,
  REST_SHIELD_MAX,
  REST_SHIELD_EARN_EVERY_DAYS,
  MISS_INTERVENTION_AT,
} from '../types/taskModel';
import type { Schedule, HabitTier } from '../types/taskModel';

// O MOTOR DE CONSTÂNCIA DOS HÁBITOS
// =================================
//
// Contraparte de `utils/careRules.ts` (cuidado) e `utils/dailyReset.ts` (virada
// do dia): funções PURAS, sem React, sem localStorage e sem `Date.now()`
// implícito — todo tempo entra por parâmetro (`now: Date` ou `dayKey: string`).
// É o que permite o teste rodar uma semana inteira em milissegundos e o que
// impede a regra de divergir entre app web, desktop e widget (footgun 9 do
// CLAUDE.md).
//
// Os tipos e as constantes são de `types/taskModel.ts` — este arquivo NÃO
// inventa número nenhum, só aplica.
//
// AS TRÊS REGRAS DE PRODUTO QUE NÃO SE NEGOCIAM
// ---------------------------------------------
//
// 1. NADA ZERA. Não existe streak binário neste arquivo, e a ausência dele é
//    deliberada. Lally et al. (2010) mediram que **pular um único dia não
//    prejudicou mensuravelmente a curva de automaticidade** — a ciência
//    autoriza o perdão; o contador que volta a zero é invenção de produto. E
//    ele tem custo conhecido: o *what-the-hell effect* (Polivy & Herman) e a
//    violação de abstinência (Marlatt) descrevem exatamente o que acontece
//    quando a pessoa quebra a sequência: ela não perde um dia, ela abandona o
//    app. Por isso a métrica exibida é média móvel ("5 das últimas 7"): uma
//    falha custa ~14%, não 100%. Se algum dia alguém acrescentar aqui um campo
//    `streak: number` que zera em `applyMissedDay`, terá desfeito a tese
//    inteira do produto — há teste travando isso.
//
// 2. A PRIMEIRA FALHA NÃO GERA NADA VISÍVEL. `needsIntervention` só responde
//    `true` na SEGUNDA falha seguida (`MISS_INTERVENTION_AT`). Um dia perdido
//    não é sinal de nada e alertar sobre ele só ensina o usuário a temer o
//    app; dois seguidos são o começo de um padrão, e é aí — e só aí — que o
//    pet aparece oferecendo uma versão reduzida do hábito. É o modelo do Finch
//    e o oposto exato do dano de HP do Habitica.
//
// 3. ESCUDOS SÃO CONSUMIDOS AUTOMATICAMENTE. `applyMissedDay` gasta o escudo
//    sozinho, sem nenhuma ação do usuário. O Streak Freeze do Duolingo só
//    virou mecânica de retenção de verdade quando passou a vir equipado por
//    padrão: proteção que exige lembrar de ativar ANTES de falhar não protege
//    ninguém — é o defeito da Pousada do Habitica, que só ajuda quem já estava
//    organizado o bastante para não precisar dela. Quem falha não está em
//    condição de administrar o próprio salva-vidas.
//
// Sobre a unidade de tempo: um dia é a string `new Date().toDateString()`
// ("Mon Aug 17 2026"), a mesma chave que `activityLog`/`lastCompletedDate` já
// usam no save. É chave LOCAL, sem fuso e sem hora — comparar dias por
// timestamp já produziu, neste projeto, "ontem" virando "hoje" na virada do
// horário de verão.

/**
 * O histórico de um hábito. No GameState vive como
 * `habitRhythms?: Record<string /* activityId *\/, HabitRhythm>`.
 *
 * `done`/`missed`/`shielded` são conjuntos de dayKeys (não ordenados por
 * contrato — as funções aqui não dependem da ordem de inserção). São podados
 * em `HISTORY_CAP` dias porque o save inteiro trafega no cloud save a cada 3s
 * de debounce; `totalDone` existe exatamente para a poda não roubar marco de
 * ninguém (o marco de 66 dias é atingido MUITO depois do teto de 120).
 */
export interface HabitRhythm {
  /** dayKeys (new Date().toDateString()) em que o hábito foi concluído, teto de 120 */
  done: string[];
  /** dayKeys em que era devido e não foi feito (para never-miss-twice) */
  missed: string[];
  shields: number;
  /** dayKeys em que um escudo foi gasto */
  shielded: string[];
  /** total de conclusões (não some com a poda dos 120) */
  totalDone: number;
  lastCompletedDate?: string;
}

/** Teto de dayKeys guardados por lista. Ver comentário de `HabitRhythm`. */
export const HISTORY_CAP = 120;

/**
 * Constância mínima para merecer um escudo.
 *
 * É literalmente o "5 das últimas 7" que o app exibe: o escudo é a recompensa
 * de quem está indo bem, não um consolo de quem parou. Prêmio por já estar
 * regular é o que faz a proteção chegar ANTES da semana ruim — depois dela não
 * adianta mais.
 */
export const GOOD_CONSTANCY_RATIO = 5 / CONSTANCY_WINDOW_DAYS;

const DAY_MS = 24 * 60 * 60 * 1000;

export function emptyRhythm(): HabitRhythm {
  return { done: [], missed: [], shields: 0, shielded: [], totalDone: 0 };
}

/** A chave de dia canônica. Um lugar só, para ninguém inventar outro formato. */
export function dayKeyOf(date: Date): string {
  return date.toDateString();
}

/** dayKey → meia-noite local daquele dia. */
export function dayKeyToDate(key: string): Date {
  const d = new Date(key);
  d.setHours(0, 0, 0, 0);
  return d;
}

function midnight(date: Date): Date {
  const d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Dias inteiros de `from` até `to` (positivo se `to` é depois). */
function daysBetween(from: Date, to: Date): number {
  return Math.round((midnight(to).getTime() - midnight(from).getTime()) / DAY_MS);
}

function addDays(date: Date, n: number): Date {
  const d = midnight(date);
  d.setDate(d.getDate() + n);
  return d;
}

function capped(keys: string[]): string[] {
  return keys.length > HISTORY_CAP ? keys.slice(keys.length - HISTORY_CAP) : keys;
}

/**
 * A âncora do `everyNDays` com `from: 'schedule'`.
 *
 * Precisa ser ESTÁVEL: se ela mudasse a cada render (ex.: "hoje"), o hábito
 * seria devido todo dia e o `n` não significaria nada. Usa a primeira
 * conclusão registrada quando existe (o dia em que a pessoa realmente começou,
 * que é o que ela espera ver no calendário) e, antes disso, a época — que é
 * arbitrária mas fixa, e portanto responde igual em qualquer aparelho.
 */
function scheduleAnchor(rhythm: HabitRhythm): Date {
  const first = rhythm.done.length > 0 ? rhythm.done[0] : null;
  return first ? dayKeyToDate(first) : midnight(new Date(0));
}

/**
 * O hábito conta para este dia?
 *
 * `now` existe na assinatura para o chamador poder passar o relógio da sessão
 * (o resto do motor recebe tempo por parâmetro, e uma exceção aqui viraria o
 * `Date.now()` implícito que este arquivo existe para não ter). Nenhuma regra
 * atual precisa dele — o veredito depende só de `date` e do histórico.
 */
export function isDueOn(
  schedule: Schedule,
  rhythm: HabitRhythm,
  date: Date,
  _now?: Date,
): boolean {
  const s = normalizeSchedule({ schedule });
  if (s.kind === 'weekdays') {
    return s.days.includes(date.getDay());
  }
  if (s.kind === 'timesPerWeek') {
    // Sempre elegível de propósito: é a meta SEMANAL que manda, e o perdão
    // embutido do formato "3x por semana" vem justamente de a pessoa escolher
    // QUAIS dias. Quem julga o cumprimento é `weeklyProgress`, nunca o
    // calendário — marcar um dia como "devido" aqui reintroduziria a falha
    // diária que este formato existe para eliminar.
    return true;
  }
  if (s.from === 'completion') {
    // O `every!` do Todoist, e o item mais importante deste arquivo.
    // Contando da CONCLUSÃO (e não da data prevista), é estruturalmente
    // impossível acumular instâncias atrasadas: sumir por um mês devolve UMA
    // ocorrência devida hoje, nunca trinta. A pilha de atrasadas é a causa nº1
    // documentada de abandono da categoria, e ela não nasce de má vontade do
    // usuário — nasce de o app gerar dívida enquanto ele não está olhando.
    if (!rhythm.lastCompletedDate) return true;
    return daysBetween(dayKeyToDate(rhythm.lastCompletedDate), date) >= s.n;
  }
  const offset = daysBetween(scheduleAnchor(rhythm), date);
  if (offset < 0) return false;
  return offset % s.n === 0;
}

/** Domingo da semana de `date` (0 = domingo, coerente com `weekDays`). */
export function weekStart(date: Date): Date {
  return addDays(date, -date.getDay());
}

/**
 * Progresso da semana corrente para `timesPerWeek`.
 *
 * Semana começa no DOMINGO, igual ao `weekDays` que o widget Android e o
 * desktop já leem — duas convenções de início de semana no mesmo save é
 * garantia de um "2 de 3" que discorda de si mesmo entre telas.
 *
 * Para os outros formatos o alvo é 0: eles não têm meta semanal, e devolver um
 * número inventado faria a UI mostrar uma barra que não mede nada.
 */
export function weeklyProgress(
  rhythm: HabitRhythm,
  schedule: Schedule,
  now: Date,
): { done: number; target: number } {
  const s = normalizeSchedule({ schedule });
  const start = weekStart(now);
  const end = addDays(start, 7);
  const done = rhythm.done.filter(key => {
    const d = dayKeyToDate(key);
    return d >= start && d < end;
  }).length;
  return { done, target: s.kind === 'timesPerWeek' ? s.target : 0 };
}

/**
 * A métrica que substitui o streak: "N das últimas 7".
 *
 * Conta apenas dias em que o hábito ERA DEVIDO — um hábito de 3x por semana
 * não pode aparecer como 43% só porque a semana tem sete dias. Dias protegidos
 * por escudo contam como FEITOS: é para isso que o escudo existe, e um escudo
 * que salva o "streak" mas derruba o percentual não salva nada.
 *
 * O denominador sai do próprio histórico (dias registrados como feito, perdido
 * ou protegido) porque o `Schedule` não basta: `everyNDays from:'completion'`
 * só sabe quais dias eram devidos olhando o que aconteceu. Hábito novo, sem
 * histórico, devolve ratio 1 — *progresso dotado* (Nunes & Drèze): ninguém
 * começa em 0%.
 */
export function constancy(
  rhythm: HabitRhythm,
  now: Date,
  windowDays: number = CONSTANCY_WINDOW_DAYS,
): { done: number; window: number; ratio: number } {
  const oldest = addDays(now, -(windowDays - 1));
  const inWindow = (key: string) => {
    const d = dayKeyToDate(key);
    return d >= oldest && d <= midnight(now);
  };
  const done = rhythm.done.filter(inWindow).length + rhythm.shielded.filter(inWindow).length;
  const window = done + rhythm.missed.filter(inWindow).length;
  return { done, window, ratio: window === 0 ? 1 : done / window };
}

/**
 * O marco de maturidade, em dias efetivos.
 *
 * Os cortes são os de `HABIT_MILESTONES` (7/21/66, de Lally et al.), não os
 * "21 dias" populares — esse número vem de um cirurgião plástico de 1960
 * observando pacientes se acostumarem ao rosto novo.
 */
export function habitTier(totalDone: number): HabitTier {
  const [sprout, sapling, tree] = HABIT_MILESTONES;
  if (totalDone >= tree) return 'tree';
  if (totalDone >= sapling) return 'sapling';
  if (totalDone >= sprout) return 'sprout';
  return 'seed';
}

export function habitTierIcon(totalDone: number): string {
  return HABIT_TIER_ICONS[habitTier(totalDone)];
}

/**
 * O marco que ACABOU de ser cruzado, ou null.
 *
 * Existe para a celebração tocar UMA vez: `habitTier` sozinho responde "que
 * marco é este" para sempre, então quem quisesse comemorar teria que guardar o
 * marco anterior em algum lugar — e guardar estado de UI dentro do save é como
 * se fabrica a recompensa que dispara em todo reload.
 */
export function milestoneReached(before: number, after: number): HabitTier | null {
  if (after <= before) return null;
  const from = habitTier(before);
  const to = habitTier(after);
  return from === to ? null : to;
}

/**
 * Multiplicador de rendimento de atributo do hábito.
 *
 * Sempre ≥ 1: o esforço antigo passa a valer MAIS, nunca menos. Um hábito
 * maduro que rendesse menos com o tempo (a "eficiência decrescente" comum em
 * jogos de idle) ensinaria a abandonar exatamente o que o app quer preservar.
 */
export function attributeMultiplier(totalDone: number): number {
  return 1 + HABIT_TIER_BONUS[habitTier(totalDone)];
}

/**
 * Concede um escudo se a constância estiver boa.
 *
 * Pensado para ser chamado no ritual semanal (a cada
 * `REST_SHIELD_EARN_EVERY_DAYS` dias), e é isso que dá o "1 por semana"; a
 * função em si é idempotente dentro da mesma janela apenas no sentido de que
 * respeita o teto `REST_SHIELD_MAX` — a cadência quem decide é o chamador,
 * porque só ele sabe a data do último ritual.
 */
export function earnShield(rhythm: HabitRhythm, now: Date): HabitRhythm {
  if (rhythm.shields >= REST_SHIELD_MAX) return rhythm;
  const { ratio, window } = constancy(rhythm, now, REST_SHIELD_EARN_EVERY_DAYS);
  // `window === 0` é hábito sem nenhum dia devido na janela: não houve
  // constância a premiar (nem falha a punir). Não ganha escudo — senão quem
  // nunca abre o app acumularia proteção justamente por não jogar.
  if (window === 0 || ratio < GOOD_CONSTANCY_RATIO) return rhythm;
  return { ...rhythm, shields: rhythm.shields + 1 };
}

/**
 * Registra uma falta — consumindo escudo AUTOMATICAMENTE, se houver.
 *
 * É aqui que a regra 3 do cabeçalho vive. O dia protegido entra em `shielded`
 * (não em `missed`), então ele conta como feito na constância e NÃO conta para
 * o "never miss twice": o escudo compra de volta o dia inteiro, não só o
 * número na tela.
 *
 * Idempotente: um dia já registrado (feito, perdido ou protegido) não é
 * reprocessado — a virada do dia pode rodar duas vezes (StrictMode, aba
 * reaberta, relógio ajustado) e gastar dois escudos pela mesma falta seria o
 * pior bug possível nesta mecânica.
 */
export function applyMissedDay(rhythm: HabitRhythm, dayKey: string): HabitRhythm {
  if (
    rhythm.done.includes(dayKey) ||
    rhythm.missed.includes(dayKey) ||
    rhythm.shielded.includes(dayKey)
  ) {
    return rhythm;
  }
  if (rhythm.shields > 0) {
    return {
      ...rhythm,
      shields: rhythm.shields - 1,
      shielded: capped([...rhythm.shielded, dayKey]),
    };
  }
  return { ...rhythm, missed: capped([...rhythm.missed, dayKey]) };
}

/**
 * Faltas seguidas até agora.
 *
 * Anda para trás pelos dias REGISTRADOS (feito/perdido/protegido), do mais
 * recente para o mais antigo, e para na primeira coisa que não é falta. Dias
 * sem registro não quebram nem alimentam a contagem: para um hábito de 3x por
 * semana ou `everyNDays`, a maior parte do calendário simplesmente não era
 * devida, e tratar "não devido" como falha reintroduziria a cobrança diária
 * que o formato existe para evitar.
 *
 * Dia protegido por escudo interrompe a sequência — foi comprado de volta.
 */
export function consecutiveMisses(rhythm: HabitRhythm, now: Date): number {
  const limit = midnight(now).getTime();
  const marks: { time: number; miss: boolean }[] = [];
  for (const key of rhythm.missed) marks.push({ time: dayKeyToDate(key).getTime(), miss: true });
  for (const key of rhythm.done) marks.push({ time: dayKeyToDate(key).getTime(), miss: false });
  for (const key of rhythm.shielded) marks.push({ time: dayKeyToDate(key).getTime(), miss: false });
  const recent = marks.filter(m => m.time <= limit).sort((a, b) => b.time - a.time);
  let count = 0;
  for (const mark of recent) {
    if (!mark.miss) break;
    count += 1;
  }
  return count;
}

/**
 * "Never miss twice": só na SEGUNDA falha seguida o pet aparece.
 *
 * Regra 2 do cabeçalho. `>=` e não `===` porque o pet precisa continuar
 * oferecendo a versão reduzida no terceiro e no quarto dia — parar de oferecer
 * justo quando a pessoa mais precisa seria abandoná-la por tecnicalidade.
 */
export function needsIntervention(rhythm: HabitRhythm, now: Date): boolean {
  return consecutiveMisses(rhythm, now) >= MISS_INTERVENTION_AT;
}

/**
 * Marca o hábito como feito no dia.
 *
 * Idempotente: marcar duas vezes no mesmo dia não duplica nada nem infla
 * `totalDone` (que alimenta os marcos e o multiplicador de atributo — inflá-lo
 * seria farm de progresso com dois toques).
 *
 * Concluir também APAGA uma falta do mesmo dia: é o caminho de quem aceita a
 * versão reduzida oferecida pelo pet, e nesse caso o dia conta como feito. Um
 * escudo já gasto naquele dia, porém, fica gasto — devolver o escudo por uma
 * conclusão tardia transformaria a proteção em recurso infinito.
 */
export function completeHabit(rhythm: HabitRhythm, dayKey: string): HabitRhythm {
  if (rhythm.done.includes(dayKey)) return rhythm;
  return {
    ...rhythm,
    done: capped([...rhythm.done, dayKey]),
    missed: rhythm.missed.filter(k => k !== dayKey),
    totalDone: rhythm.totalDone + 1,
    lastCompletedDate: dayKey,
  };
}
