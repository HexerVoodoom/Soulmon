// ---------------------------------------------------------------------------
// MARCAS DE MISSÃO ("!" e "?") — dono único da regra (pedido do dono, 07/10/2026).
//
// Todo LOCAL de missão (o ícone do canto da Home, o lote do Passeio, o Torneio,
// as Conquistas do Mercado) recebe a mesma resposta, calculada aqui:
//   'ready'     "?"  há missão PRONTA (cumprida, ainda por coletar/ver)
//   'available' "!"  há missão disponível ou em andamento, ainda não pronta
//   null             nada a mostrar
// Com as duas, vale o "?" — a marca mais urgente vence, nunca as duas juntas.
//
// "Pronta" é DERIVADA do estado atual, sem campo novo no save:
//   - semanal: cumprida e ainda não paga (`claimed` é o "resgatada" que já existe);
//   - permanente: cumprida e o cenário que ela libera ainda não foi comprado.
// Sem tom de cobrança: é uma marca parada, sem número, som nem contagem.
// ---------------------------------------------------------------------------

import { MISSIONS } from './missions';
import type { MissionMark } from './travessiasSave';

export type QuestMark = 'ready' | 'available' | null;

export interface QuestMarkInput {
  /** `missionMark` do Passeio: `null` = a missão do dia já foi feita. */
  passeio: MissionMark;
  /** As missões da semana, como a tela já as monta. */
  weekly: readonly { done: boolean; claimed: boolean }[];
  /** `getMissionProgress` (permanentes, já limitado ao alvo). */
  missionProgress: Record<string, number>;
  ownedBackgrounds: readonly string[];
}

export interface QuestMarks {
  /** O ícone de missões no canto da Home: todas as missões. */
  corner: QuestMark;
  /** O lote do Passeio (missão do dia). */
  passeio: QuestMark;
  /** O Torneio (aba Missões, missões da semana). */
  torneio: QuestMark;
  /** As Conquistas do Mercado (missões permanentes). */
  conquistas: QuestMark;
}

/** A marca mais urgente de um conjunto: "?" vence "!". */
export function strongestMark(marks: readonly QuestMark[]): QuestMark {
  if (marks.includes('ready')) return 'ready';
  if (marks.includes('available')) return 'available';
  return null;
}

export function questMarks(input: QuestMarkInput): QuestMarks {
  const passeio: QuestMark = input.passeio ? 'available' : null;
  const torneio = strongestMark(
    input.weekly.filter(w => !w.claimed).map((w): QuestMark => (w.done ? 'ready' : 'available')),
  );
  const conquistas = strongestMark(MISSIONS.map((m): QuestMark => {
    const done = (input.missionProgress[m.id] ?? 0) >= m.target;
    if (!done) return 'available';
    return input.ownedBackgrounds.includes(m.bgReward) ? null : 'ready';
  }));
  return { corner: strongestMark([passeio, torneio, conquistas]), passeio, torneio, conquistas };
}

/** Rótulo acessível (EN primeiro, PT-BR depois). `null` quando não há marca. */
export function questMarkLabel(mark: QuestMark, isPt: boolean): string | null {
  if (mark === 'ready') return isPt ? 'Missão pronta' : 'Quest ready';
  if (mark === 'available') return isPt ? 'Missão disponível' : 'Quest available';
  return null;
}
