import { ENEMY_ROSTER } from './enemyRoster';
import { describe, it, expect } from 'vitest';
import {
  newBarrage, stepBarrage, phaseAt, stageOdds, pickWaveStage, STAGE_HP, BASE_Y, BARRAGE_ELEMENT, difficultyAt, barrageBits, FIELD_W, PLAYER_Y, START_LIVES,
  PHASE_SECONDS, INVULN_SECONDS, isTap, registerTap, DOUBLE_TAP_MS, DOUBLE_TAP_DIST,
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
    // o elemento do inimigo é o do SPRITE (combinado = id fundido); todos vêm do roster de espaço
    const permitidos = new Set(ENEMY_ROSTER.filter(e => e.elements[0] === BARRAGE_ELEMENT).map(e => e.element));
    expect([...seen].every(el => permitidos.has(el as string))).toBe(true);
    expect(seen.has(BARRAGE_ELEMENT)).toBe(true);
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
    expect(s.enemies.every(e => e.entry.elements[0] === 'espaco')).toBe(true);
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

import { BOSS_EVERY, BOSS_BASE_HP, BOSS_POINTS, activateSpecial, specialReady, specialKindOf, SPECIAL_COST, PLAYER_MIN_Y, FIELD_H as FH, MAX_LIVES } from './soulBarrage';

describe('soulBarrage — modo Avançado (Y livre + Especial)', () => {
  const foe = (s: ReturnType<typeof newBarrage>, x: number, y: number, hp = 6) => {
    s.enemies.push({ x, y, vx: 0, vy: 0, hp, maxHp: hp, fireIn: 99, entry: ENEMY_ROSTER[0], stage: 'rookie', points: 10, t: 0, size: 60, r: 22 });
  };
  it('Y livre só no nível 2, dentro dos limites; nível 1 fica na base', () => {
    const a = newBarrage(); const b = newBarrage();
    for (let i = 0; i < 40; i++) { stepBarrage(a, 0.05, a.px, 2, seeded(1), 0); stepBarrage(b, 0.05, b.px, 1, seeded(1), 0); }
    expect(a.py).toBe(PLAYER_MIN_Y);
    expect(b.py).toBe(PLAYER_Y);
    for (let i = 0; i < 80; i++) stepBarrage(a, 0.05, a.px, 2, seeded(1), 9999);
    expect(a.py).toBeLessThanOrEqual(FH);
  });
  it('especial carrega com abates e só dispara cheio', () => {
    const s = newBarrage();
    expect(activateSpecial(s, 'beam')).toBe(false);
    s.charge = SPECIAL_COST;
    expect(specialReady(s)).toBe(true);
    expect(activateSpecial(s, 'beam')).toBe(true);
    expect(s.charge).toBe(0);
  });
  it('projétil grande: mata na hora o que está no caminho e apaga tiros inimigos; fora do caminho não faz nada', () => {
    const s = newBarrage(); s.charge = SPECIAL_COST;
    foe(s, s.px, 300, 11); foe(s, s.px + 120, 300, 11);
    s.enemyShots.push({ x: s.px, y: 200, vx: 0, vy: 0 }, { x: s.px + 120, y: 200, vx: 0, vy: 0 });
    activateSpecial(s, 'beam');
    for (let i = 0; i < 12; i++) stepBarrage(s, 0.05, s.px, 2, seeded(4), s.py);
    expect(s.enemies).toHaveLength(1);
    expect(s.enemies[0].x).toBeGreaterThan(s.px + 60);
    expect(s.enemyShots).toHaveLength(1);
    expect(s.score).toBe(10);
  });
  it('boss: entra a cada BOSS_EVERY pontos, segura as levas, o projétil grande tira 15% e a morte paga', () => {
    const s = newBarrage();
    s.score = BOSS_EVERY; s.spawnIn = 0;
    const ev = stepBarrage(s, 0.05, s.px, 2, seeded(5), s.py);
    expect(ev.bossSpawned).toBe(true);
    expect(s.boss?.maxHp).toBe(BOSS_BASE_HP);
    for (let i = 0; i < 40; i++) stepBarrage(s, 0.05, s.px, 2, seeded(5), s.py);
    expect(s.enemies).toHaveLength(0);
    s.boss!.t = 0; s.charge = SPECIAL_COST;
    activateSpecial(s, 'beam');
    const hp0 = s.boss!.hp;
    for (let i = 0; i < 14; i++) stepBarrage(s, 0.05, s.px, 2, seeded(5), s.py);
    expect(hp0 - s.boss!.hp).toBeGreaterThanOrEqual(Math.ceil(BOSS_BASE_HP * 0.15));
    s.boss!.hp = 1; const before = s.score;
    s.shots.push({ x: s.boss!.x, y: s.boss!.y, vx: 0, vy: 0 });
    const ev2 = stepBarrage(s, 0.001, s.px, 2, seeded(5), s.py);
    expect(ev2.bossDefeated).toBe(true);
    expect(s.score).toBeGreaterThanOrEqual(before + BOSS_POINTS);
    expect(s.nextBossAt).toBe(BOSS_EVERY * 2);
  });
  it('escudo absorve um golpe sem tirar vida; cura respeita o teto; pulso limpa a tela; slow reduz a velocidade', () => {
    const s = newBarrage(); s.charge = SPECIAL_COST; activateSpecial(s, 'shield');
    s.enemyShots.push({ x: s.px, y: s.py, vx: 0, vy: 0 });
    const ev = stepBarrage(s, 0.01, s.px, 2, seeded(2), s.py);
    expect(ev.blocked).toBe(true); expect(s.lives).toBe(START_LIVES);
    s.charge = SPECIAL_COST; s.lives = MAX_LIVES; activateSpecial(s, 'heal'); expect(s.lives).toBe(MAX_LIVES);
    s.charge = SPECIAL_COST; s.enemyShots.push({ x: 5, y: 5, vx: 0, vy: 0 }); foe(s, 100, 50, 6); activateSpecial(s, 'pulse');
    expect(s.enemyShots).toHaveLength(0); expect(s.enemies[0].hp).toBe(3);
    const t = newBarrage(); t.charge = SPECIAL_COST; activateSpecial(t, 'slow'); foe(t, 100, 50); t.enemies[0].vy = 100;
    stepBarrage(t, 0.05, t.px, 2, seeded(3), t.py);
    expect(t.enemies[0].y).toBeCloseTo(52.5, 1);
  });
  it('família do especial → efeito', () => {
    expect(['direct', 'dot', undefined].map(specialKindOf)).toEqual(['beam', 'beam', 'beam']);
    expect(['shield', 'heal', 'atkBuff', 'defDebuff', 'spdBuff'].map(specialKindOf)).toEqual(['shield', 'heal', 'overdrive', 'pulse', 'slow']);
  });
});

describe('double tap (Especial)', () => {
  const at = (t: number, x = 100, y = 100) => ({ t, x, y });
  it('apertar-e-soltar curto e parado é toque; arrasto ou demora não é', () => {
    expect(isTap(at(0), at(120, 103, 102))).toBe(true);
    expect(isTap(at(0), at(400))).toBe(false);
    expect(isTap(at(0), at(100, 160, 100))).toBe(false);
  });
  it('dois toques juntos e rápidos = double; o par é consumido', () => {
    const a = registerTap(null, at(1000));
    expect(a.double).toBe(false);
    const b = registerTap(a.last, at(1200, 110, 105));
    expect(b.double).toBe(true);
    expect(b.last).toBeNull();
    expect(registerTap(b.last, at(1300)).double).toBe(false);
  });
  it('devagar demais ou longe demais não é double', () => {
    expect(registerTap(at(1000), at(1000 + DOUBLE_TAP_MS + 1)).double).toBe(false);
    expect(registerTap(at(1000), at(1100, 100 + DOUBLE_TAP_DIST + 1, 100)).double).toBe(false);
  });
});
