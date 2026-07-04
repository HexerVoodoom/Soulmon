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
  points: number;      // 🪙 Bits granted when defeated
  dmgReduction: number; // 0..~0.7 — fraction of the player's damage it shrugs off
}

// Enemies always climb these tiers in order within a wave (weakest → strongest).
export type EnemyTier = 'baby-i' | 'baby-ii' | 'rookie' | 'champion' | 'ultimate' | 'mega';
export const LADDER_TIERS: EnemyTier[] = ['baby-i', 'baby-ii', 'rookie', 'champion', 'ultimate', 'mega'];

// No daily run cap: entry is gated only by HP (losing costs a real heart, so the
// player can go as often as they can afford). Heart drops are deliberately rare.
const HEART_DROP_DAILY_CAP = 2;            // hearts the dungeon can drop per day
const HEART_DROP_CHANCE = 0.05;            // per enemy defeated (very low)

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

// Extra dungeon-only enemies (not part of the pet's evolution tree). Their
// sprites live in STAGE_SPRITES; this maps each to the tier it fights at.
// (devimon/andromon are omitted — they're in STAGES_BY_LEVEL, so getStageLevel
// already tiers them as champion/ultimate.)
const DUNGEON_ENEMY_TIERS: Record<string, EnemyTier> = {
  agumon: 'rookie', patamon: 'rookie', palmon: 'rookie', betamon: 'rookie',
  birdramon: 'champion', kabuterimon: 'champion', angemon: 'champion',
  airdramon: 'champion', seadramon: 'champion', kuwagamon: 'champion',
  ogremon: 'champion', numemon: 'champion',
  megadramon: 'ultimate', vademon: 'ultimate', nanimon: 'ultimate',
};

// Sprite keys that fight at a given tier — the pet's own evolution forms (via
// getStageLevel) plus the extra dungeon-only enemies above.
function poolForTier(tier: EnemyTier, exclude: string): string[] {
  const atTier = (k: string) => getStageLevel(k) === tier || DUNGEON_ENEMY_TIERS[k] === tier;
  const pool = Object.keys(STAGE_SPRITES).filter(k => atTier(k) && k !== exclude);
  return pool.length > 0 ? pool : Object.keys(STAGE_SPRITES).filter(atTier);
}

/**
 * Build one wave: a random Digimon from each tier (baby-i → mega, in order),
 * with stats scaled by the dungeon `level`. Higher level = more enemy damage
 * dealt and less damage taken (dmgReduction). Random each call.
 */
export function buildDungeonWave(level: number, petStage: string): DungeonEnemy[] {
  // A "level" is roughly one player-tier of difficulty: level 1 suits a rookie,
  // level 2 a champion, level 3 an ultimate… so a floor a couple levels above
  // the player is brutal. Each level: more enemy HP + damage, and the enemy
  // shrugs off more of the player's damage.
  const step = Math.max(0, level - 1);
  const hpMult = 1 + 0.14 * step;
  const atkMult = 1 + 0.2 * step;
  const dmgReduction = Math.min(0.72, 0.11 * step);
  const speedBump = Math.min(0.5, 0.05 * step);
  const ptsMult = 1 + 0.12 * step;

  return LADDER_TIERS.map(tier => {
    const base = TIER_BASE[tier];
    const pool = poolForTier(tier, petStage);
    const key = pool[Math.floor(Math.random() * pool.length)];
    const variance = 0.9 + Math.random() * 0.2;    // ±10% on HP
    return {
      name: prettyName(key),
      stage: key,
      hp: Math.max(5, Math.round(base.hp * hpMult * variance)),
      atk: Math.max(2, Math.round(base.atk * atkMult)),
      speed: +(base.speed + speedBump).toFixed(2),
      points: Math.max(2, Math.round(base.points * ptsMult)),
      dmgReduction: +dmgReduction.toFixed(2),
    };
  });
}

// ── Dungeon base level (persists; resets weekly) ────────────────────────────
function weekKey(d = new Date()): string {
  // Simple year+week bucket — good enough for a weekly reset boundary.
  const onejan = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d.getTime() - onejan.getTime()) / 86400000);
  const week = Math.floor((days + onejan.getDay()) / 7);
  return `${d.getFullYear()}-W${week}`;
}

/** Base dungeon level (floor 1's difficulty). Resets to 1 each week. */
export function getDungeonDifficulty(): number {
  const week = weekKey();
  try {
    const rec = JSON.parse(localStorage.getItem(STORAGE_KEYS.DUNGEON_DIFFICULTY) || 'null');
    if (rec?.week === week && typeof rec.level === 'number') return rec.level;
  } catch { /* fall through to reset */ }
  localStorage.setItem(STORAGE_KEYS.DUNGEON_DIFFICULTY, JSON.stringify({ week, level: 1 }));
  return 1;
}

/** Raise the persisted base level to at least `level` (called on run completion). */
export function setDungeonDifficultyAtLeast(level: number): number {
  const next = Math.max(getDungeonDifficulty(), level);
  localStorage.setItem(STORAGE_KEYS.DUNGEON_DIFFICULTY, JSON.stringify({ week: weekKey(), level: next }));
  return next;
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
