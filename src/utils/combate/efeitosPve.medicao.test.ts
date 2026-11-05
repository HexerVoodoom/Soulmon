/**
 * §228: GATE da regra nova em PvE. Pareado: mesma semente e célula, com e sem o efeito do elemento.
 * Critério: vitória dentro de ±3pp em Arena, Masmorra e Pesadelo. Só efeito que passa entra em `EFEITOS_PVE_LIGADOS`.
 */
import { describe, expect, it, vi } from 'vitest';
import { simulateArenaRunV3 } from '../arena';
import { simulateDungeonRunV3, simulateNightmareV3 } from '../dungeonFight';
import { REFERENCE_BUILD_NAMES, REFERENCE_BUILDS, RULER_LEVELS, combatantAt } from './level';
import { EFEITOS_PVE_LIGADOS, comEfeitoDoElemento, efeitoDoEspecial } from './elementEffects';
import { groupFightSteps } from './group';
import { EFFECT_TUNE, EFFECT_TUNE_PESADELO, specialOf, type SpecialFamily } from './specials';

vi.setConfig({ testTimeout: 600_000 });

const N = Number(process.env.EFEITOS_N ?? 1600);
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
const cell = (s: number) => ({ level: RULER_LEVELS[s % RULER_LEVELS.length], build: REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[(s >> 2) % 4]] });

function medir(family: SpecialFamily, el?: string) {
  const a: number[] = []; const m: number[] = []; const p: number[] = [];
  for (let s = 0; s < N; s++) {
    a.push(simulateArenaRunV3({ ...cell(s), family, area: s % 2 ? 'area' : 'single', efeitoElemento: el }, s + 1).won ? 1 : 0);
    m.push(simulateDungeonRunV3({ ...cell(s), family, efeitoElemento: el }, s + 1).floorsCleared / 5);
    p.push(simulateNightmareV3({ ...cell(s), family, efeitoElemento: el }, s % 6, s + 1).won ? 1 : 0);
  }
  return [mean(a), mean(m), mean(p)];
}
function deltas(family: SpecialFamily, el: string) {
  const b = medir(family); const c = medir(family, el);
  return c.map((x, i) => (x - b[i]) * 100);
}
const fmt = (d: number[]) => `arena ${d[0].toFixed(1)} masmorra ${d[1].toFixed(1)} pesadelo ${d[2].toFixed(1)}`;

const GRADE = process.env.EFEITOS_GRADE === '1';

describe('§228: efeitos em PvE', () => {
  it('sem par no elemento, o especial é o mesmo objeto', () => {
    const sp = specialOf('direct');
    expect(comEfeitoDoElemento(sp, 'fogo')).toBe(sp);
    const dot = specialOf('dot');
    expect(comEfeitoDoElemento(dot, 'fogo')).toBe(dot); // queimadura e veneno são só visuais
  });

  it('silêncio segura o especial do alvo, qualquer família', () => {
    const c = combatantAt(20, REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[0]]);
    const som = { combatant: c, special: comEfeitoDoElemento(specialOf('defDebuff'), 'som') };
    for (const fam of ['direct', 'heal', 'shield', 'dot'] as const) {
      const g = groupFightSteps(som, [{ combatant: c, special: specialOf(fam) }], { seed: 7, hpScale: 6, withFx: true, startEnergy: 99 });
      let r = g.next(); let ativo = false; let golpes = 0; let silencios = 0;
      while (!r.done) {
        const e = r.value;
        if (e.kind === 'cast' && e.who === 1 && ativo) { expect(golpes).toBeGreaterThanOrEqual(EFFECT_TUNE.silenceHits); ativo = false; }
        if (e.kind === 'attack' && e.who === 1 && ativo) golpes++;
        r = g.next(undefined);
        if (e.kind === 'cast' && e.who === 0 && (e.fx?.[1]?.nSil ?? 0) > 0) { ativo = true; golpes = 0; silencios++; }
      }
      expect(silencios).toBeGreaterThan(0);
    }
  });

  it('GATE ±3pp: silêncio, cura contínua e lentidão, por modo', () => {
    const casos = [['silencio', 'defDebuff', 'som'], ['curaContinua', 'shield', 'vida'], ['lentidao', 'defDebuff', 'ar']] as const;
    for (const [nome, fam, el] of casos) {
      expect(EFEITOS_PVE_LIGADOS).toContain(nome);
      const d = deltas(fam, el);
      console.log(`[gate] ${nome} | ${fmt(d)}`);
      for (const x of d) expect(Math.abs(x)).toBeLessThanOrEqual(3);
    }
  });

  // §236: os 11 elementos reusam as 3 mecânicas com o mesmo botão, então a régua de cima vale para eles.
  const ONZE = [
    ['gravidade', 'defDebuff', 'slow'], ['tempo', 'defDebuff', 'slow'], ['industrial', 'defDebuff', 'slow'], ['espaco', 'defDebuff', 'slow'],
    ['luz', 'defDebuff', 'silence'], ['eletricidade', 'defDebuff', 'silence'], ['marcial', 'defDebuff', 'silence'], ['arcano', 'defDebuff', 'silence'],
    ['planta', 'shield', 'hot'], ['fada', 'shield', 'hot'], ['vigor', 'shield', 'hot'],
  ] as const;

  it('§236: cada um dos 11 liga a mecânica real, com o mesmo especial do elemento já medido', () => {
    const ref = { slow: 'ar', silence: 'som', hot: 'vida' } as const;
    for (const [el, fam, effect] of ONZE) {
      const sp = comEfeitoDoElemento(specialOf(fam), el);
      expect(sp.effect, el).toBe(effect);
      expect(sp).toEqual(comEfeitoDoElemento(specialOf(fam), ref[effect]));
      expect(comEfeitoDoElemento(specialOf(fam), el, true)).toEqual(comEfeitoDoElemento(specialOf(fam), ref[effect], true));
      expect(EFEITOS_PVE_LIGADOS).toContain(efeitoDoEspecial(fam, el));
    }
  });

  it('§236: buff da própria família continua sendo o especial da família (delta 0 por construção)', () => {
    for (const [el, fam] of [['gravidade', 'shield'], ['industrial', 'shield'], ['vigor', 'atkBuff'], ['marcial', 'atkBuff'], ['tempo', 'spdBuff'], ['eletricidade', 'spdBuff']] as const) {
      const sp = specialOf(fam);
      expect(efeitoDoEspecial(fam, el), el).not.toBeNull();
      expect(comEfeitoDoElemento(sp, el), el).toBe(sp);
    }
  });

  it.skipIf(process.env.EFEITOS_ELEMENTOS !== '1')('GATE ±3pp elemento a elemento (só com EFEITOS_ELEMENTOS=1)', () => {
    const base = new Map<string, number[]>();
    for (const [el, fam] of ONZE) {
      if (!base.has(fam)) base.set(fam, medir(fam));
      const d = medir(fam, el).map((x, i) => (x - base.get(fam)![i]) * 100);
      console.log('[gate11] ' + el + ' | ' + fmt(d));
      for (const x of d) expect(Math.abs(x)).toBeLessThanOrEqual(3);
    }
  });

  it('RED: o gate reprova o que saiu da régua (silêncio X = 6)', () => {
    const t0 = EFFECT_TUNE.silenceHits;
    EFFECT_TUNE.silenceHits = 6;
    const d = deltas('defDebuff', 'som');
    EFFECT_TUNE.silenceHits = t0;
    console.log(`[gate] vermelho X=6 | ${fmt(d)}`);
    expect(Math.max(...d.map(Math.abs))).toBeGreaterThan(3);
  });

  it.skipIf(!GRADE)('grade de calibração (só com EFEITOS_GRADE=1)', () => {
    const t0 = { ...EFFECT_TUNE };
    const p0 = { ...EFFECT_TUNE_PESADELO };
    for (const sc of [0.15, 0.2, 0.25, 0.3]) for (const k of [0.55, 0.6, 0.65, 0.7]) {
      Object.assign(EFFECT_TUNE, { slowScale: sc, slowKeep: k });
      console.log(`[grade] AM scale=${sc} keep=${k} | ${fmt(deltas('defDebuff', 'ar'))}`);
    }
    for (const sc of [0.02, 0.05, 0.1, 0.15]) for (const k of [0.35, 0.4, 0.45, 0.5]) {
      Object.assign(EFFECT_TUNE_PESADELO, { slowScale: sc, slowKeep: k });
      console.log(`[grade] P scale=${sc} keep=${k} | ${fmt(deltas('defDebuff', 'ar'))}`);
    }
    Object.assign(EFFECT_TUNE_PESADELO, p0);
    Object.assign(EFFECT_TUNE, t0);
  });
});
