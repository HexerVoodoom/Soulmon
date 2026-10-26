import { describe, it, expect } from 'vitest';
import {
  newBarrage, stepBarrage, phaseAt, stageOdds, pickWaveStage, STAGE_HP, BASE_Y, BARRAGE_ELEMENT, difficultyAt, barrageBits, FIELD_W, PLAYER_Y, START_LIVES,
  PHASE_SECONDS, INVULN_SECONDS,
} from './soulBarrage';

const seeded = (seed = 7) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };

describe('soulBarrage', () => {
  it('fase sobe a cada PHASE_SECONDS; champion/ultimate entram "às vezes", com teto, e têm mais vida', () => {
    expect(phaseAt(0)).toBe(1);
    expect(phaseAt(PHASE_SECONDS)).toBe(2);
    expect(stageOdds(1)).toEqual({ champion: 0, ultimate: 0 });
    expect(stageOdds(2).ultimate).toBe(0);
    expect(stageOdds(3).ultimate).toBeGreaterThan(0);
    expect(stageOdds(99).champion).toBeLessThanOrEqual(0.3);
    expect(stageOdds(99).ultimate).toBeLessThanOrEqual(0.14);
    expect(STAGE_HP.champion).toBeGreaterThan(STAGE_HP.rookie);
    expect(STAGE_HP.ultimate).toBeGreaterThan(STAGE_HP.champion);
    // na fase 1 só rookie; na 8 a maioria ainda é rookie
    const rng = seeded(5);
    expect(Array.from({ length: 50 }, () => pickWaveStage(1, rng)).every(x => x === 'rookie')).toBe(true);
    const mix = Array.from({ length: 400 }, () => pickWaveStage(8, rng));
    expect(mix.filter(x => x === 'rookie').length).toBeGreaterThan(200);
    expect(mix).toContain('champion');
    expect(mix).toContain('ultimate');
  });
  it('só nascem inimigos do elemento espaço, em levas', () => {
    const s = newBarrage();
    const rng = seeded(21);
    s.t = 100; s.phase = 6;
    const seen = new Set<string>();
    for (let i = 0; i < 600; i++) { stepBarrage(s, 0.05, s.px, 30, rng); s.invuln = 99; for (const e of s.enemies) seen.add(e.entry.element); if (s.over) s.over = false; }
    expect([...seen]).toEqual([BARRAGE_ELEMENT]);
  });
  const leaker = (y: number) => {
    const entry = { key: 'x-rookie', id: 'x', stage: 'rookie' as const, kind: 'base' as const, element: 'espaco', elements: ['espaco'], name: 'x', basico: {} as never, especial: {} as never };
    return { x: 10, y, vx: 0, vy: 0, hp: 2, maxHp: 2, fireIn: 99, entry, stage: 'rookie' as const, points: 10, t: 0, size: 60, r: 22 };
  };
  it('vários vazamentos no mesmo passo tiram só 1 vida e dão invulnerabilidade', () => {
    const s = newBarrage();
    s.spawnIn = 99;
    s.enemies.push(leaker(BASE_Y + 1), leaker(BASE_Y + 2), leaker(BASE_Y + 3));
    const ev = stepBarrage(s, 0.01, s.px, 1, seeded(2));
    expect(ev.leaked).toBe(3);
    expect(s.lives).toBe(START_LIVES - 1);
    expect(s.enemies.length).toBe(0);
    expect(s.invuln).toBeGreaterThan(0.9);
  });
  it('vazamento durante a invulnerabilidade some sem tirar vida; 1,1 s depois tira outra', () => {
    const s = newBarrage();
    s.spawnIn = 99;
    s.enemies.push(leaker(BASE_Y + 1));
    stepBarrage(s, 0.01, s.px, 1, seeded(2));
    expect(s.lives).toBe(START_LIVES - 1);
    s.enemies.push(leaker(BASE_Y + 1));
    const ev = stepBarrage(s, 0.01, s.px, 1, seeded(2));
    expect(ev.leaked).toBe(0);
    expect(s.enemies.length).toBe(0);
    expect(s.lives).toBe(START_LIVES - 1);
    for (let i = 0; i < 22; i++) { s.spawnIn = 99; s.fireIn = 99; stepBarrage(s, 0.05, s.px, 1, seeded(2)); }
    expect(s.invuln).toBe(0);
    s.enemies.push(leaker(BASE_Y + 1));
    stepBarrage(s, 0.01, s.px, 1, seeded(2));
    expect(s.lives).toBe(START_LIVES - 2);
  });
  it('dificuldade cresce e tem teto', () => {
    expect(difficultyAt(5).bulletSpeed).toBeGreaterThan(difficultyAt(1).bulletSpeed);
    expect(difficultyAt(99).fanSize).toBeLessThanOrEqual(5);
    expect(difficultyAt(99).spawnEvery).toBeGreaterThanOrEqual(0.55);
  });
  it('Bits: 1 a cada 100 pontos', () => {
    expect(barrageBits(99)).toBe(0);
    expect(barrageBits(250)).toBe(2);
    expect(barrageBits(-5)).toBe(0);
  });
  it('o jogador segue o alvo com velocidade limitada e atira sozinho', () => {
    const s = newBarrage();
    const rng = seeded();
    stepBarrage(s, 0.05, FIELD_W, 1, rng);
    expect(s.px).toBeGreaterThan(FIELD_W / 2);
    expect(s.px).toBeLessThan(FIELD_W);
    for (let i = 0; i < 10; i++) stepBarrage(s, 0.05, 0, 1, rng);
    expect(s.shots.length).toBeGreaterThan(0);
  });
  it('inimigos nascem do roster, descem e atiram', () => {
    const s = newBarrage();
    const rng = seeded(3);
    for (let i = 0; i < 400 && s.enemyShots.length === 0; i++) stepBarrage(s, 0.05, s.px, 1, rng);
    expect(s.enemies.length + s.kills).toBeGreaterThan(0);
    expect(s.enemies[0]?.entry.stage ?? 'rookie').toBe('rookie');
    expect(s.enemies.every(e => e.entry.element === 'espaco')).toBe(true);
    expect(s.enemyShots.length).toBeGreaterThan(0);
  });
  it('tiro inimigo tira vida, dá invulnerabilidade e acaba em 0 vidas', () => {
    const s = newBarrage();
    const rng = seeded();
    s.spawnIn = 99;
    s.enemyShots.push({ x: s.px, y: PLAYER_Y, vx: 0, vy: 0 });
    const ev = stepBarrage(s, 0.01, s.px, 1, rng);
    expect(ev.hit).toBe(true);
    expect(s.lives).toBe(START_LIVES - 1);
    s.enemyShots.push({ x: s.px, y: PLAYER_Y, vx: 0, vy: 0 });
    expect(stepBarrage(s, 0.01, s.px, 1, rng).hit).toBe(false); // invulnerável
    s.invuln = 0; s.lives = 1;
    s.enemyShots.push({ x: s.px, y: PLAYER_Y, vx: 0, vy: 0 });
    expect(stepBarrage(s, 0.01, s.px, 1, rng).over).toBe(true);
    expect(s.over).toBe(true);
    expect(INVULN_SECONDS).toBeGreaterThan(0);
  });
  it('abater inimigo soma pontos', () => {
    const s = newBarrage();
    const rng = seeded(11);
    s.spawnIn = 99;
    s.enemies.push({ x: s.px, y: 200, vx: 0, vy: 0, hp: 1, maxHp: 1, fireIn: 99, entry: { key: 'x-rookie', id: 'x', stage: 'rookie', kind: 'base', element: 'fogo', elements: ['fogo'], name: 'x', basico: {} as never, especial: {} as never }, stage: 'rookie', points: 10, t: 0, size: 60, r: 22 });
    s.shots.push({ x: s.px, y: 200, vx: 0, vy: 0 });
    const ev = stepBarrage(s, 0.01, s.px, 1, rng);
    expect(ev.kills).toBe(1);
    expect(s.score).toBe(10);
  });
});
