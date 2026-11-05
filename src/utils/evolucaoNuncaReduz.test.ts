import { describe, it, expect } from 'vitest';
import { soulCombatant, nextStatFloor, type SoulXPState } from './soulXP';
import { evolutionStatsDelta, formatDelta } from './evolutionStatsDelta';
import { combatantAt, firstLevelOfStage, sanitizeStatFloor, statMaxOfStage, STAGE_LEVEL_CAPS } from './combate/level';
import { hpPoints } from './combate/fight';

const STAGES = ['rookie', 'champion', 'ultimate', 'mega', 'ultra'];
const WEIGHTS = (() => { const w: { p: number; h: number; b: number }[] = []; for (let a = 0; a <= 10; a++) for (let d = 0; d <= 10 - a; d++) w.push({ p: a, h: d, b: 10 - a - d }); return w; })();
/** perfectDays que dá o level `L` dentro do estágio `s` (1 dia = 1 level). */
const diasPara = (s: number, L: number) => L - firstLevelOfStage(s);

describe('REGISTRO §229 — evoluir nunca reduz (a regra, do jeito que o handleEvolve a aplica)', () => {
  it('nenhum atributo (Vida, Ataque, Defesa, Velocidade) cai, em todo estágio, todo level e toda distribuição', () => {
    let casos = 0;
    for (let s = 0; s < 4; s++) {
      for (let L = firstLevelOfStage(s); L <= STAGE_LEVEL_CAPS[s]; L++) {
        for (const w of WEIGHTS) {
          const antes: SoulXPState = { evolutionStage: STAGES[s], perfectDays: diasPara(s, L), powerPoints: w.p, harmonyPoints: w.h, benevolencePoints: w.b };
          const depois: SoulXPState = { evolutionStage: STAGES[s + 1], perfectDays: 0, powerPoints: 0, harmonyPoints: 0, benevolencePoints: 0, evoStatFloor: nextStatFloor(antes, STAGES[s + 1]) };
          const a = soulCombatant(antes), b = soulCombatant(depois);
          expect(b.atk, `atk s${s} L${L}`).toBeGreaterThanOrEqual(a.atk);
          expect(b.def, `def s${s} L${L}`).toBeGreaterThanOrEqual(a.def);
          expect(b.spd, `spd s${s} L${L}`).toBeGreaterThanOrEqual(a.spd);
          expect(hpPoints(b.hp)).toBeGreaterThanOrEqual(hpPoints(a.hp));
          for (const r of evolutionStatsDelta(antes, depois).rows) expect(r.delta).toBeGreaterThanOrEqual(0);
          casos++;
        }
      }
    }
    expect(casos).toBeGreaterThan(1000);
  });

  it('o caso medido: Ultimate L21 especializado em Defesa evolui para Mega sem perder Defesa (12, não 11)', () => {
    const antes: SoulXPState = { evolutionStage: 'ultimate', perfectDays: diasPara(2, 21), powerPoints: 0, harmonyPoints: 0, benevolencePoints: 10 };
    expect(soulCombatant(antes).def).toBe(12);
    expect(soulCombatant({ evolutionStage: 'mega', perfectDays: 0 }).def).toBe(11);
    expect(soulCombatant({ evolutionStage: 'mega', perfectDays: 0, evoStatFloor: nextStatFloor(antes, 'mega') }).def).toBe(12);
  });

  it('o piso é inerte fora do estágio dele e não pesa quando o derivado o alcança', () => {
    const piso = { s: 3, atk: 12, def: 12, spd: 12 };
    expect(soulCombatant({ evolutionStage: 'ultimate', perfectDays: 8, evoStatFloor: piso })).toEqual(soulCombatant({ evolutionStage: 'ultimate', perfectDays: 8 }));
    expect(soulCombatant({ evolutionStage: 'rookie', evoStatFloor: piso })).toEqual(soulCombatant({ evolutionStage: 'rookie' }));
    const tarde = { evolutionStage: 'mega', perfectDays: 7 };
    expect(soulCombatant({ ...tarde, evoStatFloor: piso })).toEqual(soulCombatant(tarde));
  });

  it('degenerar e evoluir de novo NÃO acumula: o piso novo vem do derivado do estágio de baixo e o de cima fica inerte', () => {
    const base: SoulXPState = { evolutionStage: 'ultimate', perfectDays: diasPara(2, 21), benevolencePoints: 10 };
    const piso1 = nextStatFloor(base, 'mega');
    const degenerado: SoulXPState = { ...base, evoStatFloor: piso1 };
    expect(soulCombatant(degenerado)).toEqual(soulCombatant(base));
    expect(nextStatFloor(degenerado, 'mega')).toEqual(piso1);
    for (const k of ['atk', 'def', 'spd'] as const) expect(piso1![k]).toBeLessThanOrEqual(statMaxOfStage(2));
  });

  it('encadeia: o piso do Ultra herda o do Mega (duas evoluções seguidas não voltam a cair)', () => {
    const u: SoulXPState = { evolutionStage: 'ultimate', perfectDays: diasPara(2, 21), benevolencePoints: 10 };
    const m: SoulXPState = { evolutionStage: 'mega', perfectDays: 0, evoStatFloor: nextStatFloor(u, 'mega') };
    const ultra: SoulXPState = { evolutionStage: 'ultra', perfectDays: 0, evoStatFloor: nextStatFloor(m, 'ultra') };
    for (const k of ['atk', 'def', 'spd'] as const) expect(soulCombatant(ultra)[k]).toBeGreaterThanOrEqual(soulCombatant(m)[k]);
  });

  it('"Trocar forma" (mesmo estágio) e destino que não sobe apagam o piso, não o criam', () => {
    expect(nextStatFloor({ evolutionStage: 'mega', perfectDays: 3 }, 'mega-power')).toBeUndefined();
    expect(nextStatFloor({ evolutionStage: 'mega', perfectDays: 3 }, 'ultimate')).toBeUndefined();
  });

  it('save adulterado: o piso é limitado ao teto legítimo e lixo vira nada', () => {
    expect(sanitizeStatFloor({ s: 3, atk: 9999, def: -5, spd: 2.9 })).toEqual({ s: 3, atk: statMaxOfStage(2), def: 0, spd: 2 });
    for (const v of [null, undefined, 3, 'x', { s: 0 }, { s: 5 }, { s: 2.5 }, { s: 'a' }]) expect(sanitizeStatFloor(v)).toBeUndefined();
    const forjado = soulCombatant({ evolutionStage: 'mega', perfectDays: 0, evoStatFloor: { s: 3, atk: 9999, def: 9999, spd: 9999 } });
    expect(forjado.atk).toBeLessThanOrEqual(statMaxOfStage(2));
  });

  it('o bônus de PvP dobra em cima do valor com piso (o piso entra antes do fold)', () => {
    const c = combatantAt(22, { atk: 0, def: 0, spd: 0 }, { def: 0.1 }, undefined, { s: 3, atk: 0, def: 14, spd: 0 });
    expect(c.def).toBeGreaterThan(14);
  });
});

describe('formatDelta', () => {
  it('só "+N" (o "−N" não existe mais para evoluir para cima)', () => {
    expect(formatDelta(0)).toBe('+0');
    expect(formatDelta(4)).toBe('+4');
  });
});
