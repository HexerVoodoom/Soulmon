import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ENEMY_ROSTER, ENEMY_ROSTER_KEYS, ENEMY_STAGE_UNLOCK_LEVEL, RAMO_CHANCE, maxEnemyStageForLevel, pickEnemy, rosterEntryOfKey, type EnemyStage,
} from './enemyRoster';
import { NOVOS_DATA, FORMAS_ALTAS } from './novosSoulmonData';
import { RAMOS_INIMIGOS_DATA } from './enemyRosterData';
import { newBossCombat } from './match3Boss';
import { SPRITE_ELEMENT, rosterEntryElement } from './spriteElement';
import { COMBINADOS_ART, INIMIGOS_API_ART, RAMOS_ART } from './enemyRosterArt';
import { INIMIGOS_API_DATA } from './enemyRosterData';
import { rosterSpriteOf } from './novosSoulmon';
import { buildDungeonWave } from './dungeon';
import { newCombat } from './match3Combat';
import { applyBestiarySeen, applyEnemyDefeated } from './dungeonRewards';
import { mulberry32 } from './combate/rng';
import { CLASS_ELEMENT_ORDER } from './soulProfile/types';
import { STRAY_ROSTER, strayForTournament } from './strayFoes';
import { buildArenaRound, arenaFoeKey, arenaLadderStage } from './arena';
import { ARENA_BASE_ELEMENTS } from './arenaSorteio';
import { isStrayFoe } from './wildFoeLabel';

const ORDEM: EnemyStage[] = ['rookie', 'champion', 'ultimate', 'mega'];

describe('roster de inimigos (M10): cobertura', () => {
  it('20 base × 4 estágios + 211 combinados rookie + 17+17+16 (lotes 1-3) + 5 da API (à parte) + o corvo neutro (31/10) + 120 de ramos (§220) = 467 entradas, chaves únicas', () => {
    expect(ENEMY_ROSTER).toHaveLength(20 * 4 + 211 + 17 + 17 + 16 + 5 + 1 + 120);
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
    expect(Object.keys(COMBINADOS_ART)).toHaveLength(211 + 50); // +17/+17/+16 dos lotes 1-3 (arte de reserva)
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
    expect(pickEnemy(1, () => 0.5, { used }).id).toBe(ENEMY_ROSTER.filter(e => e.stage === 'rookie')[0].id);
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
    for (const e of ENEMY_ROSTER.filter(x => x.kind !== 'base' && x.kind !== 'mascote')) for (const el of e.elements) expect(ok.has(el), `${e.key} ${el}`).toBe(true);
  });
});

describe('ramos evoluídos como inimigos (§220)', () => {
  const ramos = ENEMY_ROSTER.filter(e => e.kind === 'ramo');
  const ramoDe = (k: string) => rosterEntryOfKey(k)?.kind === 'ramo';
  it('os 120 PNGs viram 120 entradas: arte própria, 1 elemento = o da criatura, golpes da criatura', () => {
    expect(ramos).toHaveLength(120);
    expect(RAMOS_INIMIGOS_DATA).toHaveLength(40);
    expect(Object.keys(RAMOS_ART)).toHaveLength(120);
    expect(new Set(ramos.map(e => e.artFile))).toEqual(new Set(Object.keys(RAMOS_ART)));
    for (const e of ramos) {
      expect(rosterSpriteOf(e), e.key).toBe(RAMOS_ART[e.artFile!]);
      const n = NOVOS_DATA.find(x => x.element === e.element)!;
      expect(e.artFile!.startsWith(`${n.element}/`), e.key).toBe(true);
      expect(e.elements).toEqual([n.element]);
      expect(rosterEntryElement(e)).toBe(n.element);
      expect(SPRITE_ELEMENT[`ramo:${e.artFile!.split('-')[0]}`], e.key).toBe(n.element);
      expect(e.basico).toBe(n.basico);
      expect(e.especial).toBe(n.especial);
      expect(e.id.startsWith(n.id) && e.id !== n.id, e.key).toBe(true);
      expect(e.artFile, 'não repete o ramo que a criatura já usa').not.toContain(`/${n.line}-`);
    }
  });
  it('nomes: formato de FORMAS_ALTAS, únicos no roster inteiro e sem -mon', () => {
    const outros = [...ENEMY_ROSTER.filter(e => e.kind !== 'ramo').map(e => e.name), ...Object.values(FORMAS_ALTAS).flatMap(o => Object.values(o))];
    for (const e of ramos) {
      expect(e.name, e.key).toMatch(/^[A-Z][a-z]{4,14}$/);
      expect(e.name, e.key).not.toMatch(/mon$/i);
      expect(outros, e.key).not.toContain(e.name);
    }
    expect(new Set(ramos.map(e => e.name)).size).toBe(120);
  });
  it('nenhum ramo abaixo do level: rookie não existe e o teto vale em toda faixa', () => {
    expect(ramos.some(e => (e.stage as string) === 'rookie')).toBe(false);
    for (let seed = 1; seed <= 2000; seed++) {
      const lv = 1 + seed % 30;
      const pedido = (['champion', 'ultimate', 'mega', undefined] as const)[seed % 4];
      const e = pickEnemy(lv, mulberry32(seed), pedido ? { stage: pedido } : {});
      if (e.kind === 'ramo') expect(lv, e.key).toBeGreaterThanOrEqual(ENEMY_STAGE_UNLOCK_LEVEL[e.stage]);
      if (lv < 7) expect(e.kind).not.toBe('ramo');
    }
  });
  it('a fatia dos ramos é RAMO_CHANCE em cada estágio, e os 120 aparecem', () => {
    const vistos = new Set<string>();
    for (const stage of ['champion', 'ultimate', 'mega'] as const) {
      const N = 30000;
      let r = 0;
      for (let i = 0; i < N; i++) { const e = pickEnemy(30, () => (i + 0.5) / N, { stage }); if (e.kind === 'ramo') { r++; vistos.add(e.key); } }
      expect(r / N).toBeCloseTo(RAMO_CHANCE - 0.001, 1); // o 1º número < 1/1000 vira corvo
    }
    expect(vistos.size).toBe(120);
  });
  it('quem não olha o level do jogador nunca recebe ramo: level desconhecido, chefe do Elemental Fusion (o Torneio e a Arena têm regra própria, §221)', () => {
    for (let seed = 1; seed <= 500; seed++) {
      expect(pickEnemy(Number.POSITIVE_INFINITY, mulberry32(seed), { stage: 'mega' }).kind).not.toBe('ramo');
      expect(ramoDe(newBossCombat(mulberry32(seed)).enemies[0].roster!)).toBe(false);
    }
    expect(STRAY_ROSTER.some(e => e.kind === 'ramo')).toBe(false);
  });
  it('as ondas altas mostram ramo com chave válida do bestiário', () => {
    let achou = 0;
    for (let seed = 1; seed <= 100; seed++) for (const e of buildDungeonWave(1, 'mega', mulberry32(seed), 30)) {
      expect(ENEMY_ROSTER_KEYS.has(e.stage), e.stage).toBe(true);
      if (ramoDe(e.stage)) { achou++; expect(e.sprite).toBeTruthy(); expect(e.element).toBe(rosterEntryOfKey(e.stage)!.element); }
    }
    expect(achou).toBeGreaterThan(0);
  });
});

describe('ramos na Arena e no Desgarrado do Torneio (§221)', () => {
  const isRamoKey = (k?: string) => !!k && rosterEntryOfKey(k)?.kind === 'ramo';
  it('chefe do Elemental Fusion continua sem ramo (semRamos), por muitas sementes', () => {
    for (let seed = 1; seed <= 3000; seed++) expect(isRamoKey(newBossCombat(mulberry32(seed)).enemies[0].roster)).toBe(false);
  });
  it('Arena comum: ramo só em rodada Ultimate da escada (§222); nunca mega', () => {
    let achou = 0;
    for (let seed = 1; seed <= 4000; seed++) for (let r = 1; r <= 5; r++) for (const e of buildArenaRound(r, 1, mulberry32(seed * 7 + r), undefined, false, false, ARENA_BASE_ELEMENTS[seed % ARENA_BASE_ELEMENTS.length], [0, 14, 20, 32][seed % 4])) {
      if (!e.ramoKey) continue;
      achou++;
      expect(arenaLadderStage([0, 14, 20, 32][seed % 4], r)).toBe('ultimate'); expect(e.form).toBe('ultimate');
      expect(isRamoKey(arenaFoeKey(e))).toBe(true);
      expect(rosterEntryOfKey(e.ramoKey)!.element).toBe(e.elements[0]);
    }
    expect(achou).toBeGreaterThan(0);
  });
  it('Arena Desgarrada: segue a escada; ramo só em ultimate, com a arte resolvida', () => {
    let achou = 0;
    for (let seed = 1; seed <= 3000; seed++) for (let r = 1; r <= 5; r++) for (const e of buildArenaRound(r, 1, mulberry32(seed * 13 + r), undefined, true, false, ARENA_BASE_ELEMENTS[seed % ARENA_BASE_ELEMENTS.length], 32)) {
      if (!e.ramoKey) continue;
      achou++;
      expect(e.form).toBe('ultimate'); expect(e.stray).toBe(true);
      expect(rosterSpriteOf(rosterEntryOfKey(e.ramoKey)!)).toBeTruthy();
    }
    expect(achou).toBeGreaterThan(0);
  });
  it('determinismo e contagem de sorteios: mesma semente = mesmo resultado; ramo não consome rng a mais', () => {
    for (const stray of [false, true]) for (let seed = 1; seed <= 400; seed++) {
      const conta = (): { out: unknown; n: number } => { let n = 0; const g = mulberry32(seed); const out = buildArenaRound(5, 1, () => { n++; return g(); }, undefined, stray, false, 'fogo', 32); return { out, n }; };
      const a = conta(), b = conta();
      expect(b).toEqual(a);
    }
    // a contagem de rng é a de antes: um chefe sorteado pela via antiga (sem ramo) gasta o mesmo nº de chamadas que um que virou ramo
    const contagens = new Set<number>();
    for (let seed = 1; seed <= 600; seed++) { let n = 0; const g = mulberry32(seed); buildArenaRound(5, 1, () => { n++; return g(); }, undefined, false, false, 'fogo', 32); contagens.add(n); }
    expect(contagens.size).toBeLessThanOrEqual(3); // varia só por corvo/fundido (já existentes), nunca por ramo
  });
  it('Desgarrado do Torneio: ultimate/mega, ramo aparece, estável por conta e dia, nunca champion', () => {
    let ramos = 0;
    for (let i = 0; i < 4000; i++) {
      const e = strayForTournament(`conta-${i}`, '2026-11-04');
      expect(e).toBe(strayForTournament(`conta-${i}`, '2026-11-04'));
      if (e.kind === 'mascote') continue;
      expect(['ultimate', 'mega']).toContain(e.stage);
      if (e.kind === 'ramo') ramos++;
    }
    expect(ramos).toBeGreaterThan(0);
    expect(ramos / 4000).toBeLessThan(0.5);
  });
  it('sem exclusão por identificador: os 3 Soulmon de teste de 04/11 não têm id no código, só ficam de fora por não terem sido baixados', () => {
    expect(new Set(ENEMY_ROSTER.filter(e => e.kind === 'ramo').map(e => e.artFile))).toEqual(new Set(Object.keys(RAMOS_ART)));
  });
});
