import { describe, expect, it } from 'vitest';
import { FOE_STAGE_HP_FLOORS, stageForFoeHp } from './estagioPorHp';
import { ARENA_ROUNDS, ARENA_ROUND_COMP, arenaFoe, buildArenaRound } from './arena';
import { autoHp, STAGE_LEVEL_CAPS, stageOfLevel } from './combate/level';
import { hpPoints } from './combate/fight';
import { mulberry32 } from './combate/rng';

const ORD = ['rookie', 'champion', 'ultimate', 'mega', 'ultra'];

describe('coerência estágio × HP do inimigo (dono, 11/11/2026)', () => {
  it('as faixas saem do HP real de cada estágio: o level de cada estágio cai na sua própria faixa', () => {
    for (let L = 1; L <= STAGE_LEVEL_CAPS[STAGE_LEVEL_CAPS.length - 1]; L++) expect(stageForFoeHp(autoHp(L))).toBe(ORD[stageOfLevel(L)]);
  });
  it('HP ~2.500 nunca é Champion (o caso do dono) e ~2.000 também não', () => {
    expect(stageForFoeHp(2500 / 30)).toBe('ultimate');
    expect(stageForFoeHp(2000 / 30)).toBe('ultimate');
    expect(FOE_STAGE_HP_FLOORS[1]).toBeLessThan(2000);
  });
  it('Arena: com o level do jogador, a forma de cada inimigo nunca fica abaixo da faixa do HP dele (todas as escadas, rodadas e levels)', () => {
    for (const L of [5, 10, 14, 18, 21, 22, 30]) for (const ladder of [0, 5, 8, 11, 14, 17, 20, 32]) for (let r = 1; r <= ARENA_ROUNDS; r++) {
      const foes = buildArenaRound(r, 1, mulberry32(L * 977 + ladder * 31 + r), undefined, false, false, 'fogo', ladder, L);
      foes.forEach((f, i) => {
        const piso = stageForFoeHp(arenaFoe(L, ARENA_ROUND_COMP[r - 1][i], r - 1, ladder).combatant.hp);
        const teto = piso === 'rookie' || piso === 'champion' ? piso : 'ultimate'; // a Arena só tem arte até Ultimate
        if (f.creature === 'corvo' || f.namePt === 'Corvo') return; // o corvo (1/1000) é neutro/rookie por design
        expect(ORD.indexOf(f.tier)).toBeGreaterThanOrEqual(ORD.indexOf(teto));
      });
    }
  });
  it('Arena: o chefe (5ª luta) de um jogador Ultimate com HP ~2.500+ aparece Ultimate mesmo na escada baixa', () => {
    const L = 14;
    expect(hpPoints(arenaFoe(L, 'boss', 4, 0).combatant.hp)).toBeGreaterThan(2200);
    const boss = buildArenaRound(5, 1, mulberry32(7), undefined, false, false, 'fogo', 0, L)[0];
    expect(boss.tier).toBe('ultimate');
  });
  it('Arena: sem o level (compat.), nada muda: só a escada manda', () => {
    const a = buildArenaRound(5, 1, mulberry32(3), undefined, false, false, 'fogo', 0);
    expect(a[0].tier).toBe('rookie');
  });
});
