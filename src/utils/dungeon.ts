// Masmorra — a ONDA (`buildDungeonWave`) mora aqui porque sorteia a criatura no roster de combinados (`novosSoulmon` →
// `enemyRoster*`, ~40 KB com arte). O resto das regras está em `dungeonBase.ts` (leve; entra no chunk de entrada).
// Quem só precisa de `dungeonFoe`/`getDungeonBest`/… importa de `dungeonBase` e NÃO puxa o roster.
import { getDungeonEnemySprite } from './sprites';
import { getDungeonEncounter } from './novosSoulmon';
import { soulLevel } from './soulXP';
import { mulberry32 } from './combate/rng';
import { LADDER_TIERS, DUNGEON_BITS_FACTOR, TIER_POINTS, dungeonFoe, enemyKey, type DungeonEnemy } from './dungeonBase';
export * from './dungeonBase';

/**
 * Build one wave: a creature from each tier (baby-i → mega, in order), for the dungeon `level` (the floor:
 * base level + floor − 1). The strength is `dungeonFoe(playerLevel, slot, level)`; the flavour (sprite and
 * name) is drawn with `rng` — the run's `mulberry32`, NEVER `Math.random` (a test greps for it). Without
 * `rng` the wave is still deterministic (seeded by the level). `playerLevel` defaults to the level of the stage.
 */
export function buildDungeonWave(
  level: number,
  petStage: string,
  rng: () => number = mulberry32(Math.imul(Math.max(1, Math.floor(level)), 0x9e3779b1) | 0),
  playerLevel: number = soulLevel({ evolutionStage: petStage }),
): DungeonEnemy[] {
  const floor = Math.max(1, Math.floor(level));
  const ptsMult = 1 + 0.12 * (floor - 1);
  const used = new Set<string>(); // sem criatura repetida dentro da onda (REGISTRO §68)
  return LADDER_TIERS.map((tier, slot) => {
    const picked = getDungeonEncounter(tier, used, rng, getDungeonEnemySprite, playerLevel);
    return {
      name: picked.name,
      stage: 'key' in picked && picked.key ? picked.key : enemyKey(tier, picked.line),
      sprite: picked.sprite,
      points: Math.max(1, Math.round(TIER_POINTS[tier] * ptsMult * DUNGEON_BITS_FACTOR)),
      slot,
      floor,
      foe: dungeonFoe(playerLevel, slot, floor),
      ...('element' in picked && picked.element ? { element: picked.element, basico: picked.basico, especial: picked.especial } : {}),
    };
  });
}

