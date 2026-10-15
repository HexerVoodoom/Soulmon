import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { NOVOS_SOULMON, novoSoulmonOfStage, novoStageOfTier } from './novosSoulmon';
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
    const nomes = NOVOS_SOULMON.flatMap(n => [n.rookie.name, n.champion.name]);
    for (const f of ['Gravul', 'Umbrae', 'Solion', 'Aurolion', 'Cirruwing', 'Voltrix']) expect(nomes).toContain(f);
    for (const old of ['Grava', 'Umbrat', 'Solleon', 'Auroram', 'Windhawk', 'Voltix']) expect(nomes).not.toContain(old);
    for (const n of NOVOS_SOULMON) {
      for (const nm of [n.rookie.name, n.champion.name]) expect(nm).not.toMatch(/mon$/i);
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
    expect(LADDER_TIERS.map(novoStageOfTier)).toEqual(['rookie', 'rookie', 'rookie', 'champion', null, null]);
    for (let seed = 1; seed <= 20; seed++) {
      const wave = buildDungeonWave(1 + seed % 4, 'rookie', mulberry32(seed));
      wave.slice(0, 4).forEach((e, i) => {
        const n = novoSoulmonOfStage(e.stage)!;
        expect(n, e.stage).toBeDefined();
        expect(e.element).toBe(n.element);
        expect(e.name).toBe(i === 3 ? n.champion.name : n.rookie.name);
        expect(e.sprite).toBe(i === 3 ? n.champion.sprite : n.rookie.sprite);
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
});
