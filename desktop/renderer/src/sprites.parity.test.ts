// Regressão nomeada da auditoria `soulmon-02`: a fronteira de sprite entre o
// desktop e `src/utils/sprites.ts` quebrou o build por 16 dias sem ninguém ver,
// porque nenhum teste EXECUTAVA essa fronteira. `tsc` verde não basta.
import { describe, it, expect } from 'vitest';
import { petSprite, facesLeft } from './sprites';
import { DUNGEON_LINE_SPRITES } from '../../../src/utils/sprites';

const STAGES = ['rookie', 'champion-power', 'ultimate-harmony', 'mega-benevolence', 'ultra'];

describe('fronteira de sprite do desktop', () => {
  it('petSprite devolve uma string não vazia para todos os níveis', () => {
    for (const stage of STAGES) {
      const src = petSprite(stage);
      expect(typeof src, stage).toBe('string');
      expect(src.length, stage).toBeGreaterThan(0);
    }
  });

  it('petSprite HONRA demoCharacterId (era descartado pelo 3º argumento morto)', () => {
    const demo = Object.keys(DUNGEON_LINE_SPRITES)[0];
    expect(demo).toBeTruthy();
    expect(petSprite('champion-power', demo)).toBe(DUNGEON_LINE_SPRITES[demo].champion);
    expect(petSprite('rookie', demo)).toBe(DUNGEON_LINE_SPRITES[demo].rookie);
    // 'ultra' reusa o sprite de mega no modo demo.
    expect(petSprite('ultra', demo)).toBe(DUNGEON_LINE_SPRITES[demo].mega);
  });

  it('demo e não-demo divergem (prova que o argumento chega mesmo)', () => {
    const demo = Object.keys(DUNGEON_LINE_SPRITES)[0];
    expect(petSprite('rookie', demo)).not.toBe(petSprite('rookie'));
  });

  it('facesLeft devolve boolean para todos os níveis (era TypeError no 1º frame)', () => {
    for (const stage of STAGES) expect(typeof facesLeft(stage), stage).toBe('boolean');
  });
});
