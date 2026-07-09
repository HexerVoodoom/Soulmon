// 🏅 Missions — permanent goals that unlock EXCLUSIVE pet-box backgrounds
// (they never appear in the shop; the only way in is playing). Progress is
// derived from GameState counters; claiming adds the background to
// ownedBackgrounds, so "claimed" simply means the background is owned.
import { getStageLevel, type EvolutionStage } from '../types/progression';

export interface MissionState {
  evolutionStage: string;
  unlockedEvolutions: string[];
  /** Total dungeon enemies defeated (lifetime). */
  dungeonKills: number;
  /** Full 5-floor dungeon runs completed (lifetime). */
  dungeonRunsCompleted: number;
  /** Best Dino Runner score. */
  dinoBest: number;
  /** Perfect days earned in total (lifetime — does not reset on evolution). */
  totalPerfectDays: number;
}

export interface Mission {
  id: string;
  icon: string;
  namePt: string;
  nameEn: string;
  descPt: string;
  descEn: string;
  target: number;
  /** Background unlocked on claim (id into PET_BACKGROUNDS). */
  bgReward: string;
  progress: (s: MissionState) => number;
}

// Numeric rank per stage level, to check "reached at least X".
const LEVEL_RANK: Record<EvolutionStage, number> = {
  digiegg: 0, 'baby-i': 1, 'baby-ii': 2, rookie: 3,
  champion: 4, ultimate: 5, mega: 6, ultra: 7,
};

/** 1 when the pet has EVER reached the given level (current or unlocked form). */
function reachedLevel(s: MissionState, level: EvolutionStage): number {
  const forms = [s.evolutionStage, ...s.unlockedEvolutions];
  return forms.some(f => LEVEL_RANK[getStageLevel(f)] >= LEVEL_RANK[level]) ? 1 : 0;
}

export const MISSIONS: Mission[] = [
  {
    id: 'mission-champion', icon: '🥋', target: 1, bgReward: 'bg-mission-filecity',
    namePt: 'Primeiro Campeão', nameEn: 'First Champion',
    descPt: 'Evolua até o nível CAMPEÃO', descEn: 'Evolve to CHAMPION level',
    progress: s => reachedLevel(s, 'champion'),
  },
  {
    id: 'mission-mega', icon: '👑', target: 1, bgReward: 'bg-mission-infinity',
    namePt: 'Lenda Mega', nameEn: 'Mega Legend',
    descPt: 'Evolua até o nível MEGA', descEn: 'Evolve to MEGA level',
    progress: s => reachedLevel(s, 'mega'),
  },
  {
    id: 'mission-kills-100', icon: '⚔️', target: 100, bgReward: 'bg-mission-coliseum',
    namePt: 'Gladiador', nameEn: 'Gladiator',
    descPt: 'Derrote 100 inimigos na masmorra', descEn: 'Defeat 100 dungeon enemies',
    progress: s => s.dungeonKills,
  },
  {
    id: 'mission-runs-3', icon: '🏰', target: 3, bgReward: 'bg-mission-abyss',
    namePt: 'Conquistador do Abismo', nameEn: 'Abyss Conqueror',
    descPt: 'Conclua 3 runs completas da masmorra', descEn: 'Complete 3 full dungeon runs',
    progress: s => s.dungeonRunsCompleted,
  },
  {
    id: 'mission-dino-1000', icon: '🦖', target: 1000, bgReward: 'bg-mission-dinoland',
    namePt: 'Maratonista Jurássico', nameEn: 'Jurassic Marathoner',
    descPt: 'Faça 1000 de score na Corrida do Dino', descEn: 'Score 1000 in Dino Runner',
    progress: s => s.dinoBest,
  },
  {
    id: 'mission-perfect-30', icon: '⭐', target: 30, bgReward: 'bg-mission-aurora',
    namePt: 'Constância Perfeita', nameEn: 'Perfect Consistency',
    descPt: 'Acumule 30 dias perfeitos (total)', descEn: 'Earn 30 perfect days (lifetime)',
    progress: s => s.totalPerfectDays,
  },
];

/** Progress per mission id, clamped to the target. */
export function getMissionProgress(s: MissionState): Record<string, number> {
  return Object.fromEntries(MISSIONS.map(m => [m.id, Math.min(m.target, m.progress(s))]));
}

/** A mission is claimable when complete and its background isn't owned yet. */
export function isMissionClaimable(m: Mission, s: MissionState, ownedBackgrounds: string[]): boolean {
  return m.progress(s) >= m.target && !ownedBackgrounds.includes(m.bgReward);
}
