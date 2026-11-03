import { describe, it, expect } from 'vitest';
import { M3_COLS, M3_ROWS, findRuns, resolveBoard, trySwap, validMoves, type Board, type Step } from './match3';
import { M3C_PLAYER_HP, newCombat, playTurn } from './match3Combat';
import { mulberry32 } from './combate/rng';
import {
  BOSS_CLOCK_MS, BOSS_RULES, bossBoardRules, bossTurn, clockTick, drawBossRules, isBossMatch, newBossCombat, newBossTrack, passTurn, petrify, tideKind,
} from './match3Boss';

/** Tabuleiro sem nenhuma linha: k = (c + 2r) % 6. */
const base = (): Board => Array.from({ length: M3_ROWS }, (_, r) => Array.from({ length: M3_COLS }, (_, c) => ({ k: (c + 2 * r) % 6 })));
const step = (kinds: number[], chain = 1, created = false): Step => ({
  cleared: kinds.map((_, i) => ({ r: 0, c: i })), kinds, triggered: [], chain, gained: 0, after: base(),
  created: created ? [{ pos: { r: 0, c: 0 }, tile: { k: kinds[0], sp: 'row' } }] : [],
});

describe('BOSS: sorteio pela semente', () => {
  it('3% das partidas, determinístico', () => {
    let n = 0;
    for (let s = 0; s < 20000; s++) if (isBossMatch(s)) n++;
    expect(n / 20000).toBeGreaterThan(0.02);
    expect(n / 20000).toBeLessThan(0.04);
    expect(isBossMatch(12345)).toBe(isBossMatch(12345));
  });
  it('3 regras distintas, sem 1×2 nem 4×5, mesma semente = mesmas regras', () => {
    const vistos = new Set<string>();
    for (let s = 0; s < 3000; s++) {
      const r = drawBossRules(s);
      expect(r).toHaveLength(3);
      expect(new Set(r).size).toBe(3);
      expect(r.includes('same-element') && r.includes('inverse')).toBe(false);
      expect(r.includes('cross') && r.includes('no-extra')).toBe(false);
      r.forEach(x => vistos.add(x));
    }
    expect(vistos.size).toBe(BOSS_RULES.length);
    expect(drawBossRules(77)).toEqual(drawBossRules(77));
  });
  it('todo texto de regra existe em PT e EN', () => {
    for (const r of BOSS_RULES) for (const l of [r.pt, r.en]) { expect(l.name.length).toBeGreaterThan(0); expect(l.line.length).toBeGreaterThan(0); }
  });
  it('o boss tem o HP do jogador e arte do roster', () => {
    const c = newBossCombat(mulberry32(9));
    expect(c.enemies).toHaveLength(1);
    expect(c.enemies[0].max).toBe(M3C_PLAYER_HP);
    expect(c.enemies[0].hp).toBe(c.player.hp);
    expect(c.enemies[0].roster).toBeTruthy();
  });
});

describe('BOSS: regras de dano', () => {
  it('1 · mesmo elemento em sequência acumula bônus com teto', () => {
    let t = newBossTrack();
    const ms: number[] = [];
    for (let i = 0; i < 7; i++) { const r = bossTurn(['same-element'], t, [step([2, 2, 2])], 0, 1); ms.push(r.mult(2, 1)); t = r.track; }
    expect(ms[0]).toBe(1);
    expect(ms[1]).toBeCloseTo(1.25);
    expect(ms[2]).toBeCloseTo(1.5);
    expect(ms[6]).toBeCloseTo(2);
    const outro = bossTurn(['same-element'], t, [step([3, 3, 3])], 0, 1);
    expect(outro.mult(3, 1)).toBe(1);
  });
  it('2 · inverso: repetir o elemento corta o dano', () => {
    const a = bossTurn(['inverse'], newBossTrack(), [step([1, 1, 1])], 0, 1);
    expect(a.mult(1, 1)).toBe(1);
    const b = bossTurn(['inverse'], a.track, [step([1, 1, 1])], 0, 1);
    expect(b.mult(1, 1)).toBe(0.5);
  });
  it('3 · sequência de diferentes cresce e zera ao repetir', () => {
    let t = newBossTrack();
    const ms: number[] = [];
    for (const k of [0, 1, 2, 1]) { const r = bossTurn(['diverse-chain'], t, [step([k, k, k])], 0, 1); ms.push(r.mult(k, 1)); t = r.track; }
    expect(ms[0]).toBe(1);
    expect(ms[1]).toBeCloseTo(1.2);
    expect(ms[2]).toBeCloseTo(1.4);
    expect(ms[3]).toBe(1);
    expect(t.chain).toEqual([1]);
  });
  it('8 · cascata crescente: +25% por passo', () => {
    const r = bossTurn(['rising-cascade'], newBossTrack(), [step([0, 0, 0])], 0, 1);
    expect(r.mult(0, 1)).toBe(1);
    expect(r.mult(0, 2)).toBeCloseTo(1.25);
    expect(r.mult(0, 3)).toBeCloseTo(1.5);
    expect(bossTurn([], newBossTrack(), [step([0, 0, 0])], 0, 1).mult(0, 3)).toBe(1);
  });
  it('9 · maré elemental: dobra o elemento da maré, que só muda a cada 3 turnos', () => {
    const seed = 4242;
    expect(tideKind(seed, 0)).toBe(tideKind(seed, 2));
    const tide = tideKind(seed, 0);
    const r = bossTurn(['elemental-tide'], newBossTrack(), [step([0, 0, 0])], 0, seed);
    expect(r.mult(tide, 1)).toBe(2);
    expect(r.mult((tide + 1) % 6, 1)).toBe(1);
  });
  it('o multiplicador entra no dano do combate', () => {
    const c = newCombat(mulberry32(3));
    const sem = playTurn(c, [step([0, 0, 0])], base(), mulberry32(1)).state.dealt;
    const com = playTurn(c, [step([0, 0, 0])], base(), mulberry32(1), 1, { mult: () => 2 }).state.dealt;
    expect(com).toBeGreaterThan(sem);
  });
});

describe('BOSS: regras de tabuleiro', () => {
  it('4 · cruz: 3 na horizontal e 3 na vertical cria a especial (e a vez extra)', () => {
    const b = base();
    for (const [r, c] of [[2, 1], [2, 2], [2, 3], [1, 2], [3, 2]]) b[r][c] = { k: 5 };
    expect(resolveBoard(b, mulberry32(1)).steps[0].created).toHaveLength(0);
    const st = resolveBoard(b, mulberry32(1), [], [], bossBoardRules(['cross'])).steps[0];
    expect(st.created).toHaveLength(1);
    expect(st.created[0].pos).toEqual({ r: 2, c: 2 });
  });
  it('5 · especial sem segundo turno', () => {
    const c = newCombat(mulberry32(3));
    expect(playTurn(c, [step([0, 0, 0, 0], 1, true)], base(), mulberry32(1)).extra).toBe(true);
    expect(playTurn(c, [step([0, 0, 0, 0], 1, true)], base(), mulberry32(1), 1, { noExtra: true }).extra).toBe(false);
  });
  it('6 · especiais vizinhos explodem juntos sem troca', () => {
    const b = base();
    b[3][3] = { k: b[3][3]!.k, sp: 'row' };
    b[3][4] = { k: b[3][4]!.k, sp: 'col' };
    expect(resolveBoard(b, mulberry32(1)).steps).toHaveLength(0);
    const st = resolveBoard(b, mulberry32(1), [], [], bossBoardRules(['neighbor-specials'])).steps[0];
    expect(st.cleared.length).toBeGreaterThanOrEqual(M3_COLS + M3_ROWS * 2);
  });
  it('7 · quartzo da alma: coringa combina com qualquer elemento e explode 3×3', () => {
    const b = base();
    b[0][2] = { k: 0, wild: true };
    b[0][3] = { k: 1 };
    const runs = findRuns(b);
    expect(runs.some(r => r.k === 1 && r.cells.length === 3)).toBe(true);
    const st = resolveBoard(b, mulberry32(1)).steps[0];
    for (const p of [{ r: 1, c: 1 }, { r: 1, c: 2 }, { r: 1, c: 3 }]) expect(st.cleared).toContainEqual(p);
    // a regra liga o nascimento de coringas
    let wild = 0;
    for (let s = 0; s < 40; s++) {
      const r = resolveBoard(b, mulberry32(s), [], [], bossBoardRules(['soul-quartz']));
      for (const st2 of r.steps) for (const row of st2.after) for (const t of row) if (t?.wild) wild++;
    }
    expect(wild).toBeGreaterThan(0);
  });
  it('10 · pedras: não fazem linha nem trocam; quebram com linha ao lado', () => {
    const p = petrify(base(), mulberry32(5));
    expect(p.flat().filter(t => t?.stone)).toHaveLength(3);
    const b = base();
    b[0][2] = { k: 1 }; b[0][3] = { k: 1 };
    b[1][2] = { k: 0, stone: true };
    b[5][5] = { k: 0, stone: true };
    const st = resolveBoard(b, mulberry32(1)).steps[0];
    expect(st.cleared).toContainEqual({ r: 1, c: 2 });
    expect(st.cleared).not.toContainEqual({ r: 5, c: 5 });
    const s2 = base();
    s2[0][0] = { k: 0 }; s2[0][1] = { k: 0, stone: true }; s2[0][2] = { k: 0 };
    expect(findRuns(s2).some(r => r.cells.some(c => c.r === 0 && c.c === 1))).toBe(false);
    expect(trySwap(s2, { r: 0, c: 1 }, { r: 1, c: 1 }, mulberry32(1)).ok).toBe(false);
    expect(validMoves(s2).some(m => (m.a.r === 0 && m.a.c === 1) || (m.b.r === 0 && m.b.c === 1))).toBe(false);
  });
  it('11 · relógio curto: desconta e para com a aba escondida', () => {
    expect(clockTick(BOSS_CLOCK_MS, 1000, false)).toBe(BOSS_CLOCK_MS - 1000);
    expect(clockTick(BOSS_CLOCK_MS, 1000, true)).toBe(BOSS_CLOCK_MS);
    expect(clockTick(500, 1000, false)).toBe(0);
    const c = newBossCombat(mulberry32(2));
    const ex = passTurn(c, base(), mulberry32(1));
    expect(ex.state.turns).toBe(1);
    expect(ex.state.dealt).toBe(0);
  });
  it('12 · gravidade invertida: as peças sobem e as novas entram por baixo', () => {
    const b = base();
    b[0][0] = { k: 4 }; b[0][1] = { k: 4 }; b[0][2] = { k: 4 };
    const normal = resolveBoard(b, mulberry32(1)).steps[0].after;
    expect(normal[1][1]!.k).toBe(b[1][1]!.k);
    const inv = resolveBoard(b, mulberry32(1), [], [], bossBoardRules(['inverted-gravity'])).steps[0].after;
    expect(inv[0][1]!.k).toBe(b[1][1]!.k);
    expect(inv[M3_ROWS - 2][1]!.k).toBe(b[M3_ROWS - 1][1]!.k);
  });
});
