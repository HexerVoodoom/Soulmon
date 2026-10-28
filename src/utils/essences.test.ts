import { describe, it, expect } from 'vitest';
import { applyEssences, applyEssencesAway, essenceDropOfFoe, essenceName, essenceQtyOfBoss, essenceQtyOfStage, sanitizeEssences, ESSENCE_AWAY_DAILY_CAP } from './essences';
import { applyEnemyDefeated } from './dungeonRewards';
import { ENEMY_ROSTER } from './enemyRoster';
import { ALL_ELEMENT_IDS } from './elementDex';

describe('essências dos elementos', () => {
  it('quantidade por estágio: rookie 1, champion 2, ultimate/mega 3', () => {
    expect(['rookie', 'champion', 'ultimate', 'mega'].map(essenceQtyOfStage)).toEqual([1, 2, 3, 3]);
    expect(essenceQtyOfStage(undefined)).toBe(1);
  });
  it('chefe da Feira: 5 a 9 conforme o nível', () => {
    expect(essenceQtyOfBoss(1)).toBe(5);
    expect(essenceQtyOfBoss(20)).toBe(9);
  });
  it('drop do próprio elemento; desconhecido = nada', () => {
    expect(essenceDropOfFoe(['fogo'], 'champion')).toEqual({ id: 'fogo', qty: 2 });
    const comp = ENEMY_ROSTER.find(e => e.kind === 'combinado')!;
    expect(essenceDropOfFoe(comp.elements, comp.stage)?.id).not.toBe(comp.elements[0]);
    expect(essenceDropOfFoe(['xyz'], 'rookie')).toBeUndefined();
  });
  it('applyEssences soma, ignora lixo e devolve o mesmo objeto quando nada entra', () => {
    const a = applyEssences<{ essences?: Record<string, number> }>({}, [{ id: 'fogo', qty: 2 }, { id: 'fogo', qty: 1 }, { id: 'pesadelo', qty: 1 }, { id: 'Nada!', qty: 5 }, undefined]);
    expect(a.essences).toEqual({ fogo: 3, pesadelo: 1 });
    const s = { essences: { fogo: 1 } };
    expect(applyEssences(s, [{ id: 'Nada!', qty: 1 }])).toBe(s);
  });
  it('descida automática respeita o teto diário e reinicia no dia seguinte; luta ativa não tem teto', () => {
    let s: { essences?: Record<string, number>; essenceAway?: { day: string; count: number } } = {};
    for (let i = 0; i < 40; i++) s = applyEssencesAway(s, { id: 'fogo', qty: 3 }, '2026-10-28');
    expect(s.essences!.fogo).toBe(ESSENCE_AWAY_DAILY_CAP);
    s = applyEssencesAway(s, { id: 'fogo', qty: 3 }, '2026-10-29');
    expect(s.essences!.fogo).toBe(ESSENCE_AWAY_DAILY_CAP + 3);
    let ativo: { essences?: Record<string, number> } = {};
    for (let i = 0; i < 40; i++) ativo = applyEssences(ativo, [{ id: 'fogo', qty: 3 }]);
    expect(ativo.essences!.fogo).toBe(120);
  });
  it('applyEnemyDefeated dropa a essência do inimigo (ativo) e respeita o teto (away)', () => {
    const e = ENEMY_ROSTER.find(x => x.stage === 'ultimate' && x.kind === 'base')!;
    const base = { dungeonKills: 0 } as Parameters<typeof applyEnemyDefeated>[0];
    const ativo = applyEnemyDefeated(base, e.key);
    expect(Object.values(ativo.essences ?? {})).toEqual([3]);
    let away = base;
    for (let i = 0; i < 20; i++) away = applyEnemyDefeated(away, e.key, { dayKey: '2026-10-28' });
    expect(Object.values(away.essences ?? {})[0]).toBe(ESSENCE_AWAY_DAILY_CAP);
  });
  it('sanitizeEssences é tolerante', () => {
    expect(sanitizeEssences(null)).toEqual({});
    expect(sanitizeEssences({ fogo: 2.9, X: 3, a: 1, lava: -1, agua: 'x', ok_id: 5e9 })).toEqual({ fogo: 2, ok_id: 1_000_000 });
  });
  it('nome EN/PT', () => {
    expect(essenceName('fogo', false)).toBe('Fire Essence');
    expect(essenceName('fogo', true)).toBe('Essência de Fogo');
    expect(essenceName('pesadelo', true)).toBe('Essência de Pesadelo');
  });
  it('essência de chefe da Feira (elemento fora do dex) é aceita pela forma', () => {
    expect(applyEssences<{ essences?: Record<string, number> }>({}, [{ id: 'juizo_final', qty: 9 }]).essences).toEqual({ juizo_final: 9 });
    expect(ALL_ELEMENT_IDS).not.toContain('juizo_final');
  });
});
