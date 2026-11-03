/**
 * SOUL BARRAGE (BACKLOG-BETA3 M9) — a lógica PURA do bullet hell vertical do Salão de Jogos.
 * Sem React, sem canvas, sem relógio: `dt` e `rng` entram por parâmetro (determinístico e testável).
 * A tela (`components/SoulBarrage.tsx`) só desenha e traduz toque em `targetX`.
 *
 * Regras: o Soulmon fica na base e atira sozinho (orbe do elemento dele); inimigos do
 * elemento espaço (`enemyRoster`) descem em levas e atiram; tiro inimigo que encosta tira 1 vida;
 * inimigo que chega à base também tira 1 vida (ambos abrem 1 s de invulnerabilidade; vazamento nela é descartado). A cada `PHASE_SECONDS` a fase sobe: estágio do inimigo, cadência,
 * velocidade e densidade crescem. Pontos = abates; Bits = `barrageBits(score)` pelo funil
 * de minigames (o teto diário é aplicado fora daqui).
 */
import type { EnemyStage, RosterEntry } from './enemyRoster';
import { BARRAGE_ROSTER } from './temaInimigos';

/**
 * RODADA 4 (26/10/2026, N6): só inimigos do elemento ESPAÇO (a criatura base e os rookies combinados com espaço do
 * `enemyRoster`); a dificuldade vem de QUANTIDADE e ESTÁGIO, em LEVAS (muito rookie, às vezes champion, às vezes
 * ultimate — mais vida cada); inimigo que atravessa até a base TIRA VIDA; sprites maiores; tiro inimigo é o FX de espaço.
 */
export const BARRAGE_ELEMENT = 'espaco';
/** 30/10/2026 (dono): elenco RENOVADO — criaturas próprias da Barrage (`temaInimigos.ts` › `BARRAGE_ROSTER`), ainda só ESPAÇO. */
const SPACE_ROSTER: readonly RosterEntry[] = BARRAGE_ROSTER.filter(e => e.elements[0] === BARRAGE_ELEMENT && e.stage !== 'mega');

export const FIELD_W = 360;
export const FIELD_H = 560;
export const PLAYER_R = 10;      // hitbox do jogador (menor que o sprite: bullet hell perdoa)
export const PLAYER_SIZE = 64;   // tamanho do desenho
export const PLAYER_Y = FIELD_H - 70;
export const PLAYER_SPEED = 520; // px/s ao seguir o dedo
export const START_LIVES = 3;
export const INVULN_SECONDS = 1.0;
export const PHASE_SECONDS = 20;
export const SHOT_EVERY = 0.22;
export const SHOT_SPEED = 620;
export const SHOT_R = 7;
/** Tamanho do desenho do tiro (jogador e inimigo). */
export const SHOT_DRAW = 34;
/** Desenho e hitbox por estágio (maior = mais vida). */
export const ENEMY_SIZE_BY_STAGE: Record<EnemyStage, number> = { rookie: 60, champion: 76, ultimate: 92, mega: 92 };
export const ENEMY_SIZE = ENEMY_SIZE_BY_STAGE.rookie;
export const ENEMY_R = 22;
export const ENEMY_R_BY_STAGE: Record<EnemyStage, number> = { rookie: 22, champion: 29, ultimate: 36, mega: 36 };
/** Linha da base: o inimigo que chega aqui tira 1 vida do jogador e some. */
export const BASE_Y = FIELD_H - 16;
export const MAX_ENEMIES = 10;
export const MAX_PLAYER_SHOTS = 40;
export const MAX_ENEMY_SHOTS = 60;
/** 1 Bit a cada N pontos — a mesma conta da Corrida com obstáculos. */
export const BARRAGE_POINTS_PER_BIT = 100;

export interface Rng { (): number }
export interface Enemy {
  x: number; y: number; vx: number; vy: number; hp: number; maxHp: number;
  fireIn: number; entry: RosterEntry; stage: EnemyStage; points: number; t: number;
  /** Tamanho do desenho e raio da hitbox (crescem com o estágio). */
  size: number; r: number;
}
export interface Shot { x: number; y: number; vx: number; vy: number; /** Dano (padrão 1); o Overdrive dobra. */ dmg?: number }

/**
 * ESPECIAL (modo Avançado, pedido do dono 03/11/2026): botão no canto inferior direito, coerente com o especial do Soulmon
 * (a FAMÍLIA do especial da ficha). Carrega com abates (pontos do inimigo) e a cada fase; custa `SPECIAL_COST`.
 *  beam      (direct, dot)   tiro grande reto: limpa os tiros inimigos no caminho e causa dano triplo.
 *  shield    (shield)        escudo que absorve o próximo golpe (até `SHIELD_SECONDS`).
 *  heal      (heal)          +1 vida (até `MAX_LIVES`).
 *  overdrive (atkBuff)       `OVERDRIVE_SECONDS` com cadência e dano dobrados.
 *  pulse     (defDebuff)     onda que apaga todos os tiros inimigos e fere todos os inimigos.
 *  slow      (spdBuff)       `SLOW_SECONDS` com inimigos e tiros à metade da velocidade.
 */
export type BarrageSpecial = 'beam' | 'shield' | 'heal' | 'overdrive' | 'pulse' | 'slow';
export const SPECIAL_COST = 100;
export const BEAM_HALF_W = 32;
export const BEAM_DAMAGE = 3;
export const PULSE_DAMAGE = 3;
export const SHIELD_SECONDS = 10;
export const OVERDRIVE_SECONDS = 6;
export const SLOW_SECONDS = 5;
export const MAX_LIVES = 5;
/** Menor altura que o Soulmon alcança no modo Avançado (a faixa de baixo ~65% do campo). */
export const PLAYER_MIN_Y = FIELD_H * 0.35;
/** Família do especial da ficha → efeito do botão (família ausente/desconhecida = tiro grande). */
export function specialKindOf(family?: string): BarrageSpecial {
  switch (family) {
    case 'shield': return 'shield';
    case 'heal': return 'heal';
    case 'atkBuff': return 'overdrive';
    case 'defDebuff': return 'pulse';
    case 'spdBuff': return 'slow';
    default: return 'beam';
  }
}
export interface BarrageState {
  t: number; phase: number; score: number; lives: number; invuln: number;
  px: number; py: number; fireIn: number; spawnIn: number; scroll: number;
  /** Especial (Avançado): carga 0..SPECIAL_COST, temporizadores de efeito e feixes a desenhar. */
  charge: number; shield: number; overdrive: number; slow: number; pulse: number; beams: { x: number; t: number }[];
  enemies: Enemy[]; shots: Shot[]; enemyShots: Shot[];
  kills: number; over: boolean; usedIds: Set<string>;
}
export interface StepEvents { blocked?: boolean; hit: boolean; kills: number; phaseUp: boolean; over: boolean; leaked: number }

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function newBarrage(): BarrageState {
  return {
    t: 0, phase: 1, score: 0, lives: START_LIVES, invuln: 0, px: FIELD_W / 2, py: PLAYER_Y, fireIn: 0.3, spawnIn: 0.8, scroll: 0,
    enemies: [], shots: [], enemyShots: [], kills: 0, over: false, usedIds: new Set(),
    charge: 0, shield: 0, overdrive: 0, slow: 0, pulse: 0, beams: [],
  };
}

export const phaseAt = (t: number): number => 1 + Math.floor(Math.max(0, t) / PHASE_SECONDS);

/**
 * Chance de cada estágio numa vaga da leva. Rookie é a maioria SEMPRE; champion aparece "às vezes" a partir da fase 2 e
 * ultimate mais raro a partir da fase 3 (ambos com teto, para a tela continuar desviável).
 */
export function stageOdds(phase: number): { champion: number; ultimate: number } {
  const champion = phase < 2 ? 0 : Math.min(0.3, 0.1 + (phase - 2) * 0.04);
  const ultimate = phase < 3 ? 0 : Math.min(0.14, 0.04 + (phase - 3) * 0.02);
  return { champion, ultimate };
}
export function pickWaveStage(phase: number, rng: Rng): EnemyStage {
  const { champion, ultimate } = stageOdds(phase);
  const r = rng();
  if (r < ultimate) return 'ultimate';
  if (r < ultimate + champion) return 'champion';
  return 'rookie';
}

/** Vida por estágio: champion aguenta bem mais, ultimate ainda mais. */
export const STAGE_HP: Record<EnemyStage, number> = { rookie: 2, champion: 6, ultimate: 11, mega: 11 };
const STAGE_POINTS: Record<EnemyStage, number> = { rookie: 10, champion: 25, ultimate: 50, mega: 50 };

/** Dificuldade crescente (todas as curvas têm teto — o jogo precisa continuar sendo desviável). */
export const difficultyAt = (phase: number) => ({
  descent: Math.min(120, 45 + (phase - 1) * 9),                       // px/s
  spawnEvery: Math.max(2.4, 4.2 - (phase - 1) * 0.25),                // s entre LEVAS
  waveSize: Math.min(6, 2 + Math.floor((phase - 1) / 2)),             // inimigos por leva
  fireEvery: Math.max(0.9, 2.2 - (phase - 1) * 0.15),                 // s por inimigo
  bulletSpeed: Math.min(260, 130 + (phase - 1) * 16),                 // px/s
  fanSize: Math.min(5, 1 + Math.floor((phase - 1) / 2)),              // balas por rajada
  maxEnemies: Math.min(MAX_ENEMIES, 4 + (phase - 1)),
});

export const barrageBits = (score: number): number => Math.floor(Math.max(0, score) / BARRAGE_POINTS_PER_BIT);

const hit = (ax: number, ay: number, ar: number, bx: number, by: number, br: number) => {
  const dx = ax - bx, dy = ay - by, r = ar + br;
  return dx * dx + dy * dy <= r * r;
};

/** Um golpe no jogador: o escudo absorve (sem tirar vida); senão tira 1 vida. */
function takeHit(s: BarrageState, ev: StepEvents, invuln: number) {
  if (s.shield > 0) { s.shield = 0; s.invuln = Math.min(invuln, 0.6); ev.blocked = true; return; }
  s.lives -= 1; s.invuln = invuln; ev.hit = true;
  if (s.lives <= 0) { s.over = true; ev.over = true; }
}

export const specialReady = (s: BarrageState): boolean => !s.over && s.charge >= SPECIAL_COST;

/** Dispara o Especial se a carga estiver cheia. Devolve se disparou. Muta `s`; os abates saem no próximo `stepBarrage`. */
export function activateSpecial(s: BarrageState, kind: BarrageSpecial): boolean {
  if (!specialReady(s)) return false;
  s.charge = 0;
  switch (kind) {
    case 'beam':
      s.beams.push({ x: s.px, t: 0 });
      for (const e of s.enemies) if (e.y < s.py && Math.abs(e.x - s.px) <= BEAM_HALF_W + e.r) e.hp -= BEAM_DAMAGE;
      s.enemyShots = s.enemyShots.filter(b => !(b.y < s.py && Math.abs(b.x - s.px) <= BEAM_HALF_W));
      break;
    case 'shield': s.shield = SHIELD_SECONDS; break;
    case 'heal': s.lives = Math.min(MAX_LIVES, s.lives + 1); break;
    case 'overdrive': s.overdrive = OVERDRIVE_SECONDS; break;
    case 'pulse':
      s.pulse = 0.5; s.enemyShots = [];
      for (const e of s.enemies) if (e.y > 0) e.hp -= PULSE_DAMAGE;
      break;
    case 'slow': s.slow = SLOW_SECONDS; break;
  }
  return true;
}

/** Sorteia do roster do ESPAÇO no estágio pedido (sem ele, cai no rookie); evita repetir os últimos ids da leva. */
function pickSpaceEnemy(stage: EnemyStage, used: ReadonlySet<string>, rng: Rng): RosterEntry {
  let have = SPACE_ROSTER.filter(e => e.stage === stage);
  if (have.length === 0) have = SPACE_ROSTER.filter(e => e.stage === 'rookie');
  const fresh = have.filter(e => !used.has(e.id));
  const pool = fresh.length > 0 ? fresh : have;
  return pool[Math.floor(rng() * pool.length)];
}

/** Uma LEVA: vários inimigos de uma vez, espalhados na largura e escalonados na altura (maioria rookie). */
function spawnWave(s: BarrageState, rng: Rng) {
  const d = difficultyAt(s.phase);
  const room = d.maxEnemies - s.enemies.length;
  const n = Math.min(d.waveSize, room);
  for (let i = 0; i < n; i++) {
    const stage = pickWaveStage(s.phase, rng);
    const entry = pickSpaceEnemy(stage, s.usedIds, rng);
    s.usedIds.add(entry.id);
    if (s.usedIds.size > 6) s.usedIds.clear();
    const size = ENEMY_SIZE_BY_STAGE[entry.stage];
    const margin = size / 2 + 4;
    // faixas: cada inimigo da leva ocupa uma fatia da largura, com folga aleatória
    const slot = (FIELD_W - margin * 2) / Math.max(1, n);
    const e: Enemy = {
      x: margin + slot * i + rng() * slot, y: -size - i * 34,
      vx: (rng() - 0.5) * 50, vy: d.descent * (0.8 + rng() * 0.4) * (entry.stage === 'rookie' ? 1 : 0.8),
      hp: STAGE_HP[entry.stage], maxHp: STAGE_HP[entry.stage],
      fireIn: 0.6 + rng() * d.fireEvery, entry, stage: entry.stage, points: STAGE_POINTS[entry.stage], t: 0,
      size, r: ENEMY_R_BY_STAGE[entry.stage],
    };
    s.enemies.push(e);
  }
}

function fire(s: BarrageState, e: Enemy, rng: Rng) {
  const d = difficultyAt(s.phase);
  const base = Math.atan2(s.py - e.y, s.px - e.x); // mira no jogador
  const n = d.fanSize;
  const spread = 0.22;
  for (let i = 0; i < n; i++) {
    if (s.enemyShots.length >= MAX_ENEMY_SHOTS) return;
    const a = base + (i - (n - 1) / 2) * spread + (rng() - 0.5) * 0.06;
    s.enemyShots.push({ x: e.x, y: e.y + e.size / 2, vx: Math.cos(a) * d.bulletSpeed, vy: Math.sin(a) * d.bulletSpeed });
  }
}

/**
 * Avança a simulação `dt` segundos (clampado) e devolve o que aconteceu. Muta `s`.
 * `targetX` = onde o dedo/mouse está (o Soulmon segue com velocidade máxima, nunca teleporta).
 */
export function stepBarrage(s: BarrageState, dtRaw: number, targetX: number, level: number, rng: Rng, targetY?: number): StepEvents {
  const ev: StepEvents = { hit: false, kills: 0, phaseUp: false, over: false, leaked: 0 };
  if (s.over) return { ...ev, over: true };
  const dt = clamp(dtRaw, 0, 0.05);
  s.t += dt;
  s.scroll += dt * 60;
  const ph = phaseAt(s.t);
  if (ph > s.phase) { s.phase = ph; ev.phaseUp = true; s.score += 50; if (level === 2) s.charge = Math.min(SPECIAL_COST, s.charge + 20); }
  const d = difficultyAt(s.phase);

  // jogador
  const dx = clamp(targetX, PLAYER_SIZE / 2, FIELD_W - PLAYER_SIZE / 2) - s.px;
  const step = PLAYER_SPEED * dt;
  s.px += Math.abs(dx) <= step ? dx : Math.sign(dx) * step;
  if (level === 2 && targetY !== undefined) {
    const dy = clamp(targetY, PLAYER_MIN_Y, FIELD_H - PLAYER_SIZE / 2 - 4) - s.py;
    s.py += Math.abs(dy) <= step ? dy : Math.sign(dy) * step;
  }
  s.shield = Math.max(0, s.shield - dt); s.overdrive = Math.max(0, s.overdrive - dt);
  s.slow = Math.max(0, s.slow - dt); s.pulse = Math.max(0, s.pulse - dt);
  for (const b of s.beams) b.t += dt;
  s.beams = s.beams.filter(b => b.t < 0.4);
  const edt = s.slow > 0 ? dt * 0.5 : dt;
  s.invuln = Math.max(0, s.invuln - dt);

  // tiro automático contínuo
  s.fireIn -= dt;
  const every = s.overdrive > 0 ? SHOT_EVERY / 2 : SHOT_EVERY;
  while (s.fireIn <= 0) {
    s.fireIn += every;
    if (s.shots.length < MAX_PLAYER_SHOTS) s.shots.push({ x: s.px, y: s.py - PLAYER_SIZE / 2, vx: 0, vy: -SHOT_SPEED, ...(s.overdrive > 0 ? { dmg: 2 } : {}) });
  }

  // spawn
  s.spawnIn -= dt;
  if (s.spawnIn <= 0) {
    s.spawnIn = d.spawnEvery * (0.8 + rng() * 0.4);
    spawnWave(s, rng);
  }

  // movimento
  for (const e of s.enemies) {
    e.t += edt;
    e.x += (e.vx + Math.sin(e.t * 1.6 + e.maxHp) * 28) * edt;
    e.x = clamp(e.x, e.size / 2, FIELD_W - e.size / 2);
    e.y += e.vy * edt;
    e.fireIn -= edt;
    if (e.fireIn <= 0 && e.y > 0 && e.y < s.py - 80) { fire(s, e, rng); e.fireIn = d.fireEvery * (0.85 + rng() * 0.3); }
  }
  // Quem atravessa até a base some. Fora da invulnerabilidade, a leva inteira tira 1 vida só e abre a janela;
  // durante a invulnerabilidade, o vazamento é descartado sem tirar vida.
  const through = s.enemies.filter(e => e.y >= BASE_Y).length;
  if (through > 0) {
    s.enemies = s.enemies.filter(e => e.y < BASE_Y);
    if (s.invuln <= 0) { ev.leaked = through; takeHit(s, ev, INVULN_SECONDS); }
  }
  for (const b of s.shots) { b.x += b.vx * dt; b.y += b.vy * dt; }
  s.shots = s.shots.filter(b => b.y > -20);
  for (const b of s.enemyShots) { b.x += b.vx * edt; b.y += b.vy * edt; }
  s.enemyShots = s.enemyShots.filter(b => b.y < FIELD_H + 20 && b.y > -40 && b.x > -20 && b.x < FIELD_W + 20);

  // tiros do jogador × inimigos
  for (const b of s.shots) {
    for (const e of s.enemies) {
      if (e.hp > 0 && hit(b.x, b.y, SHOT_R, e.x, e.y, e.r)) { e.hp -= b.dmg ?? 1; b.y = -999; break; }
    }
  }
  s.shots = s.shots.filter(b => b.y > -500);
  const alive: Enemy[] = [];
  for (const e of s.enemies) {
    if (e.hp > 0) { alive.push(e); continue; }
    s.score += e.points; s.kills += 1; ev.kills += 1;
    if (level === 2) s.charge = Math.min(SPECIAL_COST, s.charge + e.points);
  }
  s.enemies = alive;

  // colisão com o jogador (tiro inimigo ou corpo)
  if (s.invuln <= 0) {
    const bullet = s.enemyShots.findIndex(b => hit(b.x, b.y, 6, s.px, s.py, PLAYER_R));
    const body = s.enemies.findIndex(e => hit(e.x, e.y, e.r - 2, s.px, s.py, PLAYER_R));
    if (bullet >= 0 || body >= 0) {
      if (bullet >= 0) s.enemyShots.splice(bullet, 1);
      if (body >= 0) s.enemies.splice(body, 1);
      takeHit(s, ev, INVULN_SECONDS);
    }
  }
  return ev;
}
