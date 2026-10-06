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
import { soulLevel } from './soulXP';
import { CURVE_K, elementHits, hitsToKnockOut } from './combate/curve';
import { COMBAT_BONUS_CAP } from './combate/bonus';
import { HIT_UNIT_H0, type FightSide } from './combate/fight';
import { REFERENCE_BUILDS, combatantAt } from './combate/level';
import { mulberry32 } from './combate/rng';
import { specialOf } from './combate/specials';
import { STORAGE_KEYS } from './storageKeys';
import { readJson, readNumber, writeJson, writeLocal } from './safeStorage';

export interface DungeonEnemy {
  name: string;
  stage: string;       // sprite key
  sprite: string;       // sprite final (linha placeholder do Soulmon)
  points: number;      // 🪙 Bits granted when defeated
  /** Slot of the ladder (0..5 = baby-i..mega) and the dungeon level (floor) it was built for. */
  slot: number;
  floor: number;
  /** The enemy as the Combat v3 core sees it: relative to the player's level (`dungeonFoe`). */
  foe: FightSide;
}

// Enemies always climb these tiers in order within a wave (weakest → strongest).
export type EnemyTier = 'baby-i' | 'baby-ii' | 'rookie' | 'champion' | 'ultimate' | 'mega';
export const LADDER_TIERS: EnemyTier[] = ['baby-i', 'baby-ii', 'rookie', 'champion', 'ultimate', 'mega'];

// Heart drops are deliberately rare — and they are the ONLY way the dungeon
// touches the heart bar, always upward. Losing never subtracts a heart.
const HEART_DROP_DAILY_CAP = 2;            // hearts the dungeon can drop per day
export const HEART_DROP_CHANCE = 0.05;           // per enemy defeated (very low)

// Bits per tier, before the per-floor scaling (the strength lives in `DUNGEON_SLOTS`).
const TIER_POINTS: Record<EnemyTier, number> = {
  'baby-i': 2, 'baby-ii': 3, rookie: 4, champion: 6, ultimate: 9, mega: 13,
};

/**
 * Combat v3 (PR4, `builder/balanco-motores.md` §3): the enemy is RELATIVE to the player — the balanced
 * mirror of the player's level, with HP × `hp` and strength × `power` (`bonus = power − 1`, negative:
 * only an NPC can have it). One entry per slot of the ladder (baby-i..mega); the mega also casts a
 * `direct` special.
 *
 * ⚠️ RECALIBRATED in PR4 (contexto §2.18). The table of the story (hp 0.74..0.94 · power 0.03..0.09 ·
 * growth 0.09/0.15) was measured with the player's ENERGY reset at every fight; the game carries it (the story's
 * own rule: "HP and energy go from one enemy to the next"), which makes the fights ~2 s shorter and the wall
 * one floor deeper (floor 5: 99.5%, floor 6: 34%, enemy 18.3 s). Fitted again with the real rule (N = 1200 runs,
 * same level, `media` skill): floors 1-4 ended in 99.9-100%, floor 5 in 36.6%, floor 6 in 0%; median time per
 * enemy A1..A5 20.6/20.1/23.5/26.8/28.9 s; Nightmare 21.8-22.1 s. The coefficients are SENSITIVE (the run is 6
 * fights of carried HP): change them only by re-measuring (`dungeon.v3.test.ts`), never by hand.
 */
export const DUNGEON_SLOTS: readonly { readonly hp: number; readonly power: number; readonly special?: true }[] = [
  { hp: 0.945, power: 0.026 },
  { hp: 0.95, power: 0.038 },
  { hp: 0.955, power: 0.04 },
  { hp: 0.955, power: 0.06 },
  { hp: 0.96, power: 0.089 },
  { hp: 0.965, power: 0.096, special: true },
];

/** Per-floor growth of the enemy: HP × (1 + hp·(f−1)), strength × (1 + power·(f−1)). The ladder climbs in HITS, not in %. */
export const DUNGEON_FLOOR_GROWTH = { hp: 0.14, power: 0.11 } as const;

/** The F2 floor (§2.3): the weakest enemy takes at least 3 displayed hits from the strongest attacker. */
export const DUNGEON_MIN_HITS = 3;

/** Knobs of the gates only (the RED tests); the game never sets them. */
export interface DungeonFoeKnobs {
  /** Multiplies the HP (the RED of the floor of 3 hits). */
  readonly hp?: number;
  /** Turns the floor of 3 hits off. */
  readonly noFloor?: boolean;
  /** Replaces `DUNGEON_FLOOR_GROWTH` (the RED of the ladder). */
  readonly growth?: { readonly hp: number; readonly power: number };
}

/**
 * The enemy of `slot` (0..5) at dungeon level `floor` (≥ 1) for a player of level `L`:
 * `{ ...combatantAt(L, balanced), hp: hp × slot.hp × (1 + 0.09·(f−1)), bonus: slot.power × (1 + 0.15·(f−1)) − 1 }`.
 * The HP never goes below the point where the strongest attacker of the level (ATK-pure, 5% bonus, element
 * advantage) would still need `DUNGEON_MIN_HITS` hits (the `Math.max(3, …)` of the story).
 */
export function dungeonFoe(L: number, slot: number, floor: number, knobs?: DungeonFoeKnobs): FightSide {
  const s = DUNGEON_SLOTS[Math.min(DUNGEON_SLOTS.length - 1, Math.max(0, Math.floor(slot)))];
  const g = Math.max(0, Math.floor(floor) - 1);
  const growth = knobs?.growth ?? DUNGEON_FLOOR_GROWTH;
  const b = combatantAt(L, REFERENCE_BUILDS.balanced);
  let hp = b.hp * s.hp * (1 + growth.hp * g) * (knobs?.hp ?? 1);
  if (!knobs?.noFloor) {
    const top = combatantAt(L, REFERENCE_BUILDS.atk, COMBAT_BONUS_CAP);
    const u = hitsToKnockOut(b, b) / HIT_UNIT_H0;
    const min = (DUNGEON_MIN_HITS * (1 + top.atk / CURVE_K) * (1 + top.bonus) * u) / ((1 + b.def / CURVE_K) * elementHits(1));
    hp = Math.max(hp, min);
  }
  return {
    combatant: { ...b, hp, bonus: s.power * (1 + growth.power * g) - 1 },
    special: s.special ? specialOf('direct') : null,
  };
}

// Enemy identity comes from OUR OWN creature lines (utils/sprites.ts): the
// roster used to be a list of borrowed species names backed by borrowed art,
// and both are gone. `getDungeonEnemySprite` picks the line and the name; this
// only records which line was drawn, so the same enemy is never the mirror of
// the player's current form.
function enemyKey(tier: EnemyTier, line: string): string {
  return `${line}-${tier}`;
}

/**
 * 💠 O FATOR DE BITS DA MASMORRA (decisão do dono, 30/09/2026 —
 * `docs/BALANCO-MINIJOGOS.md` §4). Uma run completa pagava 327–417 Bits, 2–3×
 * o teto diário de minijogo (`MINIGAME_BITS_PER_DAY` = 150): a Masmorra enchia
 * o teto no 2º/3º andar e zerava todos os outros jogos no dia. Com 0,4, uma
 * run completa fica perto do teto (~130–170). É UM número, aplicado nos DOIS
 * lugares que pagam (Bits por inimigo aqui, bônus de andar em `clearBonus` da
 * `DungeonGame`) e no custo de começar mais fundo (o sumidouro), para a proporção
 * entre ganhar e gastar não mudar. Régua: `utils/mente/balanco.test.ts`.
 */
export const DUNGEON_BITS_FACTOR = 0.4;

/**
 * Build one wave: a creature from each tier (baby-i → mega, in order), for the dungeon `level` (the floor:
 * base level + floor − 1). The strength is `dungeonFoe(playerLevel, slot, level)`; the flavour (sprite and
 * name) is drawn with `rng` — the run's `mulberry32`, NEVER `Math.random` (a test greps for it). Without
 * `rng` the wave is still deterministic (seeded by the level). `playerLevel` defaults to the level of the stage.
 */
export function buildDungeonWave(
  level: number,
  petStage: string,
  rng: () => number = mulberry32(Math.imul(Math.max(1, Math.floor(level)), 0x9e3779b1) | 0),
  playerLevel: number = soulLevel({ evolutionStage: petStage }),
): DungeonEnemy[] {
  const floor = Math.max(1, Math.floor(level));
  const ptsMult = 1 + 0.12 * (floor - 1);
  return LADDER_TIERS.map((tier, slot) => {
    const picked = getDungeonEnemySprite(tier, petStage, rng);
    return {
      name: picked.name,
      stage: enemyKey(tier, picked.line),
      sprite: picked.sprite,
      points: Math.max(1, Math.round(TIER_POINTS[tier] * ptsMult * DUNGEON_BITS_FACTOR)),
      slot,
      floor,
      foe: dungeonFoe(playerLevel, slot, floor),
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

/**
 * WP4.5 — O SUMIDOURO RECORRENTE DE BITS: descer mais fundo.
 *
 * Até aqui os Bits só tinham compras ÚNICAS (decoração, cenários), então quem
 * joga muito acumula uma moeda que não compra mais nada — e moeda que não
 * compra nada deixa de ser recompensa.
 *
 * O sumidouro escolhido é o único que o `CLAUDE.md` já declara legítimo:
 * **custo de ENTRADA em Bits, nunca cobrar da barra que representa o cuidado
 * que a pessoa teve consigo mesma**. Comprar um nível de base começa a run
 * mais fundo (mais Bits por andar, e o andar 1 deixa de ser trivial para quem
 * já subiu). Ele é RECORRENTE de graça, sem inventar mecânica nova: a base
 * reseta toda semana, então a compra é semanal por construção.
 *
 * O preço sobe com o nível para o sumidouro acompanhar quem farma mais — e
 * porque o valor do que se compra também sobe (o bônus de andar é escalado).
 */
/** Era 40; acompanha o `DUNGEON_BITS_FACTOR` (30/09/2026) para o sumidouro manter o peso relativo. */
export const DEEP_START_BASE_COST = Math.round(40 * DUNGEON_BITS_FACTOR);

export function deepStartCost(currentLevel: number): number {
  const n = Math.max(1, Math.floor(currentLevel));
  return DEEP_START_BASE_COST * n;
}

/**
 * Teto do que se pode comprar. Sem ele, alguém com Bits suficientes começaria
 * numa base impossível e perderia a run no primeiro inimigo — o que não é
 * desafio, é dinheiro queimado por uma tela que deixou.
 */
export const DEEP_START_MAX_LEVEL = 5;

/**
 * 02/10/2026 (E2, dono): "Descer mais fundo" SÓ libera um nível que a pessoa JÁ
 * ALCANÇOU antes. Não dá para pular pagando — o Bit compra a volta ao ponto
 * conquistado (depois do reset semanal), nunca o ponto que ainda não se jogou.
 * `reachedLevel` é o nível mais fundo que a pessoa já cumpriu (ver
 * `getDungeonReached`/`recordDungeonReached`, gravado ao CONCLUIR uma descida).
 *
 * É regra PURA e mora aqui, não na tela: o botão desabilitado é só leitura
 * desta função, e `buyDeepStart` recusa o mesmo que `canBuyDeepStart`.
 */
export function canBuyDeepStart(currentLevel: number, bits: number, reachedLevel: number): boolean {
  if (currentLevel >= DEEP_START_MAX_LEVEL) return false;
  if (currentLevel >= reachedLevel) return false; // só até onde já chegou
  return bits >= deepStartCost(currentLevel);
}

/**
 * O nível que a compra entrega, ou `null` se a regra recusa. Sempre UM nível
 * por vez e nunca acima do alcançado: o resultado é `currentLevel + 1`, que por
 * `canBuyDeepStart` é no máximo `reachedLevel`.
 */
export function buyDeepStart(currentLevel: number, bits: number, reachedLevel: number): number | null {
  return canBuyDeepStart(currentLevel, bits, reachedLevel) ? currentLevel + 1 : null;
}

/** Raise the persisted base level to at least `level` (called on run completion). */
export function setDungeonDifficultyAtLeast(level: number): number {
  const next = Math.max(getDungeonDifficulty(), level);
  // Progresso de verdade (a base semanal da masmorra): perder isso rebaixa a
  // dificuldade conquistada, então a falha AVISA.
  writeJson(STORAGE_KEYS.DUNGEON_DIFFICULTY, { week: weekKey(), level: next });
  return next;
}

/**
 * O nível mais fundo que a pessoa já cumpriu (persiste; NÃO reseta na semana —
 * é o que o reset semanal da base deixa para trás e que "Descer mais fundo"
 * devolve). Nunca menor que a base atual: quem já estava numa base conquistada
 * antes desta chave existir não perde o que tinha.
 */
export function getDungeonReached(): number {
  const stored = readNumber(STORAGE_KEYS.DUNGEON_REACHED, 1);
  return Math.max(1, Math.floor(stored), getDungeonDifficulty());
}

/** Registra um nível CUMPRIDO (nunca chamado numa compra). Só sobe. */
export function recordDungeonReached(level: number): number {
  const next = Math.max(getDungeonReached(), Math.floor(level));
  writeLocal(STORAGE_KEYS.DUNGEON_REACHED, String(next));
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
