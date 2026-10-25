import { describe, it, expect } from 'vitest';
import {
  newBarrage, stepBarrage, phaseAt, enemyStageForPhase, difficultyAt, barrageBits, FIELD_W, PLAYER_Y, START_LIVES,
  PHASE_SECONDS, INVULN_SECONDS,
} from './soulBarrage';

const seeded = (seed = 7) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };

describe('soulBarrage', () => {
  it('fase sobe a cada PHASE_SECONDS e o estágio do inimigo acompanha', () => {
    expect(phaseAt(0)).toBe(1);
    expect(phaseAt(PHASE_SECONDS)).toBe(2);
    expect([1, 3, 5, 7, 12].map(enemyStageForPhase)).toEqual(['rookie', 'champion', 'ultimate', 'mega', 'mega']);
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
    s.enemies.push({ x: s.px, y: 200, vx: 0, vy: 0, hp: 1, maxHp: 1, fireIn: 99, entry: { key: 'x-rookie', id: 'x', stage: 'rookie', kind: 'base', element: 'fogo', elements: ['fogo'], name: 'x', basico: {} as never, especial: {} as never }, stage: 'rookie', points: 10, t: 0 });
    s.shots.push({ x: s.px, y: 200, vx: 0, vy: 0 });
    const ev = stepBarrage(s, 0.01, s.px, 1, rng);
    expect(ev.kills).toBe(1);
    expect(s.score).toBe(10);
  });
});
