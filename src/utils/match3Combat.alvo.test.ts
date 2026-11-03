import { describe, expect, it } from 'vitest';
import { applyPlayerSteps, mirarInimigo, newCombat, newPvpCombat, type M3Combat } from './match3Combat';
import { mulberry32 } from './combate/rng';
import type { Step } from './match3';

const passo = (kinds: number[]): Step => ({ cleared: [], kinds, triggered: [], created: [], chain: 1, gained: 0, after: [] });
const novo = (): M3Combat => { const c = newCombat(mulberry32(1), ['a', 'b', 'c', 'd'], 'a'); return { ...c, enemies: c.enemies.map(e => ({ ...e, element: 'neutro' })) }; };

describe('Match-3: alvo por toque', () => {
  it('sem escolha, o dano cai no ativo (igual a antes)', () => {
    const c = applyPlayerSteps(novo(), [passo([0, 0, 0])]);
    expect(c.log[0].target).toBe(0);
    expect(c.enemies[0].hp).toBeLessThan(c.enemies[0].max);
  });
  it('tocar o 3º manda o próximo golpe nele; o ativo (quem responde) segue o 1º de pé', () => {
    const c0 = mirarInimigo(novo(), 2);
    expect(c0.target).toBe(2);
    const c = applyPlayerSteps(c0, [passo([0, 0, 0])]);
    expect(c.log[0].target).toBe(2);
    expect(c.enemies[2].hp).toBeLessThan(c.enemies[2].max);
    expect(c.enemies[0].hp).toBe(c.enemies[0].max);
    expect(c.active).toBe(0);
  });
  it('combinação de 4+ e peça especial disparada (o "especial" do Match-3) também caem no escolhido', () => {
    const c0 = mirarInimigo(novo(), 1);
    const especial: Step = { ...passo([0, 0, 0, 0, 0, 0, 0]), triggered: [{ r: 0, c: 0 }] as unknown as Step['triggered'] };
    const c = applyPlayerSteps(c0, [passo([1, 1, 1, 1]), especial]);
    expect(c.log.every(l => l.target === 1)).toBe(true);
    expect(c.enemies[1].hp).toBeLessThan(c.enemies[1].max);
    expect(c.enemies[0].hp).toBe(c.enemies[0].max);
    expect(c.enemies[2].hp).toBe(c.enemies[2].max);
  });
  it('escolhido caído: volta ao 1º de pé; todos caídos = vitória', () => {
    const base = novo();
    const c0: M3Combat = { ...base, target: 2, enemies: base.enemies.map((e, i) => ({ ...e, hp: i === 2 ? 1 : e.hp })) };
    const c1 = applyPlayerSteps(c0, [passo([0, 0, 0]), passo([1, 1, 1])]);
    expect(c1.enemies[2].hp).toBe(0);
    expect(c1.log[1].target).toBe(0);
    const fim = applyPlayerSteps({ ...base, enemies: base.enemies.map((e, i) => ({ ...e, hp: i === 1 ? 1 : 0 })), active: 1, target: 1 }, [passo([0, 0, 0])]);
    expect(fim.outcome).toBe('win');
  });
  it('toque em caído, fora do índice ou no PVP 1×1 não muda nada', () => {
    const base = novo();
    const caido: M3Combat = { ...base, enemies: base.enemies.map((e, i) => ({ ...e, hp: i === 1 ? 0 : e.hp })) };
    expect(mirarInimigo(caido, 1)).toBe(caido);
    expect(mirarInimigo(base, 7)).toBe(base);
    const pvp = newPvpCombat(mulberry32(2), ['fogo', 'agua', 'terra', 'ar', 'luz', 'trevas']);
    expect(mirarInimigo(pvp, 0)).toBe(pvp);
  });
});
