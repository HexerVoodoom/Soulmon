import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { NOVOS_SOULMON, novoSoulmonOfStage, novoPreferenceOfTier } from './novosSoulmon';
import { NOVOS_DATA, FORMAS_ALTAS, pickNovo } from './novosSoulmonData';
import { buildArenaRound, ARENA_ROUNDS } from './arena';
import { buildDungeonWave, LADDER_TIERS } from './dungeon';
import { DUNGEON_LINE_NAMES, DUNGEON_LINE_SPRITES } from './sprites';
import { VISUAL_ELEMENTS, fxElementId, elementStrikeForm, dungeonEnemyElement, dungeonFoeSpecialLabel } from './combatFx';
import { mulberry32 } from './combate/rng';

const DIR = join(process.cwd(), 'src/assets/soulmon/novos');

describe('os 17 novos Soulmon da masmorra', () => {
  it('um por elemento base, divisão 6/6/5, ids únicos', () => {
    expect(NOVOS_SOULMON).toHaveLength(17);
    expect([...NOVOS_SOULMON.map(n => n.element)].sort()).toEqual([...VISUAL_ELEMENTS].sort());
    const por = (l: string) => NOVOS_SOULMON.filter(n => n.line === l).length;
    expect([por('poder'), por('harmonia'), por('benevolencia')]).toEqual([6, 6, 5]);
    expect(new Set(NOVOS_SOULMON.map(n => n.id)).size).toBe(17);
  });

  it('nomes finais (renomeados), sem -mon, e ataques PT/EN preenchidos', () => {
    const nomes = NOVOS_SOULMON.flatMap(n => [n.name('rookie'), n.name('champion')]);
    for (const f of ['Gravul', 'Umbrae', 'Solion', 'Aurolion', 'Cirruwing', 'Voltrix']) expect(nomes).toContain(f);
    for (const old of ['Grava', 'Umbrat', 'Solleon', 'Auroram', 'Windhawk', 'Voltix']) expect(nomes).not.toContain(old);
    for (const n of NOVOS_SOULMON) {
      for (const nm of [n.name('rookie'), n.name('champion')]) expect(nm).not.toMatch(/mon$/i);
      for (const a of [n.basico, n.especial]) { expect(a.pt.length).toBeGreaterThan(2); expect(a.en.length).toBeGreaterThan(2); }
    }
  });

  it('arte 256² RGBA, 34 arquivos sem órfão, peso < 150 KB', () => {
    const files = readdirSync(DIR).filter(f => f.endsWith('.png'));
    expect(files).toHaveLength(34);
    for (const n of NOVOS_SOULMON) for (const st of ['rookie', 'champion']) expect(files).toContain(`${n.element}-${st}.png`);
    for (const f of files) {
      const b = readFileSync(join(DIR, f));
      expect(b.readUInt32BE(16)).toBe(256);
      expect(b.readUInt32BE(20)).toBe(256);
      expect(b[25]).toBe(6); // RGBA
      expect(b.length).toBeLessThan(150_000);
    }
  });

  it('todo elemento tem FX próprio (sem cair no neutro) e forma de golpe própria', () => {
    for (const n of NOVOS_SOULMON) {
      expect(fxElementId(n.element)).toBe(n.element);
      expect(elementStrikeForm(n.element, 'basica')).toBeTruthy();
    }
  });

  it('a escada: slots rookie/champion = criaturas novas com elemento; ultimate/mega = linhas antigas', () => {
    expect(LADDER_TIERS.map(t => novoPreferenceOfTier(t)[0])).toEqual(['rookie', 'rookie', 'rookie', 'champion', 'ultimate', 'mega']);
    expect(Object.keys(FORMAS_ALTAS)).toEqual([]); // enquanto não há arte, slots 4/5 ficam nas linhas antigas
    for (let seed = 1; seed <= 20; seed++) {
      const wave = buildDungeonWave(1 + seed % 4, 'rookie', mulberry32(seed));
      wave.slice(0, 4).forEach((e, i) => {
        const n = novoSoulmonOfStage(e.stage)!;
        expect(n, e.stage).toBeDefined();
        expect(e.element).toBe(n.element);
        expect(e.name).toBe(i === 3 ? n.name('champion') : n.name('rookie'));
        expect(e.sprite).toBe(i === 3 ? n.sprite('champion') : n.sprite('rookie'));
        expect(dungeonEnemyElement(e)).toBe(n.element);
        expect(dungeonFoeSpecialLabel(true, e, e.element, e.name)).toBe(n.especial.pt);
        expect(dungeonFoeSpecialLabel(false, e, e.element, e.name)).toBe(n.especial.en);
      });
      wave.slice(4).forEach(e => {
        expect(novoSoulmonOfStage(e.stage)).toBeUndefined();
        expect(e.element).toBeUndefined();
        expect(Object.keys(DUNGEON_LINE_SPRITES)).toContain(e.stage.split('-')[0]);
        expect(Object.values(DUNGEON_LINE_NAMES)).toContain(e.name);
      });
    }
  });

  it('o valor (HP/poder) do encontro não mudou: só o sabor', () => {
    const a = buildDungeonWave(3, 'rookie', mulberry32(7));
    const b = buildDungeonWave(3, 'rookie', mulberry32(99));
    expect(a.map(e => e.foe)).toEqual(b.map(e => e.foe));
  });

  it('sem repetição: as 4 criaturas novas da onda são todas diferentes', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const ids = buildDungeonWave(1, 'rookie', mulberry32(seed)).slice(0, 4).map(e => e.stage.split('-')[0]);
      expect(new Set(ids).size, ids.join()).toBe(4);
    }
  });

  it('pickNovo: forma sem arte -> null; com `used` esgotado reaproveita', () => {
    const rng = () => 0.3;
    expect(pickNovo(['mega'], new Set(), rng)).toBeNull();
    expect(pickNovo(['ultra', 'mega', 'champion'], new Set(), rng)!.stage).toBe('champion');
    expect(pickNovo(['rookie'], new Set(NOVOS_DATA.map(n => n.id)), rng)).not.toBeNull();
  });

  it('Arena: inimigo é criatura nova, com o elemento dela, determinístico e sem repetir na rodada', () => {
    for (let seed = 1; seed <= 50; seed++) {
      for (let r = 1; r <= ARENA_ROUNDS; r++) {
        const a = buildArenaRound(r, 1, mulberry32(seed + r), []);
        expect(buildArenaRound(r, 1, mulberry32(seed + r), [])).toEqual(a);
        expect(new Set(a.map(e => e.creature)).size).toBe(a.length);
        for (const e of a) {
          const n = NOVOS_SOULMON.find(x => x.id === e.creature)!;
          expect(e.elements).toEqual([n.element]);
          expect(e.form).toBe(e.cls === 'weak' ? 'rookie' : 'champion'); // sem arte alta: o chefe usa o Champion
          expect(e.namePt).toBe(n.name(e.form!));
        }
      }
    }
  });
});
