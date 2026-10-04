import { describe, it, expect } from 'vitest';
import { TOURNAMENT_TIERS, getTierStanding } from './tournamentTiers';

describe('faixas do torneio', () => {
  it('A1: são as faixas CLÁSSICAS, nesta ordem, nos dois idiomas', () => {
    expect(TOURNAMENT_TIERS.map(t => t.namePt)).toEqual(['Madeira', 'Bronze', 'Prata', 'Ouro', 'Platina', 'Diamante', 'Mestre']);
    expect(TOURNAMENT_TIERS.map(t => t.nameEn)).toEqual(['Wood', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master']);
  });

  it('o catálogo está ordenado e começa em zero', () => {
    expect(TOURNAMENT_TIERS[0].min).toBe(0);
    for (let i = 1; i < TOURNAMENT_TIERS.length; i++) {
      expect(TOURNAMENT_TIERS[i].min).toBeGreaterThan(TOURNAMENT_TIERS[i - 1].min);
    }
  });

  it('coloca o jogador na faixa certa', () => {
    expect(getTierStanding(0).tier.id).toBe('madeira');
    expect(getTierStanding(99).tier.id).toBe('madeira');
    expect(getTierStanding(100).tier.id).toBe('bronze');
    expect(getTierStanding(299).tier.id).toBe('bronze');
    expect(getTierStanding(300).tier.id).toBe('prata');
    expect(getTierStanding(699).tier.id).toBe('prata');
    expect(getTierStanding(700).tier.id).toBe('ouro');
    expect(getTierStanding(1100).tier.id).toBe('platina');
    expect(getTierStanding(1500).tier.id).toBe('diamante');
    expect(getTierStanding(2199).tier.id).toBe('diamante');
    expect(getTierStanding(2200).tier.id).toBe('mestre');
    expect(getTierStanding(999999).tier.id).toBe('mestre');
  });

  it('a faixa nunca desce por causa do que os outros fizeram', () => {
    // A faixa é função APENAS dos pontos do próprio jogador: não há entrada no
    // cálculo que dependa de outra pessoa. É o ponto todo de existir.
    const antes = getTierStanding(350);
    const depois = getTierStanding(350);
    expect(depois.tier.id).toBe(antes.tier.id);
    // E acumular pontos nunca rebaixa.
    for (let p = 0; p < 3000; p += 37) {
      const a = TOURNAMENT_TIERS.findIndex(t => t.id === getTierStanding(p).tier.id);
      const b = TOURNAMENT_TIERS.findIndex(t => t.id === getTierStanding(p + 37).tier.id);
      expect(b).toBeGreaterThanOrEqual(a);
    }
  });

  it('mostra o quanto falta para a próxima faixa', () => {
    const s = getTierStanding(120);
    expect(s.next?.id).toBe('prata');
    expect(s.pointsToNext).toBe(180);
    expect(s.progress).toBeGreaterThan(0);
    expect(s.progress).toBeLessThan(1);
  });

  it('na última faixa não há próxima', () => {
    const s = getTierStanding(5000);
    expect(s.next).toBeNull();
    expect(s.pointsToNext).toBe(0);
    expect(s.progress).toBe(1);
  });

  it('entrada inválida não quebra a UI', () => {
    expect(getTierStanding(-50).tier.id).toBe('madeira');
    expect(getTierStanding(NaN).tier.id).toBe('madeira');
  });
});
