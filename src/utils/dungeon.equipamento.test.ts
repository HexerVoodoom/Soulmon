/**
 * Combate v3 / PR12a (§2.28 B) — a MASMORRA com DEF e SPD do equipamento, pelo canal único de 5%.
 *
 * Antes o equipamento entrava na fenda só como a SOMA dos 3 slots em dano (`equipScalar`). Agora a Masmorra usa o canal por
 * atributo (`dungeonAttrBonus` → `combinedAttrBonus`): ATK = dano dado, DEF = o inimigo precisa de mais golpes (dano recebido
 * menor), SPD = o golpe sai mais cedo. O teto é UM (5% na soma dos três). Medido com o núcleo real, nas mesmas funções da tela.
 *
 * Os gates AC5/AC6/AC10 da Masmorra continuam medindo o jogador SEM equipamento (`dungeon.v3.test.ts`). Aqui se mede o que o
 * equipamento muda e se o teto aguenta; o número do andar 5 com equipamento é REPORTADO ao dono (a parede sobe), não recalibrado.
 */
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { simulateDungeonRunV3, type DungeonSkill } from './dungeonFight';
import { REFERENCE_BUILD_NAMES, REFERENCE_BUILDS, RULER_LEVELS, combatantAt } from './combate/level';
import { fight } from './combate/fight';
import { SPECIAL_FAMILIES, type SpecialFamily } from './combate/specials';
import { COMBAT_BONUS_CAP, type AttrBonus } from './combate/bonus';
import { dungeonAttrBonus, EQUIP_CATALOG, type EquipmentState } from './equipment';
import type { Combatant } from './combate/curve';

vi.setConfig({ testTimeout: 300_000 });

const fam = (i: number): SpecialFamily => SPECIAL_FAMILIES[((i % 7) + 7) % 7];
const pct = (x: number) => `${(100 * x).toFixed(1)}%`;
const cell = (s: number) => ({
  level: RULER_LEVELS[s % RULER_LEVELS.length],
  build: REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[(s >> 2) % 4]],
  family: fam(s >> 4),
});
const full = (): EquipmentState => ({
  owned: EQUIP_CATALOG.filter((i) => i.tier === 3).map((i) => i.id),
  equipped: { nucleo: 'eq-nucleo-t3', carapaca: 'eq-carapaca-t3', rastro: 'eq-rastro-t3' },
  fragments: 0,
});
const only = (slot: 'nucleo' | 'carapaca' | 'rastro'): EquipmentState => ({ owned: [`eq-${slot}-t3`], equipped: { [slot]: `eq-${slot}-t3` }, fragments: 0 });

const NADA: AttrBonus = { atk: 0, def: 0, spd: 0 };
const CHEIO = dungeonAttrBonus(0, full());
const CHEIO_TALENTO = dungeonAttrBonus(0.12, full()); // talento PvE enorme: o teto corta
const SO_DEF = dungeonAttrBonus(0, only('carapaca'));
const SO_SPD = dungeonAttrBonus(0, only('rastro'));

describe('1. o canal da Masmorra: cada slot no SEU atributo, UM teto de 5%', () => {
  it('Núcleo→ATK, Carapaça→DEF, Rastro→SPD; talento de PvE soma no ATK', () => {
    expect(CHEIO).toEqual({ atk: 0.015, def: 0.015, spd: 0.015 });
    expect(SO_DEF).toEqual({ atk: 0, def: 0.015, spd: 0 });
    expect(SO_SPD).toEqual({ atk: 0, def: 0, spd: 0.015 });
    expect(dungeonAttrBonus(0.02, only('carapaca'))).toEqual({ atk: 0.02, def: 0.015, spd: 0 });
  });
  it('a SOMA dos três canais nunca passa de 5%, com talento enorme, lixo ou equipamento forjado', () => {
    for (const b of [CHEIO, CHEIO_TALENTO, dungeonAttrBonus(9, full()), dungeonAttrBonus(NaN, { owned: ['x'], equipped: { nucleo: 'eq-carapaca-t3' } })]) {
      expect(b.atk + b.def + b.spd).toBeLessThanOrEqual(COMBAT_BONUS_CAP + 1e-12);
    }
    expect(CHEIO_TALENTO.atk + CHEIO_TALENTO.def + CHEIO_TALENTO.spd).toBeCloseTo(COMBAT_BONUS_CAP, 12);
  });
});

describe('2. o teto de 5% pela razão das médias (HP×3, núcleo real)', () => {
  const L = RULER_LEVELS[Math.floor(RULER_LEVELS.length / 2)];
  const base = combatantAt(L, REFERENCE_BUILDS.balanced);
  const adv = (a: Combatant) => {
    const run = (x: Combatant) => {
      let ta = 0, tb = 0;
      for (let s = 1; s <= 60; s++) {
        const r = fight({ combatant: x, special: null }, { combatant: base, special: null }, { seed: s * 104729 + L, hpScale: 3 });
        ta += r.timeA; tb += r.timeB;
      }
      return ta / tb - 1;
    };
    return run(a) - run(base);
  };
  it('equipamento cheio e cheio + talento: vantagem ≤ 5,5%; DEF e SPD sozinhos têm efeito real (> 0,5%)', () => {
    const v = { cheio: adv(combatantAt(L, REFERENCE_BUILDS.balanced, CHEIO)), cheioTalento: adv(combatantAt(L, REFERENCE_BUILDS.balanced, CHEIO_TALENTO)), def: adv(combatantAt(L, REFERENCE_BUILDS.balanced, SO_DEF)), spd: adv(combatantAt(L, REFERENCE_BUILDS.balanced, SO_SPD)) };
    console.log(`[PR12a razão das médias] cheio ${pct(v.cheio)} · cheio+talento ${pct(v.cheioTalento)} · só DEF ${pct(v.def)} · só SPD ${pct(v.spd)}`);
    expect(v.cheio).toBeLessThanOrEqual(0.055);
    expect(v.cheioTalento).toBeLessThanOrEqual(0.055);
    expect(v.def).toBeGreaterThan(0.005);
    expect(v.spd).toBeGreaterThan(0.005);
  });
  it('RED: sem o corte (3 canais de 3,1%) passa do teto', () => {
    expect(adv(combatantAt(L, REFERENCE_BUILDS.balanced, { atk: 0.031, def: 0.031, spd: 0.031 }))).toBeGreaterThan(0.055);
  });
});

describe('3. a Masmorra com equipamento (andares 1-4, andar 5, andar 6, duração, habilidade)', () => {
  const N = 800;
  const reach = (bonus: AttrBonus) => {
    const runs = Array.from({ length: N }, (_, s) => simulateDungeonRunV3({ ...cell(s), bonus }, s, 'media', 6));
    return (n: number) => runs.filter((r) => r.floorsCleared >= n).length / runs.length;
  };
  const rNada = reach(NADA);
  const rDef = reach(SO_DEF);
  const rSpd = reach(SO_SPD);
  const rCheio = reach(CHEIO_TALENTO);

  it('DEF e SPD mexem na Masmorra (RED: sem o canal o andar 5 ficaria igual ao sem equipamento)', () => {
    console.log(`[PR12a andar 5] nada ${pct(rNada(5))} · só DEF ${pct(rDef(5))} · só SPD ${pct(rSpd(5))} · cheio+talento ${pct(rCheio(5))}`);
    expect(rDef(5)).toBeGreaterThan(rNada(5) + 0.03);
    expect(rSpd(5)).toBeGreaterThan(rNada(5) + 0.03);
  });
  it('com equipamento cheio: andares 1-4 seguem ~100% e o andar 6 segue ~0% (a parede do andar 5 sobe: reportado)', () => {
    for (const n of [1, 2, 3, 4]) expect(rCheio(n), `andar ${n}`).toBeGreaterThanOrEqual(0.97);
    expect(rCheio(6)).toBeLessThanOrEqual(0.03);
    expect(rCheio(5)).toBeGreaterThan(rNada(5));
  });
  it('o jogador SEM equipamento segue nas faixas do dono (andar 5: 30-40%)', () => {
    expect(rNada(5)).toBeGreaterThanOrEqual(0.28);
    expect(rNada(5)).toBeLessThanOrEqual(0.42);
  });
  it('FINDING (reportado ao dono, não recalibrado): habilidade ao concluir — sem equipamento, escalar antigo e canal novo', () => {
    const concluiu = (skill: DungeonSkill, bonus: number | AttrBonus) => {
      let w = 0;
      for (let s = 0; s < 1200; s++) w += +(simulateDungeonRunV3({ ...cell(s), bonus }, s, skill, 5).floorsCleared >= 5);
      return w / 1200;
    };
    const gap = (bonus: number | AttrBonus) => concluiu('boa', bonus) - concluiu('nenhuma', bonus);
    const g = { nada: gap(NADA), antigo: gap(0.05), novo: gap(CHEIO_TALENTO) };
    console.log(`[PR12a habilidade ao concluir] sem equipamento ${(100 * g.nada).toFixed(1)}pp · escalar antigo (5% em dano) ${(100 * g.antigo).toFixed(1)}pp · canal novo ${(100 * g.novo).toFixed(1)}pp (meta 25pp; aceito 30,2pp)`);
    // Trava de regressão, não de meta: o canal novo não pode abrir mais que 3pp sobre o que o dono já aceitou.
    expect(g.nada).toBeLessThanOrEqual(0.302 + 0.005);
    expect(g.novo).toBeLessThanOrEqual(0.302 + 0.03);
  });
});

describe('4. a tela da Masmorra usa o canal por atributo; Arena e Pesadelo ficam como estavam', () => {
  const ler = (f: string) => readFileSync(resolve(__dirname, '..', f), 'utf8').replace(/\r\n/g, '\n');
  it('DungeonGame lê useDungeonBonus; Arena e Pesadelo seguem em useTalentBonus (escalar)', () => {
    expect(ler('components/DungeonGame.tsx')).toMatch(/useDungeonBonus\(\)/);
    expect(ler('components/DungeonGame.tsx')).not.toMatch(/useTalentBonus\(/);
    expect(ler('components/ArenaGame.tsx')).toMatch(/useTalentBonus\('pve'\)/);
    expect(ler('components/NightmareBattle.tsx')).toMatch(/useTalentBonus\('nightmare'\)/); // Tarefa B: o Pesadelo soma tal-pve-05 (canal único de 5%)
  });
});
