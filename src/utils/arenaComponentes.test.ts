// 15/11/2026 (dono): o Ultimate da Arena vinha 97,4% de elemento único. A tabela de pesos por nº de componentes e o sorteio (`arenaComponentes.ts`).
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  ARENA_COMPONENT_COUNTS, ARENA_COMPONENT_WEIGHTS, combinedPoolOf, drawComponentCount, entryComponents, planArenaComponents, relaxComponentCount,
  type ArenaComponentCount,
} from './arenaComponentes';
import { ARENA_BASE_ELEMENTS, arenaFoesOfSeed, arenaRunElement } from './arenaSorteio';
import { arenaElementsFor, arenaFoeSides, simulateArenaRunV3, type ArenaEnemy, type ArenaPlayerCfg } from './arena';
import { combatantAt, REFERENCE_BUILDS } from './combate/level';
import { elementHits } from './combate/curve';
import { mulberry32 } from './combate/rng';
import { isStraySeed } from './strayFoes';
import { ENEMY_ROSTER } from './enemyRoster';
import { rosterSpriteOf } from './novosSoulmon';
import { elementIcon } from './elementIconArt';
import { fxElementId } from './combatFx';
import { combatSceneBg } from './combatArt';

vi.setConfig({ testTimeout: 300_000 });

const N = 20_000;
const PP = 1.5;
const pct = (c: number, n: number) => (100 * c) / n;
const randomSeeds = (n: number, s = 20261115): number[] => { const r = mulberry32(s); return Array.from({ length: n }, () => (r() * 0x100000000) | 0); };
/** Runs comuns: a Desgarrada fica de fora da regra (como da forma paralela). */
const comuns = (n: number, s?: number): number[] => randomSeeds(n * 2, s).filter(x => !isStraySeed(x)).slice(0, n);
const entryOf = (e: ArenaEnemy) => { const key = e.formaKey ?? e.paraleloKey; return key ? ENEMY_ROSTER.find(r => r.key === key) : undefined; };
const sizeOf = (e: ArenaEnemy): ArenaComponentCount => { const en = entryOf(e); return (en ? entryComponents(en).length : 1) as ArenaComponentCount; };

describe('a tabela de pesos (a que o dono ajusta)', () => {
  it('só Ultimate e Mega têm linha; Rookie e Champion ficam como estavam', () => {
    expect(Object.keys(ARENA_COMPONENT_WEIGHTS).sort()).toEqual(['mega', 'ultimate']);
    expect(drawComponentCount('rookie', 0.5)).toBeUndefined();
    expect(drawComponentCount('champion', 0.5)).toBeUndefined();
  });
  it('valores pedidos pelo dono', () => {
    expect(ARENA_COMPONENT_WEIGHTS.ultimate).toEqual({ 1: 25, 2: 55, 3: 15, 4: 5 });
    expect(ARENA_COMPONENT_WEIGHTS.mega).toEqual({ 1: 10, 2: 20, 3: 50, 4: 20 });
  });
  for (const st of ['ultimate', 'mega'] as const) {
    it(`${st}: ${N} sorteios caem a ±${PP}pp da tabela`, () => {
      const w = ARENA_COMPONENT_WEIGHTS[st]!;
      const tot = ARENA_COMPONENT_COUNTS.reduce((s, n) => s + w[n], 0);
      const r = mulberry32(99);
      const c: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
      for (let i = 0; i < N; i++) c[drawComponentCount(st, r())!]++;
      for (const n of ARENA_COMPONENT_COUNTS) expect(Math.abs(pct(c[n], N) - (100 * w[n]) / tot), `${st} ${n} comp.`).toBeLessThan(PP);
    });
  }
  it('determinístico: o mesmo número dá o mesmo plano', () => {
    for (const el of ARENA_BASE_ELEMENTS) for (const v of [0, 0.1, 0.3, 0.6, 0.9, 0.999]) {
      expect(planArenaComponents('ultimate', el, v)).toEqual(planArenaComponents('ultimate', el, v));
    }
  });
});

describe('pool escasso relaxa sem travar', () => {
  it('tamanho mais próximo; empate fica com o maior; só a base como último recurso', () => {
    const tem = (...n: ArenaComponentCount[]) => new Set<ArenaComponentCount>(n);
    expect(relaxComponentCount(2, tem(2, 3))).toBe(2);
    expect(relaxComponentCount(2, tem(3, 4))).toBe(3);
    expect(relaxComponentCount(2, tem(4))).toBe(4);
    expect(relaxComponentCount(3, tem(2, 4))).toBe(4);
    expect(relaxComponentCount(4, tem(2))).toBe(2);
    expect(relaxComponentCount(3, tem())).toBe(1);
    expect(relaxComponentCount(1, tem(2, 3))).toBe(1);
  });
  it('nenhum elemento da run fica sem combinado com arte no Ultimate, e o plano nunca devolve vazio', () => {
    for (const el of ARENA_BASE_ELEMENTS) {
      expect([...combinedPoolOf('ultimate', el).values()].flat().length, el).toBeGreaterThan(0);
      for (let i = 0; i < 400; i++) {
        const p = planArenaComponents('ultimate', el, i / 400)!;
        if (p.got >= 2) expect(p.entry, `${el} ${i}`).toBeDefined();
        else expect(p.entry).toBeUndefined();
      }
    }
  });
  it('Mega sem pool de 2 componentes relaxa para o vizinho (3)', () => {
    const p = planArenaComponents('mega', 'luz', 0.2)!; // faixa de 2 componentes do Mega; luz só tem 3 e 4 no Mega
    expect(p.want).toBe(2);
    expect(p.got).toBe(3);
    expect(p.entry).toBeDefined();
  });
  it('com os 14 Ultimates de 2 componentes (15/11, §405) os 20 elementos têm pool de 2 componentes no Ultimate e o relaxamento some (era ~45%)', () => {
    for (const el of ARENA_BASE_ELEMENTS) expect(combinedPoolOf('ultimate', el).get(2)?.length ?? 0, el).toBeGreaterThan(0);
    let relaxados = 0;
    const r = mulberry32(5);
    for (let i = 0; i < N; i++) {
      const p = planArenaComponents('ultimate', ARENA_BASE_ELEMENTS[i % ARENA_BASE_ELEMENTS.length], r())!;
      if (p.want !== p.got) relaxados++;
    }
    expect(pct(relaxados, N)).toBeLessThan(10);
  });
});

describe('a Arena: distribuição real do Ultimate', () => {
  /** O esperado = tabela depois do relaxamento, ponderado pelos elementos de run (uniforme sobre a semente). */
  function esperado(): Record<number, number> {
    const e: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const w = ARENA_COMPONENT_WEIGHTS.ultimate!;
    const tot = ARENA_COMPONENT_COUNTS.reduce((s, n) => s + w[n], 0);
    for (const el of ARENA_BASE_ELEMENTS) {
      const have = new Set(combinedPoolOf('ultimate', el).keys());
      for (const n of ARENA_COMPONENT_COUNTS) e[relaxComponentCount(n, have)] += (100 * w[n]) / tot / ARENA_BASE_ELEMENTS.length;
    }
    return e;
  }
  it(`${N} sementes: a taxa por nº de componentes bate com a tabela relaxada (±${PP}pp)`, () => {
    const c: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    let n = 0;
    for (const s of comuns(N)) for (const e of arenaFoesOfSeed(s, 5, 31, 18)) { // escada 31: nenhum chefe Ultra; nível 18: HP de Ultimate
      expect(e.tier).toBe('ultimate');
      c[sizeOf(e)]++; n++;
    }
    const exp = esperado();
    for (const k of ARENA_COMPONENT_COUNTS) expect(Math.abs(pct(c[k], n) - exp[k]), `${k} comp.: ${pct(c[k], n).toFixed(1)}% vs ${exp[k].toFixed(1)}%`).toBeLessThan(PP);
  });
  it('o Ultimate de 2+ componentes deixou de ser raro (era 2,6%)', () => {
    let multi = 0, n = 0;
    for (const s of comuns(5000, 3)) for (const e of arenaFoesOfSeed(s, 5, 31, 18)) { n++; if (sizeOf(e) >= 2) multi++; }
    expect(pct(multi, n)).toBeGreaterThan(55);
  });
  it('determinística pela semente (card = luta) e sem Math.random', () => {
    for (const s of randomSeeds(300, 4)) expect(arenaFoesOfSeed(s, 5, 31, 18)).toEqual(arenaFoesOfSeed(s, 5, 31, 18));
    for (const f of ['arenaComponentes.ts', 'arena.ts']) expect(readFileSync(new URL(`./${f}`, import.meta.url), 'utf8')).not.toMatch(/Math\.random\(/);
  });
  it('sem combinado repetido dentro da rodada', () => {
    for (const s of randomSeeds(2000, 6)) {
      const ids = arenaFoesOfSeed(s, 4, 31, 18).filter(e => sizeOf(e) >= 2).map(e => e.formaKey ?? e.paraleloKey);
      const pool = [...combinedPoolOf('ultimate', arenaRunElement(s)).values()].flat().length; // só repete quando o pool do elemento acabou
      expect(new Set(ids).size, String(s)).toBe(Math.min(ids.length, pool));
    }
  });
});

describe('Rookie e Champion ficam como estavam', () => {
  const fnv = (s: string) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return (h >>> 0).toString(16); };
  // REGISTRO §435 (16/11/2026): o Champion de run de elemento passou a seguir a tabela §232 (1 `rng()` a mais), então o hash da escada 10 (que tem Champion) foi
  // regravado por decisão do dono; a escada 0 (só Rookie) segue idêntica. Os hashes originais foram tirados de `origin/main` (antes desta mudança) e conferidos com o código novo: mesmo resultado. Se um dia o roster mudar
  // de forma legítima, regrave com o dono; o que não pode é este teste passar porque o sorteio de Rookie/Champion mudou sem querer.
  for (const [ladder, lv, hash] of [[0, 3, '71aa4d26'], [10, 10, 'ae60d46a']] as const) {
    it(`escada ${ladder}, nível ${lv}: inimigos não-Ultimate idênticos aos da main`, () => {
      const all = randomSeeds(600, 777).map(s => [1, 2, 3, 4, 5].map(ro => arenaFoesOfSeed(s, ro, ladder, lv).filter(f => f.tier !== 'ultimate')));
      expect(fnv(JSON.stringify(all))).toBe(hash);
    });
  }
});

describe('todo elemento sorteado tem sprite, ícone, cenário e efeito', () => {
  it('todos os candidatos de Ultimate e Mega, para os 20 elementos de run', () => {
    let total = 0;
    for (const st of ['ultimate', 'mega'] as const) for (const b of ARENA_BASE_ELEMENTS) for (const [, list] of combinedPoolOf(st, b)) for (const e of list) {
      total++;
      expect(rosterSpriteOf(e), `sprite ${e.key}`).toBeTruthy();
      expect(elementIcon(e.element), `ícone ${e.element}`).toBeTruthy();
      expect(combatSceneBg(e.element), `cenário ${e.element}`).toBeTruthy();
      expect(fxElementId(e.element), `fx ${e.element}`).not.toBe('neutro');
    }
    expect(total).toBeGreaterThan(300);
  });
});

describe('o elemento do inimigo não muda o poder', () => {
  const p = (el: string): ArenaPlayerCfg => ({
    combatant: combatantAt(18, REFERENCE_BUILDS.balanced), family: 'direct', area: 'single',
    elements: arenaElementsFor({ basica: el, especial: el }, { basico: { elemento: el }, especial: { elemento: el } }, { principal: el, secundario: el }),
  });
  it('o HP de cada inimigo só se afasta do espelho pelo ±1 golpe do confronto (igual a qualquer elemento)', () => {
    const permitido = [elementHits(-1), elementHits(0), elementHits(1)];
    const base = arenaFoeSides({ ...p('fogo'), elements: undefined }, 4, undefined, 31);
    for (const s of randomSeeds(300, 12)) {
      const sides = arenaFoeSides(p('agua'), 4, arenaFoesOfSeed(s, 5, 31, 18).map(f => f.elements), 31);
      sides.forEach((side, i) => {
        const ratio = side.combatant.hp / base[i].combatant.hp;
        expect(permitido.some(h => Math.abs(h - ratio) < 1e-9), `hp ${ratio}`).toBe(true);
      });
    }
  });
  it('a taxa de vitória da Arena (escadas 20 e 31) não mudou: ±3pp da medida antes da mudança, mesmas condições', () => {
    // Antes (main e21f70663), jogador balanceado nível 18 sem equipamento, 4000 runs: escada 20 = 17,07% · escada 31 = 14,82%. Depois: 16,70% e 14,15%.
    const seeds = randomSeeds(4000, 123);
    for (const [ladder, antes] of [[20, 17.07], [31, 14.82]] as const) {
      let w = 0;
      seeds.forEach((s, i) => {
        const el = ARENA_BASE_ELEMENTS[i % ARENA_BASE_ELEMENTS.length];
        const cfg = {
          level: 18, build: REFERENCE_BUILDS.balanced, family: 'direct' as const, area: 'area' as const, escolaBasica: 'conjuracao' as const, ladder,
          elements: arenaElementsFor({ basica: el, especial: el }, { basico: { elemento: el }, especial: { elemento: el } }, { principal: el, secundario: el }),
          foeElementsOfRound: (r: number) => arenaFoesOfSeed(s, r + 1, ladder, 18).map(e => e.elements),
        };
        if (simulateArenaRunV3(cfg, 9000 + i, 'media').won) w++;
      });
      expect(Math.abs(pct(w, seeds.length) - antes), `escada ${ladder}: ${pct(w, seeds.length).toFixed(2)}% vs ${antes}%`).toBeLessThan(3);
    }
  });
});

describe('isolamento: só a Arena muda', () => {
  const src = (f: string) => readFileSync(new URL(f, import.meta.url), 'utf8');
  it('Masmorra, Fenda, Pesadelo, Duelo e Torneio não importam o sorteio novo', () => {
    for (const f of ['./enemyRoster.ts', './dungeon.ts', './novosSoulmon.ts', './match3Combat.ts', './match3Pvp.ts', './match3Boss.ts', './combate/duel.ts', './strayFoes.ts']) {
      expect(src(f), f).not.toMatch(/arenaComponentes|ARENA_COMPONENT_WEIGHTS|planArenaComponents/);
    }
  });
});
