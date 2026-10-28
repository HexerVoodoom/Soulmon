/**
 * ARENA LIVRE: sorteio geral + reroll + cenário (decisão do dono, 28/10/2026).
 */
import { describe, it, expect } from 'vitest';
import {
  ARENA_REROLL_FREE_PER_DAY, ARENA_REROLL_PRICES, arenaRerollCost, arenaRerollsFreeLeft, arenaRerollsToday, nextArenaReroll,
  sanitizeArenaReroll, arenaCards, arenaFoesOfSeed, arenaCardElements, arenaSceneOfSeed, applyArenaReroll,
} from './arenaSorteio';
import { ARENA_BG_SCENES } from './dungeonScenes';
import { isStraySeed } from './strayFoes';
import { CLASS_ELEMENT_ORDER } from './soulProfile/types';

describe('sorteio geral (sem tema)', () => {
  it.each(['sombra', 'fogo', 'neutro'])('jogador %s: os cards NÃO são mais todos do mesmo elemento (200 sementes)', () => {
    const vistos = new Set<string>();
    let todosIguais = 0;
    for (let i = 0; i < 200; i++) {
      const els = arenaCards('2026-10-28', `conta-${i}`, 0).map(s => arenaCardElements(s)[0]);
      els.forEach(e => vistos.add(e));
      if (new Set(els).size === 1) todosIguais++;
    }
    expect(vistos.size).toBeGreaterThanOrEqual(15);
    expect(todosIguais).toBe(0);
  });

  it('cards com elementos distintos entre si (sem sobreposição) na imensa maioria dos sorteios, e no máximo 1 Desgarrado', () => {
    let disjuntos = 0;
    for (let i = 0; i < 200; i++) {
      const seeds = arenaCards('2026-10-28', `c${i}`, i % 5);
      const todos = seeds.flatMap(arenaCardElements);
      if (new Set(todos).size === todos.length) disjuntos++;
      expect(seeds.filter(isStraySeed).length).toBeLessThanOrEqual(1);
    }
    expect(disjuntos).toBeGreaterThanOrEqual(190);
  });

  it('o card mostra o que será lutado: mesma função, determinística, e elementos do pool base', () => {
    const [s] = arenaCards('2026-10-28', 'x', 0);
    expect(arenaFoesOfSeed(s, 3)).toEqual(arenaFoesOfSeed(s, 3));
    for (const f of arenaFoesOfSeed(s, 1)) expect(CLASS_ELEMENT_ORDER as readonly string[]).toContain(f.elements[0]);
  });
});

describe('reroll: determinismo', () => {
  it('mesmo (dia, conta, nº de rerolls) = mesmos cards; cada reroll muda; outro dia/conta muda', () => {
    const a = arenaCards('2026-10-28', 'conta', 0);
    expect(arenaCards('2026-10-28', 'conta', 0)).toEqual(a);
    expect(arenaCards('2026-10-28', 'conta', 1)).not.toEqual(a);
    expect(arenaCards('2026-10-29', 'conta', 0)).not.toEqual(a);
    expect(arenaCards('2026-10-28', 'outra', 0)).not.toEqual(a);
  });
});

describe('reroll: tabela de custo', () => {
  it('3 grátis, depois 15, 30, 45 e 45 fixo', () => {
    expect(ARENA_REROLL_FREE_PER_DAY).toBe(3);
    expect(ARENA_REROLL_PRICES).toEqual([15, 30, 45]);
    expect([0, 1, 2, 3, 4, 5, 6, 7, 50].map(arenaRerollCost)).toEqual([0, 0, 0, 15, 30, 45, 45, 45, 45]);
    expect([0, 1, 2, 3, 9].map(arenaRerollsFreeLeft)).toEqual([3, 2, 1, 0, 0]);
  });

  it('dia do jogador vira: o contador de outro dia vale 0; a escrita é monotônica', () => {
    const r = { day: '2026-10-28', count: 4 };
    expect(arenaRerollsToday(r, '2026-10-28')).toBe(4);
    expect(arenaRerollsToday(r, '2026-10-29')).toBe(0);
    expect(nextArenaReroll(r, '2026-10-29')).toEqual({ day: '2026-10-29', count: 1 });
    expect(nextArenaReroll(r, '2026-10-28')).toEqual({ day: '2026-10-28', count: 5 });
    expect(nextArenaReroll(r, '2026-10-27')).toEqual({ day: '2026-10-28', count: 5 }); // relógio que voltou não reabre os grátis
  });

  it('sanitizador tolerante e idempotente', () => {
    for (const lixo of [null, 3, 'x', [], {}, { day: 'x', count: 1 }, { day: '2026-10-28', count: NaN }]) expect(sanitizeArenaReroll(lixo)).toBeUndefined();
    const s = sanitizeArenaReroll({ day: '2026-10-28', count: -3.7 });
    expect(s).toEqual({ day: '2026-10-28', count: 0 });
    expect(sanitizeArenaReroll(s)).toEqual(s);
  });
});

describe('reroll: cobrança só em Bits, sobre o prev', () => {
  const base = { gamePoints: 100, arenaReroll: undefined as undefined | { day: string; count: number } };
  it('grátis não gasta Bits; o 4º gasta 15, o 5º 30; sem saldo devolve o mesmo objeto', () => {
    let s: typeof base = base;
    for (let i = 0; i < 3; i++) s = applyArenaReroll(s, '2026-10-28');
    expect(s.gamePoints).toBe(100);
    expect(s.arenaReroll).toEqual({ day: '2026-10-28', count: 3 });
    s = applyArenaReroll(s, '2026-10-28');
    expect(s.gamePoints).toBe(85);
    s = applyArenaReroll(s, '2026-10-28');
    expect(s.gamePoints).toBe(55);
    const pobre = { gamePoints: 10, arenaReroll: { day: '2026-10-28', count: 3 } };
    expect(applyArenaReroll(pobre, '2026-10-28')).toBe(pobre);
    expect(applyArenaReroll(pobre, '2026-10-29').arenaReroll).toEqual({ day: '2026-10-29', count: 1 });
  });
});

describe('cenário da Arena', () => {
  it('só as duas arenas do Torneio, determinístico, e as duas aparecem', () => {
    expect(ARENA_BG_SCENES.map(s => s.nameEn)).toEqual(['Night Arena', 'Elder Colosseum']);
    const vistos = new Set<string>();
    for (let seed = 1; seed < 100; seed++) {
      const c = arenaSceneOfSeed(seed);
      expect(ARENA_BG_SCENES).toContain(c);
      expect(arenaSceneOfSeed(seed)).toBe(c);
      vistos.add(c.nameEn);
    }
    expect(vistos.size).toBe(2);
  });
});
