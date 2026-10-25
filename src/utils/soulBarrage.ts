/**
 * SOUL BARRAGE (BACKLOG-BETA3 M9) — a lógica PURA do bullet hell vertical do Salão de Jogos.
 * Sem React, sem canvas, sem relógio: `dt` e `rng` entram por parâmetro (determinístico e testável).
 * A tela (`components/SoulBarrage.tsx`) só desenha e traduz toque em `targetX`.
 *
 * Regras: o Soulmon fica na base e atira sozinho (orbe do elemento dele); inimigos do
 * `enemyRoster` descem e atiram; tiro inimigo que encosta tira 1 vida; inimigo que passa da
 * base some sem custo. A cada `PHASE_SECONDS` a fase sobe: estágio do inimigo, cadência,
 * velocidade e densidade crescem. Pontos = abates; Bits = `barrageBits(score)` pelo funil
 * de minigames (o teto diário é aplicado fora daqui).
 */
import { pickEnemy, type EnemyStage, type RosterEntry } from './enemyRoster';

export const FIELD_W = 360;
export const FIELD_H = 560;
export const PLAYER_R = 10;      // hitbox do jogador (menor que o sprite: bullet hell perdoa)
export const PLAYER_SIZE = 44;   // tamanho do desenho
export const PLAYER_Y = FIELD_H - 70;
export const PLAYER_SPEED = 520; // px/s ao seguir o dedo
export const START_LIVES = 3;
export const INVULN_SECONDS = 1.4;
export const PHASE_SECONDS = 20;
export const SHOT_EVERY = 0.22;
export const SHOT_SPEED = 620;
export const SHOT_R = 5;
export const ENEMY_SIZE = 40;
export const ENEMY_R = 16;
export const MAX_ENEMIES = 7;
export const MAX_PLAYER_SHOTS = 40;
export const MAX_ENEMY_SHOTS = 60;
/** 1 Bit a cada N pontos — a mesma conta da Corrida com obstáculos. */
export const BARRAGE_POINTS_PER_BIT = 100;

export interface Rng { (): number }
export interface Enemy {
  x: number; y: number; vx: number; vy: number; hp: number; maxHp: number;
  fireIn: number; entry: RosterEntry; stage: EnemyStage; points: number; t: number;
}
export interface Shot { x: number; y: number; vx: number; vy: number }
export interface BarrageState {
  t: number; phase: number; score: number; lives: number; invuln: number;
  px: number; fireIn: number; spawnIn: number; scroll: number;
  enemies: Enemy[]; shots: Shot[]; enemyShots: Shot[];
  kills: number; over: boolean; usedIds: Set<string>;
}
export interface StepEvents { hit: boolean; kills: number; phaseUp: boolean; over: boolean }

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function newBarrage(): BarrageState {
  return {
    t: 0, phase: 1, score: 0, lives: START_LIVES, invuln: 0, px: FIELD_W / 2, fireIn: 0.3, spawnIn: 0.8, scroll: 0,
    enemies: [], shots: [], enemyShots: [], kills: 0, over: false, usedIds: new Set(),
  };
}

export const phaseAt = (t: number): number => 1 + Math.floor(Math.max(0, t) / PHASE_SECONDS);

/** rookie nas fases 1–2, champion 3–4, ultimate 5–6, mega 7+ (depois o `pickEnemy` ainda rebaixa ao teto do level). */
export function enemyStageForPhase(phase: number): EnemyStage {
  if (phase <= 2) return 'rookie';
  if (phase <= 4) return 'champion';
  if (phase <= 6) return 'ultimate';
  return 'mega';
}

const STAGE_HP: Record<EnemyStage, number> = { rookie: 2, champion: 3, ultimate: 5, mega: 8 };
const STAGE_POINTS: Record<EnemyStage, number> = { rookie: 10, champion: 20, ultimate: 35, mega: 60 };

/** Dificuldade crescente (todas as curvas têm teto — o jogo precisa continuar sendo desviável). */
export const difficultyAt = (phase: number) => ({
  descent: Math.min(120, 45 + (phase - 1) * 9),                       // px/s
  spawnEvery: Math.max(0.55, 1.5 - (phase - 1) * 0.12),               // s
  fireEvery: Math.max(0.9, 2.2 - (phase - 1) * 0.15),                 // s por inimigo
  bulletSpeed: Math.min(260, 130 + (phase - 1) * 16),                 // px/s
  fanSize: Math.min(5, 1 + Math.floor((phase - 1) / 2)),              // balas por rajada
  maxEnemies: Math.min(MAX_ENEMIES, 3 + Math.floor((phase - 1) / 1)),
});

export const barrageBits = (score: number): number => Math.floor(Math.max(0, score) / BARRAGE_POINTS_PER_BIT);

const hit = (ax: number, ay: number, ar: number, bx: number, by: number, br: number) => {
  const dx = ax - bx, dy = ay - by, r = ar + br;
  return dx * dx + dy * dy <= r * r;
};

function spawnEnemy(s: BarrageState, level: number, rng: Rng) {
  const d = difficultyAt(s.phase);
  const stage = enemyStageForPhase(s.phase);
  const entry = pickEnemy(level, rng, { stage, used: s.usedIds });
  s.usedIds.add(entry.id);
  if (s.usedIds.size > 6) s.usedIds.clear();
  const margin = ENEMY_SIZE / 2 + 4;
  const e: Enemy = {
    x: margin + rng() * (FIELD_W - margin * 2), y: -ENEMY_SIZE,
    vx: (rng() - 0.5) * 50, vy: d.descent * (0.8 + rng() * 0.4),
    hp: STAGE_HP[entry.stage], maxHp: STAGE_HP[entry.stage],
    fireIn: 0.6 + rng() * d.fireEvery, entry, stage: entry.stage, points: STAGE_POINTS[entry.stage], t: 0,
  };
  s.enemies.push(e);
}

function fire(s: BarrageState, e: Enemy, rng: Rng) {
  const d = difficultyAt(s.phase);
  const base = Math.atan2(PLAYER_Y - e.y, s.px - e.x); // mira no jogador
  const n = d.fanSize;
  const spread = 0.22;
  for (let i = 0; i < n; i++) {
    if (s.enemyShots.length >= MAX_ENEMY_SHOTS) return;
    const a = base + (i - (n - 1) / 2) * spread + (rng() - 0.5) * 0.06;
    s.enemyShots.push({ x: e.x, y: e.y + ENEMY_SIZE / 2, vx: Math.cos(a) * d.bulletSpeed, vy: Math.sin(a) * d.bulletSpeed });
  }
}

/**
 * Avança a simulação `dt` segundos (clampado) e devolve o que aconteceu. Muta `s`.
 * `targetX` = onde o dedo/mouse está (o Soulmon segue com velocidade máxima, nunca teleporta).
 */
export function stepBarrage(s: BarrageState, dtRaw: number, targetX: number, level: number, rng: Rng): StepEvents {
  const ev: StepEvents = { hit: false, kills: 0, phaseUp: false, over: false };
  if (s.over) return { ...ev, over: true };
  const dt = clamp(dtRaw, 0, 0.05);
  s.t += dt;
  s.scroll += dt * 60;
  const ph = phaseAt(s.t);
  if (ph > s.phase) { s.phase = ph; ev.phaseUp = true; s.score += 50; }
  const d = difficultyAt(s.phase);

  // jogador
  const dx = clamp(targetX, PLAYER_SIZE / 2, FIELD_W - PLAYER_SIZE / 2) - s.px;
  const step = PLAYER_SPEED * dt;
  s.px += Math.abs(dx) <= step ? dx : Math.sign(dx) * step;
  s.invuln = Math.max(0, s.invuln - dt);

  // tiro automático contínuo
  s.fireIn -= dt;
  while (s.fireIn <= 0) {
    s.fireIn += SHOT_EVERY;
    if (s.shots.length < MAX_PLAYER_SHOTS) s.shots.push({ x: s.px, y: PLAYER_Y - PLAYER_SIZE / 2, vx: 0, vy: -SHOT_SPEED });
  }

  // spawn
  s.spawnIn -= dt;
  if (s.spawnIn <= 0) {
    s.spawnIn = d.spawnEvery * (0.8 + rng() * 0.4);
    if (s.enemies.length < d.maxEnemies) spawnEnemy(s, level, rng);
  }

  // movimento
  for (const e of s.enemies) {
    e.t += dt;
    e.x += (e.vx + Math.sin(e.t * 1.6 + e.maxHp) * 28) * dt;
    e.x = clamp(e.x, ENEMY_SIZE / 2, FIELD_W - ENEMY_SIZE / 2);
    e.y += e.vy * dt;
    e.fireIn -= dt;
    if (e.fireIn <= 0 && e.y > 0 && e.y < PLAYER_Y - 80) { fire(s, e, rng); e.fireIn = d.fireEvery * (0.85 + rng() * 0.3); }
  }
  s.enemies = s.enemies.filter(e => e.y < FIELD_H + ENEMY_SIZE);
  for (const b of s.shots) { b.x += b.vx * dt; b.y += b.vy * dt; }
  s.shots = s.shots.filter(b => b.y > -20);
  for (const b of s.enemyShots) { b.x += b.vx * dt; b.y += b.vy * dt; }
  s.enemyShots = s.enemyShots.filter(b => b.y < FIELD_H + 20 && b.y > -40 && b.x > -20 && b.x < FIELD_W + 20);

  // tiros do jogador × inimigos
  for (const b of s.shots) {
    for (const e of s.enemies) {
      if (e.hp > 0 && hit(b.x, b.y, SHOT_R, e.x, e.y, ENEMY_R)) { e.hp -= 1; b.y = -999; break; }
    }
  }
  s.shots = s.shots.filter(b => b.y > -500);
  const alive: Enemy[] = [];
  for (const e of s.enemies) {
    if (e.hp > 0) { alive.push(e); continue; }
    s.score += e.points; s.kills += 1; ev.kills += 1;
  }
  s.enemies = alive;

  // colisão com o jogador (tiro inimigo ou corpo)
  if (s.invuln <= 0) {
    const bullet = s.enemyShots.findIndex(b => hit(b.x, b.y, 4, s.px, PLAYER_Y, PLAYER_R));
    const body = s.enemies.findIndex(e => hit(e.x, e.y, ENEMY_R - 2, s.px, PLAYER_Y, PLAYER_R));
    if (bullet >= 0 || body >= 0) {
      if (bullet >= 0) s.enemyShots.splice(bullet, 1);
      if (body >= 0) s.enemies.splice(body, 1);
      s.lives -= 1; s.invuln = INVULN_SECONDS; ev.hit = true;
      if (s.lives <= 0) { s.over = true; ev.over = true; }
    }
  }
  return ev;
}
