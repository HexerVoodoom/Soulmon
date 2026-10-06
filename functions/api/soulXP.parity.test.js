/**
 * PARIDADE do XP/level do Soulmon entre o app e o servidor (combate v3, PR2).
 *
 * O servidor nunca aceita level nem stats do cliente: recalcula de
 * `evolutionStage` + `perfectDays` com `_soulXP.js`. Se as duas implementacoes
 * divergirem nao ha erro nenhum, so um clamp errado; por isso o encontro e
 * comportamental, como em `bond.parity.test.js`.
 */
import { describe, it, expect } from 'vitest';
import * as srv from './_soulXP.js';
import * as app from '../../src/utils/soulXP';
import { STAGE_LEVEL_CAPS, FORM_REQUIREMENTS, levelCapFor } from '../../src/types/progression';

const ESTAGIOS = [
  'rookie', 'champion-power', 'champion-harmony', 'champion-benevolence',
  'ultimate-power', 'ultimate-harmony', 'ultimate-benevolence',
  'mega-power', 'mega-harmony', 'mega-benevolence', 'ultra',
  'lixo', '', 'mega', 'MEGA-POWER',
];

describe('o level do Soulmon e o MESMO nos dois lados', () => {
  it('os tetos do servidor sao os de FORM_REQUIREMENTS', () => {
    expect([...srv.STAGE_LEVEL_CAPS]).toEqual([...STAGE_LEVEL_CAPS]);
    expect(srv.MAX_LEVEL).toBe(STAGE_LEVEL_CAPS[STAGE_LEVEL_CAPS.length - 1]);
    expect(Object.keys(FORM_REQUIREMENTS).length).toBe(srv.STAGE_LEVEL_CAPS.length);
  });

  it('N = 15 estagios x 0..60 dias perfeitos: XP, level e teto batem', () => {
    let n = 0;
    for (const evolutionStage of ESTAGIOS) {
      for (let perfectDays = 0; perfectDays <= 60; perfectDays++) {
        const st = { evolutionStage, perfectDays };
        expect(srv.soulXP(st), JSON.stringify(st)).toBe(app.soulXP(st));
        expect(srv.soulLevel(st), JSON.stringify(st)).toBe(app.soulLevel(st));
        expect(srv.levelCapFor(evolutionStage)).toBe(levelCapFor(evolutionStage));
        n++;
      }
    }
    expect(n).toBe(15 * 61);
  });

  it('lixo no save cai no mesmo lado (level 1) nos dois', () => {
    for (const lixo of [null, undefined, NaN, -5, Infinity, 'muito', {}, []]) {
      const st = { evolutionStage: 'rookie', perfectDays: lixo };
      expect(srv.soulLevel(st)).toBe(1);
      expect(app.soulLevel(st)).toBe(1);
    }
    expect(srv.soulLevel(null)).toBe(1);
    expect(srv.soulLevel({ evolutionStage: 42, perfectDays: 3 })).toBe(app.soulLevel({ evolutionStage: 42, perfectDays: 3 }));
  });

  it('levelFor bate em todo XP ate bem depois do fim', () => {
    for (let xp = 0; xp <= 6000; xp += 7) expect(srv.levelFor(xp)).toBe(app.levelFor(xp));
  });
});
