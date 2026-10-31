import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ENEMY_ROSTER, ENEMY_ROSTER_KEYS, ENEMY_STAGE_UNLOCK_LEVEL, maxEnemyStageForLevel, pickEnemy, rosterEntryOfKey, type EnemyStage,
} from './enemyRoster';
import { NOVOS_DATA } from './novosSoulmonData';
import { COMBINADOS_ART, INIMIGOS_API_ART } from './enemyRosterArt';
import { INIMIGOS_API_DATA } from './enemyRosterData';
import { rosterSpriteOf } from './novosSoulmon';
import { buildDungeonWave } from './dungeon';
import { newCombat } from './match3Combat';
import { applyBestiarySeen, applyEnemyDefeated } from './dungeonRewards';
import { mulberry32 } from './combate/rng';
import { CLASS_ELEMENT_ORDER } from './soulProfile/types';
import { STRAY_ROSTER } from './strayFoes';
import { isStrayFoe } from './wildFoeLabel';

const ORDEM: EnemyStage[] = ['rookie', 'champion', 'ultimate', 'mega'];

describe('roster de inimigos (M10): cobertura', () => {
  it('20 base × 4 estágios + 211 combinados rookie + 5 da API (à parte), chaves únicas', () => {
    expect(ENEMY_ROSTER).toHaveLength(20 * 4 + 211 + 16 + 5);
    expect(ENEMY_ROSTER_KEYS.size).toBe(ENEMY_ROSTER.length);
    expect(ENEMY_ROSTER.filter(e => e.kind === 'combinado').every(e => e.stage === 'rookie' && e.elements.length === 2)).toBe(true);
  });
  it('distribuição: cada elemento base tem 1 representante (20 distintos); os da API ficam à parte e não entram na conta', () => {
    const base = ENEMY_ROSTER.filter(e => e.kind === 'base' && e.stage === 'rookie');
    expect(base).toHaveLength(20);
    expect(new Set(base.map(e => e.element)).size).toBe(20);
    expect(new Set(base.map(e => e.id)).size).toBe(20);
    expect(ENEMY_ROSTER.filter(e => e.kind === 'api').every(e => e.kind === 'api')).toBe(true);
  });
  it('todo elemento base aparece em todos os estágios; toda entrada tem arte e nome', () => {
    for (const n of NOVOS_DATA) for (const s of ORDEM) expect(rosterEntryOfKey(`${n.id}-${s}`), `${n.id}-${s}`).toBeDefined();
    expect(Object.keys(COMBINADOS_ART)).toHaveLength(211 + 16); // +16 do lote 3 (arte de reserva)
    for (const e of ENEMY_ROSTER) {
      expect(rosterSpriteOf(e), e.key).toBeTruthy();
      expect(e.name.length, e.key).toBeGreaterThan(0);
    }
  });
  it('5 inimigos da API (à parte; R10/R14/R12/R19/R42): arte 256² alfa binário, elemento existente, sem nome de franquia, nada de sufixo -mon', () => {
    const api = ENEMY_ROSTER.filter(e => e.kind === 'api');
    expect(api).toHaveLength(5);
    expect(Object.keys(INIMIGOS_API_ART).sort()).toEqual(INIMIGOS_API_DATA.map(([id, st]) => `${id}-${st}`).sort());
    const els = new Set(NOVOS_DATA.map(n => n.element));
    for (const e of api) {
      expect(els.has(e.element), e.key).toBe(true);
      expect(e.name, e.key).not.toMatch(/mon$/i);
      expect(rosterSpriteOf(e), e.key).toBe(INIMIGOS_API_ART[e.artFile!]);
    }
    expect(new Set(api.map(e => e.key)).size).toBe(5);
    // poda de 27/10: só os 7 códigos escolhidos pelo dono (5 no roster); nada podado volta
    expect(api.map(e => e.key).sort()).toEqual(['ashimp-rookie', 'cinderkit-champion', 'gloomhorn-champion', 'tailhorn-rookie', 'tidewark-ultimate']);
    expect(api.map(e => e.bancoN).sort()).toEqual([736, 739, 746, 749, 823]);
    for (const [id, st] of INIMIGOS_API_DATA) {
      const b = readFileSync(join(process.cwd(), 'src/assets/soulmon/inimigos-api', `${id}-${st}.png`));
      expect([b.readUInt32BE(16), b.readUInt32BE(20), b[25]], `${id}-${st}`).toEqual([256, 256, 6]);
    }
  });
  it('a chave do bestiário não tem hífen no id e cobre elemento+estágio', () => {
    for (const e of ENEMY_ROSTER) {
      expect(e.id).not.toContain('-');
      expect(e.key).toBe(`${e.id}-${e.stage}`);
    }
  });
});

describe('roster de inimigos (M10): progressão', () => {
  it('limiares: champion 7, ultimate 14, mega 22', () => {
    expect(ENEMY_STAGE_UNLOCK_LEVEL).toEqual({ rookie: 1, champion: 7, ultimate: 14, mega: 22 });
    expect([1, 6, 7, 13, 14, 21, 22, 40].map(maxEnemyStageForLevel)).toEqual(['rookie', 'rookie', 'champion', 'champion', 'ultimate', 'ultimate', 'mega', 'mega']);
    expect(maxEnemyStageForLevel(NaN)).toBe('rookie');
  });
  it('level baixo NUNCA sorteia champion+, mesmo pedindo mega (e sem pedir)', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const r = mulberry32(seed);
      expect(pickEnemy(6, r, { stage: 'mega' }).stage).toBe('rookie');
      expect(pickEnemy(1, r).stage).toBe('rookie');
    }
  });
  it('cada limiar abre o estágio, e só ele', () => {
    const vistos = (lv: number) => new Set(Array.from({ length: 400 }, (_, i) => pickEnemy(lv, mulberry32(i + 1)).stage));
    expect([...vistos(7)].sort()).toEqual(['champion', 'rookie']);
    expect([...vistos(14)].sort()).toEqual(['champion', 'rookie', 'ultimate']);
    expect([...vistos(22)].sort()).toEqual(['champion', 'mega', 'rookie', 'ultimate']);
  });
  it('rookie sorteia também os combinados; `used` evita repetir', () => {
    const ids = new Set<string>();
    for (let i = 1; i <= 400; i++) ids.add(pickEnemy(1, mulberry32(i)).kind);
    expect([...ids].sort()).toEqual(['api', 'base', 'combinado']);
    const used = new Set(ENEMY_ROSTER.filter(e => e.stage === 'rookie').slice(1).map(e => e.id));
    expect(pickEnemy(1, () => 0, { used }).id).toBe(ENEMY_ROSTER.filter(e => e.stage === 'rookie')[0].id);
  });
  it('masmorra: level 1 → onda toda rookie; level 22+ → a escada sobe até mega', () => {
    for (let seed = 1; seed <= 30; seed++) {
      expect(buildDungeonWave(1, 'rookie', mulberry32(seed), 1).every(e => e.stage.endsWith('-rookie'))).toBe(true);
      const alta = buildDungeonWave(1, 'mega', mulberry32(seed), 25).map(e => e.stage.split('-').pop());
      expect(alta).toEqual(['rookie', 'rookie', 'rookie', 'champion', 'ultimate', 'mega']);
    }
  });
  it('masmorra: toda `stage` da onda é chave válida do roster (entra no bestiário)', () => {
    for (let seed = 1; seed <= 50; seed++) for (const e of buildDungeonWave(2, 'mega', mulberry32(seed), 30)) expect(ENEMY_ROSTER_KEYS.has(e.stage), e.stage).toBe(true);
  });
  it('Elemental Fusion: com level, os 3 inimigos vêm do roster respeitando o teto; sem level, nada muda', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const c = newCombat(mulberry32(seed), ['a', 'b', 'c'], undefined, 1);
      for (const e of c.enemies) expect(rosterEntryOfKey(e.roster)?.stage).toBe('rookie');
      expect(new Set(c.enemies.map(e => rosterEntryOfKey(e.roster)!.id)).size).toBe(3);
    }
    expect(newCombat(mulberry32(5), ['a', 'b', 'c']).enemies.every(e => e.roster === undefined)).toBe(true);
    expect(newCombat(mulberry32(5), ['a', 'b', 'c'], undefined, 30).enemies.map(e => rosterEntryOfKey(e.roster)!.stage)).toEqual(['rookie', 'champion', 'ultimate']);
  });
});

describe('bestiário (M10)', () => {
  it('abate grava a chave elemento+estágio; visto sem abate não mexe em dungeonKills; ambos idempotentes', () => {
    const base = { dungeonKills: 0, bestiary: [] as string[] };
    const a = applyEnemyDefeated(base, 'embrit-champion');
    expect(a).toEqual({ dungeonKills: 1, bestiary: ['embrit-champion'], defeatedElements: ['fogo'], essences: { fogo: 2 } }); // dex de elementos: a vitória libera o elemento; REGISTRO §183: champion dropa 2 essências do próprio elemento
    const b = applyBestiarySeen(a, 'cmb003-rookie');
    expect(b.dungeonKills).toBe(1);
    expect(b.bestiary).toEqual(['embrit-champion', 'cmb003-rookie']);
    expect(applyBestiarySeen(b, 'cmb003-rookie')).toBe(b);
    expect(applyBestiarySeen(b, undefined)).toBe(b);
  });
});

describe('contrato: elemento x criatura base (selvagem/desgarrado)', () => {
  const base = ENEMY_ROSTER.filter(e => e.kind === 'base');
  it('cada um dos 20 elementos base tem EXATAMENTE 1 criatura base, sem repetição', () => {
    expect(CLASS_ELEMENT_ORDER).toHaveLength(20);
    expect(NOVOS_DATA).toHaveLength(20);
    for (const el of CLASS_ELEMENT_ORDER) expect(NOVOS_DATA.filter(n => n.element === el), el).toHaveLength(1);
    expect(new Set(NOVOS_DATA.map(n => n.element))).toEqual(new Set(CLASS_ELEMENT_ORDER));
  });
  it('cada elemento tem a criatura em todos os estágios selvagens (rookie/champion) e desgarrados (ultimate/mega)', () => {
    for (const el of CLASS_ELEMENT_ORDER) {
      const doEl = base.filter(e => e.element === el);
      expect(new Set(doEl.map(e => e.id)).size, el).toBe(1);
      expect(doEl.filter(e => !isStrayFoe(e.stage)).length, el).toBeGreaterThanOrEqual(2);
      expect(doEl.filter(e => isStrayFoe(e.stage)).length, el).toBeGreaterThanOrEqual(2);
      expect(STRAY_ROSTER.some(e => e.element === el), el).toBe(true);
    }
  });
  it('os 211 combinados e os 5 da API só usam elementos base válidos', () => {
    const ok = new Set<string>(CLASS_ELEMENT_ORDER);
    for (const e of ENEMY_ROSTER.filter(x => x.kind !== 'base')) for (const el of e.elements) expect(ok.has(el), `${e.key} ${el}`).toBe(true);
  });
});
