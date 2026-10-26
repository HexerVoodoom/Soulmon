import { describe, it, expect } from 'vitest';
import { TOURNAMENT_NPCS, TOURNAMENT_NPC_ART, tournamentNpcSprite } from './tournamentNpcs';
import { spriteUrlFacesLeft } from './sprites';

describe('Soulmon próprio dos desafiantes do Torneio', () => {
  it('cada desafiante tem 4 formas distintas, e estágio desconhecido/ultra cai em mega', () => {
    for (const n of TOURNAMENT_NPCS) {
      const art = TOURNAMENT_NPC_ART[n.id];
      expect(new Set(Object.values(art)).size).toBe(4);
      expect(tournamentNpcSprite(n, 'rookie')).toBe(art.rookie);
      expect(tournamentNpcSprite(n, 'champion-power')).toBe(art.champion);
      expect(tournamentNpcSprite(n, 'ultimate-x')).toBe(art.ultimate);
      expect(tournamentNpcSprite(n, 'mega-x')).toBe(art.mega);
      expect(tournamentNpcSprite(n, 'ultra')).toBe(art.mega);
      expect(tournamentNpcSprite(n, 'qualquer-coisa')).toBe(art.mega);
    }
  });
  it('a arte olha para a direita (sem caso especial no BattleStage)', () => {
    for (const n of TOURNAMENT_NPCS) for (const u of Object.values(TOURNAMENT_NPC_ART[n.id])) expect(spriteUrlFacesLeft(u!)).toBe(false);
  });
});
