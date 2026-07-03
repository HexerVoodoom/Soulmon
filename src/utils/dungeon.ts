// ⚔️ Dungeon logic — random enemies by tier, monthly-scaling difficulty,
// daily play limit, score/ranking and heart drops. Kept out of the component so
// the rules are testable and the storage bookkeeping lives in one place.
import { STAGE_SPRITES } from './sprites';
import { getStageLevel } from '../types/progression';
import { STORAGE_KEYS } from './storageKeys';

export interface DungeonEnemy {
  name: string;
  stage: string;   // sprite key
  hp: number;
  atk: number;
  speed: number;   // timing-bar sweeps per second (higher = harder)
  points: number;  // 🎖️ granted when defeated
}

export type BattleTier = 'rookie' | 'champion' | 'ultimate' | 'mega';

export const DUNGEON_DAILY_LIMIT = 3;      // runs per day (dungeon rewards more)
const HEART_DROP_DAILY_CAP = 2;            // hearts the dungeon can drop per day
const HEART_DROP_CHANCE = 0.3;             // per enemy defeated

// Base enemy stats per tier, before the monthly difficulty scaling.
const TIER_BASE: Record<BattleTier, { hp: number; atk: number; speed: number; points: number }> = {
  rookie:   { hp: 10, atk: 3, speed: 1.0,  points: 4 },
  champion: { hp: 15, atk: 4, speed: 1.25, points: 7 },
  ultimate: { hp: 20, atk: 5, speed: 1.5,  points: 10 },
  mega:     { hp: 28, atk: 7, speed: 1.8,  points: 13 },
};

// Map the pet's evolution level to a battle tier (babies fight rookie-tier
// enemies; ultra fights mega-tier).
export function getBattleTier(stage: string): BattleTier {
  const level = getStageLevel(stage);
  switch (level) {
    case 'champion': return 'champion';
    case 'ultimate': return 'ultimate';
    case 'mega':
    case 'ultra':    return 'mega';
    default:         return 'rookie';
  }
}

// Pretty display name from a sprite key: 'gatomon-black' → 'Gatomon Black'.
function prettyName(stage: string): string {
  return stage.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

// Sprite keys whose ACTUAL evolution level equals the tier (so eggs/babies —
// which getStageLevel collapses oddly — never show up as enemies). The tier is
// always one of rookie/champion/ultimate/mega, matching real stage levels.
function poolForTier(tier: BattleTier, exclude: string): string[] {
  const atTier = (k: string) => getStageLevel(k) === tier;
  const pool = Object.keys(STAGE_SPRITES).filter(k => atTier(k) && k !== exclude);
  return pool.length > 0 ? pool : Object.keys(STAGE_SPRITES).filter(atTier);
}

/** How many enemies a run has at a given difficulty level (3 → 5). */
export function enemyCountForLevel(level: number): number {
  return Math.min(5, 3 + Math.floor((level - 1) / 2));
}

/**
 * Build a run's enemy line-up: random Digimon from the pet's tier, with stats
 * scaled by the monthly difficulty `level` (1 = easiest). Random each call.
 */
export function buildDungeonEnemies(stage: string, level: number): DungeonEnemy[] {
  const tier = getBattleTier(stage);
  const base = TIER_BASE[tier];
  const mult = 1 + 0.15 * (level - 1);         // hp/atk/points scaling
  const speedMult = Math.min(1.6, 1 + 0.05 * (level - 1));
  const count = enemyCountForLevel(level);

  const pool = poolForTier(tier, stage);
  // Shuffle for distinct picks; fall back to random when the pool is small.
  const shuffled = [...pool].sort(() => Math.random() - 0.5);

  const enemies: DungeonEnemy[] = [];
  for (let i = 0; i < count; i++) {
    const key = shuffled.length > i ? shuffled[i] : pool[Math.floor(Math.random() * pool.length)];
    const variance = 0.9 + Math.random() * 0.2;  // ±10%
    // Later enemies in the run are a touch tougher than the first.
    const slot = 1 + i * 0.12;
    enemies.push({
      name: prettyName(key),
      stage: key,
      hp: Math.max(6, Math.round(base.hp * mult * variance * slot)),
      atk: Math.max(2, Math.round(base.atk * mult * slot)),
      speed: +(base.speed * speedMult).toFixed(2),
      points: Math.max(3, Math.round(base.points * mult)),
    });
  }
  return enemies;
}

// ── Monthly difficulty ───────────────────────────────────────────────────────
function monthKey(d = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}`;
}

/** Current dungeon difficulty level (resets to 1 at the start of each month). */
export function getDungeonDifficulty(): number {
  const month = monthKey();
  try {
    const rec = JSON.parse(localStorage.getItem(STORAGE_KEYS.DUNGEON_DIFFICULTY) || 'null');
    if (rec?.month === month && typeof rec.level === 'number') return rec.level;
  } catch { /* fall through to reset */ }
  localStorage.setItem(STORAGE_KEYS.DUNGEON_DIFFICULTY, JSON.stringify({ month, level: 1 }));
  return 1;
}

/** Bump difficulty by one (called when a whole dungeon is cleared). */
export function bumpDungeonDifficulty(): number {
  const level = getDungeonDifficulty() + 1;
  localStorage.setItem(STORAGE_KEYS.DUNGEON_DIFFICULTY, JSON.stringify({ month: monthKey(), level }));
  return level;
}

// ── Daily run limit ──────────────────────────────────────────────────────────
function readRuns(): { date: string; count: number } {
  const today = new Date().toDateString();
  try {
    const rec = JSON.parse(localStorage.getItem(STORAGE_KEYS.DUNGEON_RUNS) || 'null');
    if (rec?.date === today) return rec;
  } catch { /* fresh */ }
  return { date: today, count: 0 };
}

export function getDungeonRunsLeft(): number {
  return Math.max(0, DUNGEON_DAILY_LIMIT - readRuns().count);
}

/** Consume one daily run; returns the runs left afterwards. */
export function consumeDungeonRun(): number {
  const rec = readRuns();
  const next = { date: rec.date, count: rec.count + 1 };
  localStorage.setItem(STORAGE_KEYS.DUNGEON_RUNS, JSON.stringify(next));
  return Math.max(0, DUNGEON_DAILY_LIMIT - next.count);
}

// ── Best score (ranking) ─────────────────────────────────────────────────────
export function getDungeonBest(): number {
  const v = Number(localStorage.getItem(STORAGE_KEYS.DUNGEON_BEST) || '0');
  return Number.isFinite(v) ? v : 0;
}

/** Record a run's score; returns the (possibly new) best. */
export function recordDungeonScore(score: number): number {
  const best = Math.max(getDungeonBest(), score);
  localStorage.setItem(STORAGE_KEYS.DUNGEON_BEST, String(best));
  return best;
}

// ── Heart drops ──────────────────────────────────────────────────────────────
/** Roll for a heart drop (capped per day). Returns true when one dropped. */
export function rollDungeonHeartDrop(): boolean {
  const today = new Date().toDateString();
  let rec = { date: today, count: 0 };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.DUNGEON_HEART_DROPS) || 'null');
    if (saved?.date === today) rec = saved;
  } catch { /* fresh */ }
  if (rec.count >= HEART_DROP_DAILY_CAP) return false;
  if (Math.random() > HEART_DROP_CHANCE) return false;
  localStorage.setItem(STORAGE_KEYS.DUNGEON_HEART_DROPS, JSON.stringify({ date: today, count: rec.count + 1 }));
  return true;
}
