import { describe, it, expect } from 'vitest';
import {
  ALL_ELEMENT_IDS, BASE_ELEMENT_IDS, DERIVED_ELEMENT_IDS, applyElementsDefeated, elementIdOfFoe, sanitizeDefeatedElements, elementComponents,
} from './elementDex';
import { elementMatchups } from './elementDexMatchups';
import { applyEnemyDefeated } from './dungeonRewards';
import { ENEMY_ROSTER } from './enemyRoster';

describe('catálogo do dex', () => {
  it('20 base + 190 derivados, sem repetir', () => {
    expect(BASE_ELEMENT_IDS).toHaveLength(20);
    expect(DERIVED_ELEMENT_IDS).toHaveLength(190);
    expect(new Set(ALL_ELEMENT_IDS).size).toBe(210);
  });
});

describe('elementIdOfFoe', () => {
  it('base → ele mesmo; composto → só o derivado, em qualquer ordem', () => {
    expect(elementIdOfFoe(['fogo'])).toBe('fogo');
    expect(elementIdOfFoe(['fogo', 'agua'])).toBe('vapor');
    expect(elementIdOfFoe(['agua', 'fogo'])).toBe('vapor');
    expect(elementIdOfFoe(['fogo', 'fogo'])).toBe('fogo');
  });
  it('desconhecido ou vazio → undefined', () => {
    expect(elementIdOfFoe(undefined)).toBeUndefined();
    expect(elementIdOfFoe([])).toBeUndefined();
    expect(elementIdOfFoe(['xyz'])).toBeUndefined();
  });
});

describe('applyElementsDefeated', () => {
  it('começa vazio, vitória adiciona, idempotente (mesmo objeto)', () => {
    const s0: { defeatedElements?: string[] } = {};
    const s1 = applyElementsDefeated(s0, ['fogo']);
    expect(s1.defeatedElements).toEqual(['fogo']);
    expect(applyElementsDefeated(s1, ['fogo'])).toBe(s1);
    expect(applyElementsDefeated(s1, ['fogo', 'lava']).defeatedElements).toEqual(['fogo', 'lava']);
  });
  it('ignora id fora do catálogo', () => {
    const s0: { defeatedElements?: string[] } = {};
    expect(applyElementsDefeated(s0, ['xyz', undefined])).toBe(s0);
  });
});

describe('sanitizeDefeatedElements', () => {
  it('lixo vira lista vazia; limpa duplicados e formas inválidas', () => {
    expect(sanitizeDefeatedElements(undefined)).toEqual([]);
    expect(sanitizeDefeatedElements('fogo')).toEqual([]);
    expect(sanitizeDefeatedElements(['fogo', 'fogo', 3, 'A B'])).toEqual(['fogo']);
  });
});

describe('vitória na masmorra libera o elemento (applyEnemyDefeated)', () => {
  it('base libera a base; composto libera só o composto', () => {
    const base = ENEMY_ROSTER.find(e => e.kind === 'base')!;
    const cmb = ENEMY_ROSTER.find(e => e.kind === 'combinado')!;
    const a = applyEnemyDefeated({ dungeonKills: 0, bestiary: [], defeatedElements: undefined }, base.key);
    expect(a.defeatedElements).toEqual([base.element]);
    const b = applyEnemyDefeated({ dungeonKills: 0, bestiary: [], defeatedElements: undefined }, cmb.key);
    expect(b.defeatedElements).toHaveLength(1);
    expect(elementComponents(b.defeatedElements![0])).toEqual(expect.arrayContaining([...cmb.elements]));
    expect(b.defeatedElements).not.toContain(cmb.elements[0]);
    expect(applyEnemyDefeated(a, base.key).defeatedElements).toEqual([base.element]);
  });
  it('sem chave de roster não libera nada', () => {
    expect(applyEnemyDefeated<{ dungeonKills: number; bestiary: string[]; defeatedElements?: string[] }>({ dungeonKills: 0, bestiary: [] }, undefined).defeatedElements).toBeUndefined();
  });
});

describe('elementMatchups', () => {
  it('base: 2 fortes e 2 fracos (anel simétrico)', () => {
    const m = elementMatchups('fogo');
    expect(m.strong).toEqual(['planta', 'vida']);
    expect(m.weak).toHaveLength(2);
  });
  it('derivado usa a base dominante', () => {
    expect(elementMatchups('vapor')).toEqual(elementMatchups('fogo'));
  });
});
