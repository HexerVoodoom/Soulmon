// Masmorra — a ONDA (`buildDungeonWave`) mora aqui porque sorteia a criatura no roster de combinados (`novosSoulmon` →
// `enemyRoster*`, ~40 KB com arte). O resto das regras está em `dungeonBase.ts` (leve; entra no chunk de entrada).
// Quem só precisa de `dungeonFoe`/`getDungeonBest`/… importa de `dungeonBase` e NÃO puxa o roster.
import { foeSpecialOf } from './combate/foeFamilies';
import { getDungeonEnemySprite } from './sprites';
import { lineElementOf } from './spriteElement';
import { getDungeonEncounter } from './novosSoulmon';
import { soulLevel } from './soulXP';
import { stageForFoeHp, FOE_STAGES } from './estagioPorHp';
import { ENEMY_STAGE_UNLOCK_LEVEL, type EnemyStage } from './enemyRoster';
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
  /** Masmorra temática (08/11/2026): só criaturas deste elemento. Ausente = sorteio comum. */
  element?: string,
): DungeonEnemy[] {
  const floor = Math.max(1, Math.floor(level));
  const ptsMult = 1 + 0.12 * (floor - 1);
  const used = new Set<string>(); // sem criatura repetida dentro da onda (REGISTRO §68)
  return LADDER_TIERS.map((tier, slot) => {
    const foe = dungeonFoe(playerLevel, slot, floor);
    // Coerência estágio × HP (dono, 11/11/2026): a forma sobe até a faixa do HP real do inimigo; o roster não tem arte de Ultra, então o teto é Mega.
    const hpStage = stageForFoeHp(foe.combatant.hp);
    const minStage: EnemyStage = FOE_STAGES.indexOf(hpStage) >= FOE_STAGES.indexOf('mega') ? 'mega' : (hpStage as EnemyStage);
    const picked = getDungeonEncounter(tier, used, rng, getDungeonEnemySprite, Math.max(playerLevel, ENEMY_STAGE_UNLOCK_LEVEL[minStage]), element, minStage, floor, playerLevel); // o HP manda: o teto de ARTE por level não segura a forma coerente com ele
    // Especiais variados (dono, 11/11/2026): o tipo do especial do inimigo (Rift/Masmorra) vem do sorteio fixo por (andar, posição, criatura). O Pesadelo substitui o foe depois.
    const foeFinal = foe.special ? { ...foe, special: foeSpecialOf(minStage, `rift|${floor}|${slot}|${picked.name}`) } : foe;
    return {
      name: picked.name,
      stage: 'key' in picked && picked.key ? picked.key : enemyKey(tier, picked.line),
      sprite: picked.sprite,
      points: Math.max(1, Math.round(TIER_POINTS[tier] * ptsMult * DUNGEON_BITS_FACTOR)),
      slot,
      floor,
      foe: foeFinal,
      ...('element' in picked && picked.element ? { element: picked.element, basico: picked.basico, especial: picked.especial } : (lineElementOf(picked.line) ? { element: lineElementOf(picked.line) } : {})),
    };
  });
}

