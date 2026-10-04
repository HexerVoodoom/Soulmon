/**
 * QA3 — `duelStats` com `stage` hostil. `stage` vem do perfil gravado pelo cliente
 * (texto livre, 40 chars) e `STAGE_POWER[...]` era lido sem checar propriedade própria:
 * 'constructor' / '__proto__' / 'toString' devolviam uma função/objeto (não-nulo), a
 * conta virava NaN e o duelo nunca tinha eventos: quem ENFRENTASSE esse perfil perdia
 * sempre (`NaN >= NaN` é falso) e o dono dele ganhava +10 pontos por partida.
 */
import { describe, it, expect } from 'vitest';
import { duelStats, simulateDuel } from './_duel.js';

describe('duelStats com stage hostil', () => {
  for (const stage of ['constructor', '__proto__', 'toString', 'hasOwnProperty', 'valueOf']) {
    it(`stage "${stage}" vira ficha finita (rookie)`, () => {
      const s = duelStats({ stage });
      expect(Number.isFinite(s.hp)).toBe(true);
      expect(Number.isFinite(s.atk)).toBe(true);
      expect(s).toEqual(duelStats({ stage: 'rookie' }));
    });
  }
  it('o desafiante não perde automaticamente contra um perfil com stage hostil', () => {
    const me = duelStats({ stage: 'ultra' });
    const opp = duelStats({ stage: 'constructor' });
    const r = simulateDuel({ me, opp, seed: 7, cheers: [] });
    expect(r.events.length).toBeGreaterThan(0);
    expect(r.won).toBe(true);
  });
  it('atributos hostis não geram ataque negativo/infinito', () => {
    const s = duelStats({ stage: 'rookie', attrs: { power: -1e9, harmony: -1e9, benevolence: -1e9 } });
    expect(Number.isFinite(s.atk)).toBe(true);
    expect(s.atk).toBeGreaterThanOrEqual(10);
  });
});
