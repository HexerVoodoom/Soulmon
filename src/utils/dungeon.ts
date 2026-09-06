// ⚔️ Dungeon logic — an ascending ladder of enemies (baby-i → mega), each random
// within its tier and each stronger than the last. Clearing the whole ladder
// advances the "dungeon level" (wave): enemies then deal MORE damage and take
// LESS. That level persists and resets WEEKLY (`weekKey`), and the run keeps a
// score ranking (`DUNGEON_BEST`) and rare heart drops. Kept out of the
// component so the rules are testable.
//
// Runs are unlimited (no per-day cap) and there is no entry gate. Losing takes
// no heart at all: what is at stake is the run itself — floor bonus, Glitchtama
// and score. The game never charges the bar that stands for the care the player
// took of themselves; it used to, and that locked out of the content exactly
// whoever had had a bad week.
//
// ⚠️ Until 06/09/2026 this header claimed a monthly reset, a per-day play limit
// and an HP-gated entry whose defeat cost a heart. All three were false, and had
// been for as long as `handleDungeonLose` has been an empty callback in
// `App.tsx`. Same family as the "roster of 60" that WP4.9 deleted: a header
// describing a design the file below never implemented. The exact wording is
// deliberately NOT quoted here — the acceptance grep for WP4.20 looks for those
// phrases in this file, and a historical note that repeats them would fail it
// (the self-defeating acceptance that WP4.9 already had to fix once).
import { getDungeonEnemySprite } from './sprites';
import { getStageLevel } from '../types/progression';
import { STORAGE_KEYS } from './storageKeys';
import { readJson, readNumber, writeJson, writeLocal } from './safeStorage';

export interface DungeonEnemy {
  name: string;
  stage: string;       // sprite key
  sprite: string;       // sprite final (linha placeholder do Soulmon)
  hp: number;
  atk: number;
  speed: number;       // timing-bar sweeps per second (higher = harder)
  points: number;      // 🪙 Bits granted when defeated
  dmgReduction: number; // 0..~0.7 — fraction of the player's damage it shrugs off
}

// Enemies always climb these tiers in order within a wave (weakest → strongest).
export type EnemyTier = 'baby-i' | 'baby-ii' | 'rookie' | 'champion' | 'ultimate' | 'mega';
export const LADDER_TIERS: EnemyTier[] = ['baby-i', 'baby-ii', 'rookie', 'champion', 'ultimate', 'mega'];

// Heart drops are deliberately rare — and they are the ONLY way the dungeon
// touches the heart bar, always upward. Losing never subtracts a heart.
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

// Enemy identity comes from OUR OWN creature lines (utils/sprites.ts): the
// roster used to be a list of borrowed species names backed by borrowed art,
// and both are gone. `getDungeonEnemySprite` picks the line and the name; this
// only records which line was drawn, so the same enemy is never the mirror of
// the player's current form.
function enemyKey(tier: EnemyTier, line: string): string {
  return `${line}-${tier}`;
}

/**
 * Build one wave: a random creature from each tier (rookie → mega, in order),
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
    const variance = 0.9 + Math.random() * 0.2;    // ±10% on HP
    const picked = getDungeonEnemySprite(tier, petStage);
    return {
      name: picked.name,
      stage: enemyKey(tier, picked.line),
      sprite: picked.sprite,
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
  const rec = readJson<{ week?: string; level?: unknown } | null>(
    STORAGE_KEYS.DUNGEON_DIFFICULTY, null);
  if (rec?.week === week && typeof rec.level === 'number') return rec.level;
  writeJson(STORAGE_KEYS.DUNGEON_DIFFICULTY, { week, level: 1 });
  return 1;
}

/** Raise the persisted base level to at least `level` (called on run completion). */
export function setDungeonDifficultyAtLeast(level: number): number {
  const next = Math.max(getDungeonDifficulty(), level);
  // Progresso de verdade (a base semanal da masmorra): perder isso rebaixa a
  // dificuldade conquistada, então a falha AVISA.
  writeJson(STORAGE_KEYS.DUNGEON_DIFFICULTY, { week: weekKey(), level: next });
  return next;
}

// ── Best score (ranking) ─────────────────────────────────────────────────────
export function getDungeonBest(): number {
  return readNumber(STORAGE_KEYS.DUNGEON_BEST, 0);
}

/** Record a run's score; returns the (possibly new) best. */
export function recordDungeonScore(score: number): number {
  const best = Math.max(getDungeonBest(), score);
  writeLocal(STORAGE_KEYS.DUNGEON_BEST, String(best));
  return best;
}

// ── Heart drops ──────────────────────────────────────────────────────────────
/** Roll for a heart drop (capped per day). Returns true when one dropped. */
export function rollDungeonHeartDrop(bonusChance = 0): boolean {
  const today = new Date().toDateString();
  let rec = { date: today, count: 0 };
  const saved = readJson<{ date?: string; count?: number } | null>(
    STORAGE_KEYS.DUNGEON_HEART_DROPS, null);
  if (saved?.date === today) rec = { date: today, count: Number(saved.count) || 0 };
  if (rec.count >= HEART_DROP_DAILY_CAP) return false;
  if (Math.random() > HEART_DROP_CHANCE + bonusChance) return false;
  // Teto diário de cura: se não persistir, o jogador ganha itens acima do teto.
  // É regra de economia — a falha AVISA.
  writeJson(STORAGE_KEYS.DUNGEON_HEART_DROPS, { date: today, count: rec.count + 1 });
  return true;
}
