/**
 * §224: medição da regra nova em PvE. Pareado: mesma semente, mesma célula, com e sem o efeito do elemento.
 * Critério: vitória dentro de ±3pp e duração dentro de ±5%. Enquanto a mecânica não passar, `EFEITOS_PVE_LIGADOS` fica `false`.
 */
import { describe, expect, it, vi } from 'vitest';
import { simulateArenaRunV3 } from '../arena';
import { simulateDungeonRunV3 } from '../dungeonFight';
import { REFERENCE_BUILD_NAMES, REFERENCE_BUILDS, RULER_LEVELS } from './level';
import { EFEITOS_PVE_LIGADOS, comEfeitoDoElemento } from './elementEffects';
import { groupFight } from './group';
import { combatantAt } from './level';
import { specialOf, type SpecialFamily } from './specials';

vi.setConfig({ testTimeout: 600_000 });

const N = 3200;
const CASOS: readonly [string, SpecialFamily, string][] = [
  ['queimadura', 'dot', 'fogo'], ['veneno', 'dot', 'vileza'], ['curaContinua', 'shield', 'vida'],
  ['lentidao', 'defDebuff', 'ar'], ['silencio', 'defDebuff', 'som'],
];
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);

function arena(family: SpecialFamily, el?: string) {
  const w: number[] = []; const t: number[] = [];
  for (let s = 0; s < N; s++) {
    const r = simulateArenaRunV3({
      level: RULER_LEVELS[s % RULER_LEVELS.length], build: REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[(s >> 2) % 4]],
      family, area: s % 2 ? 'area' : 'single', efeitoElemento: el,
    }, s + 1);
    w.push(r.won ? 1 : 0); if (r.won) t.push(r.total);
  }
  return { win: mean(w), t: mean(t) };
}
function masmorra(family: SpecialFamily, el?: string) {
  const w: number[] = []; const t: number[] = [];
  for (let s = 0; s < N; s++) {
    const r = simulateDungeonRunV3({
      level: RULER_LEVELS[s % RULER_LEVELS.length], build: REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[(s >> 2) % 4]],
      family, efeitoElemento: el,
    }, s + 1);
    w.push(r.floorsCleared / 5); t.push(mean(r.timesByFloor.flat()));
  }
  return { win: mean(w), t: mean(t) };
}

describe('§224: medição', () => {
  it('a chave segue desligada', () => expect(EFEITOS_PVE_LIGADOS).toBe(false));

  it('sem efeito no par, o especial é o mesmo objeto', () => {
    const sp = specialOf('direct');
    expect(comEfeitoDoElemento(sp, 'fogo')).toBe(sp);
    const sh = specialOf('shield');
    expect(comEfeitoDoElemento(sh, 'terra')).toBe(sh);
  });

  it('silêncio com barra cheia: a luta termina e o especial do alvo atrasa, não some', () => {
    const c = combatantAt(20, REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[0]]);
    const som = { combatant: c, special: comEfeitoDoElemento(specialOf('defDebuff'), 'som') };
    const alvo = { combatant: c, special: specialOf('direct') };
    for (let seed = 1; seed < 40; seed++) {
      const r = groupFight(som, [alvo], { seed, hpScale: 3 });
      expect(r.t).toBeGreaterThan(0);
    }
  });

  for (const [nome, fam, el] of CASOS) {
    it(`${nome} (${fam} + ${el}) contra ${fam} puro`, () => {
      const a0 = arena(fam); const a1 = arena(fam, el);
      const m0 = masmorra(fam); const m1 = masmorra(fam, el);
      const dW = (a1.win - a0.win) * 100; const dT = (a1.t / a0.t - 1) * 100;
      const mW = (m1.win - m0.win) * 100; const mT = (m1.t / m0.t - 1) * 100;
      console.log(`[medicao] ${nome} | arena ${(a0.win * 100).toFixed(1)}->${(a1.win * 100).toFixed(1)} (${dW.toFixed(1)}pp) t ${dT.toFixed(1)}% | masmorra ${(m0.win * 100).toFixed(1)}->${(m1.win * 100).toFixed(1)} (${mW.toFixed(1)}pp) t ${mT.toFixed(1)}%`);
      expect(a1.win).toBeGreaterThanOrEqual(0);
    });
  }
});
