/**
 * §222 — a ESCADA da Arena: a ordem exata que o dono ditou, a força que sobe a cada vitória, derrota que segura,
 * card = luta, e a calibração medida (jogar perfeito vence; desvantagem sem mecânica perde).
 */
import { describe, expect, it, vi } from 'vitest';
import {
  ARENA_LADDER_MAX, ARENA_ROUNDS, arenaFoe, arenaFoeSides, arenaLadderStage, arenaLadderStep, arenaLadderStrength, buildArenaRound,
  nextArenaLadder, sanitizeArenaLadder, simulateArenaRunV3, type ArenaLadderStage, type ArenaSkill,
} from './arena';
import { applyArenaRunEnd, arenaFoesOfSeed, arenaRunIsStray } from './arenaSorteio';
import { combatantAt, REFERENCE_BUILDS, REFERENCE_BUILD_NAMES, RULER_LEVELS } from './combate/level';
import { SPECIAL_FAMILIES } from './combate/specials';
import { mulberry32 } from './combate/rng';
import { isStraySeed } from './strayFoes';

vi.setConfig({ testTimeout: 300_000 });

const R = 'rookie', C = 'champion', U = 'ultimate';
const row = (l: number) => Array.from({ length: ARENA_ROUNDS }, (_, i) => arenaLadderStage(l, i + 1));

describe('a ordem exata do dono', () => {
  const ordem: [number, ArenaLadderStage[]][] = [
    [0, [R, R, R, R, R]], [4, [R, R, R, R, R]],
    [5, [R, R, R, R, C]], [8, [R, R, R, C, C]], [11, [R, R, C, C, C]], [14, [R, C, C, C, C]], [17, [C, C, C, C, C]],
    [20, [C, C, C, C, U]], [23, [C, C, C, U, U]], [26, [C, C, U, U, U]], [29, [C, U, U, U, U]], [32, [U, U, U, U, U]],
    [500, [U, U, U, U, U]],
  ];
  it.each(ordem)('escada %i', (l, esperado) => expect(row(l)).toEqual(esperado));
  it('nunca regride ao subir, e cada degrau muda só uma rodada', () => {
    const peso = { rookie: 0, champion: 1, ultimate: 2 };
    for (let l = 1; l <= 40; l++) {
      const a = row(l - 1).map(s => peso[s]), b = row(l).map(s => peso[s]);
      expect(b.every((v, i) => v >= a[i])).toBe(true);
      expect(b.reduce((s, v, i) => s + v - a[i], 0)).toBeLessThanOrEqual(1);
    }
  });
  it('sanitiza valor hostil', () => {
    for (const v of [null, undefined, 'x', {}, NaN, -3]) expect(sanitizeArenaLadder(v)).toBe(0);
    expect(sanitizeArenaLadder(2.9)).toBe(2);
    expect(sanitizeArenaLadder(1e9)).toBe(ARENA_LADDER_MAX);
    expect(arenaLadderStep(-1)).toBe(0);
  });
});

describe('vitória sobe, derrota segura', () => {
  it('nextArenaLadder e applyArenaRunEnd', () => {
    expect(nextArenaLadder(4, 'win')).toBe(5);
    expect(nextArenaLadder(4, 'loss')).toBe(4);
    expect(nextArenaLadder(4, 'draw')).toBe(4);
    expect(nextArenaLadder(undefined, 'win')).toBe(1); // save antigo começa de baixo
    expect(nextArenaLadder(ARENA_LADDER_MAX, 'win')).toBe(ARENA_LADDER_MAX);
    const d = '2026-11-04';
    expect(applyArenaRunEnd({} as { arenaLadder?: number }, d, 'win').arenaLadder).toBe(1);
    expect(applyArenaRunEnd({ arenaLadder: 3 }, d, 'loss').arenaLadder).toBe(3);
    expect(applyArenaRunEnd({ arenaLadder: 3 }, d).arenaLadder).toBe(3);
  });
  it('cada vitória deixa o inimigo um pouco mais forte, até o teto', () => {
    for (let l = 1; l <= 32; l++) expect(arenaLadderStrength(l)).toBeGreaterThan(arenaLadderStrength(l - 1));
    expect(arenaLadderStrength(33)).toBe(arenaLadderStrength(32));
    expect(arenaLadderStrength(0)).toBe(1);
    expect(arenaLadderStrength(1) - arenaLadderStrength(0)).toBeLessThanOrEqual(0.005);
  });
  it('a força é relativa ao jogador: acompanha level e bônus', () => {
    expect(arenaFoe(40, 'weak', 0, 10).combatant.hp).toBeGreaterThan(arenaFoe(6, 'weak', 0, 10).combatant.hp);
    expect(arenaFoe(21, 'weak', 0, 10, 0.05).combatant.hp).toBeCloseTo(arenaFoe(21, 'weak', 0, 10).combatant.hp * 1.05, 9);
    const p = { combatant: { ...combatantAt(21, REFERENCE_BUILDS.balanced), bonus: 0.05 }, family: 'direct' as const, area: 'single' as const };
    expect(arenaFoeSides(p, 0, undefined, 10)[0].combatant.hp).toBeCloseTo(arenaFoe(21, 'medium', 0, 10, 0.05).combatant.hp, 9);
  });
  it('especial do inimigo: o chefe sempre; as outras classes quando a forma passou de Rookie', () => {
    expect(arenaFoe(21, 'medium', 0, 0).special).toBeNull();
    expect(arenaFoe(21, 'boss', 4, 0).special?.family).toBe('direct');
    expect(arenaFoe(21, 'medium', 2, 17).special?.family).toBe('direct');
  });
});

describe('o sorteio segue a escada; card = luta', () => {
  it('forma e ramo por rodada; Rookie nunca vê evoluído', () => {
    for (let s = 1; s <= 400; s++) for (const l of [0, 8, 20, 32]) for (let r = 1; r <= ARENA_ROUNDS; r++) {
      const st = arenaLadderStage(l, r);
      const foes = arenaFoesOfSeed(s, r, l);
      expect(arenaFoesOfSeed(s, r, l)).toEqual(foes); // card e luta chamam a mesma função
      for (const e of foes) {
        if (e.creature === 'corvo' || e.elements[0] === 'neutro') continue;
        if (st === 'rookie') { expect(e.form).toBe('rookie'); expect(e.ramoKey).toBeUndefined(); }
        if (st === 'champion') { expect(e.ramoKey).toBeUndefined(); expect(['champion', 'rookie']).toContain(e.form); }
        expect(e.form).not.toBe('mega');
        expect(e.form).not.toBe('ultra');
      }
    }
  });
  it('Desgarrado só aparece com a última rodada em Ultimate', () => {
    let s = 1; while (!isStraySeed(s)) s++;
    expect(arenaRunIsStray(s, 0)).toBe(false);
    expect(arenaRunIsStray(s, 19)).toBe(false);
    expect(arenaRunIsStray(s, 20)).toBe(true);
    expect(arenaFoesOfSeed(s, 5, 0).every(e => !e.stray && e.form === 'rookie')).toBe(true);
    expect(arenaFoesOfSeed(s, 5, 20).every(e => e.stray)).toBe(true);
    expect(arenaFoesOfSeed(s, 1, 20).every(e => !e.stray)).toBe(true);
  });
  it('pagamento: Bits e drop dependem só da classe do slot, em qualquer degrau', () => {
    const paga = (l: number) => { const out: unknown[] = []; for (let r = 1; r <= ARENA_ROUNDS; r++) out.push(buildArenaRound(r, 1, mulberry32(r + 5), undefined, false, false, 'fogo', l).map(e => [e.points, e.dropTier])); return out; };
    expect(paga(32)).toEqual(paga(0));
    expect((paga(0) as [number, string][][]).flat().reduce((s, [p]) => s + p, 0)).toBe(50);
  });
});

describe('calibração medida', () => {
  const els = { basica: 'fogo', especial: 'fogo', attrs: { principal: 'fogo', secundario: 'fogo' } };
  const VANTAGEM = 'vida', NEUTRO = 'sombra', DESVANTAGEM = 'vigor';
  function taxa(ladder: number, skill: ArenaSkill, foe: string, cheer: 'nenhum' | 'teto', N = 700): number {
    let w = 0;
    for (let s = 0; s < N; s++) {
      w += +simulateArenaRunV3({
        level: RULER_LEVELS[s % RULER_LEVELS.length], build: REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[(s >> 2) % 4]],
        family: SPECIAL_FAMILIES[(s >> 4) % 7], area: s & 1 ? 'area' : 'single', elements: els, foeElement: foe, ladder, cheer,
      }, s, skill).won;
    }
    return w / N;
  }
  it.each([0, 5, 14, 20, 32])('escada %i: perfeito com vantagem vence; desvantagem sem mecânica perde; a força desce em ordem', (l) => {
    expect(taxa(l, 'perfeita', VANTAGEM, 'teto')).toBeGreaterThanOrEqual(0.9);
    expect(taxa(l, 'perfeita', NEUTRO, 'teto')).toBeGreaterThanOrEqual(0.5);
    expect(taxa(l, 'nenhuma', DESVANTAGEM, 'nenhum')).toBeLessThanOrEqual(0.1);
    expect(taxa(l, 'nenhuma', DESVANTAGEM, 'teto')).toBeLessThanOrEqual(0.25); // mesmo torcendo no teto
    expect(taxa(l, 'perfeita', NEUTRO, 'teto')).toBeGreaterThan(taxa(l, 'media', NEUTRO, 'teto'));
  });
  it('§240: a rodada evoluída é mais forte que a Rookie da mesma escada', () => {
    const hp = (l: number, r: number) => arenaFoe(21, 'medium', r, l).combatant.hp / arenaFoe(21, 'medium', r, 0).combatant.hp;
    expect(hp(5, 4)).toBeCloseTo(1.07, 9); // o 1º Champion
    expect(hp(5, 0)).toBeCloseTo(arenaLadderStrength(5), 9);
    expect(hp(20, 4)).toBeCloseTo(1.08, 9); // o 1º Ultimate
  });
  it.skipIf(!process.env.ARENA_MEDIR)('tabela do §240', () => {
    for (const l of [0, 5, 8, 14, 20, 32]) console.log(`MED ${l} perfeita-neutro ${taxa(l, 'perfeita', NEUTRO, 'teto')} perfeita-vant ${taxa(l, 'perfeita', VANTAGEM, 'teto')} media-neutro ${taxa(l, 'media', NEUTRO, 'teto')}`);
  });
  it('subir a escada endurece a run média', () => {
    expect(taxa(32, 'media', NEUTRO, 'teto')).toBeLessThan(taxa(0, 'media', NEUTRO, 'teto') - 0.3);
  });
});
