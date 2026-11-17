/**
 * HEXSMITH H2 (16/11/2026) — o MOTOR lê `specialEffect` e as 3 famílias só de Coroa.
 *  1. mecânica: cada efeito/família faz o que promete no 1v1 (`fight.ts`), com os contadores reais no rastro;
 *  2. retrocompatibilidade: sem efeito nem família nova, o rastro e os eventos não ganham nada;
 *  3. CALIBRAÇÃO PvP: a régua pareada do 1v1 (±5%, −15% de buff no rookie) com 4 builds × 3 níveis × 100 sementes;
 *  4. as famílias novas NUNCA são sorteadas (ficha, inimigo, jogador novo): entram só pela Coroa.
 * O espelho do servidor tem o teste de paridade do log inteiro em `functions/api/hexsmith.motor.parity.test.js`.
 */
import { describe, expect, it, vi } from 'vitest';
import { fightSteps, type FightEvent, type FightFxPair, type FightSide } from './fight';
import { combatantAt, REFERENCE_BUILD_NAMES, REFERENCE_BUILDS, RULER_LEVELS } from './level';
import { pairedDelta, rulerBaseline, rulerBounds } from './ruler';
import {
  ALL_SPECIAL_FAMILIES, CROWN_ONLY_FAMILIES, EFFECT_FAMILY, EFFECT_TUNE_PVP, FAMILY_TUNE, SPECIAL_FAMILIES, SPECIAL_POWER, specialOf,
  type SpecialEffect, type SpecialFamily,
} from './specials';
import { foeSpecialOf } from './foeFamilies';
import { familiaDoEspecial, PESO_FAMILIA_ESCOLA } from '../soulProfile/ficha/nomeEspecial';
import type { EscolaSkillId } from '../soulProfile/ficha/types';

vi.setConfig({ testTimeout: 120_000 });

const L = 20;
const lado = (fam: SpecialFamily | null, ef?: SpecialEffect, build: keyof typeof REFERENCE_BUILDS = 'balanced'): FightSide => (
  { combatant: combatantAt(L, REFERENCE_BUILDS[build]), special: fam ? specialOf(fam, ef) : null }
);
function jogar(a: FightSide, b: FightSide, seed: number, extra: object = {}) {
  const fx: FightFxPair[] = [];
  const g = fightSteps(a, b, { seed, hpScale: 1.7, variance: null, fxTrace: fx, ...extra });
  const events: FightEvent[] = [];
  let r = g.next();
  while (!r.done) { events.push(r.value); r = g.next(1); }
  return { events, fx, result: r.value };
}
const iCast = (ev: readonly FightEvent[], side: 0 | 1) => ev.findIndex((e) => e.kind === 'cast' && e.side === side);

describe('efeitos de Coroa no 1v1', () => {
  it('lentidão: o alvo ganha o contador, fica mais lento e perde parte do corte de defesa (`slowKeep`)', () => {
    const a = jogar(lado('defDebuff', 'slow'), lado(null), 3, { startEnergy: [100, 0] });
    const i = iCast(a.events, 0);
    expect(i).toBeGreaterThan(-1);
    expect(a.fx[i][1].nSlow ?? 0).toBeGreaterThan(0);
    expect(a.fx[i][1].nVuln).toBeGreaterThan(0);
    const puro = jogar(lado('defDebuff'), lado(null), 3, { startEnergy: [100, 0] });
    expect(puro.fx[iCast(puro.events, 0)][1].nVuln).toBeGreaterThan(a.fx[i][1].nVuln); // parte do orçamento virou lentidão
    const golpes = (r: ReturnType<typeof jogar>, t: number) => r.events.filter((e) => e.kind === 'attack' && e.side === 1 && e.t <= t).length;
    expect(golpes(a, 25)).toBeLessThan(golpes(jogar(lado('direct'), lado(null), 3, { startEnergy: [100, 0] }), 25));
    expect(a.fx.some((p) => (p[1].nSlow ?? 0) > 0)).toBe(true);
    expect(a.fx[a.fx.length - 1][1].nSlow).toBeUndefined(); // o contador se gasta nos golpes do alvo
  });

  it('silêncio: o alvo com especial não solta o especial durante `silenceHits` golpes; sem especial, o corte de defesa vem inteiro', () => {
    const r = jogar(lado('defDebuff', 'silence'), lado('direct'), 5, { startEnergy: [100, 100] });
    const i = iCast(r.events, 0);
    expect(i).toBeGreaterThan(-1);
    expect(r.fx[i][1].nSil).toBe(EFFECT_TUNE_PVP.silenceHits);
    const j = iCast(r.events, 1);
    const golpesDoAlvoAntes = r.events.slice(i, j < 0 ? undefined : j).filter((e) => e.kind === 'attack' && e.side === 1).length;
    expect(j === -1 || golpesDoAlvoAntes >= EFFECT_TUNE_PVP.silenceHits).toBe(true);
    // contra quem não tem especial não há o que calar: `defDebuff` inteiro
    const vazio = jogar(lado('defDebuff', 'silence'), lado(null), 5, { startEnergy: [100, 0] });
    const puro = jogar(lado('defDebuff'), lado(null), 5, { startEnergy: [100, 0] });
    expect(vazio.fx[iCast(vazio.events, 0)][1].nSil).toBeUndefined();
    expect(vazio.fx[iCast(vazio.events, 0)][1].nVuln).toBe(puro.fx[iCast(puro.events, 0)][1].nVuln);
  });

  it('cura contínua: 3 pulsos no começo dos 3 próximos golpes de quem recebe, em pontos inteiros', () => {
    const r = jogar(lado('shield', 'hot'), lado('direct'), 7, { startEnergy: [100, 0], startHp: [0.4, 1], hitScale: (who: 0 | 1) => (who === 1 ? 0 : 1) });
    const i = iCast(r.events, 0);
    expect(r.fx[i][0].hot).toBe(3);
    const apos = r.events.slice(i).filter((e) => e.kind === 'attack' && e.side === 0);
    const hp = [r.events[i].hp[0], ...apos.slice(0, 4).map((e) => e.hp[0])];
    expect(hp[1]).toBeGreaterThan(hp[0]);
    expect(hp[2]).toBeGreaterThan(hp[1]);
    expect(hp[3]).toBeGreaterThan(hp[2]);
    expect(hp[4]).toBe(hp[3]); // 3 pulsos e acabou
    expect(r.fx[r.events.indexOf(apos[2])][0].hot ?? 0).toBe(0); // gastou os 3 pulsos
  });

  it('o efeito só vale na família-base: efeito fora dela é ignorado (o especial é o mesmo objeto de sempre)', () => {
    expect(specialOf('direct', 'hot')).toEqual(specialOf('direct'));
    expect(specialOf('defDebuff', 'hot')).toEqual(specialOf('defDebuff'));
    expect(specialOf('shield', 'slow')).toEqual(specialOf('shield'));
    for (const [ef, fam] of Object.entries(EFFECT_FAMILY) as [SpecialEffect, SpecialFamily][]) expect(specialOf(fam, ef).effect).toBe(ef);
  });
});

describe('famílias só de Coroa no 1v1', () => {
  const golpesDoAlvo = (r: ReturnType<typeof jogar>, de: number, n: number) => r.events.slice(de).filter((e) => e.kind === 'attack' && e.side === 1).slice(0, n).map((e) => e.frac);

  it('reforço de defesa: os próximos golpes que o conjurador RECEBE saem cortados em `guardCut`', () => {
    const g = jogar(lado('defBuff'), lado(null), 9, { startEnergy: [100, 0] });
    const ref = jogar(lado('direct'), lado(null), 9, { startEnergy: [100, 0] });
    const i = iCast(g.events, 0);
    expect(g.fx[i][0].nGuard).toBeGreaterThan(0);
    const com = golpesDoAlvo(g, i, 3).reduce((x, y) => x + y, 0);
    const sem = golpesDoAlvo(ref, iCast(ref.events, 0), 3).reduce((x, y) => x + y, 0);
    expect(com / sem).toBeGreaterThan(1 - FAMILY_TUNE.guardCut - 0.2);
    expect(com / sem).toBeLessThan(1 - FAMILY_TUNE.guardCut + 0.2);
    expect(g.fx[g.fx.length - 1][0].nGuard).toBeUndefined();
  });

  it('debuff de ataque: os próximos golpes do ALVO saem cortados; os do conjurador não mudam', () => {
    const g = jogar(lado('atkDebuff'), lado(null), 11, { startEnergy: [100, 0] });
    const ref = jogar(lado('direct'), lado(null), 11, { startEnergy: [100, 0] });
    const i = iCast(g.events, 0);
    expect(g.fx[i][1].nWeak).toBeGreaterThan(0);
    expect(g.fx[i][0].nWeak).toBeUndefined();
    const com = golpesDoAlvo(g, i, 3).reduce((x, y) => x + y, 0);
    const sem = golpesDoAlvo(ref, iCast(ref.events, 0), 3).reduce((x, y) => x + y, 0);
    expect(com / sem).toBeLessThan(1 - FAMILY_TUNE.weakCut + 0.2);
    expect(g.fx[g.fx.length - 1][1].nWeak).toBeUndefined();
  });

  it('lentidão real: o alvo ataca menos vezes no mesmo tempo e o contador (`nSlow` do selo) se gasta', () => {
    const g = jogar(lado('spdDebuff'), lado(null), 13, { startEnergy: [100, 0] });
    const ref = jogar(lado('direct'), lado(null), 13, { startEnergy: [100, 0] });
    const i = iCast(g.events, 0);
    expect(g.fx[i][1].nSlow).toBeGreaterThan(0);
    const n = (r: ReturnType<typeof jogar>) => r.events.filter((e) => e.kind === 'attack' && e.side === 1 && e.t <= 25).length;
    expect(n(g)).toBeLessThan(n(ref));
    expect(g.fx[g.fx.length - 1][1].nSlow).toBeUndefined();
  });

  it('quem não usa efeito nem família nova: rastro e eventos sem nenhum contador novo (retrocompatível)', () => {
    for (const fam of SPECIAL_FAMILIES) {
      for (const seed of [1, 5, 99]) {
        const r = jogar({ ...lado(fam), special: specialOf(fam) }, lado('direct'), seed, { variance: undefined });
        expect(JSON.stringify(r.fx), fam).not.toMatch(/nGuard|nWeak|nSil|nSlow|"hot"/);
      }
    }
  });

  it('determinismo: a mesma semente dá o mesmo log, com cada família e efeito', () => {
    for (const fam of ALL_SPECIAL_FAMILIES) {
      const a = jogar(lado(fam), lado('direct'), 21, { variance: undefined, startEnergy: [50, 20] });
      expect(jogar(lado(fam), lado('direct'), 21, { variance: undefined, startEnergy: [50, 20] })).toEqual(a);
    }
  });
});

describe('CALIBRAÇÃO PvP: régua pareada do 1v1 (±5%; buff −15% no rookie)', () => {
  const NS = 100;
  const CASOS: [string, SpecialFamily, SpecialEffect | undefined][] = [
    ['coroa:hot', 'shield', 'hot'], ['coroa:slow', 'defDebuff', 'slow'], ['coroa:silence', 'defDebuff', 'silence'],
    ['coroa:defBuff', 'defBuff', undefined], ['coroa:atkDebuff', 'atkDebuff', undefined], ['coroa:spdDebuff', 'spdDebuff', undefined],
  ];
  for (const [nome, fam, ef] of CASOS) {
    it(`${nome}: dentro da régua em 3 níveis × 4 builds × ${NS} sementes`, () => {
      for (const nivel of [5, 20, 40]) {
        for (const b of REFERENCE_BUILD_NAMES) {
          const c = combatantAt(nivel, REFERENCE_BUILDS[b]);
          const d = pairedDelta(c, specialOf(fam, ef), NS, nivel, rulerBaseline(c, NS, nivel));
          const [lo, hi] = rulerBounds(fam, nivel);
          expect(d, `${nome} L${nivel} ${b}`).toBeGreaterThanOrEqual(lo);
          expect(d, `${nome} L${nivel} ${b}`).toBeLessThanOrEqual(hi);
        }
      }
    });
  }
  it('as famílias novas e os 3 efeitos também em todos os 15 níveis da régua × 4 builds × 40 sementes', () => {
    for (const [nome, fam, ef] of CASOS) {
      for (const nivel of RULER_LEVELS) {
        for (const b of REFERENCE_BUILD_NAMES) {
          const c = combatantAt(nivel, REFERENCE_BUILDS[b]);
          const d = pairedDelta(c, specialOf(fam, ef), 40, nivel, rulerBaseline(c, 40, nivel));
          const [lo, hi] = rulerBounds(fam, nivel);
          expect(d, `${nome} L${nivel} ${b}`).toBeGreaterThanOrEqual(lo);
          expect(d, `${nome} L${nivel} ${b}`).toBeLessThanOrEqual(hi);
        }
      }
    }
  });
  it('RED: a régua reprova o que sai dela (poder 3x no `spdDebuff`)', () => {
    const p0 = SPECIAL_POWER.spdDebuff;
    const c = combatantAt(20, REFERENCE_BUILDS.atk);
    const d = pairedDelta(c, { family: 'spdDebuff', power: p0 * 3 }, NS, 20, rulerBaseline(c, NS, 20));
    expect(d).toBeGreaterThan(rulerBounds('spdDebuff', 20)[1]);
  });
});

describe('as famílias novas NUNCA são sorteadas: só entram pela Coroa', () => {
  it('lista sorteável intacta (7) e a total tem 10; peso 0 em toda escola; nenhuma é "sorteável"', () => {
    expect(SPECIAL_FAMILIES.length).toBe(7);
    expect(ALL_SPECIAL_FAMILIES.length).toBe(10);
    for (const esc of Object.keys(PESO_FAMILIA_ESCOLA) as EscolaSkillId[]) {
      for (const f of CROWN_ONLY_FAMILIES) expect(PESO_FAMILIA_ESCOLA[esc][f], `${esc}/${f}`).toBe(0);
      for (const f of SPECIAL_FAMILIES) expect(PESO_FAMILIA_ESCOLA[esc][f]).toBeGreaterThan(0);
    }
  });
  it('o sorteio da ficha (jogador novo) em 6000 sementes nunca devolve família só de Coroa', () => {
    const escolas = Object.keys(PESO_FAMILIA_ESCOLA) as EscolaSkillId[];
    for (let i = 0; i < 6000; i++) {
      const f = familiaDoEspecial({ escola: escolas[i % escolas.length], elementoId: ['fogo', 'agua', 'ar', 'terra', 'vida', 'som'][i % 6], seedKey: `s${i}`, stage: i % 2 ? 'rookie' : 'champion' });
      expect(CROWN_ONLY_FAMILIES as readonly string[], `seed ${i}`).not.toContain(f);
    }
  });
  it('o especial dos inimigos (PvE e PvP) em 6000 chaves nunca é família só de Coroa', () => {
    for (let i = 0; i < 6000; i++) {
      for (const pvp of [false, true]) {
        const sp = foeSpecialOf(i % 2 ? 'rookie' : 'champion', `chave${i}`, pvp);
        expect(CROWN_ONLY_FAMILIES as readonly string[]).not.toContain(sp.family);
      }
    }
  });
});
