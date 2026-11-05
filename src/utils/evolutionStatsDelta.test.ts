import { describe, it, expect } from 'vitest';
import { evolutionStatsDelta, formatDelta, EVO_STAT_ORDER } from './evolutionStatsDelta';
import { soulCombatant } from './soulXP';
import { hpPoints } from './combate/fight';

const antes = { evolutionStage: 'rookie', perfectDays: 14, powerPoints: 30, harmonyPoints: 5, benevolencePoints: 5 };
const depois = { evolutionStage: 'champion', perfectDays: 0, powerPoints: 0, harmonyPoints: 0, benevolencePoints: 0 };

describe('evolutionStatsDelta', () => {
  it('as linhas saem do MESMO combatente da luta (sem fórmula paralela)', () => {
    const d = evolutionStatsDelta(antes, depois);
    const a = soulCombatant(antes), b = soulCombatant(depois);
    expect(d.rows.map(r => r.id)).toEqual([...EVO_STAT_ORDER]);
    const by = Object.fromEntries(d.rows.map(r => [r.id, r]));
    expect(by.atk.before).toBe(Math.round(a.atk));
    expect(by.atk.after).toBe(Math.round(b.atk));
    expect(by.def.after).toBe(Math.round(b.def));
    expect(by.spd.after).toBe(Math.round(b.spd));
    expect(by.hp.before).toBe(hpPoints(a.hp));
    expect(by.hp.after).toBe(hpPoints(b.hp));
    for (const r of d.rows) expect(r.delta).toBe(r.after - r.before);
  });
  it('subir de estágio sobe a vida e o nível', () => {
    const d = evolutionStatsDelta(antes, depois);
    expect(d.rows.find(r => r.id === 'hp')!.delta).toBeGreaterThan(0);
    expect(d.levelAfter).toBeGreaterThan(d.levelBefore);
  });
  it('é puro: não muda os saves de entrada', () => {
    const a = { ...antes }, b = { ...depois };
    evolutionStatsDelta(a, b);
    expect(a).toEqual(antes);
    expect(b).toEqual(depois);
  });
  it('antes = depois dá delta 0 em tudo', () => {
    expect(evolutionStatsDelta(antes, antes).rows.every(r => r.delta === 0)).toBe(true);
  });
});

describe('formatDelta', () => {
  it('+N, +0 e −N (menos tipográfico)', () => {
    expect(formatDelta(3)).toBe('+3');
    expect(formatDelta(0)).toBe('+0');
    expect(formatDelta(-2)).toBe('\u22122');
  });
});
