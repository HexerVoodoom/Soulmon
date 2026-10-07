/**
 * Tarefa B (§2.38) — os oito nós que estavam "em breve" ganharam efeito. Linhas que este arquivo trava:
 *  · tudo é determinístico (sem RNG) e o ZERO é idêntico a "sem o nó" (bit a bit);
 *  · o teto de 5% é UM só: o que é % de combate (`allAttr`, `tal-pve-05/06`) passa por `combinedAttrBonus`/`combinedBonus`;
 *  · o que não é % de combate (largada, resistência, cura, Bits, escudo) é pequeno, com teto declarado, e medido na régua;
 *  · o ESPECIAL não é tocado (nenhum nó muda `SPECIAL_POWER`, a família ou a duração de um efeito);
 *  · nada que se compre com dinheiro chega a talento (o vetor só passa por `isValidPicks`).
 */
import { describe, it, expect, vi } from 'vitest';

vi.setConfig({ testTimeout: 300_000 });
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  TALENT_BY_ID, isPickable, isValidPicks, talentAttrBonus, talentBonus, talentStartEnergy, talentDotResist, talentHealBoost, talentRiftBits, talentStartShield,
  START_ENERGY_MAX, DOT_RESIST_MAX, HEAL_BOOST_MAX, RIFT_BITS_MAX, START_SHIELD_MAX,
} from './talents';
import { combinedAttrBonus, combinedBonus, COMBAT_BONUS_CAP } from './combate/bonus';
import { fight } from './combate/fight';
import { groupFight } from './combate/group';
import { simulatePvp } from './combate/duel';
import { combatantAt, REFERENCE_BUILDS, RULER_LEVELS } from './combate/level';
import { specialOf, cleanStartEnergy, cleanDotResist, cleanStartShield, SPECIAL_POWER } from './combate/specials';
import { simulateDungeonRunV3 } from './dungeonFight';
import { REFERENCE_BUILD_NAMES } from './combate/level';
import { riftBitsWith } from '../contexts/useTalentBonus';

const rep = (id: string, n: number) => Array<string>(n).fill(id);
const P4 = [...rep('tal-pvp-01', 2), ...rep('tal-pvp-02', 2), ...rep('tal-pvp-03', 2)];
const COM_PVP = [...P4, ...rep('tal-pvp-04', 3), ...rep('tal-pvp-06', 3)];
const PVE = [...rep('tal-pve-01', 2), ...rep('tal-pve-02', 2), 'tal-pve-03'];

describe('os nós saíram de "pendente"', () => {
  it('nenhum nó é pendente e todos os 21 se compram', () => {
    for (const n of TALENT_BY_ID.values()) { expect(n.effect.kind, n.id).not.toBe('pendente'); expect(isPickable(n)).toBe(true); }
  });
});

describe('os helpers: valor, teto, inválido = 0', () => {
  it('largada e resistência do PvP', () => {
    expect(talentStartEnergy([...P4, ...rep('tal-pvp-04', 3)], 20)).toBe(START_ENERGY_MAX);
    expect(talentStartEnergy([...P4, 'tal-pvp-04'], 20)).toBe(3);
    expect(talentDotResist(COM_PVP, 20)).toBeCloseTo(DOT_RESIST_MAX, 12);
    expect(talentStartEnergy(rep('tal-pvp-04', 3), 20)).toBe(0); // sem o pré-requisito: vetor inválido
    expect(talentDotResist(COM_PVP, 3)).toBe(0); // pontos a mais para o Vínculo
  });
  it('a Fenda: cura, Bits e escudo', () => {
    expect(talentHealBoost([...PVE, ...rep('tal-pve-03', 2)], 20)).toBeCloseTo(HEAL_BOOST_MAX, 12);
    expect(talentRiftBits([...PVE, 'tal-pve-04', 'tal-pve-04', 'tal-pve-04'], 20)).toBeCloseTo(RIFT_BITS_MAX, 12);
    expect(talentStartShield([...PVE, 'tal-pve-05', 'tal-pve-06', 'tal-pve-07'], 20)).toBeCloseTo(START_SHIELD_MAX, 12);
    for (const f of [talentHealBoost, talentRiftBits, talentStartShield, talentStartEnergy, talentDotResist]) {
      expect(f(null, 20)).toBe(0); expect(f('x', 20)).toBe(0); expect(f(['lixo'], 20)).toBe(0);
    }
  });
  it('limpadores do motor: lixo vale 0 e o teto é do motor', () => {
    expect(cleanStartEnergy(1e9)).toBe(START_ENERGY_MAX); expect(cleanStartEnergy(-4)).toBe(0); expect(cleanStartEnergy(NaN)).toBe(0);
    expect(cleanDotResist(5)).toBe(DOT_RESIST_MAX); expect(cleanDotResist('x')).toBe(0);
    expect(cleanStartShield(1)).toBe(START_SHIELD_MAX); expect(cleanStartShield(-1)).toBe(0);
  });
  it('Bits da fenda: nunca menos que a base, extra arredondado para baixo', () => {
    expect(riftBitsWith(100, 0)).toBe(100); expect(riftBitsWith(100, 0.09)).toBe(109); expect(riftBitsWith(7, 0.09)).toBe(7);
    expect(riftBitsWith(0, 0.09)).toBe(0); expect(riftBitsWith(50, -1)).toBe(50);
  });
});

describe('o teto de 5% continua UM só', () => {
  it('a Coroa soma nos três canais, mas o PvP cheio + Coroa nunca passa de 5% na soma', () => {
    const vet = [...rep('tal-pvp-01', 2), ...rep('tal-pvp-02', 2), ...rep('tal-pvp-03', 2), ...rep('tal-pvp-05', 3), 'tal-pvp-04', 'tal-pvp-06', 'tal-pvp-07', ...rep('tal-pvp-01', 2), ...rep('tal-pvp-02', 2), ...rep('tal-pvp-03', 2)].slice(0, 20);
    expect(isValidPicks(vet, 20), 'vetor de teste válido').toBe(true);
    const t = talentAttrBonus(vet, 20);
    const c = combinedAttrBonus({ talent: t, equipment: { atk: 0.05 } });
    expect(c.atk + c.def + c.spd).toBeLessThanOrEqual(COMBAT_BONUS_CAP + 1e-12);
    expect(t.atk).toBeGreaterThan(0); expect(t.def).toBeGreaterThan(0); expect(t.spd).toBeGreaterThan(0);
  });
  it('Lua com olho soma só no Pesadelo; Arco de luz soma na fenda; os dois cortam em 5% no canal único', () => {
    const v = [...PVE, ...rep('tal-pve-05', 3), ...rep('tal-pve-06', 3)];
    expect(isValidPicks(v, 20)).toBe(true);
    expect(talentBonus(v, 20, 'pve')).toBeCloseTo(4 * 0.006 + 0.012, 10);
    expect(talentBonus(v, 20, 'nightmare')).toBeGreaterThan(talentBonus(v, 20, 'pve'));
    expect(talentBonus(v, 20, 'pvp')).toBe(0);
    expect(combinedBonus({ talent: talentBonus(v, 20, 'nightmare'), equipment: 0.05 })).toBe(COMBAT_BONUS_CAP);
    expect(talentBonus(v, 20, 'nightmare')).toBeLessThanOrEqual(COMBAT_BONUS_CAP);
  });
});

describe('o motor: zero é idêntico, e o efeito é pequeno e na direção certa', () => {
  const N = 200;
  const lado = (L: number, fam: Parameters<typeof specialOf>[0] = 'direct') => ({ combatant: combatantAt(L, REFERENCE_BUILDS.balanced), special: specialOf(fam) });
  it('startEnergy 0 e dotResist 0 não mudam NADA (bit a bit)', () => {
    for (let s = 0; s < 30; s++) {
      const a = lado(12, 'dot'), b = lado(12, 'dot');
      const base = fight(a, b, { seed: s, hpScale: 1.7 });
      expect(fight({ ...a, dotResist: 0 }, { ...b, dotResist: 0 }, { seed: s, hpScale: 1.7, startEnergy: [0, 0] })).toEqual(base);
      expect(simulatePvp({ me: { ...a, startEnergy: 0, dotResist: 0 }, opp: b, seed: s, taps: [] })).toEqual(simulatePvp({ me: a, opp: b, seed: s, taps: [] }));
    }
  });
  it('a largada adianta o especial e a resistência reduz o dano de DoT sofrido; os dois tetos medidos na régua', () => {
    let tBase = 0, tFaisca = 0, tBase2 = 0, tResist = 0;
    for (const L of RULER_LEVELS) for (let s = 0; s < 12; s++) {
      const me = lado(L, 'direct'), opp = lado(L, 'dot');
      const seed = s * 7919 + L;
      const r0 = fight(me, opp, { seed, hpScale: 1.7 });
      const r1 = fight(me, opp, { seed, hpScale: 1.7, startEnergy: [START_ENERGY_MAX, 0] });
      tBase += Math.min(r0.timeA, r0.timeB); tFaisca += Math.min(r1.timeA, r1.timeB);
      const q0 = fight(me, opp, { seed, hpScale: 1.7 });
      const q1 = fight({ ...me, dotResist: DOT_RESIST_MAX }, opp, { seed, hpScale: 1.7 });
      tBase2 += q0.timeA; tResist += q1.timeA;
      expect(Number.isFinite(q0.timeA) && Number.isFinite(q1.timeA)).toBe(true);
    }
    const faisca = tBase / tFaisca - 1, resist = tResist / tBase2 - 1;
    console.log('[Tarefa B] Faísca (9 de energia) adianta o KO do inimigo em', (faisca * 100).toFixed(2) + '%; Brasa (18%) atrasa o KO próprio em', (resist * 100).toFixed(2) + '%');
    expect(faisca).toBeGreaterThanOrEqual(0); expect(faisca).toBeLessThanOrEqual(0.05);
    expect(resist).toBeGreaterThanOrEqual(0); expect(resist).toBeLessThanOrEqual(0.05);
  });
  it('o escudo de largada absorve o primeiro dano, e 0 é idêntico', () => {
    const p = lado(10), f = lado(10);
    for (let s = 0; s < 20; s++) {
      expect(groupFight({ ...p, startShield: 0 }, [f], { seed: s })).toEqual(groupFight(p, [f], { seed: s }));
    }
    let sem = 0, com = 0;
    for (let sd = 0; sd < 40; sd++) {
      sem += groupFight(p, [f], { seed: sd }).hpLeft;
      com += groupFight({ ...p, startShield: START_SHIELD_MAX }, [f], { seed: sd }).hpLeft;
    }
    expect(com).toBeGreaterThanOrEqual(sem); // o escudo só pode sobrar vida
  });
  it('nenhum nó mexe no especial: a tabela de poder é a mesma e a família nunca vem de um talento', () => {
    expect(SPECIAL_POWER).toEqual({ direct: 1, dot: 1, heal: 1, shield: 1, atkBuff: 1.01, defDebuff: 1.01, spdBuff: 1.82 });
    const fonte = readFileSync(resolve(__dirname, 'talents.ts'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(fonte).not.toMatch(/SPECIAL_POWER|specialOf|Math\.random/);
  });
});

describe('a Masmorra com escudo de largada e cura maior (medido; os gates seguem sem o nó)', () => {
  it('sem os nós a simulação é idêntica; com os dois no teto o andar 5 sobe pouco e nunca desce', () => {
    const N = 300;
    const taxa = (extra: { startShield?: number; healBoost?: number }) => {
      let ok5 = 0, andares = 0;
      for (let s = 0; s < N; s++) {
        const level = RULER_LEVELS[s % RULER_LEVELS.length];
        const r = simulateDungeonRunV3({ level, build: REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[(s >> 2) % 4]], family: 'direct', ...extra }, s * 131 + 7);
        if (r.floorsCleared >= 4) ok5++;
        andares += r.floorsCleared;
      }
      return { ok5: ok5 / N, andares: andares / N };
    };
    const base = taxa({}), zero = taxa({ startShield: 0, healBoost: 0 }), com = taxa({ startShield: START_SHIELD_MAX, healBoost: HEAL_BOOST_MAX });
    console.log(`[Tarefa B] Masmorra: base ${base.ok5.toFixed(3)} (${base.andares.toFixed(2)} andares) -> escudo+cura ${com.ok5.toFixed(3)} (${com.andares.toFixed(2)})`);
    expect(zero).toEqual(base);
    expect(com.andares).toBeGreaterThanOrEqual(base.andares);
    expect(com.andares - base.andares).toBeLessThan(0.4); // o ganho é pequeno (medido ~0,3 andar com os dois nos tetos), bem abaixo do que o equipamento já move
  });
});
