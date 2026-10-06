/**
 * The craft (ofício) on the Combat v3 core (story PR4, AC3): `jeitoParaPve` has ONE owner and maps every field of
 * `JeitoNaMasmorra` to a hook of the adapter; each craft moves the mean time to knock out (TTK) by at most ±25%
 * (contexto §2.3 X4: the craft stays OUTSIDE the ruler). The list of crafts comes from the module itself.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  ATRAVESSA_POR_PONTO, CONTRA_ATAQUE_TETO, JEITO_PADRAO, PROFISSAO_MASMORRA, REDUCAO_DANO_POR_PONTO,
  jeitoDaProfissao, jeitoParaPve, type JeitoNaMasmorra,
} from './profissaoMasmorra';
import { jeitoDefesaBonus } from './autoDefesa';
import { simulateDungeonRunV3 } from './dungeonFight';
import { REFERENCE_BUILD_NAMES, REFERENCE_BUILDS, RULER_LEVELS } from './combate/level';
import { SPECIAL_FAMILIES } from './combate/specials';

vi.setConfig({ testTimeout: 180_000 });

const mean = (a: readonly number[]) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
const cell = (s: number) => ({
  level: RULER_LEVELS[s % RULER_LEVELS.length],
  build: REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[(s >> 2) % 4]],
  family: SPECIAL_FAMILIES[(s >> 4) % 7],
});

describe('jeitoParaPve: the mapping (one owner)', () => {
  it('the default craft is neutral', () => {
    expect(jeitoParaPve(JEITO_PADRAO)).toEqual({
      hp: 1, basico: 1, cast: 1, perfeito: 0.92, defesaBonus: 0, recebido: 1, contra: 0.5, cura: 0.25,
    });
  });
  it('each field lands on its hook', () => {
    const j = (p: Partial<JeitoNaMasmorra>) => jeitoParaPve({ ...JEITO_PADRAO, ...p });
    expect(j({ hp: 1.15 }).hp).toBe(1.15); // player HP × hp
    expect(j({ dmg: 1.1 }).basico).toBeCloseTo(1.1, 9); // basic hit × dmg ...
    expect(j({ dmg: 1.1 }).cast).toBe(1.1); // ... and the cast × dmg
    expect(j({ perfeito: 0.89 }).perfeito).toBe(0.89); // threshold of the auto-defence
    expect(j({ velocidadeDefesa: 0.9, tempoDefesaExtra: 0.5 }).defesaBonus).toBeCloseTo(jeitoDefesaBonus({ velocidadeDefesa: 0.9, tempoDefesaExtra: 0.5 }), 12);
    expect(j({ velocidadeAtaque: 0.9 }).basico).toBeCloseTo(1 / 0.9, 9); // basic hit × 1/v
    expect(j({ reducaoDano: 1 }).recebido).toBeCloseTo(1 - REDUCAO_DANO_POR_PONTO, 9); // received × (1 − 0.1·r)
    expect(j({ atravessaGuarda: 0.5 }).basico).toBeCloseTo(1 + ATRAVESSA_POR_PONTO * 0.5, 9); // basic hit × (1 + 0.1·a)
    expect(j({ curaAndar: 0.35 }).cura).toBe(0.35); // heal between floors
  });
  it('the counter-attack is +0.5·c on the next basic after a perfect block, capped at +0.6', () => {
    expect(CONTRA_ATAQUE_TETO).toBe(0.6);
    expect(jeitoParaPve({ ...JEITO_PADRAO, contraAtaque: 1 }).contra).toBe(0.5);
    expect(jeitoParaPve({ ...JEITO_PADRAO, contraAtaque: 2 }).contra).toBe(0.6); // alchemist: 1.0 would be 2× — capped
    expect(jeitoParaPve({ ...JEITO_PADRAO, contraAtaque: 10 }).contra).toBe(0.6);
    expect(jeitoParaPve({ ...JEITO_PADRAO, contraAtaque: 10 }, { contraTeto: Infinity }).contra).toBe(5);
  });
});

describe('AC3. each craft moves the mean TTK by at most ±25% (outside the ruler)', () => {
  const N = 800;
  const run = (jeito?: JeitoNaMasmorra, knobs?: { contraTeto?: number }) => {
    const t: number[] = [];
    for (let s = 0; s < N; s++) t.push(...simulateDungeonRunV3({ ...cell(s), jeito, knobs }, s, 'media', 3).timesByFloor.flat());
    return mean(t);
  };
  const base = run();
  it('every craft of PROFISSAO_MASMORRA', () => {
    const out: string[] = [];
    for (const k of Object.keys(PROFISSAO_MASMORRA)) {
      const r = run(jeitoDaProfissao(k)) / base - 1;
      out.push(`${k} ${(100 * r).toFixed(1)}%`);
      expect(Math.abs(r), k).toBeLessThanOrEqual(0.25);
    }
    console.log(`[AC3] TTK vs default: ${out.join(' · ')}`);
    expect(Object.keys(PROFISSAO_MASMORRA).length).toBeGreaterThanOrEqual(11);
  });
  it('RED: without the +0.6 cap a counter-attack of 10 moves the TTK many times more than with it', () => {
    // declared: in the measured model even the raw 10 stays inside ±25% (a perfect block is ~6% of the foe hits),
    // so the RED compares the two instead of crossing the band — the cap is what keeps the craft light.
    const raw = Math.abs(run({ ...JEITO_PADRAO, contraAtaque: 10 }, { contraTeto: Infinity }) / base - 1);
    const capped = Math.abs(run({ ...JEITO_PADRAO, contraAtaque: 10 }) / base - 1);
    console.log(`[AC3 RED] contraAtaque 10: sem teto ${(100 * raw).toFixed(1)}% · com teto ${(100 * capped).toFixed(1)}%`);
    expect(raw).toBeGreaterThan(capped * 5);
  });
  it('RED: a fantasy craft (damage × 3) breaks the band', () => {
    expect(Math.abs(run({ ...JEITO_PADRAO, dmg: 3 }) / base - 1)).toBeGreaterThan(0.25);
  });
});
