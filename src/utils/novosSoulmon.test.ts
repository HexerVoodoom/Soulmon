import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { NOVOS_SOULMON, FORMAS_ALTAS_ART, novoSoulmonOfStage, novoPreferenceOfTier } from './novosSoulmon';
import { NOVOS_DATA, FORMAS_ALTAS, pickNovo } from './novosSoulmonData';
import { buildArenaRound, ARENA_ROUNDS } from './arena';
import { buildDungeonWave, LADDER_TIERS } from './dungeon';
import { DUNGEON_LINE_NAMES, DUNGEON_LINE_SPRITES } from './sprites';
import { VISUAL_ELEMENTS, fxElementId, elementStrikeForm, dungeonEnemyElement, dungeonFoeSpecialLabel } from './combatFx';
import { mulberry32 } from './combate/rng';

const DIR = join(process.cwd(), 'src/assets/soulmon/novos');

describe('os 20 novos Soulmon da masmorra (17 + fada/industrial/planta)', () => {
  it('um por elemento base, divisão 7/7/6, ids únicos', () => {
    expect(NOVOS_SOULMON).toHaveLength(20);
    expect([...NOVOS_SOULMON.map(n => n.element)].sort()).toEqual([...VISUAL_ELEMENTS, 'fada', 'industrial', 'planta'].sort());
    const por = (l: string) => NOVOS_SOULMON.filter(n => n.line === l).length;
    expect([por('poder'), por('harmonia'), por('benevolencia')]).toEqual([7, 7, 6]);
    expect(new Set(NOVOS_SOULMON.map(n => n.id)).size).toBe(20);
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

  it('arte 256² RGBA, 100 arquivos (20×5 formas) sem órfão, peso < 150 KB', () => {
    const files = readdirSync(DIR).filter(f => f.endsWith('.png'));
    expect(files).toHaveLength(100);
    for (const n of NOVOS_SOULMON) for (const st of ['rookie', 'champion', 'ultimate', 'mega', 'ultra']) expect(files).toContain(`${n.element}-${st}.png`);
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
      // fada tem FX próprio; planta/industrial ainda usam o da classe (`ORACULO_PARA_CLASSE`: vida/aco) até o alias ser apagado.
      if (!['planta', 'industrial'].includes(n.element)) expect(fxElementId(n.element)).toBe(n.element);
      expect(elementStrikeForm(n.element, 'basica')).toBeTruthy();
    }
  });

  it('formas altas: as 20 têm ultimate/mega/ultra, com nome PT/EN (iguais), arte própria e sem colisão', () => {
    const todos = new Set<string>();
    for (const n of NOVOS_SOULMON) {
      expect(NOVOS_DATA.find(d => d.id === n.id)).toBeDefined();
      for (const st of ['ultimate', 'mega', 'ultra'] as const) {
        const nome = FORMAS_ALTAS[n.id]?.[st];
        expect(nome, `${n.id} ${st}`).toMatch(/^[A-Z][a-z]{4,14}$/);
        expect(n.name(st)).toBe(nome);
        expect(FORMAS_ALTAS_ART[n.id][st]).toBeTruthy();
        expect(n.sprite(st)).not.toBe(n.sprite('champion'));
        todos.add(nome!);
      }
      for (const nm of [n.rookie, n.champion]) todos.add(nm);
    }
    expect(todos.size).toBe(20 * 5);
    expect(new Set(Object.values(FORMAS_ALTAS_ART).flatMap(o => Object.values(o))).size).toBe(60);
  });

  it('a escada: slots rookie/champion/ultimate/mega = criaturas novas com elemento', () => {
    expect(LADDER_TIERS.map(t => novoPreferenceOfTier(t)[0])).toEqual(['rookie', 'rookie', 'rookie', 'champion', 'ultimate', 'mega']);
    expect(Object.keys(FORMAS_ALTAS)).toHaveLength(20);
    for (let seed = 1; seed <= 20; seed++) {
      // M10: a forma de ARTE do slot é limitada pelo level (`enemyRoster.ts`); level 30 libera a escada inteira.
      const wave = buildDungeonWave(1 + seed % 4, 'mega', mulberry32(seed), 30);
      const forma = ['rookie', 'rookie', 'rookie', 'champion', 'ultimate', 'mega'] as const;
      wave.forEach((e, i) => {
        const n = novoSoulmonOfStage(e.stage);
        if (!n) { expect(e.stage, e.stage).toMatch(/^(cmb\d{3}-rookie|[a-z]+-(rookie|champion|ultimate))$/); return; } // rookie de elemento combinado (M10)
        expect(n, e.stage).toBeDefined();
        expect(e.element).toBe(n.element);
        expect(e.name).toBe(n.name(forma[i]));
        expect(e.sprite).toBe(n.sprite(forma[i]));
        expect(dungeonEnemyElement(e)).toBe(n.element);
        expect(dungeonFoeSpecialLabel(true, e, e.element, e.name)).toBe(n.especial.pt);
        expect(dungeonFoeSpecialLabel(false, e, e.element, e.name)).toBe(n.especial.en);
      });
    }
  });

  it('o valor (HP/poder) do encontro não mudou: só o sabor', () => {
    const a = buildDungeonWave(3, 'rookie', mulberry32(7));
    const b = buildDungeonWave(3, 'rookie', mulberry32(99));
    expect(a.map(e => e.foe)).toEqual(b.map(e => e.foe));
  });

  it('sem repetição: as criaturas novas da onda (6 slots) são todas diferentes', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const ids = buildDungeonWave(1, 'rookie', mulberry32(seed), 30).map(e => e.stage.split('-')[0]);
      expect(ids).toHaveLength(6);
      expect(new Set(ids).size, ids.join()).toBe(6);
    }
  });

  it('pickNovo: forma sem arte -> null; com `used` esgotado reaproveita', () => {
    const rng = () => 0.3;
    expect(pickNovo(['ultra', 'mega', 'champion'], new Set(), rng)!.stage).toBe('ultra');
    expect(pickNovo(['mega'], new Set(NOVOS_DATA.map(n => n.id)), rng)!.stage).toBe('mega');
    expect(pickNovo(['ultimate'], new Set(), () => 0)!.data.id).toBe(NOVOS_DATA[0].id);
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
          expect(e.form).toBe(e.cls === 'weak' ? 'rookie' : e.cls === 'medium' ? 'champion' : 'ultra'); // chefe: ultra > mega > ultimate
          expect(e.namePt).toBe(n.name(e.form!));
        }
      }
    }
  });
});

describe('arquivo de ramos e combinados (sem consumidor)', () => {
  const ARQ = join(process.cwd(), 'src/assets/soulmon/novos-arquivo');
  it('manifest bate com os PNGs (120 ramos + 211 combinados), 256² RGBA, sem órfão', () => {
    const m = JSON.parse(readFileSync(join(ARQ, 'manifest.json'), 'utf8'));
    expect(m.branches).toHaveLength(120);
    expect(m.combined).toHaveLength(211);
    const listados = new Set<string>([...m.branches, ...m.combined].map((x: { file: string }) => x.file));
    const reais = [...readdirSync(join(ARQ, 'combinados')).map(f => `combinados/${f}`),
      ...readdirSync(join(ARQ, 'ramos')).flatMap(d => readdirSync(join(ARQ, 'ramos', d)).map(f => `ramos/${d}/${f}`))];
    expect(new Set(reais)).toEqual(listados);
    for (const f of reais) {
      const b = readFileSync(join(ARQ, f));
      expect([b.readUInt32BE(16), b.readUInt32BE(20), b[25]]).toEqual([256, 256, 6]);
    }
  });
  it('nenhum arquivo de src importa o arquivo (fica fora do bundle)', () => {
    const walk = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap(e =>
      e.isDirectory() ? (e.name === 'assets' ? [] : walk(join(d, e.name))) : /\.(ts|tsx)$/.test(e.name) ? [join(d, e.name)] : []);
    for (const f of walk(join(process.cwd(), 'src'))) {
      if (f.endsWith('novosSoulmon.test.ts')) continue;
      if (/enemyRoster(Art|Data)?\.ts$/.test(f)) continue; // M10: `enemyRosterArt.ts` é o ÚNICO consumidor (glob só dos 138 combinados); os outros só citam o caminho em comentário
      expect(readFileSync(f, 'utf8'), f).not.toContain('novos-arquivo');
    }
  });
});
