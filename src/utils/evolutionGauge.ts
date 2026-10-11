/**
 * 🧬 GAUGE DE EVOLUÇÃO — dono único da regra (decisão do dono, 11/10/2026).
 *
 * Substitui o "dia completo" (`perfectDays`) como CRITÉRIO de evolução. Uma
 * barra por estágio que enche com o PESO DE ESFORÇO do que foi concluído
 * (hábito = `HABIT_WEIGHT`, tarefa = `effort` 1–3) — nunca contagem de itens
 * (linha vermelha: recompensa por contagem de tarefas é proibida).
 *
 * As três travas que fazem dela uma barra de CUIDADO e não de cobrança:
 *  1. **Teto diário** = `FORM_REQUIREMENTS[estágio].required` — a meta diária
 *     do estágio. Vinte tarefas triviais num dia rendem o mesmo que a meta
 *     cumprida: não dá para farmar. E não há número novo: o teto É a meta.
 *  2. **Nunca decresce** por dia ruim — dia fraco credita pouco, nunca tira.
 *     Só zera ao evoluir (o progresso foi GASTO) e, na queda por HP, cai para
 *     um piso (`degeneratedEvolutionPoints`, em `dailyReset.ts`).
 *  3. **Creditado na VIRADA** (`computeDailyReset`), sobre o peso feito no dia
 *     que terminou — o mesmo `dailyDone` que julga o coração. Um ponto só de
 *     escrita: marcar/desmarcar não credita nada, e nenhum caminho (desktop,
 *     widget, check-in) precisa saber do gauge. A tela mostra o de HOJE como
 *     prévia (`gaugeView.today`), que entra na próxima virada.
 *
 * Funções PURAS: sem React, sem localStorage.
 */
import {
  FORM_REQUIREMENTS,
  getStageLevel,
  hasMegaCollection,
  ULTRA_PATIENCE_POINTS,
} from '../types/progression';

/** Número finito ≥ 0 ou 0. O save vem do cliente e da nuvem. */
function safe(n: unknown): number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : 0;
}

/** Teto diário de contribuição ao gauge = a meta diária do estágio. */
export function dailyGaugeCap(stage: string): number {
  return FORM_REQUIREMENTS[getStageLevel(stage)].required;
}

/**
 * Pontos para encher o gauge do estágio. No mega depende do caminho para o
 * Ultra: com a coleção das três megas basta `gauge`; sem ela, o caminho da
 * permanência (`ULTRA_PATIENCE_POINTS`). No ultra não há próxima forma: 0.
 */
export function gaugeGoalFor(stage: string, unlockedEvolutions?: readonly string[]): number {
  const level = getStageLevel(stage);
  if (level === 'mega' && !hasMegaCollection(unlockedEvolutions)) return ULTRA_PATIENCE_POINTS;
  return FORM_REQUIREMENTS[level].gauge;
}

/** Quanto o peso feito num dia rende ao gauge: 0..teto diário. */
export function gaugeContribution(doneWeight: number, stage: string): number {
  return Math.min(dailyGaugeCap(stage), Math.floor(safe(doneWeight)));
}

/** Credita um dia. Nunca devolve menos do que recebeu. */
export function creditGauge(points: number, doneWeight: number, stage: string): number {
  return Math.floor(safe(points)) + gaugeContribution(doneWeight, stage);
}

/** O gauge está cheio (o gesto de evoluir pode acender)? */
export function gaugeFull(points: number | undefined, stage: string, unlockedEvolutions?: readonly string[]): boolean {
  const goal = gaugeGoalFor(stage, unlockedEvolutions);
  return goal > 0 && safe(points) >= goal;
}

/** Quanto falta para encher (0 no topo ou cheio). */
export function gaugePointsLeft(points: number | undefined, stage: string, unlockedEvolutions?: readonly string[]): number {
  const goal = gaugeGoalFor(stage, unlockedEvolutions);
  return Math.max(0, goal - safe(points));
}

/**
 * MIGRAÇÃO de save antigo: `perfectDays` (desde a última evolução) vira pontos
 * na MESMA fração da barra — quem estava a meio caminho continua a meio
 * caminho. Arredonda para CIMA (nunca perde) e não corta o que passa do
 * requisito (o banco de dias do mega para o Ultra vem junto).
 */
export function migrateEvolutionPoints(perfectDays: unknown, stage: string): number {
  const { required, gauge } = FORM_REQUIREMENTS[getStageLevel(stage)];
  if (gauge <= 0) return 0;
  return Math.ceil(safe(perfectDays) * gauge / required);
}

/**
 * Hidratação: campo presente e válido vence (IDEMPOTENTE — a 2ª carga não
 * migra de novo); ausente ou corrompido → migra de `perfectDays`.
 */
export function hydrateEvolutionPoints(loaded: { evolutionPoints?: unknown; perfectDays?: unknown; evolutionStage?: unknown }): number {
  const v = loaded.evolutionPoints;
  if (typeof v === 'number' && Number.isFinite(v) && v >= 0) return Math.min(Math.floor(v), 1e6);
  return migrateEvolutionPoints(loaded.perfectDays, typeof loaded.evolutionStage === 'string' ? loaded.evolutionStage : 'rookie');
}

/** 🌀 O item da masmorra: um dia de teto do estágio (o item continua 1 por dia). */
export function dayItemGaugeGain(stage: string): number {
  return dailyGaugeCap(stage);
}

export interface GaugeView {
  /** Pontos já creditados. */
  points: number;
  /** Prévia de hoje (entra na próxima virada), já limitada ao teto diário. */
  today: number;
  /** Pontos para encher (0 no ultra). */
  goal: number;
  /** Teto diário. */
  dailyCap: number;
  /** Fração creditada 0..1 e fração com a prévia de hoje 0..1. */
  pct: number;
  pctWithToday: number;
  /** Quanto falta (creditado). Nunca negativo. */
  left: number;
  full: boolean;
  /** Estágio final: não há barra. */
  top: boolean;
}

export function gaugeView(input: {
  evolutionPoints?: number;
  evolutionStage: string;
  unlockedEvolutions?: readonly string[];
  todayWeight?: number;
}): GaugeView {
  const points = Math.floor(safe(input.evolutionPoints));
  const goal = gaugeGoalFor(input.evolutionStage, input.unlockedEvolutions);
  const dailyCap = dailyGaugeCap(input.evolutionStage);
  const today = gaugeContribution(input.todayWeight ?? 0, input.evolutionStage);
  const top = goal <= 0;
  return {
    points,
    today,
    goal,
    dailyCap,
    pct: top ? 1 : Math.min(1, points / goal),
    pctWithToday: top ? 1 : Math.min(1, (points + today) / goal),
    left: top ? 0 : Math.max(0, goal - points),
    full: !top && points >= goal,
    top,
  };
}
