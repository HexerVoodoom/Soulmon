// 🏅 Missions — permanent achievements that UNLOCK THE PURCHASE of exclusive
// shop items (the mission backgrounds). Locked items show in the shop with a
// padlock; completing the mission makes them buyable. Progress is derived
// from GameState counters.
import { getStageLevel, type EvolutionStage } from '../types/progression';
import type { ShopItem } from './shop';
// Missão é INTERFACE (aparece na aba da loja), não conteúdo do visor: o ícone
// deixou de ser PNG emoldurado e virou o nome de uma ligature da Material
// Symbols Rounded, desenhada pelo `<Icon>`. Este módulo é de DADOS e não
// importa React — ele carrega só o NOME; quem renderiza é a tela.
// Os seis nomes foram conferidos no inventário de `src/styles/tokens.md`;
// nome fora dele não renderiza glifo nenhum e não dá erro.

export interface MissionState {
  evolutionStage: string;
  unlockedEvolutions: string[];
  /** Total dungeon enemies defeated (lifetime). */
  dungeonKills: number;
  /** Full 5-floor dungeon runs completed (lifetime). */
  dungeonRunsCompleted: number;
  /** Best Dino Runner score. */
  dinoBest: number;
  /** Perfect days earned in total (lifetime — does not reset on evolution).
   *  ⚠️ Só dias completos REAIS desde a decisão #41/#60 (22/09/2026). */
  totalPerfectDays: number;
  /**
   * Dias completos vitalícios PARA A MISSÃO — reais **mais** os 🌀.
   *
   * Decisão do dono #41/#60 (`docs/PERGUNTAS-DO-DONO.md`, 22/09/2026):
   * *"🌀 não conta para conquistas: `totalPerfectDays` só por dia
   * completo real (**segue contando para a missão**)"*. São duas perguntas
   * diferentes — "você cumpriu 30 dias?" (conquista) e "você acumulou 30
   * marcas?" (missão) — e por isso são dois contadores, em vez de um número
   * com dois significados.
   *
   * `?? totalPerfectDays` em quem monta o objeto: save anterior à decisão não
   * tem o campo, e ali o vitalício antigo JÁ incluía os 🌀 — ou seja, a missão
   * nunca anda para trás.
   */
  missionPerfectDays: number;
}

/**
 * Categoria da conquista — o filtro da folha de Conquistas do Mercado
 * (minimal-ui F5: "Conquistas filtra por categoria em vez de moeda"). Dado da
 * missão, não da tela: acrescentar uma missão sem categoria não compila.
 */
export type MissionCategory = 'evolution' | 'dungeon' | 'games' | 'constancy';

export const MISSION_CATEGORIES: readonly MissionCategory[] = ['evolution', 'dungeon', 'games', 'constancy'];

export interface Mission {
  id: string;
  category: MissionCategory;
  /** Emoji — chave curta para TEXTO. Não é o visual da loja. */
  icon: string;
  /** Ligature da Material Symbols (inventário de `styles/tokens.md`) — é
   *  ISTO que a loja desenha, via `<Icon name={iconName} />`. */
  iconName: string;
  namePt: string;
  nameEn: string;
  descPt: string;
  descEn: string;
  target: number;
  /** Shop item whose PURCHASE this mission unlocks (id into SHOP_ITEMS). */
  bgReward: string;
  progress: (s: MissionState) => number;
}

// Numeric rank per stage level, to check "reached at least X".
const LEVEL_RANK: Record<EvolutionStage, number> = {
  rookie: 0, champion: 1, ultimate: 2, mega: 3, ultra: 4,
};

/** 1 when the pet has EVER reached the given level (current or unlocked form). */
function reachedLevel(s: MissionState, level: EvolutionStage): number {
  const forms = [s.evolutionStage, ...s.unlockedEvolutions];
  return forms.some(f => LEVEL_RANK[getStageLevel(f)] >= LEVEL_RANK[level]) ? 1 : 0;
}

export const MISSIONS: Mission[] = [
  {
    id: 'mission-champion', category: 'evolution', icon: '🥋', iconName: 'military_tech', target: 1, bgReward: 'bg-mission-filecity',
    namePt: 'Primeiro Campeão', nameEn: 'First Champion',
    descPt: 'Evolua até o nível CAMPEÃO', descEn: 'Evolve to CHAMPION level',
    progress: s => reachedLevel(s, 'champion'),
  },
  {
    id: 'mission-mega', category: 'evolution', icon: '👑', iconName: 'emoji_events', target: 1, bgReward: 'bg-mission-infinity',
    namePt: 'Lenda Mega', nameEn: 'Mega Legend',
    descPt: 'Evolua até o nível MEGA', descEn: 'Evolve to MEGA level',
    progress: s => reachedLevel(s, 'mega'),
  },
  {
    id: 'mission-kills-100', category: 'dungeon', icon: '⚔️', iconName: 'swords', target: 100, bgReward: 'bg-mission-coliseum',
    namePt: 'Gladiador', nameEn: 'Gladiator',
    descPt: 'Derrote 100 inimigos na masmorra', descEn: 'Defeat 100 dungeon enemies',
    progress: s => s.dungeonKills,
  },
  {
    id: 'mission-runs-3', category: 'dungeon', icon: '🏰', iconName: 'flag', target: 3, bgReward: 'bg-mission-abyss',
    namePt: 'Conquistador do Abismo', nameEn: 'Abyss Conqueror',
    descPt: 'Conclua 3 runs completas da masmorra', descEn: 'Complete 3 full dungeon runs',
    progress: s => s.dungeonRunsCompleted,
  },
  {
    id: 'mission-dino-1000', category: 'games', icon: '🦖', iconName: 'pets', target: 1000, bgReward: 'bg-mission-dinoland',
    namePt: 'Maratonista Jurássico', nameEn: 'Jurassic Marathoner',
    descPt: 'Faça 1000 de score na Corrida do Dino', descEn: 'Score 1000 in Dino Runner',
    progress: s => s.dinoBest,
  },
  {
    id: 'mission-perfect-30', category: 'constancy', icon: '⭐', iconName: 'star', target: 30, bgReward: 'bg-mission-aurora',
    namePt: 'Constância Perfeita', nameEn: 'Perfect Consistency',
    descPt: 'Acumule 30 dias completos (total)', descEn: 'Earn 30 complete days (lifetime)',
    // #41/#60: a MISSÃO segue contando o 🌀 (decisão literal do dono); quem
    // deixou de contá-lo é `utils/achievements.ts`, que lê `totalPerfectDays`.
    progress: s => s.missionPerfectDays,
  },
];

/** Progress per mission id, clamped to the target. */
export function getMissionProgress(s: MissionState): Record<string, number> {
  return Object.fromEntries(MISSIONS.map(m => [m.id, Math.min(m.target, m.progress(s))]));
}

/** Whether a mission is complete, given a getMissionProgress record. */
export function isMissionComplete(missionId: string, progress: Record<string, number>): boolean {
  const m = MISSIONS.find(x => x.id === missionId);
  return !!m && (progress[missionId] ?? 0) >= m.target;
}

/**
 * Whether a shop item's purchase is unlocked. Locked items still render in
 * the shop (darkened + padlock) with a hint on how to unlock them —
 * mission-gated: unlocked once the mission is complete.
 */
export function isShopItemUnlocked(
  item: ShopItem,
  missionProgress: Record<string, number>,
): boolean {
  if (!item.unlock) return true;
  return isMissionComplete(item.unlock.missionId, missionProgress);
}
