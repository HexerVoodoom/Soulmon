// ---------------------------------------------------------------------------
// PARA ONDE CADA MISSÃO LEVA (dono, 14/10/2026, REGISTRO §62): toda missão que depende de uma ação num PRÉDIO direciona para lá
// (fecha a folha de Missões e abre o lote no Mapa, com a navegação que já existe); a que se faz na Home (cuidado, humor) leva de
// volta à Home; a que não tem lugar não tem ação. Tabela única e pura — a UI só pergunta.
// ---------------------------------------------------------------------------

import type { BuildingId } from './gates';
import type { WeeklyMissionId } from './weeklyMissions';
import type { MissionCategory } from './missions';
import type { DailyMission } from './dailyMissions';

/** Um prédio do Mapa, a Home (a ação mora no pet/lista), o CAMPO DE CONVERSA com o Soulmon (na Home) ou lugar nenhum. */
export type GoTarget = BuildingId | 'home' | 'chat' | null;

export function weeklyTarget(id: WeeklyMissionId): GoTarget {
  switch (id) {
    case 'dungeon-runs': return 'exploracao.fenda';
    case 'evolve-view': return 'laboratorio.evolucao';
    case 'tournament-match': return 'arena.torneio';
    case 'gift-sent': return 'laboratorio.amigos';
    case 'journal-days': return 'forja.caderno';
    case 'focus-days': return 'forja.oficina';
    // O Restaurante não é BuildingId (sem portão de Vínculo); a missão do prato leva ao Mercado, onde a diária da Snapjaw também aponta (`n-snapjaw`).
    case 'cook-dish': return 'mercado.itens';
    case 'rest-nights': case 'checkins': case 'haunted-done': case 'rub-days': case 'shower': case 'play-days': case 'mood-checkins':
      return 'home';
    case 'dream-new': return 'home';
    default: return null;
  }
}

/** Conquistas por categoria: Evolução → Centro de Evolução, Masmorra → Masmorra, Jogos → Salão; Constância não tem lugar. */
export function achievementTarget(category: MissionCategory, id?: string): GoTarget {
  // Exceções por id (11/11/2026): a conquista tem lugar óbvio mesmo fora das categorias com prédio.
  switch (id) {
    case 'mission-zip-10': case 'mission-patches-10': return 'jogos.mente';
    case 'mission-focus-prepared-10': return 'forja.oficina';
    case 'mission-clan-shop-3': return 'hall.guilda';
    case 'mission-perfect-30': return 'home';
    default: break;
  }
  switch (category) {
    case 'evolution': return 'laboratorio.evolucao';
    case 'dungeon': return 'exploracao.fenda';
    case 'games': return 'jogos.salao';
    default: return null;
  }
}

/** Diárias: o cuidado do Refúgio (banho, carinho, comida, humor, descanso, brincar) se faz na Home; o resto, no prédio da missão. */
export function dailyTarget(m: Pick<DailyMission, 'building'> & { id?: string; event?: string }): GoTarget {
  // "Conte como você está se sentindo hoje" se cumpre CONVERSANDO com o Soulmon: o toque abre o campo de conversa.
  // 12/11/2026: vale também para a missão do NPC que pede o mesmo gesto (Sumi, `n-sumi`, evento `humor`).
  if (m.id === 'd-humor' || m.event === 'humor') return 'chat';
  // O cuidado (carinho, banho, comida, sono) se faz na Home, mesmo quando é a missão de um NPC de outro prédio (Tinta).
  if (m.event === 'carinho' || m.event === 'banho' || m.event === 'comida' || m.event === 'sono') return 'home';
  return m.building === 'forja.refugio' ? 'home' : m.building;
}
