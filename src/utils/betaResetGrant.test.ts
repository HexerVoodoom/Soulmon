import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  type Grants,
  applyBetaResetGrant, BETA_RESET_GRANT, RESET_POINTS_EMOJI, resetAlignmentPoints, sanitizeGrants, pointsResetLine,
} from './betaResetGrant';
import { applySpecialItem } from './specialItemUse';
import { SPECIAL_ITEMS } from './shop';
import { evolutionTarget } from './evolutionTarget';

type S = { foodInventory: Record<string, number>; bornAt?: string; soulmonStages?: unknown; grants?: Grants };
const veterano = (): S => ({ foodInventory: { '🍎': 2 } as Record<string, number>, bornAt: 'Mon Oct 05 2026', soulmonStages: [{}] });

describe('§209 concessão única do beta', () => {
  it('veterano recebe 1 item e a flag; segunda carga não dá outro', () => {
    const a = applyBetaResetGrant(veterano());
    expect(a.foodInventory[RESET_POINTS_EMOJI]).toBe(1);
    expect(a.grants?.[BETA_RESET_GRANT]).toBe(true);
    const b = applyBetaResetGrant(applyBetaResetGrant(a));
    expect(b.foodInventory[RESET_POINTS_EMOJI]).toBe(1);
  });
  it('flag sobrevive à sanitização (save em nuvem) e bloqueia re-concessão', () => {
    const a = applyBetaResetGrant(veterano());
    const daNuvem = { ...veterano(), grants: sanitizeGrants(JSON.parse(JSON.stringify(a.grants))) };
    expect(applyBetaResetGrant(daNuvem).foodInventory[RESET_POINTS_EMOJI]).toBeUndefined();
  });
  it('save antigo sem bornAt mas com árvore recebe', () => {
    expect(applyBetaResetGrant<S>({ foodInventory: {}, soulmonStages: [{}] }).foodInventory[RESET_POINTS_EMOJI]).toBe(1);
  });
  it('jogador novo (nascido depois do corte) não recebe, e ganha a flag para nunca receber', () => {
    const n = applyBetaResetGrant<S>({ foodInventory: {}, bornAt: 'Tue Nov 03 2026', soulmonStages: [{}] });
    expect(n.foodInventory[RESET_POINTS_EMOJI]).toBeUndefined();
    expect(n.grants?.[BETA_RESET_GRANT]).toBe(true);
  });
  it('onboarding não concluído: nada, nem flag', () => {
    const s = { foodInventory: {} };
    expect(applyBetaResetGrant(s)).toBe(s);
  });
  it('sanitizeGrants descarta lixo', () => {
    expect(sanitizeGrants('x')).toBeUndefined();
    expect(sanitizeGrants({ a: 1, b: true })).toEqual({ b: true });
  });
});

describe('§209 Zerador de Pontos', () => {
  it('está no catálogo como kind reset', () => {
    expect(SPECIAL_ITEMS[RESET_POINTS_EMOJI]?.kind).toBe('reset');
  });
  it('usar zera os 3 pontos, consome o item e não mexe em poção nem no log do estágio', () => {
    const prev = {
      healthPoints: 3, maxHealthPoints: 3, foodInventory: { [RESET_POINTS_EMOJI]: 1 }, perfectDays: 0, totalXP: 0,
      powerPoints: 9, harmonyPoints: 4, benevolencePoints: 7,
      attributesSinceLastEvolution: { power: 3, harmony: 1, benevolence: 2 }, evolutionPotion: 'fire',
    };
    const { state } = applySpecialItem(prev, RESET_POINTS_EMOJI, new Date());
    expect([state.powerPoints, state.harmonyPoints, state.benevolencePoints]).toEqual([0, 0, 0]);
    expect(state.foodInventory[RESET_POINTS_EMOJI]).toBeUndefined();
    expect(state.evolutionPotion).toBe('fire');
    expect(state.attributesSinceLastEvolution).toEqual({ power: 3, harmony: 1, benevolence: 2 });
  });
});

describe('§209 reset na evolução', () => {
  it('o galho sai dos pontos de ANTES; depois os pontos zeram', () => {
    const pts = { power: 1, harmony: 2, benevolence: 30 };
    const alvo = evolutionTarget({
      points: pts, reading: undefined as never, currentBranch: 'harmony' as never, evolutionStage: 'rookie',
      unlockedEvolutions: ['rookie'], evolutionPoints: 9999,
    } as never);
    const depois = resetAlignmentPoints({ powerPoints: pts.power, harmonyPoints: pts.harmony, benevolencePoints: pts.benevolence });
    expect(alvo.branch).toBe('benevolence');
    expect(depois).toEqual({ powerPoints: 0, harmonyPoints: 0, benevolencePoints: 0 });
  });
  it('handleEvolve aplica o reset DEPOIS de calcular o alvo, no retorno do commit', () => {
    const app = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    const ini = app.indexOf('const handleEvolve = useCallback(');
    const corpo = app.slice(ini, app.indexOf('playEvolve();', ini));
    expect(corpo.indexOf('evolutionTarget(')).toBeGreaterThan(0);
    expect(corpo.indexOf('powerPoints: 0, harmonyPoints: 0, benevolencePoints: 0')).toBeGreaterThan(corpo.indexOf('evolutionTarget('));
  });
  it('recap tem a linha PT/EN e a cerimônia a usa', () => {
    expect(pointsResetLine('pt-BR')).toBe('Os pontos de Benevolência, Harmonia e Poder recomeçam do zero para a próxima forma.');
    expect(pointsResetLine('en-US')).toBe('Benevolence, Harmony and Power points start again from zero for the next form.');
    const cer = readFileSync(resolve(__dirname, '../components/EvolutionCeremony.tsx'), 'utf8');
    expect(cer).toContain('pointsResetLine(language)');
  });
});
