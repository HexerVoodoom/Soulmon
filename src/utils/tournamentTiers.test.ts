import { describe, it, expect } from 'vitest';
import { TOURNAMENT_TIERS, TOURNAMENT_SEATS, TOURNAMENT_LADDER, SEAT_MIN_LIFETIME, getTierStanding, resolveSeasonPlace } from './tournamentTiers';

describe('faixas do torneio', () => {
  it('A1/R8: a escada clássica, nesta ordem, nos dois idiomas (Mestre e Grão-Mestre são LUGARES)', () => {
    expect(TOURNAMENT_LADDER.map(t => t.namePt)).toEqual(['Madeira', 'Bronze', 'Prata', 'Ouro', 'Platina', 'Diamante', 'Mestre', 'Grão-Mestre']);
    expect(TOURNAMENT_LADDER.map(t => t.nameEn)).toEqual(['Wood', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster']);
    expect(TOURNAMENT_TIERS.map(t => t.min)).toEqual([0, 100, 300, 700, 1100, 1500]);
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
    // sem posição, nem 999999 pontos viram Mestre: é um lugar, não um limiar
    expect(getTierStanding(999999).tier.id).toBe('diamante');
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

  describe('R8 — Mestre (top 100) e Grão-Mestre (top 20)', () => {
    it('os lugares estão declarados com o corte da posição', () => {
      expect(TOURNAMENT_SEATS.map(t => [t.id, t.maxPlace])).toEqual([['mestre', 100], ['grao-mestre', 20]]);
    });

    it('a posição promove — só com a faixa Diamante já alcançada', () => {
      const L = SEAT_MIN_LIFETIME;
      expect(getTierStanding(L, 1)).toMatchObject({ seat: true, place: 1, tier: { id: 'grao-mestre' } });
      expect(getTierStanding(L, 20).tier.id).toBe('grao-mestre');
      expect(getTierStanding(L, 21)).toMatchObject({ seat: true, place: 21, tier: { id: 'mestre' } });
      expect(getTierStanding(L, 100).tier.id).toBe('mestre');
      expect(getTierStanding(L, 101)).toMatchObject({ seat: false, place: null, tier: { id: 'diamante' } });
      // top 1 de uma season vazia, sem a faixa Diamante: não vira Mestre
      expect(getTierStanding(L - 1, 1).seat).toBe(false);
      expect(getTierStanding(L - 1, 1).tier.id).toBe('platina');
    });

    it('sair do top devolve a faixa de pontos — nunca abaixo dela', () => {
      expect(getTierStanding(1800, 15).tier.id).toBe('grao-mestre');
      expect(getTierStanding(1800, 150).tier.id).toBe('diamante');
      expect(getTierStanding(1800, null).tier.id).toBe('diamante');
    });

    it('posição inválida é ignorada', () => {
      for (const bad of [0, -3, 1.5, NaN, undefined, null]) {
        expect(getTierStanding(2000, bad as number).seat).toBe(false);
      }
    });

    it('resolveSeasonPlace: o servidor manda; sem ele, a lista pública (índice + 1)', () => {
      expect(resolveSeasonPlace(42, 3)).toBe(42);
      expect(resolveSeasonPlace(undefined, 3)).toBe(4);
      expect(resolveSeasonPlace('7', -1)).toBeNull();
      expect(resolveSeasonPlace(undefined, -1)).toBeNull();
    });
  });
});
