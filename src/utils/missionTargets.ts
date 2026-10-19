// ---------------------------------------------------------------------------
// PARA ONDE CADA MISSÃO LEVA (dono, 14/10/2026, REGISTRO §62): toda missão que depende de uma ação num PRÉDIO direciona para lá
// (fecha a folha de Missões e abre o lote no Mapa, com a navegação que já existe); a que se faz na Home (cuidado, humor) leva de
// volta à Home; a que não tem lugar não tem ação. Tabela única e pura — a UI só pergunta.
// ---------------------------------------------------------------------------

import type { BuildingId } from './gates';
import type { WeeklyMissionId } from './weeklyMissions';
import type { MissionCategory } from './missions';
import type { DailyMission } from './dailyMissions';

/** Um prédio do Mapa, a Home (a ação mora no pet/lista) ou lugar nenhum. */
export type GoTarget = BuildingId | 'home' | null;

export function weeklyTarget(id: WeeklyMissionId): GoTarget {
  switch (id) {
    case 'dungeon-runs': return 'exploracao.masmorra';
    case 'evolve-view': return 'laboratorio.evolucao';
    case 'tournament-match': return 'arena.torneio';
    case 'friend-visit': return 'laboratorio.amigos';
    case 'rest-nights': case 'checkins': case 'haunted-done': case 'rub-days': case 'shower': case 'play-days': case 'mood-checkins':
      return 'home';
    case 'dream-new': return 'home';
    default: return null;
  }
}

/** Conquistas por categoria: Evolução → Centro de Evolução, Masmorra → Masmorra, Jogos → Salão; Constância não tem lugar. */
export function achievementTarget(category: MissionCategory): GoTarget {
  switch (category) {
    case 'evolution': return 'laboratorio.evolucao';
    case 'dungeon': return 'exploracao.masmorra';
    case 'games': return 'jogos.salao';
    default: return null;
  }
}

/** Diárias: o cuidado do Refúgio (banho, carinho, comida, humor, descanso, brincar) se faz na Home; o resto, no prédio da missão. */
export function dailyTarget(m: Pick<DailyMission, 'building'>): GoTarget {
  return m.building === 'jogos.refugio' ? 'home' : m.building;
}
