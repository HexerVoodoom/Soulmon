import { describe, it, expect } from 'vitest';
import { TOURNAMENT_TIERS, getTierStanding } from './tournamentTiers';

describe('faixas do torneio', () => {
  it('o catálogo está ordenado e começa em zero', () => {
    expect(TOURNAMENT_TIERS[0].min).toBe(0);
    for (let i = 1; i < TOURNAMENT_TIERS.length; i++) {
      expect(TOURNAMENT_TIERS[i].min).toBeGreaterThan(TOURNAMENT_TIERS[i - 1].min);
    }
  });

  it('coloca o jogador na faixa certa', () => {
    expect(getTierStanding(0).tier.id).toBe('semente');
    expect(getTierStanding(99).tier.id).toBe('semente');
    expect(getTierStanding(100).tier.id).toBe('broto');
    expect(getTierStanding(699).tier.id).toBe('guardiao');
    expect(getTierStanding(1500).tier.id).toBe('lendario');
    expect(getTierStanding(999999).tier.id).toBe('lendario');
  });

  it('a faixa nunca desce por causa do que os outros fizeram', () => {
    // A faixa é função APENAS dos pontos do próprio jogador: não há entrada no
    // cálculo que dependa de outra pessoa. É o ponto todo de existir.
    const antes = getTierStanding(350);
    const depois = getTierStanding(350);
    expect(depois.tier.id).toBe(antes.tier.id);
    // E acumular pontos nunca rebaixa.
    for (let p = 0; p < 2000; p += 37) {
      const a = TOURNAMENT_TIERS.findIndex(t => t.id === getTierStanding(p).tier.id);
      const b = TOURNAMENT_TIERS.findIndex(t => t.id === getTierStanding(p + 37).tier.id);
      expect(b).toBeGreaterThanOrEqual(a);
    }
  });

  it('mostra o quanto falta para a próxima faixa', () => {
    const s = getTierStanding(120);
    expect(s.next?.id).toBe('guardiao');
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
    expect(getTierStanding(-50).tier.id).toBe('semente');
    expect(getTierStanding(NaN).tier.id).toBe('semente');
  });
});
