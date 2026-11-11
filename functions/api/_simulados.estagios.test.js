import { describe, expect, it } from 'vitest';
import { SIMULADOS } from './_simulados.data.js';
import { estadoDoDia } from './_simulados.js';

// dono, 11/11/2026: os "jogadores reais fake" tinham quase só Rookie/Champion; precisa de mais Ultimate sem sair da faixa de poder possível.
describe('distribuição de estágio dos simulados', () => {
  const conta = (dia) => { const c = {}; for (const p of SIMULADOS) { const s = estadoDoDia(p, dia).stage; c[s] = (c[s] || 0) + 1; } return c; };
  it('no dia da correção, Ultimate+ é pelo menos 20% (era ~7%) e ainda sobra Rookie para o jogador novo', () => {
    const c = conta('2026-11-11');
    const alto = (c.ultimate || 0) + (c.mega || 0) + (c.ultra || 0);
    expect(alto / SIMULADOS.length).toBeGreaterThanOrEqual(0.2);
    expect((c.rookie || 0) / SIMULADOS.length).toBeGreaterThanOrEqual(0.3);
    expect(c.champion || 0).toBeGreaterThan(0);
  });
  it('nenhum simulado está acima do que a faixa dele alcançaria desde o dia-zero (poder coerente com o ritmo de um jogador real)', () => {
    // Ritmo real (gauge): Rookie→Champion ~8 dias a 100% (≈12 a 70%, ≈25 a 33%); →Ultimate ~17 dias a 100% (≈25 a 70%). Margem folgada abaixo.
    const dias = { A: { champion: 12, ultimate: 30 }, B: { champion: 16, ultimate: 40 }, C: { champion: 28, ultimate: 90 } };
    for (const p of SIMULADOS) {
      const min = dias[p.faixa][p.ancora.estagio];
      if (min) expect(p.daysPlaying, p.id).toBeGreaterThanOrEqual(min);
    }
  });
  it('nunca regride de estágio ao longo dos dias', () => {
    const ord = ['rookie', 'champion', 'ultimate', 'mega', 'ultra'];
    for (const p of SIMULADOS) {
      let prev = -1;
      for (const d of ['2026-11-11', '2026-11-25', '2026-12-15', '2027-02-01']) { const i = ord.indexOf(estadoDoDia(p, d).stage); expect(i).toBeGreaterThanOrEqual(prev); prev = i; }
    }
  });
});
