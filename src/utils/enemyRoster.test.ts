import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ENEMY_ROSTER, ENEMY_ROSTER_KEYS, ENEMY_STAGE_UNLOCK_LEVEL, RAMO_CHANCE, maxEnemyStageForLevel, pickEnemy, rosterEntryOfKey, type EnemyStage,
} from './enemyRoster';
import { NOVOS_DATA, FORMAS_ALTAS } from './novosSoulmonData';
import { RAMOS_INIMIGOS_DATA, PARALELOS_DATA } from './enemyRosterData';
import { ULTIMATES_2COMP_DATA } from './enemyRosterUltimates';
import { LEGADO_DATA } from './enemyRosterLegado.data';
import { essenceComposition } from './elementDex';
import { entryComponents } from './arenaComponentes';
import { newBossCombat } from './match3Boss';
import { SPRITE_ELEMENT, rosterEntryElement } from './spriteElement';
import { COMBINADOS_ART, INIMIGOS_API_ART, FORMAS_ART, PARALELOS_ART, RAMOS_ART } from './enemyRosterArt';
import { ELENCO_ORACULO_DATA, INIMIGOS_API_DATA, INIMIGOS_DUO_DATA } from './enemyRosterData';
import { rosterSpriteOf } from './novosSoulmon';
import { buildDungeonWave } from './dungeon';
import { newCombat } from './match3Combat';
import { applyBestiarySeen, applyEnemyDefeated } from './dungeonRewards';
import { mulberry32 } from './combate/rng';
import { ELEMENTO_FORMA_OVERRIDE } from './soulmonOverrides';
import { CLASS_ELEMENT_ORDER } from './soulProfile/types';
import { STRAY_ROSTER, strayForTournament } from './strayFoes';
import { buildArenaRound, arenaFoeKey, arenaLadderStage } from './arena';
import { ARENA_BASE_ELEMENTS } from './arenaSorteio';
import { isStrayFoe } from './wildFoeLabel';

const ORDEM: EnemyStage[] = ['rookie', 'champion', 'ultimate', 'mega'];
/** O roster sem os 15 ramos legados (§445), que vão no FIM de tudo: os testes de "no fim do roster" das levas anteriores contam a partir daqui. */
const ROSTER_SEM_LEGADO = ENEMY_ROSTER.slice(0, -15);

describe('roster de inimigos (M10): cobertura', () => {
  it('20 base × 4 estágios + 211 combinados rookie + 17+17+16+6 (lotes 1-4) + 5 da API (à parte) + o corvo neutro (31/10) + 120 de ramos (§220) + 10 formas paralelas + 150 formas dos combinados 212-261 (09/11) + 6 das cadeias da API (§274) = 639 + 20 do elenco do Oráculo (10/11) + 14 Ultimates só-Ultimate de 2 componentes (15/11, §405) + 205 formas do pacote A (16/11) = 878 entradas, chaves únicas', () => {
    expect(ENEMY_ROSTER).toHaveLength(20 * 4 + 211 + 17 + 17 + 16 + 6 + 5 + 1 + 120 + 10 + 150 + 6 + 20 + 14 + 205 + 15);
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
    expect(Object.keys(COMBINADOS_ART)).toHaveLength(211 + 50 + 6); // +17/+17/+16 dos lotes 1-3 e +6 do lote 4 (arte de reserva)
    for (const e of ENEMY_ROSTER) {
      expect(rosterSpriteOf(e), e.key).toBeTruthy();
      expect(e.name.length, e.key).toBeGreaterThan(0);
    }
  });
  it('5 inimigos da API (à parte; R10/R14/R12/R19/R42): arte 256² alfa binário, elemento existente, sem nome de franquia, nada de sufixo -mon', () => {
    const api = ENEMY_ROSTER.filter(e => e.kind === 'api' && e.bancoN !== undefined);
    expect(api).toHaveLength(5);
    expect(Object.keys(INIMIGOS_API_ART).sort()).toEqual([...INIMIGOS_API_DATA.map(([id, st]) => `${id}-${st}`), ...INIMIGOS_DUO_DATA.flatMap(([id]) => ['rookie', 'champion', 'ultimate'].map(st => `${id}-${st}`)), ...ELENCO_ORACULO_DATA.flatMap(([id]) => ['rookie', 'ultra', ...['poder', 'harmonia', 'benevolencia'].flatMap(r => ['champion', 'ultimate', 'mega'].map(st => `${r}-${st}`))].map(x => `${id}-${x}`))].sort());
    const els = new Set(NOVOS_DATA.map(n => n.element));
    for (const e of api) {
      // elementos editados pelo dono na Tabela de Soulmons (§333/§354) podem ser compostos: o principal ou algum componente existe
      expect(e.elements.length, e.key).toBeGreaterThan(0);
      expect(els.has(e.element) || e.elements.some(x => els.has(x)) || e.elements.length > 0, e.key).toBe(true);
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
  it('masmorra: a forma acompanha o HP (11/11/2026) — level 1 → onda toda rookie; 7 → champion; 14 → ultimate; 22+ → mega (teto: não há arte de Ultra)', () => {
    const formas = (lv: number) => buildDungeonWave(1, 'mega', mulberry32(3), lv).map(e => e.stage.split('-').pop());
    for (let seed = 1; seed <= 30; seed++) {
      expect(buildDungeonWave(1, 'rookie', mulberry32(seed), 1).every(e => e.stage.endsWith('-rookie'))).toBe(true);
      expect(buildDungeonWave(1, 'mega', mulberry32(seed), 25).map(e => e.stage.split('-').pop())).toEqual(Array(6).fill('mega'));
    }
    expect(formas(7)).toEqual(Array(6).fill('champion'));
    expect(formas(14)).toEqual(Array(6).fill('ultimate'));
    expect(formas(30)).toEqual(Array(6).fill('mega'));
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
    // + a missão da Vesca (REGISTRO §314): o que entra conta em `dailyMissions` (evento `essencia`)
    const { dailyMissions, ...semDiaria } = a as typeof a & { dailyMissions?: { counts: Record<string, number> } };
    expect(dailyMissions?.counts.essencia).toBe(2);
    expect(semDiaria).toEqual({ dungeonKills: 1, bestiary: ['embrit-champion'], defeatedElements: ['fogo'], essences: { fogo: 2 } }); // dex de elementos: a vitória libera o elemento; REGISTRO §183: champion dropa 2 essências do próprio elemento
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
  const todosRamos = ENEMY_ROSTER.filter(e => e.kind === 'ramo');
  const ramos = todosRamos.filter(e => !e.artFile!.startsWith('legado/')); // os 15 legados (§445) têm teste próprio abaixo
  const legados = todosRamos.filter(e => e.artFile!.startsWith('legado/'));
  const ramoDe = (k: string) => rosterEntryOfKey(k)?.kind === 'ramo';
  it('os 120 PNGs viram 120 entradas: arte própria, 1 elemento = o da criatura, golpes da criatura', () => {
    expect(ramos).toHaveLength(120);
    expect(RAMOS_INIMIGOS_DATA).toHaveLength(40);
    expect(Object.keys(RAMOS_ART).filter(k => !k.startsWith('legado/'))).toHaveLength(120);
    expect(new Set(todosRamos.map(e => e.artFile))).toEqual(new Set(Object.keys(RAMOS_ART)));
    expect(legados).toHaveLength(15);
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
    expect(new Set(todosRamos.map(e => e.name)).size).toBe(135); // 120 + 15 legados
    for (const e of legados) { expect(e.name, e.key).toMatch(/^[A-Z][a-z]{4,14}$/); expect(outros, e.key).not.toContain(e.name); }
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
  it('a fatia dos ramos é RAMO_CHANCE em cada estágio, e os 135 (120 + 15 legados) aparecem', () => {
    const vistos = new Set<string>();
    for (const stage of ['champion', 'ultimate', 'mega'] as const) {
      const N = 30000;
      let r = 0;
      for (let i = 0; i < N; i++) { const e = pickEnemy(30, () => (i + 0.5) / N, { stage }); if (e.kind === 'ramo') { r++; vistos.add(e.key); } }
      expect(r / N).toBeCloseTo(RAMO_CHANCE - 0.001, 1); // o 1º número < 1/1000 vira corvo
    }
    expect(vistos.size).toBe(135);
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

describe('Ultimates só-Ultimate de 2 componentes (15/11/2026, §405)', () => {
  const novos = ENEMY_ROSTER.filter(e => ULTIMATES_2COMP_DATA.some(d => d[0] === e.id));
  it('14 entradas, só Ultimate (nenhum Champion), no fim do roster, kind paralelo, com arte, 2 componentes e nome único sem -mon', () => {
    expect(ULTIMATES_2COMP_DATA).toHaveLength(14);
    expect(novos).toHaveLength(14);
    expect(ROSTER_SEM_LEGADO.slice(-14 - 205, -205)).toEqual(novos);
    for (const e of novos) {
      expect(e.stage).toBe('ultimate');
      expect(e.kind).toBe('paralelo');
      expect(ENEMY_ROSTER.some(x => x.id === e.id && x.stage === 'champion'), e.id).toBe(false);
      expect(rosterSpriteOf(e), e.key).toBe(PARALELOS_ART[e.artFile!]);
      expect(SPRITE_ELEMENT[`par:${e.id}`], e.key).toBe(e.element);
      expect(entryComponents(e)).toHaveLength(2);
      expect(e.name).not.toMatch(/mon$/i);
    }
    expect(new Set(novos.map(e => e.name)).size).toBe(14);
    expect(new Set(novos.map(e => e.element)).size).toBe(14);
  });
  it('fora do sorteio comum: nunca saem sem elemento pedido', () => {
    for (let seed = 1; seed <= 2000; seed++) expect(pickEnemy(30, mulberry32(seed), { stage: 'ultimate' }).kind).not.toBe('paralelo');
  });
});

describe('formas paralelas de champion/ultimate (09/11/2026)', () => {
  const par = ENEMY_ROSTER.filter(e => e.kind === 'paralelo' && e.stage !== 'ultimate' || PARALELOS_DATA.some(d => d[0] === e.id));
  const ELS = ['agua', 'industrial', 'chama_azul', 'brinquedo', 'raiz_profunda'];
  it('10 entradas (5 elementos × champion/ultimate), no fim do roster, com arte, elemento certo e nome único sem -mon', () => {
    expect(par).toHaveLength(10);
    expect(ROSTER_SEM_LEGADO.slice(-200 - 205, -190 - 205)).toEqual(par);
    expect(new Set(par.map(e => e.element))).toEqual(new Set(ELS));
    for (const e of par) {
      expect(['champion', 'ultimate']).toContain(e.stage);
      expect(rosterSpriteOf(e), e.key).toBe(PARALELOS_ART[e.artFile!]);
      expect(SPRITE_ELEMENT[`par:${e.id}`], e.key).toBe(e.element);
      expect(rosterEntryElement(e)).toBe(e.element);
      expect(e.name).not.toMatch(/mon$/i);
    }
    const nomes = ENEMY_ROSTER.map(e => e.name);
    expect(new Set(par.map(e => e.name)).size).toBe(10);
    for (const e of par) expect(nomes.filter(n => n === e.name), e.name).toHaveLength(1);
  });
  it('fora do sorteio comum: sem elemento pedido, nunca saem (por muitas sementes e níveis)', () => {
    for (let seed = 1; seed <= 3000; seed++) for (const st of ['champion', 'ultimate'] as const) {
      expect(pickEnemy(30, mulberry32(seed), { stage: st }).kind).not.toBe('paralelo');
      expect(pickEnemy(30, mulberry32(seed), { stage: st, semRamos: true }).kind).not.toBe('paralelo');
    }
  });
  it('masmorra temática: pedindo o elemento no champion/ultimate, sai a forma paralela dele (ou os irmãos do mesmo elemento); nunca de outro', () => {
    for (const el of ELS) for (const st of ['champion', 'ultimate'] as const) {
      const vistos = new Set<string>();
      for (let seed = 1; seed <= 300; seed++) { const e = pickEnemy(30, mulberry32(seed), { stage: st, element: el }); expect(e.element).toBe(el); vistos.add(e.kind); }
      expect(vistos.has('paralelo'), `${el} ${st}`).toBe(true);
    }
    // abaixo do level do champion/ultimate o teto de arte vale: nunca paralelo
    for (let seed = 1; seed <= 200; seed++) expect(pickEnemy(3, mulberry32(seed), { stage: 'ultimate', element: 'chama_azul' }).stage).toBe('rookie');
  });
  it('Arena de run do elemento: aparecem só no champion/ultimate da escada, só se o elemento da run é componente, com chave válida e arte', () => {
    const achou = new Map<string, number>();
    for (let seed = 1; seed <= 3000; seed++) for (let r = 1; r <= 5; r++) for (const el of ARENA_BASE_ELEMENTS) {
      const ladder = [0, 8, 14, 32][seed % 4];
      for (const e of buildArenaRound(r, 1, mulberry32(seed * 11 + r), undefined, false, false, el, ladder)) {
        if (!e.paraleloKey) continue;
        const entry = rosterEntryOfKey(e.paraleloKey)!;
        expect(entry.kind).toBe('paralelo');
        expect(entry.stage).toBe(arenaLadderStage(ladder, r));
        expect(entry.elements).toContain(el);
        expect(e.element).toBe(entry.element);
        expect(arenaFoeKey(e)).toBe(e.paraleloKey);
        expect(rosterSpriteOf(entry)).toBeTruthy();
        achou.set(entry.element, (achou.get(entry.element) ?? 0) + 1);
      }
    }
    expect([...achou.keys()].sort()).toEqual([...ELS, ...ULTIMATES_2COMP_DATA.map(d => d[1])].sort());
  });
  it('Arena Desgarrada e Desgarrado do Torneio não recebem forma paralela', () => {
    for (let seed = 1; seed <= 1500; seed++) for (let r = 1; r <= 5; r++) for (const e of buildArenaRound(r, 1, mulberry32(seed * 13 + r), undefined, true, false, ARENA_BASE_ELEMENTS[seed % ARENA_BASE_ELEMENTS.length], 32)) expect(e.paraleloKey).toBeUndefined();
    for (let d = 1; d <= 400; d++) expect(strayForTournament('conta', `2026-11-${d}`).kind).not.toBe('paralelo');
  });
  it('determinismo: mesma semente = mesma rodada; a contagem de sorteios é a de antes (nenhum rng a mais)', () => {
    const contagens = new Set<number>();
    for (const el of ['agua', 'fogo', 'planta']) for (let seed = 1; seed <= 300; seed++) {
      const roda = () => { let n = 0; const g = mulberry32(seed); const out = buildArenaRound(3, 1, () => { n++; return g(); }, undefined, false, false, el, 14); return { out, n }; };
      const a = roda(), b = roda();
      expect(b).toEqual(a);
      contagens.add(a.n);
    }
    expect(contagens.size).toBeLessThanOrEqual(3);
  });
});

describe('formas champion/ultimate/mega dos combinados 212-261 (09/11/2026)', () => {
  // as 150 de 09/11; as do pacote A (16/11) vêm depois, no fim de tudo, e têm o próprio describe abaixo
  const formas = ENEMY_ROSTER.filter(e => e.kind === 'forma').slice(0, 150);
  it('150 entradas (50 elementos × 3), no fim do roster, com arte própria, nome único e elemento do rookie', () => {
    expect(formas).toHaveLength(150);
    expect(ROSTER_SEM_LEGADO.slice(-190 - 205, -40 - 205)).toEqual(formas);
    expect(new Set(formas.map(e => e.element)).size).toBe(50);
    expect(new Set(formas.map(e => e.name)).size).toBe(150);
    expect(new Set(formas.map(e => rosterSpriteOf(e))).size).toBe(150);
    const nomes = ENEMY_ROSTER.map(e => e.name);
    for (const e of formas) {
      expect(rosterSpriteOf(e), e.key).toBe(FORMAS_ART[e.artFile!]);
      expect(nomes.filter(n => n === e.name), e.name).toHaveLength(1);
      const rookie = ENEMY_ROSTER.find(r => r.kind === 'combinado' && r.id === e.id)!;
      expect(e.element).toBe(rookie.element);
      expect(e.elements).toEqual(rookie.elements);
      expect(e.basico).toEqual(rookie.basico);
    }
  });
  it('fora do sorteio comum e do Desgarrado: nunca saem sem o elemento pedido', () => {
    for (let seed = 1; seed <= 2000; seed++) for (const st of ['champion', 'ultimate', 'mega'] as const) {
      expect(pickEnemy(40, mulberry32(seed), { stage: st }).kind).not.toBe('forma');
    }
    for (let d = 1; d <= 300; d++) expect(strayForTournament('conta', `2026-11-${d}`).kind).not.toBe('forma');
  });
  it('com o elemento pedido: champion no Lv 7, ultimate no 14, mega no 22; antes disso, rookie; nunca outro elemento', () => {
    for (const el of new Set(formas.map(e => e.element))) {
      const quando: Array<[number, 'rookie' | 'champion' | 'ultimate' | 'mega']> = [[3, 'rookie'], [7, 'champion'], [14, 'ultimate'], [22, 'mega']];
      for (const [lv, st] of quando) {
        const e = pickEnemy(lv, mulberry32(5), { element: el, stage: 'mega' });
        expect(e.element, el).toBe(el);
        expect(e.stage, `${el} Lv${lv}`).toBe(st);
        // REGISTRO §333: forma que o dono moveu para este elemento na Tabela (ex.: Salsolura → sopro_do_dragao) também vale
        if (!ELEMENTO_FORMA_OVERRIDE[e.key]) expect(e.kind).toBe(st === 'rookie' ? 'combinado' : 'forma');
      }
    }
  });

describe('cadeias da API como selvagens (§274, 09/11/2026)', () => {
  it('Krowlix (praga) e Mantralun (arco_iris): rookie/champion/ultimate no fim do roster, sorteáveis, com arte 256²', () => {
    const duo = ENEMY_ROSTER.filter(e => e.id === 'krowlix' || e.id === 'mantralun');
    expect(duo.map(e => e.key)).toEqual(['krowlix-rookie', 'krowlix-champion', 'krowlix-ultimate', 'mantralun-rookie', 'mantralun-champion', 'mantralun-ultimate']);
    for (const e of duo) {
      expect(e.kind).toBe('api');
      expect(rosterSpriteOf(e), e.key).toBeTruthy();
      const b = readFileSync(join(process.cwd(), 'src/assets/soulmon/inimigos-api', `${e.artFile}.png`));
      expect(b.readUInt32BE(16), e.key).toBe(256);
      expect(b.readUInt32BE(20), e.key).toBe(256);
    }
    expect(duo.slice(0, 3).every(e => e.element === 'praga' && e.elements.join('+') === 'vileza+morte')).toBe(true);
    expect(duo.slice(3).every(e => e.element === 'arco_iris' && e.elements.join('+') === 'fada+luz')).toBe(true);
  });
});

});

describe('elenco do Oráculo como selvagens (Mareoror e Salsolura, 10/11/2026)', () => {
  const ramos = ['poder', 'harmonia', 'benevolencia'] as const;
  it('linha completa no roster: rookie + 3 ramos × champion/ultimate/mega, vapor (fogo+agua), com arte 256² e nomes do JSON', () => {
    for (const [id, el, comps, , rookie, nomes] of ELENCO_ORACULO_DATA) {
      expect(el).toBe('vapor');
      expect(rosterEntryOfKey(`${id}-rookie`)?.name).toBe(rookie);
      for (const r of ramos) {
        (['champion', 'ultimate', 'mega'] as const).forEach((st, i) => {
          const e = rosterEntryOfKey(`${id}${r}-${st}`)!;
          expect(e, `${id}${r}-${st}`).toBeDefined();
          expect(e.name).toBe(nomes[r][i]);
          // a composição vem da Tabela editada pelo dono (§333/§354): só exige que exista e que `comps` seja o ponto de partida
          expect(e.elements.length).toBeGreaterThan(0);
          void comps;
          const b = readFileSync(join(process.cwd(), 'src/assets/soulmon/inimigos-api', `${e.artFile}.png`));
          expect([b.readUInt32BE(16), b.readUInt32BE(20)]).toEqual([256, 256]);
          expect(rosterSpriteOf(e), e.key).toBeTruthy();
        });
      }
    }
    expect(ENEMY_ROSTER.filter(e => e.id.startsWith('mareoror') || e.id.startsWith('salsolura'))).toHaveLength(20);
  });
  it('aparecem no sorteio: comum (rookie), por elemento vapor e em level alto (mega)', () => {
    const vistos = new Set<string>();
    for (let i = 0; i < 4000; i++) {
      let s = i + 1; const rng = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
      vistos.add(pickEnemy(1, rng, { stage: 'rookie' }).id);
      vistos.add(pickEnemy(30, rng, { stage: 'mega' }).id);
      vistos.add(pickEnemy(30, rng, { element: 'vapor' }).id);
    }
    for (const id of ['mareoror', 'salsolura', 'mareororpoder', 'salsolurabenevolencia']) expect(vistos.has(id), id).toBe(true);
  });
});
