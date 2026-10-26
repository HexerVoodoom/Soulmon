import { describe, it, expect } from 'vitest';
import { TOURNAMENT_NPCS, TOURNAMENT_NPC_ART, tournamentNpcSprite } from './tournamentNpcs';
import { getSpriteForStage, spriteUrlFacesLeft } from './sprites';

describe('Soulmon próprio dos desafiantes do Torneio', () => {
  const espina = TOURNAMENT_NPCS[0];
  it('a forma com arte própria usa o PNG próprio; as outras formas e os outros NPCs caem no starter da demo', () => {
    expect(tournamentNpcSprite(espina, 'rookie')).toBe(TOURNAMENT_NPC_ART['npc-espina'].rookie);
    expect(tournamentNpcSprite(espina, 'champion-power')).toBe(getSpriteForStage('champion-power', espina.starter, 256));
    for (const n of TOURNAMENT_NPCS.slice(1)) expect(tournamentNpcSprite(n, 'rookie')).toBe(getSpriteForStage('rookie', n.starter, 256));
  });
  it('a arte olha para a direita (sem caso especial no BattleStage)', () => {
    expect(spriteUrlFacesLeft(TOURNAMENT_NPC_ART['npc-espina'].rookie!)).toBe(false);
  });
});
