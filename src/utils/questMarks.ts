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
//
// COR (decisão do dono, 07/10/2026: "Missão semanal fica com ! e ? azul"): as
// marcas das missões SEMANAIS são AZUIS (`tone: 'blue'`); Passeio e conquistas
// seguem amarelas. As permanentes só acendem "?" quando PRONTAS — nunca "!"
// (um "!" quase sempre ligado deixava de dizer algo). O canto herda o tom da
// marca vencedora (ready antes de available; empate: Passeio, Torneio, Conquistas).
//
// PRÉDIOS (07/10/2026, `utils/buildingQuests.ts`): só as missões LISTADAS no menu da Home
// (hoje o Caderno) contam, e só no ícone do canto — nunca no lote (nenhuma marca de missão
// vive dentro de prédio nem sobre lote). O canto SOME quando não há nada a fazer nem a entregar.
// Sem tom de cobrança: é uma marca parada, sem número, som nem contagem.
// ---------------------------------------------------------------------------

import { MISSIONS } from './missions';
import type { MissionMark } from './travessiasSave';
import type { BuildingId } from './gates';

export type QuestMark = 'ready' | 'available' | null;
/** Tom da marca: `blue` = missão semanal (token `--sm2-primary-ink`); `gold` = o resto. */
export type QuestTone = 'blue' | 'gold';

export interface QuestMarkInput {
  /** `missionMark` do Passeio: `null` = a missão do dia já foi feita. */
  passeio: MissionMark;
  /** As missões da semana, como a tela já as monta. */
  weekly: readonly { done: boolean; claimed: boolean }[];
  /** `getMissionProgress` (permanentes, já limitado ao alvo). */
  missionProgress: Record<string, number>;
  ownedBackgrounds: readonly string[];
  /** A marca do dia de cada prédio (`buildingMarks`). Opcional: sem ela, nada de prédio acende. */
  buildings?: Partial<Record<BuildingId, QuestMark>>;
  /** O cartão do PRIMEIRO DIA ainda está de pé (`shouldShowFirstDay`)? É uma missão: vive no menu de Missões, nunca na lista de tarefas. */
  firstDay?: boolean;
}

export interface QuestMarks {
  /** A seção "Primeiro dia" do menu: "!" enquanto os três gestos não foram feitos e o dia não virou. */
  firstDay: QuestMark;
  /** O ícone de missões no canto da Home: todas as missões. */
  corner: QuestMark;
  /** O Passeio (missão do dia do menu da Home). */
  passeio: QuestMark;
  /** A seção "Hoje" do menu: o Passeio + as missões de prédio listadas. */
  daily: QuestMark;
  /** A seção "Esta semana" do menu (missões da semana, azuis). */
  torneio: QuestMark;
  /** As Conquistas (missões permanentes). */
  conquistas: QuestMark;
  /** O tom do ícone do canto (o da marca que venceu). */
  cornerTone: QuestTone;
  /** A marca de cada missão de prédio listada no menu (nunca desenhada no lote). */
  buildings: Partial<Record<BuildingId, QuestMark>>;
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
  // Permanente: só "?" (pronta e cenário ainda não comprado); em andamento não acende nada.
  const conquistas = strongestMark(MISSIONS.map((m): QuestMark => {
    const done = (input.missionProgress[m.id] ?? 0) >= m.target;
    return done && !input.ownedBackgrounds.includes(m.bgReward) ? 'ready' : null;
  }));
  const buildings = input.buildings ?? {};
  const predios = strongestMark(Object.values(buildings).map(m => m ?? null));
  const firstDay: QuestMark = input.firstDay ? 'available' : null;
  const daily = strongestMark([passeio, predios]);
  const corner = strongestMark([firstDay, passeio, torneio, conquistas, predios]);
  const fontes: [QuestMark, QuestTone][] = [[firstDay, 'gold'], [passeio, 'gold'], [torneio, 'blue'], [conquistas, 'gold'], [predios, 'gold']];
  const cornerTone = fontes.find(([m]) => m === corner && corner !== null)?.[1] ?? 'gold';
  return { corner, passeio, daily, torneio, conquistas, cornerTone, buildings, firstDay };
}

/** Rótulo acessível (EN primeiro, PT-BR depois). `null` quando não há marca. */
export function questMarkLabel(mark: QuestMark, isPt: boolean): string | null {
  if (mark === 'ready') return isPt ? 'Missão pronta' : 'Quest ready';
  if (mark === 'available') return isPt ? 'Missão disponível' : 'Quest available';
  return null;
}
