/**
 * O RECAP DA EVOLUÇÃO (REGISTRO §190, pedido do dono 29/10/2026): a 2ª página do resumo da manhã mostra a barra do gauge
 * (`evolutionGauge.ts`) enchendo do que estava ontem até o que ficou hoje. Puro: sem React, sem storage, sem `Date`.
 *
 * O "ontem" NÃO precisa de um snapshot em tempo de virada: o relatório da virada (`lastDayReport`) já carrega
 * `evolutionPoints` (depois) e `gaugeGain` (quanto entrou), então `antes = depois - ganho`. O snapshot persistido
 * (`STORAGE_KEYS.EVO_RECAP_SNAPSHOT`) guarda `{date, before, after}` do dia mostrado: é o "visto" (não repete ao recarregar)
 * e a prova do que a pessoa viu.
 *
 * Sem progresso (`gaugeGain === 0`) o modal NÃO abre: uma página só para dizer "nada mudou" seria cobrança disfarçada.
 */
import { gaugeGoalFor } from './evolutionGauge';

export interface EvoRecapSnapshot { date: string; before: number; after: number }

export interface EvoRecap {
  date: string;
  before: number;
  after: number;
  goal: number;
  /** 0..100, inteiros. */
  beforePct: number;
  afterPct: number;
  /** Pontos de barra ganhos ontem para hoje (>= 1). */
  deltaPct: number;
  gain: number;
  /** Pontos que faltam para encher (0 = cheia). */
  left: number;
  full: boolean;
}

export interface EvoRecapReport { date?: string; gaugeGain?: number; evolutionPoints?: number }

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

export function parseEvoRecapSnapshot(raw: string | null | undefined): EvoRecapSnapshot | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw);
    if (!o || typeof o.date !== 'string') return null;
    return { date: o.date, before: num(o.before), after: num(o.after) };
  } catch { return null; }
}

export function serializeEvoRecapSnapshot(r: Pick<EvoRecap, 'date' | 'before' | 'after'>): string {
  return JSON.stringify({ date: r.date, before: r.before, after: r.after });
}

/** O recap de uma virada, ou `null` (já visto, sem progresso, estágio final, dado incoerente). */
export function buildEvoRecap(input: {
  report: EvoRecapReport | null | undefined;
  evolutionStage: string;
  unlockedEvolutions?: readonly string[];
  seen?: EvoRecapSnapshot | null;
}): EvoRecap | null {
  const { report } = input;
  if (!report || typeof report.date !== 'string') return null;
  if (input.seen?.date === report.date) return null;
  const goal = gaugeGoalFor(input.evolutionStage, input.unlockedEvolutions);
  if (goal <= 0) return null; // estágio final: não há barra
  const gain = Math.floor(num(report.gaugeGain));
  const after = Math.floor(num(report.evolutionPoints));
  if (gain <= 0 || after < gain) return null; // sem progresso, ou a barra reiniciou (evolução): nada a comparar
  const before = after - gain;
  const pct = (p: number) => Math.round(Math.min(1, p / goal) * 100);
  const beforePct = pct(before);
  const afterPct = pct(after);
  return {
    date: report.date, before, after, goal, gain, beforePct, afterPct,
    deltaPct: Math.max(1, afterPct - beforePct),
    left: Math.max(0, goal - after),
    full: after >= goal,
  };
}
