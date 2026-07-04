// ⚔️ Dungeon logic — an ascending ladder of enemies (baby-i → mega), each random
// within its tier and each stronger than the last. Clearing the whole ladder
// advances the "dungeon level" (wave): enemies then deal MORE damage and take
// LESS. That level persists (resets monthly), plus a daily play limit, score
// ranking and heart drops. Kept out of the component so the rules are testable.
import { STAGE_SPRITES } from './sprites';
import { getStageLevel } from '../types/progression';
import { STORAGE_KEYS } from './storageKeys';

export interface DungeonEnemy {
  name: string;
  stage: string;       // sprite key
  hp: number;
  atk: number;
  speed: number;       // timing-bar sweeps per second (higher = harder)
  points: number;      // 🎖️ granted when defeated
  dmgReduction: number; // 0..~0.7 — fraction of the player's damage it shrugs off
}

// Enemies always climb these tiers in order within a wave (weakest → strongest).
export type EnemyTier = 'baby-i' | 'baby-ii' | 'rookie' | 'champion' | 'ultimate' | 'mega';
export const LADDER_TIERS: EnemyTier[] = ['baby-i', 'baby-ii', 'rookie', 'champion', 'ultimate', 'mega'];

export const DUNGEON_DAILY_LIMIT = 3;      // runs per day (dungeon rewards more)
const HEART_DROP_DAILY_CAP = 2;            // hearts the dungeon can drop per day
const HEART_DROP_CHANCE = 0.3;             // per enemy defeated

// Base enemy stats per tier, before the per-wave difficulty scaling.
const TIER_BASE: Record<EnemyTier, { hp: number; atk: number; speed: number; points: number }> = {
  'baby-i':   { hp: 6,  atk: 2, speed: 0.85, points: 2 },
  'baby-ii':  { hp: 8,  atk: 3, speed: 0.95, points: 3 },
  rookie:     { hp: 11, atk: 4, speed: 1.05, points: 4 },
  champion:   { hp: 15, atk: 5, speed: 1.2,  points: 6 },
  ultimate:   { hp: 20, atk: 6, speed: 1.4,  points: 9 },
  mega:       { hp: 28, atk: 8, speed: 1.6,  points: 13 },
};

// Pretty display name from a sprite key: 'gatomon-black' → 'Gatomon Black'.
function prettyName(stage: string): string {
  return stage.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

// Sprite keys whose ACTUAL evolution level equals the tier (candidates as enemies).
function poolForTier(tier: EnemyTier, exclude: string): string[] {
  const atTier = (k: string) => getStageLevel(k) === tier;
  const pool = Object.keys(STAGE_SPRITES).filter(k => atTier(k) && k !== exclude);
  return pool.length > 0 ? pool : Object.keys(STAGE_SPRITES).filter(atTier);
}

/**
 * Build one wave: a random Digimon from each tier (baby-i → mega, in order),
 * with stats scaled by the dungeon `level`. Higher level = more enemy damage
 * dealt and less damage taken (dmgReduction). Random each call.
 */
export function buildDungeonWave(level: number, petStage: string): DungeonEnemy[] {
  const step = Math.max(0, level - 1);
  const atkMult = 1 + 0.12 * step;                 // deals more damage each level
  const dmgReduction = Math.min(0.7, 0.08 * step); // takes less damage each level
  const speedBump = Math.min(0.4, 0.04 * step);
  const ptsMult = 1 + 0.1 * step;

  return LADDER_TIERS.map(tier => {
    const base = TIER_BASE[tier];
    const pool = poolForTier(tier, petStage);
    const key = pool[Math.floor(Math.random() * pool.length)];
    const variance = 0.9 + Math.random() * 0.2;    // ±10% on HP
    return {
      name: prettyName(key),
      stage: key,
      hp: Math.max(5, Math.round(base.hp * variance)),
      atk: Math.max(2, Math.round(base.atk * atkMult)),
      speed: +(base.speed + speedBump).toFixed(2),
      points: Math.max(2, Math.round(base.points * ptsMult)),
      dmgReduction: +dmgReduction.toFixed(2),
    };
  });
}

// ── Dungeon level (persists; resets monthly) ────────────────────────────────
function monthKey(d = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}`;
}

/** Current dungeon level (the wave a run starts at). Resets to 1 each month. */
export function getDungeonDifficulty(): number {
  const month = monthKey();
  try {
    const rec = JSON.parse(localStorage.getItem(STORAGE_KEYS.DUNGEON_DIFFICULTY) || 'null');
    if (rec?.month === month && typeof rec.level === 'number') return rec.level;
  } catch { /* fall through to reset */ }
  localStorage.setItem(STORAGE_KEYS.DUNGEON_DIFFICULTY, JSON.stringify({ month, level: 1 }));
  return 1;
}

/** Raise the persisted dungeon level to at least `level` (called on wave clear). */
export function setDungeonDifficultyAtLeast(level: number): number {
  const next = Math.max(getDungeonDifficulty(), level);
  localStorage.setItem(STORAGE_KEYS.DUNGEON_DIFFICULTY, JSON.stringify({ month: monthKey(), level: next }));
  return next;
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
