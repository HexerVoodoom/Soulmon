import { describe, it, expect } from 'vitest';
import { canSwitchLaterally, applyLateralSwitch } from './trocaLateral';
import { degeneratedEvolutionPoints, degeneratedPerfectDays } from './dailyReset';

const base = {
  evolutionStage: 'mega-power',
  unlockedEvolutions: ['champion-power', 'champion-harmony', 'ultimate-power', 'mega-power', 'mega-harmony'],
  healthPoints: 1,
  maxHealthPoints: 3,
  perfectDays: 40,
  evolutionPoints: 500,
  degeneratedByHP: true,
  currentBranch: 'power',
  attributesSinceLastEvolution: { power: 3, harmony: 1, benevolence: 0 },
  chipsStage: 'mega-power',
};

describe('troca lateral de forma', () => {
  it('troca entre formas desbloqueadas do mesmo nível, mesmo fora do galho dominante', () => {
    const s = { ...base, currentBranch: 'benevolence' };
    expect(applyLateralSwitch(s, 'mega-harmony').evolutionStage).toBe('mega-harmony');
  });

  it('não mexe em HP, perfectDays, evolutionPoints, atributos, chips nem marca de queda', () => {
    const out = applyLateralSwitch(base, 'mega-harmony');
    expect({ ...out, evolutionStage: base.evolutionStage }).toEqual(base);
  });

  it('lateral não ganha piso de pontos; a queda normal (dailyReset) segue com o piso', () => {
    expect(degeneratedPerfectDays(0, 'champion')).toBeGreaterThan(0);
    expect(degeneratedEvolutionPoints(0, 'champion')).toBeGreaterThan(0);
    const pobre = { ...base, perfectDays: 2, evolutionPoints: 0, healthPoints: 1 };
    const out = applyLateralSwitch(pobre, 'mega-harmony');
    expect(out.perfectDays).toBe(2);
    expect(out.evolutionPoints).toBe(0);
    expect(out.healthPoints).toBe(1);
  });

  it('recusa nível diferente, forma não desbloqueada, a mesma forma, rookie e ultra', () => {
    const u = base.unlockedEvolutions;
    expect(canSwitchLaterally({ currentStageId: 'mega-power', targetStageId: 'champion-power', unlockedEvolutions: u })).toBe(false);
    expect(canSwitchLaterally({ currentStageId: 'mega-power', targetStageId: 'mega-benevolence', unlockedEvolutions: u })).toBe(false);
    expect(canSwitchLaterally({ currentStageId: 'mega-power', targetStageId: 'mega-power', unlockedEvolutions: u })).toBe(false);
    expect(canSwitchLaterally({ currentStageId: 'rookie', targetStageId: 'rookie', unlockedEvolutions: u })).toBe(false);
    expect(canSwitchLaterally({ currentStageId: 'ultra', targetStageId: 'mega-power', unlockedEvolutions: u })).toBe(false);
    expect(applyLateralSwitch(base, 'mega-benevolence')).toBe(base);
  });
});

import { forecastNodeId, stageLevelIndex } from './evolutionForecast';

describe('nó previsto = nível seguinte ao atual', () => {
  const benev = ['champion-benevolence', 'ultimate-benevolence', 'mega-benevolence'];
  it('galhos trocados, atual mega: previsto não pode ser Ultimate (nível abaixo)', () => {
    expect(forecastNodeId('mega-power', benev)).toBeNull(); // mega -> ultra não está no galho
    expect(forecastNodeId('mega-power', benev)).not.toBe('ultimate-benevolence');
  });
  it('galhos trocados, atual ultimate: previsto é o Mega do galho previsto', () => {
    expect(forecastNodeId('ultimate-power', benev)).toBe('mega-benevolence');
  });
  it('rookie e champion apontam para o nível seguinte', () => {
    expect(forecastNodeId('rookie', benev)).toBe('champion-benevolence');
    expect(forecastNodeId('champion-benevolence', benev)).toBe('ultimate-benevolence');
    expect(stageLevelIndex('ultra')).toBeGreaterThan(stageLevelIndex('mega-power'));
  });
});

describe('degenerar de galho diferente', () => {
  it('queda não mexe em unlockedEvolutions: canReachUltra igual', async () => {
    const { canReachUltra, getStageLevel } = await import('../types/progression');
    const u = ['mega-power', 'mega-harmony', 'mega-benevolence', 'champion-harmony'];
    const antes = canReachUltra({ unlockedEvolutions: u, evolutionPoints: 0 });
    // a queda manual só troca estágio/HP/pontos; a lista de desbloqueios não entra
    expect(getStageLevel('champion-harmony')).toBe('champion');
    expect(canReachUltra({ unlockedEvolutions: u, evolutionPoints: 0 })).toBe(antes);
    expect(antes).toBe(true);
  });
});
