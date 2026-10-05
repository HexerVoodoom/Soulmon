// ---------------------------------------------------------------------------
// MISSÕES NA HOME (ajuste do dono, 05/10/2026). Uma lista PURA, montada a partir
// de regras que já existem — nada aqui paga nada nem cria economia nova:
//
// - `passeio`: a missão do dia do Passeio (Travessias). Leva ao lote do Passeio.
// - `meta`: a meta do dia, por ESFORÇO (regra #16 — nunca contagem de itens).
// - `parada`: UMA tarefa parada (`isHaunted`) por dia, no máximo. A recompensa é
//   o alívio que já existe (+1 comida, fixo): NÃO cresce com o atraso, então
//   deixar atrasar de propósito não paga mais do que fazer em dia.
// - `semanal`: as missões da semana do Torneio (Emblemas), depois das diárias.
//
// Diárias primeiro (no máximo 3); semanais depois, numa linha compacta.
// ---------------------------------------------------------------------------

import type { MissionMark } from './travessiasSave';
import { daysStale, isHaunted, type TriageTask } from './taskTriage';

export type HomeMissionKind = 'passeio' | 'meta' | 'parada' | 'semanal';

export interface HomeMission {
  key: string;
  kind: HomeMissionKind;
  textPt: string;
  textEn: string;
  done: boolean;
  /** Progresso visível (só semanal): `count/target`. */
  count?: number;
  target?: number;
  /** Só `parada`: a tarefa a enfrentar. */
  taskId?: string;
}

export interface WeeklyRow {
  mission: { id: string; target: number; descPt: string; descEn: string };
  count: number;
  done: boolean;
  claimed: boolean;
}

/**
 * A tarefa parada do dia: a MAIS antiga entre as assombradas (empate pelo id,
 * para a escolha ser estável no dia). Uma só — "máx. 1 por dia".
 */
export function staleTaskOfDay(tasks: readonly TriageTask[], now: Date): TriageTask | null {
  const alvo = tasks.filter(t => isHaunted(t, now));
  if (!alvo.length) return null;
  return [...alvo].sort((a, b) => daysStale(b, now) - daysStale(a, now) || a.id.localeCompare(b.id))[0];
}

export function homeMissions(input: {
  /** `missionMark` do Passeio: `null` = a missão do dia já foi feita. */
  passeio: MissionMark;
  /** Meta do dia por esforço: `goal` 0 = nada cadastrado hoje (sem missão). */
  meta: { done: number; goal: number };
  tasks: readonly TriageTask[];
  weekly: readonly WeeklyRow[];
  now: Date;
}): { daily: HomeMission[]; weekly: HomeMission[] } {
  const daily: HomeMission[] = [];
  daily.push({
    key: 'passeio', kind: 'passeio', done: input.passeio === null,
    textPt: 'Fazer um passeio', textEn: 'Go on a stroll',
  });
  if (input.meta.goal > 0) {
    daily.push({
      key: 'meta', kind: 'meta', done: input.meta.done >= input.meta.goal,
      textPt: 'Cumprir a meta de hoje', textEn: "Reach today's goal",
    });
  }
  const parada = staleTaskOfDay(input.tasks, input.now);
  if (parada) {
    const nome = parada.name?.trim();
    daily.push({
      key: `parada:${parada.id}`, kind: 'parada', done: false, taskId: parada.id,
      textPt: nome ? `Destravar: ${nome}` : 'Destravar uma tarefa parada',
      textEn: nome ? `Get unstuck: ${nome}` : 'Get a stuck task moving',
    });
  }
  const weekly = input.weekly
    .filter(w => !w.claimed)
    .map(w => ({
      key: `semanal:${w.mission.id}`, kind: 'semanal' as const, done: w.done,
      textPt: w.mission.descPt, textEn: w.mission.descEn,
      count: Math.min(w.count, w.mission.target), target: w.mission.target,
    }));
  return { daily: daily.slice(0, 3), weekly };
}
