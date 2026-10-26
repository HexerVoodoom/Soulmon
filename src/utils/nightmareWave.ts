// A ONDA do pesadelo: delega a `buildDungeonWave` (roster de combinados, ~40 KB com arte). Fica fora de `nightmares.ts`
// para que o chunk de entrada não puxe o roster — só a tela do pesadelo (`NightmareBattleHost`) importa este módulo.
import { buildDungeonWave, type DungeonEnemy } from './dungeon';
import { mulberry32 } from './combate/rng';
import { soulLevel } from './soulXP';
import { nightmareShadowSprite } from './nightmareShadows';
import { nightmaresFor, nightmareDayKey, nightmareFoe, nightmareSlots, tierIndex, hashDayKey } from './nightmares';
import type { RestState } from './restWindow';

/**
 * A onda do pesadelo — **delegada a `buildDungeonWave`**.
 *
 * Não existe combate reimplementado aqui: o inimigo (`dungeonFoe`, relativo ao level do jogador), o
 * sprite e a exclusão da linha do próprio jogador são todos da masmorra. Este módulo só decide QUANTOS e
 * ATÉ QUE TIER — o resto é o motor que já existe.
 *
 * Combate v3 (PR4): a onda é SEMPRE do andar 1 (o `max(1, top−1)` de antes levava o TTK a 31 s no top 5);
 * `playerLevel` é o level do Soulmon (`soulLevel`) e `rng` o sorteio do sabor da onda (sem ele, determinístico
 * pelo andar). Nunca `Math.random`. `buildDungeonWave` devolve a escada inteira (6 inimigos, na ordem); a
 * luta do pesadelo pega só a fatia que TERMINA no tier alvo. Sem noite elegível → `[]`.
 */
export function buildNightmareWave(
  rest: RestState,
  petStage: string,
  now: Date,
  playerLevel?: number,
  rng?: () => number,
): DungeonEnemy[] {
  const { count, tier } = nightmaresFor(rest, now, petStage);
  if (count <= 0) return [];

  const top = tierIndex(tier);
  // sem `rng`, a onda é a da NOITE: o mesmo dia sorteia as mesmas criaturas (e dias diferentes, outras)
  const seed = rng ?? mulberry32(hashDayKey(nightmareDayKey(now, rest?.playerDayTz)));
  const lvl = playerLevel ?? soulLevel({ evolutionStage: petStage });
  const wave = buildDungeonWave(1, petStage, seed, lvl);
  const dayHash = hashDayKey(nightmareDayKey(now, rest?.playerDayTz));
  // Os SPRITES são os do pesadelo (as sombras `dino-shadow-*`, não Soulmons comuns), a força é a do Pesadelo.
  return nightmareSlots(top).map((slot) => ({
    ...wave[slot],
    sprite: nightmareShadowSprite(slot, dayHash).src,
    foe: nightmareFoe(lvl, slot),
  }));
}

