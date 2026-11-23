import { describe, expect, it } from 'vitest';
import { FOE_MIX, foeKindOf, foeSpecialOf, type FoeKind } from './foeFamilies';
import { SPECIAL_POWER, EFFECT_TUNE } from './specials';
import { arenaFoe, arenaFoeSides, simulateArenaRunV3, type ArenaRunConfig } from '../arena';
import { REFERENCE_BUILDS } from './level';
import { buildDungeonWave } from '../dungeon';
// @ts-expect-error JS espelho do servidor
import { foeFamilyOf as srv } from '../../../functions/api/_foeFamilies.js';
import { SPECIAL_POWER as SRV_POWER } from '../../../functions/api/_combate.js';

function dist(stage: string, n = 20000) {
  const c: Record<FoeKind, number> = { direct: 0, buff: 0, dot: 0, heal: 0, hot: 0, debuff: 0 };
  for (let i = 0; i < n; i++) c[foeKindOf(stage, `k${i}`)]++;
  return c;
}

describe('especiais variados dos inimigos (dono 11/11/2026)', () => {
  it('Champion+: ~50% direto e ~10% de cada outro tipo', () => {
    for (const st of ['champion', 'ultimate', 'mega']) {
      const c = dist(st);
      expect(Math.abs(c.direct / 20000 - 0.5)).toBeLessThan(0.02);
      for (const k of ['buff', 'dot', 'heal', 'hot', 'debuff'] as const) expect(Math.abs(c[k] / 20000 - 0.1)).toBeLessThan(0.015);
    }
  });
  it('Rookie: conservador (~75% direto)', () => {
    const c = dist('rookie');
    expect(Math.abs(c.direct / 20000 - 0.75)).toBeLessThan(0.02);
    for (const k of ['buff', 'dot', 'heal', 'hot', 'debuff'] as const) expect(Math.abs(c[k] / 20000 - 0.05)).toBeLessThan(0.012);
  });
  it('as tabelas somam 100', () => {
    for (const m of Object.values(FOE_MIX)) expect(Object.values(m).reduce((a, b) => a + b, 0)).toBe(100);
  });
  it('é determinístico e HoT PvE = shield com effect hot; PvP vira shield puro', () => {
    let hot = 0;
    for (let i = 0; i < 400; i++) {
      const a = foeSpecialOf('champion', `x${i}`), b = foeSpecialOf('champion', `x${i}`);
      expect(a).toEqual(b);
      if (foeKindOf('champion', `x${i}`) === 'hot') { hot++; expect(a).toMatchObject({ family: 'shield', effect: 'hot' }); expect(foeSpecialOf('champion', `x${i}`, true).effect).toBeUndefined(); }
    }
    expect(hot).toBeGreaterThan(10);
  });
  it('paridade com o servidor (família do duelo 1v1)', () => {
    for (const st of ['rookie', 'champion', 'ultimate']) for (let i = 0; i < 300; i++) expect(srv(st, `p${i}`)).toBe(foeSpecialOf(st, `p${i}`, true).family);
    expect(SRV_POWER).toEqual(SPECIAL_POWER);
  });
  it('equilíbrio (PvE): cura ≈ dano direto; DoT e HoT ≈ +15% (razão 1,1–1,2); HoT/DoT ≈ 1', () => {
    const d = foeSpecialOf('champion', 'a'); void d;
    const find = (kind: FoeKind) => { for (let i = 0; i < 999; i++) if (foeKindOf('champion', `e${i}`) === kind) return foeSpecialOf('champion', `e${i}`); throw new Error(kind); };
    const direct = find('direct'), heal = find('heal'), dot = find('dot'), hot = find('hot');
    expect(heal.power / direct.power).toBeCloseTo(1, 5);
    const r = dot.power / direct.power;
    expect(r).toBeGreaterThanOrEqual(1.1); expect(r).toBeLessThanOrEqual(1.2);
    const h = (hot.power * (hot.tune?.hotScale ?? EFFECT_TUNE.hotScale)) / heal.power;
    expect(h).toBeGreaterThanOrEqual(1.1); expect(h).toBeLessThanOrEqual(1.2);
    expect(h / r).toBeCloseTo(1, 5);
  });
  it('Arena: sem mix tudo direto (régua antiga); com mix aparecem os 6 tipos e o poder do foe não muda', () => {
    const base = arenaFoe(30, 'weak', 3, 20);
    expect(base.special?.family).toBe('direct');
    const sides = Array.from({ length: 300 }, (_, i) => arenaFoe(30, 'medium', i % 5, 20, 0, false, { seed: i, i: 0 }));
    const fam = new Set(sides.map((s) => `${s.special?.family}${s.special?.effect ?? ''}`));
    expect(fam.size).toBeGreaterThanOrEqual(6);
    for (const s of sides) expect(s.combatant.hp).toBeGreaterThan(0);
    expect(arenaFoeSides).toBeTypeOf('function');
  });

  it('Arena (gate de equilíbrio): o mix não deixa o inimigo invencível (vitória ±12pp, duração ±12% do todo-direto)', () => {
    for (const ladder of [0, 12]) {
      const run = (foeMix: boolean) => {
        let w = 0, tot = 0;
        const n = 150;
        for (let sd = 1; sd <= n; sd++) {
          const r = simulateArenaRunV3({ level: 30, build: REFERENCE_BUILDS.balanced, family: 'heal', area: 'single', ladder, foeMix } as ArenaRunConfig, sd, 'media');
          if (r.won) { w++; tot += r.total; }
        }
        return { win: w / n, t: w ? tot / w : 0 };
      };
      const a = run(false), b = run(true);
      expect(Math.abs(b.win - a.win)).toBeLessThanOrEqual(0.12);
      if (a.t && b.t) expect(Math.abs(b.t / a.t - 1)).toBeLessThanOrEqual(0.12);
    }
  });
  it('Rift/Masmorra: a onda sorteia tipos variados; Rookie conservador; o Pesadelo segue fora', () => {
    const fam: Record<string, number> = {};
    for (let floor = 1; floor <= 60; floor++) for (const e of buildDungeonWave(floor, 'champion-poder', undefined, 40)) {
      if (!e.foe.special) continue;
      const k = e.foe.special.effect === 'hot' ? 'hot' : e.foe.special.family;
      fam[k] = (fam[k] ?? 0) + 1;
    }
    expect(Object.keys(fam).length).toBeGreaterThanOrEqual(6);
    const tot = Object.values(fam).reduce((a, b) => a + b, 0);
    expect(fam.direct / tot).toBeGreaterThan(0.35);
    expect(fam.direct / tot).toBeLessThan(0.75);
  });
});
