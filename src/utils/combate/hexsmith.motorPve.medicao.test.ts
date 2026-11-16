/**
 * HEXSMITH H2 (16/11/2026) — GATE PvE ±3pp das Coroas novas, pareado (mesma semente e célula), como `efeitosPve.medicao.test.ts`:
 *  · Coroa de EFEITO (`hot`, `slow`, `silence`): vale como o "elemento" `coroa:<efeito>` no canal `efeitoElemento` e produz o MESMO
 *    especial do efeito do elemento já medido; aqui se mede a vitória com e sem ela, em Arena, Masmorra e Pesadelo (±3pp; a lentidão no
 *    Pesadelo tem a faixa que o dono aceitou em §325);
 *  · Coroa de FAMÍLIA nova (`defBuff`, `atkDebuff`, `spdDebuff`): vitória contra a família ESPELHADA dela (`defDebuff`, `atkBuff`, `spdBuff`),
 *    ±3pp por modo. O poder de cada uma em cada modo é `PVE_FAMILY_POWER` (calibrado aqui, nunca chutado).
 */
import { describe, expect, it, vi } from 'vitest';
import { simulateArenaRunV3 } from '../arena';
import { simulateDungeonRunV3, simulateNightmareV3 } from '../dungeonFight';
import { REFERENCE_BUILD_NAMES, REFERENCE_BUILDS, RULER_LEVELS } from './level';
import { comEfeitoDoElemento, efeitoElementoPve, elementoDaCoroa } from './elementEffects';
import { CROWN_ONLY_FAMILIES, EFFECT_FAMILY, specialOfPve, type SpecialEffect, type SpecialFamily } from './specials';

vi.setConfig({ testTimeout: 900_000 });

const N = Number(process.env.EFEITOS_N ?? 1600);
const cell = (s: number) => ({ level: RULER_LEVELS[s % RULER_LEVELS.length], build: REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[(s >> 2) % 4]] });
/** Vitória de cada modo (Arena, Masmorra, Pesadelo), em %. `el` = o que a tela passa em `efeitoElemento`. */
function medir(family: SpecialFamily, el?: string): [number, number, number] {
  let a = 0, m = 0, p = 0;
  for (let s = 0; s < N; s++) {
    a += simulateArenaRunV3({ ...cell(s), family, area: s % 2 ? 'area' : 'single', efeitoElemento: el }, s + 1).won ? 1 : 0;
    m += simulateDungeonRunV3({ ...cell(s), family, efeitoElemento: el }, s + 1).floorsCleared / 5;
    p += simulateNightmareV3({ ...cell(s), family, efeitoElemento: el }, s % 6, s + 1).won ? 1 : 0;
  }
  return [(100 * a) / N, (100 * m) / N, (100 * p) / N];
}
const diff = (x: readonly number[], y: readonly number[]) => x.map((v, i) => v - y[i]);
/** A lentidão no Pesadelo rende +16,4pp sobre o `defDebuff` puro por decisão do dono (§325); faixa travada nos dois sentidos. */
const PESADELO_LENTIDAO_PP = { min: 13, max: 20 };

describe('Coroa de efeito no PvE: o token `coroa:<efeito>` é o efeito do elemento já medido', () => {
  const REF: Record<SpecialEffect, string> = { hot: 'vida', slow: 'ar', silence: 'som' };
  it('mesmo especial que o elemento de referência, em Arena, Masmorra e Pesadelo; prevalece sobre o Amuleto', () => {
    for (const [ef, fam] of Object.entries(EFFECT_FAMILY) as [SpecialEffect, SpecialFamily][]) {
      const tok = elementoDaCoroa(ef);
      const sp = specialOfPve(fam);
      expect(comEfeitoDoElemento(sp, tok)).toEqual(comEfeitoDoElemento(sp, REF[ef]));
      expect(comEfeitoDoElemento(sp, tok, true)).toEqual(comEfeitoDoElemento(sp, REF[ef], true));
      expect(comEfeitoDoElemento(sp, tok, false, true)).toEqual(comEfeitoDoElemento(sp, REF[ef], false, true));
      expect(comEfeitoDoElemento(sp, tok).effect).toBe(ef);
      // Amuleto de outro sabor: a Coroa de efeito vence (`efeitoElementoPve` troca o elemento pelo token)
      const outro = ef === 'silence' ? 'ar' : 'som';
      expect(efeitoElementoPve(fam, outro, { specialEffect: ef })).toBe(tok);
      expect(comEfeitoDoElemento(sp, efeitoElementoPve(fam, outro, { specialEffect: ef }))).toEqual(comEfeitoDoElemento(sp, REF[ef]));
    }
  });
  it('fora da família-base o token não faz nada (o especial é o mesmo objeto)', () => {
    for (const fam of ['direct', 'dot', 'heal', 'atkBuff', 'spdBuff', ...CROWN_ONLY_FAMILIES] as const) {
      const sp = specialOfPve(fam);
      for (const ef of Object.keys(EFFECT_FAMILY) as SpecialEffect[]) expect(comEfeitoDoElemento(sp, elementoDaCoroa(ef))).toBe(sp);
    }
    expect(efeitoElementoPve('direct', 'fogo', {})).toBeUndefined();
    expect(comEfeitoDoElemento(specialOfPve('defDebuff'), 'coroa:lixo')).toEqual(specialOfPve('defDebuff'));
  });
  it('GATE ±3pp: cada Coroa de efeito contra a família-base dela, por modo', () => {
    for (const [ef, fam] of Object.entries(EFFECT_FAMILY) as [SpecialEffect, SpecialFamily][]) {
      const d = diff(medir(fam, elementoDaCoroa(ef)), medir(fam));
      d.forEach((x, i) => {
        if (ef === 'slow' && i === 2) { expect(x).toBeGreaterThanOrEqual(PESADELO_LENTIDAO_PP.min); expect(x).toBeLessThanOrEqual(PESADELO_LENTIDAO_PP.max); }
        else expect(Math.abs(x), `coroa:${ef} modo ${i}`).toBeLessThanOrEqual(3);
      });
    }
  });
});

describe('Coroa de família nova no PvE: ±3pp da família espelhada', () => {
  const ESPELHO: Record<(typeof CROWN_ONLY_FAMILIES)[number], SpecialFamily> = { defBuff: 'defDebuff', atkDebuff: 'atkBuff', spdDebuff: 'spdBuff' };
  it('GATE ±3pp por modo', () => {
    for (const fam of CROWN_ONLY_FAMILIES) {
      const d = diff(medir(fam), medir(ESPELHO[fam]));
      d.forEach((x, i) => expect(Math.abs(x), `${fam} modo ${i}`).toBeLessThanOrEqual(3));
    }
  });
});
