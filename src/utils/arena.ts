// 🏟️ Arena logic — the Arena on the Combat v3 core, in GROUPS (N × 1)
// (story PR3b, run `combate-v3-01`, contexto §2.15 P2/P4, §2.16 and §2.17).
//
// The player is `soulCombatant(state)` (level and branch → ATK/DEF/SPD/HP, bonus 0); the
// special is `specialOf(family)` with the area coming from `StageSkill.area`; the foes are
// RELATIVE to the player's level (`arenaFoe`) and fight all at once (`groupFightSteps`).
// The bestiary only gives the FLAVOUR (name, element, sprite) — NEVER the pool's `nome`, which
// carries franchise names; the displayed name is always generated here.
//
// Everything in this module is PURE and deterministic given a seed. The balance gates live in
// `arena.v3.test.ts` and in the area × single ruler (`combate/ruler.ts`, which reads THIS
// module's foes): the constants below were measured by `_sim/cv3-medir/grupo.ts`
// (`builder/balanco-motores.md` §6) — recalibrate with that script, never by hand.
import { CLASS_ELEMENT_ORDER } from './soulProfile/types';
import { BASE_ELEMENT_LABELS, DERIVED_ELEMENT_PAIRS } from './soulProfile/derivedElements';
import { CUSTO_PONTO_PAR } from './soulProfile/ficha/cascata';
import type { Ficha } from './soulProfile/ficha/types';
import type { EscolaId, RecursoId } from './soulProfile/ficha/types';
import type { StageSkills } from './soulProfile/ficha/skills';
import type { Combatant } from './combate/curve';
import { elementHits } from './combate/curve';
import type { FightSide } from './combate/fight';
import { cheerEvents, PVE_FAMILY_POWER, SPECIAL_FAMILIES, specialOf, type SpecialFamily } from './combate/specials';
import { groupFightSteps, type GroupEvent, type GroupResult } from './combate/group';
import { REFERENCE_BUILDS, combatantAt, type StatWeights } from './combate/level';
import { mulberry32 } from './combate/rng';
import { DODGE_REDUCE, RING_MULT, type DodgeGrade, type RingGrade } from './energia';

// ── Elements ────────────────────────────────────────────────────────────────

const BASE_SET = new Set<string>(CLASS_ELEMENT_ORDER);
const PAIR_COMPONENTS = new Map<string, [string, string]>(
  DERIVED_ELEMENT_PAIRS.map(d => [d.id, d.componentes]),
);

/** EN labels for the 17 base elements (PT lives in BASE_ELEMENT_LABELS). */
export const BASE_ELEMENT_LABELS_EN: Record<string, string> = {
  fogo: 'Fire', agua: 'Water', terra: 'Earth', ar: 'Air', eletricidade: 'Lightning',
  arcano: 'Arcane', sombra: 'Shadow', luz: 'Light', vileza: 'Vileness', morte: 'Death',
  vida: 'Life', vigor: 'Vigor', marcial: 'Martial', tempo: 'Time', som: 'Sound',
  gravidade: 'Gravity', espaco: 'Space',
};

export function elementLabel(id: string, isPt: boolean): string {
  return isPt
    ? (BASE_ELEMENT_LABELS as Record<string, string>)[id] ?? id
    : BASE_ELEMENT_LABELS_EN[id] ?? id;
}

/**
 * Counter chart over the 17 base elements — a curated RING where each element
 * counters the NEXT TWO and is countered by the PREVIOUS TWO. Building it as
 * a ring is what makes the coverage symmetric by construction (every element
 * counters exactly 2 and is countered by exactly 2 — locked by test).
 *
 * The ring (attacker → the two it beats):
 *   fogo     → vida, terra        (fire burns the living and scorches earth)
 *   vida     → terra, gravidade   (life takes root anywhere, defies weight)
 *   terra    → gravidade, ar      (earth grounds gravity and blocks wind)
 *   gravidade→ ar, som            (gravity pulls air down, crushes waves)
 *   ar       → som, eletricidade  (wind scatters sound and insulates)
 *   som      → eletricidade, agua (resonance disrupts current and water)
 *   eletricidade → agua, marcial  (shocks water and armored fighters)
 *   agua     → marcial, arcano    (rusts steel, washes away sigils)
 *   marcial  → arcano, tempo      (cuts through casting, strikes first)
 *   arcano   → tempo, espaco      (magic bends time and space)
 *   tempo    → espaco, luz        (time outlasts space, dims all light)
 *   espaco   → luz, sombra        (the void swallows light and shadow)
 *   luz      → sombra, morte      (light banishes shadow and undeath)
 *   sombra   → morte, vileza      (shadow claims the dead and the vile)
 *   morte    → vileza, vigor      (death humbles the cruel and the strong)
 *   vileza   → vigor, fogo        (venom saps strength, smothers flame)
 *   vigor    → fogo, vida         (endurance outlasts fire, overpowers life)
 */
const COUNTER_RING: string[] = [
  'fogo', 'vida', 'terra', 'gravidade', 'ar', 'som', 'eletricidade', 'agua',
  'marcial', 'arcano', 'tempo', 'espaco', 'luz', 'sombra', 'morte', 'vileza', 'vigor',
];

export const COUNTERS: Record<string, [string, string]> = Object.fromEntries(
  COUNTER_RING.map((id, i) => [
    id,
    [COUNTER_RING[(i + 1) % COUNTER_RING.length], COUNTER_RING[(i + 2) % COUNTER_RING.length]],
  ]),
) as Record<string, [string, string]>;

export function countersElement(attacker: string, defender: string): boolean {
  return COUNTERS[attacker]?.includes(defender) ?? false;
}

/**
 * Element matchup of an attacker element against a defender's element list, in HITS (PR3a):
 * +1 = advantage (one displayed hit less), -1 = disadvantage (one more), 0 = neutral or both
 * (advantage and disadvantage cancel out when the defender has mixed elements).
 */
export function elementAdvantage(attackEl: string, defenderEls: readonly string[]): -1 | 0 | 1 {
  const adv = defenderEls.some(d => countersElement(attackEl, d));
  const dis = defenderEls.some(d => countersElement(d, attackEl));
  if (adv && !dis) return 1;
  if (dis && !adv) return -1;
  return 0;
}

// ── Player attributes from the ficha ────────────────────────────────────────

/** Same discrepancy rule as derivedElements.ts (MAX_IMBALANCE_RATIO). */
const MAX_IMBALANCE_RATIO = 1.7;

/**
 * The two BASE elements that act as the player's arena attributes.
 * Elements are ranked by generational weight (a bought pair costs
 * CUSTO_PONTO_PAR per point — same weighting as skills.ts's rankElementos);
 * a derived pair contributes its weight to BOTH of its base components,
 * because the counter chart is defined over the 17 bases only.
 * The secondary only stands when the profile isn't lopsided
 * (peso1 <= peso2 × 1.7, the derivedElements discrepancy rule) — otherwise
 * the primary repeats (e.g. vida/vida).
 */
export function getArenaAttributes(ficha: Ficha): { principal: string; secundario: string } {
  const pesos = new Map<string, number>();
  const add = (id: string, w: number) => pesos.set(id, (pesos.get(id) ?? 0) + w);
  for (const [id, pts] of Object.entries(ficha.elementos)) {
    const p = pts ?? 0;
    if (p <= 0) continue;
    if (BASE_SET.has(id)) { add(id, p); continue; }
    const comps = PAIR_COMPONENTS.get(id);
    if (comps) { add(comps[0], p * CUSTO_PONTO_PAR); add(comps[1], p * CUSTO_PONTO_PAR); }
  }
  const ranked = [...pesos.entries()]
    .map(([id, peso]) => ({ id, peso }))
    .sort((a, b) => b.peso - a.peso || a.id.localeCompare(b.id));
  const principal = ranked[0]?.id ?? 'vigor';
  const second = ranked[1];
  const secundario = second && ranked[0].peso <= second.peso * MAX_IMBALANCE_RATIO
    ? second.id : principal;
  return { principal, secundario };
}

// ── Player shape by school ──────────────────────────────────────────────────

/**
 * Role shape from the BASIC skill's dominant school (§2.11): `hp` multiplies the player's HP and
 * `dmg` the damage of the BASIC attack (`hitScale`). It stays outside the measured ruler: the AC6
 * of `arena.v3.test.ts` limits its effect on the fight length to ±25%.
 *
 * ⚠️ RECALIBRATED in PR3b. The old pairs (hp×dmg ≈ 1) were neutral in the old turn engine; in the
 * group run they are NOT: HP carries over 5 rounds, so 1 point of HP is worth about twice 1 point of
 * damage in win chance (combate_fisico 1.25/0.8 won 93%, benca 85%, against 61–70% for the others).
 * These pairs keep the direction (tank = more HP, slower; cannon = less HP, faster) and are fitted
 * so that each school keeps its OWN neutral win rate (bisection of hp for a fixed dmg, 3200 runs);
 * arena.v3.test.ts (AC3b) pins the 6 archetypes in 40–80% / spread ≤ 20pp, as the old gate did.
 */
export const ROLE_SHAPE: Record<EscolaId, { hp: number; dmg: number }> = {
  combate_fisico: { hp: 1.07, dmg: 0.85 },
  longo_alcance:  { hp: 0.95, dmg: 1.08 },
  conjuracao:     { hp: 0.93, dmg: 1.1 },
  benca:          { hp: 1.17, dmg: 0.9 },
  maldicao:       { hp: 0.96, dmg: 1.05 },
  evocacao:       { hp: 1.0,  dmg: 1.0 },
};

/**
 * DEFAULT family of the special by school: only the fallback for a skill without `familia` (old data,
 * no ficha) and the reference build of the school in the balance simulations. Since PR9 the real
 * family comes from `StageSkill.familia` (`familyOfSkill`), new at every stage.
 */
export const ESCOLA_FAMILY_PADRAO: Record<EscolaId, SpecialFamily> = {
  combate_fisico: 'direct',
  longo_alcance: 'dot',
  conjuracao: 'direct',
  benca: 'heal',
  maldicao: 'defDebuff',
  evocacao: 'atkBuff',
};

export function familyOfEscola(escola: EscolaId | undefined): SpecialFamily {
  return ESCOLA_FAMILY_PADRAO[escola ?? 'combate_fisico'] ?? 'direct';
}

/** The family of a special skill: its own `familia` (PR9); without it, the default of its school. */
export function familyOfSkill(skill: { familia?: SpecialFamily; escolaId?: EscolaId } | undefined | null): SpecialFamily {
  // `familia` vem do save (cache da ficha): só vale se estiver na lista fechada das 7.
  const f = skill?.familia;
  return typeof f === 'string' && (SPECIAL_FAMILIES as readonly string[]).includes(f) ? f : familyOfEscola(skill?.escolaId);
}

/** From this accuracy up the automatic defence blocks the hit clean (the `perfeito` of `utils/autoDefesa.ts`). */
export const PERFECT_ACC = 0.92;

/**
 * The auto-defence as the core's `hitScale` of a FOE: 0 if the defence was perfect, else (1 − acc)/0.3
 * (the same linear law as the old fight: the average player takes 1× the normalised hit).
 */
export function autoDefenseHitScale(acc: number, perfect = PERFECT_ACC): number {
  return acc >= perfect ? 0 : (1 - acc) / 0.3;
}


// ── Enemies: flavour from the bestiary pool ─────────────────────────────────

export interface BestiaryCreature {
  nome: string;
  elementos: string[];
  atributos: { forca: number; inteligencia: number; velocidade: number; magia: number };
  tamanho: string;
  hostilidade: number;
}

/**
 * Dynamic import keeps the 2 000-creature pool (~104 KB gzip) out of the
 * initial bundle — same pattern as the astronomy-engine in the oracle.
 */
export async function loadBestiaryPool(): Promise<BestiaryCreature[]> {
  const mod = await import('./soulProfile/bestiary/pool.json');
  const data = (mod as { default?: { criaturas?: BestiaryCreature[] } }).default ?? mod;
  return (data as { criaturas?: BestiaryCreature[] }).criaturas ?? [];
}

export type ArenaEnemyClass = 'weak' | 'medium' | 'boss';

/** The FLAVOUR of one foe: name, element, sprite tier and Bits. Its strength comes from `arenaFoe`. */
export interface ArenaEnemy {
  /** GENERATED name (element label + generic noun) — the pool's `nome` is a
   *  locked repo rule: it NEVER reaches the player (franchise names). */
  namePt: string;
  nameEn: string;
  /** Base-element ids (1–2) driving the counter chart. */
  elements: string[];
  points: number;
  cls: ArenaEnemyClass;
  /** Sprite tier for getDungeonEnemySprite (resolved by the component, so
   *  this module stays free of asset imports and fully testable). */
  tier: 'rookie' | 'champion' | 'mega';
}

export const ARENA_ROUNDS = 5;

/** Round composition: 1,3 = one medium · 2 = two weak · 4 = three weak · 5 = boss. THE declared composition (the ruler reads it). */
export const ARENA_ROUND_COMP: readonly (readonly ArenaEnemyClass[])[] = [
  ['medium'],
  ['weak', 'weak'],
  ['medium'],
  ['weak', 'weak', 'weak'],
  ['boss'],
];

const CLASS_FLAVOR: Record<ArenaEnemyClass, { points: number; tier: ArenaEnemy['tier'] }> = {
  weak:   { points: 4,  tier: 'rookie' },
  medium: { points: 7,  tier: 'champion' },
  boss:   { points: 16, tier: 'mega' },
};

/** Generic nouns per class — PT "Noun de Elemento" / EN "Element Noun". */
const CLASS_NOUNS: Record<ArenaEnemyClass, Array<{ pt: string; en: string }>> = {
  weak: [
    { pt: 'Cria', en: 'Whelp' }, { pt: 'Batedor', en: 'Scout' },
    { pt: 'Rondante', en: 'Prowler' }, { pt: 'Lacaio', en: 'Minion' },
  ],
  medium: [
    { pt: 'Fera', en: 'Beast' }, { pt: 'Sentinela', en: 'Sentinel' },
    { pt: 'Andarilho', en: 'Wanderer' }, { pt: 'Predador', en: 'Predator' },
  ],
  boss: [
    { pt: 'Colosso', en: 'Colossus' }, { pt: 'Soberano', en: 'Sovereign' },
    { pt: 'Tirano', en: 'Tyrant' }, { pt: 'Ancião', en: 'Elder' },
  ],
};

/**
 * The flavour of the foes of one round (1-based): creature from the pool (element), generated name,
 * Bits. `rng` is the run's `mulberry32(seed)` stream — NEVER `Math.random`. The strength is not here:
 * it is `arenaFoe(level, cls, round)`.
 */
export function buildArenaRound(
  roundIdx: number,
  difficulty: number,
  rng: () => number,
  pool: BestiaryCreature[],
): ArenaEnemy[] {
  const comp = ARENA_ROUND_COMP[Math.min(Math.max(roundIdx, 1), ARENA_ROUNDS) - 1];
  return comp.map(cls => {
    const shape = CLASS_FLAVOR[cls];
    const creature = pool.length > 0 ? pool[Math.floor(rng() * pool.length)] : null;
    const elements = (creature?.elementos ?? []).filter(e => BASE_SET.has(e)).slice(0, 2);
    if (elements.length === 0) {
      elements.push(CLASS_ELEMENT_ORDER[Math.floor(rng() * CLASS_ELEMENT_ORDER.length)]);
    }
    const nouns = CLASS_NOUNS[cls];
    const noun = nouns[Math.floor(rng() * nouns.length)];
    const el = elements[0];
    return {
      namePt: `${noun.pt} de ${elementLabel(el, true)}`,
      nameEn: `${elementLabel(el, false)} ${noun.en}`,
      elements,
      points: shape.points + Math.max(0, difficulty - 1),
      cls,
      tier: shape.tier,
    };
  });
}


// ── The foes: relative to the player's level (measured, balanco-motores §6) ─

/** hp × power of each class, relative to the balanced mirror of the player's level. `power` is the damage bonus + 1. */
export const ARENA_FOES = {
  weak: { hp: 0.45, power: 0.12 },
  medium: { hp: 0.95, power: 0.235 },
  boss: { hp: 1.2, power: 0.495, special: true },
} as const;

/** Per-round growth of the foes (round r = 0..4). */
export const ARENA_ROUND_GROWTH = { hp: 0.04, power: 0.13 } as const;

/** HP fraction recovered when a round is cleared (the breather between rounds). */
export const ROUND_CLEAR_HEAL = 0.3;

/**
 * The foe of class `cls` at round `r` (0..4) for a player of level `L`:
 * `{ ...combatantAt(L, balanced), hp: hp × cls.hp × (1 + 0.04·r), bonus: cls.power × (1 + 0.13·r) − 1 }`.
 * The boss casts a `direct` special aimed at ONE target.
 */
export function arenaFoe(L: number, cls: ArenaEnemyClass, r: number): FightSide {
  const s = ARENA_FOES[cls];
  const b = combatantAt(L, REFERENCE_BUILDS.balanced);
  return {
    combatant: { ...b, hp: b.hp * s.hp * (1 + ARENA_ROUND_GROWTH.hp * r), bonus: s.power * (1 + ARENA_ROUND_GROWTH.power * r) - 1 },
    special: 'special' in s ? specialOf('direct') : null,
  };
}

// ── The player and the round, shared by the simulation and the scene ───────

export interface ArenaElements {
  /** Element of the basic and of the special skill (the ficha's `elementoId`). */
  basica: string;
  especial: string;
  /** The player's two arena attributes (`getArenaAttributes`): what the foes' elements are measured against. */
  attrs: { principal: string; secundario: string };
}

export interface ArenaPlayerCfg {
  /** `soulCombatant(state)` (bonus 0 in the Arena). */
  combatant: Combatant;
  family: SpecialFamily;
  /** From `StageSkill.area` (`'circulo' → 'area'`). */
  area: 'single' | 'area';
  /** School of the BASIC skill: its `ROLE_SHAPE` reshapes HP and the basic hit. Absent = neutral. */
  escolaBasica?: EscolaId;
  /** Absent = neutral element (what the balance sample measures). */
  elements?: ArenaElements;
}

const roleOf = (p: ArenaPlayerCfg) => (p.escolaBasica ? ROLE_SHAPE[p.escolaBasica] : null);

/** The player side of the core: HP reshaped by the school, the family's special, the area. */
export function arenaPlayerSide(p: ArenaPlayerCfg): FightSide {
  const role = roleOf(p);
  return {
    combatant: role ? { ...p.combatant, hp: p.combatant.hp * role.hp } : p.combatant,
    special: specialOf(p.family),
    area: p.area,
  };
}

/** Multiplier of the n-th BASIC hit of the player (the school's `dmg`). */
export function arenaPlayerHitScale(p: ArenaPlayerCfg): number {
  return roleOf(p)?.dmg ?? 1;
}

/**
 * The foes of round `r` (0..4) as the core sees them. With `p.elements` and the `foeElements` of the
 * round, the matchup moves exactly ±1 displayed hit (`elementHits`): the player's basic against the
 * foe's element shrinks or grows the FOE's HP; the foe's element against the player's attributes
 * shrinks or grows the foe's damage bonus.
 */
export function arenaFoeSides(p: ArenaPlayerCfg, r: number, foeElements?: readonly (readonly string[])[]): FightSide[] {
  return ARENA_ROUND_COMP[r].map((cls, i) => arenaFoeWithElement(arenaFoe(p.combatant.level, cls, r), p, foeElements?.[i]));
}

/** One foe with the element matchup applied (see `arenaFoeSides`); neutral when there is no element on either side. */
export function arenaFoeWithElement(f: FightSide, p: ArenaPlayerCfg, fe: readonly string[] | undefined): FightSide {
  if (!p.elements || !fe || fe.length === 0) return f;
  const mine = elementAdvantage(p.elements.basica, fe);
  const theirs = elementAdvantage(fe[0], [p.elements.attrs.principal, p.elements.attrs.secundario]);
  return {
    ...f,
    combatant: {
      ...f.combatant,
      hp: f.combatant.hp * elementHits(mine),
      bonus: (1 + f.combatant.bonus) / elementHits(theirs) - 1,
    },
  };
}

/** Seed of the core fight of round `r` of the run `seed`. */
export const arenaRoundSeed = (seed: number, r: number): number => (seed * 101 + r) | 0;

const specialAimsAtEnemy = (f: SpecialFamily): boolean => f === 'direct' || f === 'dot' || f === 'defDebuff';

/**
 * Scale of the player's SPECIAL when its element differs from the basic's: the foes' HP already carry
 * the BASIC matchup, so the special pays the ratio (single = the first living foe; area = the mean of the living).
 */
export function arenaSpecialElementScale(
  p: ArenaPlayerCfg, foeElements: readonly (readonly string[])[] | undefined, foesHp: readonly number[],
): number {
  const els = p.elements;
  if (!els || !foeElements || els.basica === els.especial) return 1;
  const living = foesHp.map((h, i) => (h > 1e-9 ? i : -1)).filter(i => i >= 0);
  if (living.length === 0) return 1;
  const ratio = (i: number) => {
    const fe = foeElements[i];
    if (!fe || fe.length === 0) return 1;
    return elementHits(elementAdvantage(els.basica, fe)) / elementHits(elementAdvantage(els.especial, fe));
  };
  const pick = p.area === 'area' && specialAimsAtEnemy(p.family) ? living : [living[0]];
  return pick.reduce((s, i) => s + ratio(i), 0) / pick.length;
}

/**
 * The multiplier the scene hands to the core at the PLAYER's cast: the ring × the family's PvE power
 * (`PVE_FAMILY_POWER.arena`) × the special's element. At a FOE's cast: `1 − DODGE_REDUCE[dodge]`.
 */
export function arenaPlayerCastScale(p: ArenaPlayerCfg, ring: RingGrade, elementScale = 1, knobs?: ArenaKnobs): number {
  return (knobs?.ring ?? RING_MULT)[ring] * (knobs?.familyPower ?? PVE_FAMILY_POWER.arena)[p.family] * elementScale;
}
export const arenaFoeCastScale = (dodge: DodgeGrade, knobs?: ArenaKnobs): number => 1 - (knobs?.dodge ?? DODGE_REDUCE)[dodge];

/** Knobs of the gates only (the RED tests feed a sabotaged table); the game never sets them. */
export interface ArenaKnobs {
  readonly familyPower?: Readonly<Record<SpecialFamily, number>>;
  readonly ring?: Readonly<Record<RingGrade, number>>;
  readonly dodge?: Readonly<Record<DodgeGrade, number>>;
  /** Multiplies the HP of every foe (the duration gate's RED). */
  readonly foeHp?: number;
  /** Replaces the school's `ROLE_SHAPE` (the AC6 RED). */
  readonly role?: { readonly hp: number; readonly dmg: number };
}

// ── Full-run simulation (the balance gates' engine) ─────────────────────────

/**
 * How well the player plays the mechanics: `nenhuma` never acts (ring `ruim`, no dodge), `media` and
 * `boa` draw the grades with these odds.
 */
export type ArenaSkill = 'nenhuma' | 'media' | 'boa';
/** Odds of [ruim, bom, otimo] on the ring and of [nada, bom, otimo] on the dodge. */
export const ARENA_SKILL_ODDS: Record<ArenaSkill, { ring: readonly number[]; dodge: readonly number[] }> = {
  nenhuma: { ring: [1, 0, 0], dodge: [1, 0, 0] },
  media: { ring: [0.25, 0.5, 0.25], dodge: [0.3, 0.4, 0.3] },
  boa: { ring: [0.1, 0.3, 0.6], dodge: [0.1, 0.3, 0.6] },
};
const RING_GRADES: readonly RingGrade[] = ['ruim', 'bom', 'otimo'];
const DODGE_GRADES: readonly DodgeGrade[] = ['nada', 'bom', 'otimo'];
const pickOdds = (r: () => number, p: readonly number[]): number => {
  const x = r();
  return x < p[0] ? 0 : x < p[0] + p[1] ? 1 : 2;
};

export interface ArenaRunConfig {
  level: number;
  build: StatWeights;
  family: SpecialFamily;
  area: 'single' | 'area';
  escolaBasica?: EscolaId;
  elements?: ArenaElements;
  /** With the pool the foes' elements are drawn (flavour); without it the matchup is neutral. */
  pool?: BestiaryCreature[];
  /** `teto`: the player cheers at the cap (16 taps per 3 s) all the fight. Default: nobody cheers. */
  cheer?: 'nenhum' | 'teto';
  knobs?: ArenaKnobs;
}

export interface ArenaRunResult {
  won: boolean;
  /** Seconds of the fights played (only meaningful when won). */
  total: number;
  /** Duration of each fight played, round by round. */
  rounds: readonly number[];
  roundsCleared: number;
  /** HP fraction when the run ended. */
  hpLeft: number;
}

const CHEER_CEILING_TAPS: readonly number[] = Array.from({ length: 30 * 16 }, (_, i) => (i * 3) / 16);

/**
 * One 5-round run of the group Arena. Pure in (cfg, seed, skill). The ring and the dodge are drawn by
 * `skill`; the foes' auto-defence is the same 0.7 ± 0.25 law of the game. A draw or a defeat ends the
 * run (`won: false`). `areaEfficiency` is a knob of the ruler only.
 */
export function simulateArenaRunV3(cfg: ArenaRunConfig, seed: number, skill: ArenaSkill = 'media', areaEfficiency?: number): ArenaRunResult {
  const p: ArenaPlayerCfg = {
    combatant: combatantAt(cfg.level, cfg.build), family: cfg.family, area: cfg.area,
    escolaBasica: cfg.escolaBasica, elements: cfg.elements,
  };
  const player0 = arenaPlayerSide(p);
  const role = cfg.knobs?.role;
  const player = role ? { ...player0, combatant: { ...p.combatant, hp: p.combatant.hp * role.hp } } : player0;
  const odds = ARENA_SKILL_ODDS[skill];
  const roleScale = role ? role.dmg : arenaPlayerHitScale(p);
  const cheer = cfg.cheer === 'teto' ? cheerEvents(CHEER_CEILING_TAPS, 0) : undefined;
  let hp = 1, en = 0, total = 0;
  const rounds: number[] = [];
  for (let r = 0; r < ARENA_ROUNDS; r++) {
    const rng = mulberry32((seed * 7919 + r) | 0);
    const foeEls = cfg.pool && cfg.elements ? buildArenaRound(r + 1, 1, mulberry32((seed * 31 + r) | 0), cfg.pool).map(e => e.elements) : undefined;
    const foeHp = cfg.knobs?.foeHp ?? 1;
    const foes = arenaFoeSides(p, r, foeEls).map(f => (foeHp === 1 ? f : { ...f, combatant: { ...f.combatant, hp: f.combatant.hp * foeHp } }));
    const g = groupFightSteps(player, foes, {
      seed: arenaRoundSeed(seed, r), startHp: hp, startEnergy: en, areaEfficiency, cheer,
      hitScale: (who) => {
        if (who === 0) return roleScale;
        return autoDefenseHitScale(Math.min(1, Math.max(0, 0.7 + (rng() * 2 - 1) * 0.25)));
      },
    });
    let step = g.next();
    while (!step.done) {
      const e: GroupEvent = step.value;
      let ans: number | undefined;
      if (e.kind === 'cast') {
        ans = e.who === 0
          ? arenaPlayerCastScale(p, RING_GRADES[pickOdds(rng, odds.ring)], arenaSpecialElementScale(p, foeEls, e.foesHp), cfg.knobs)
          : arenaFoeCastScale(DODGE_GRADES[pickOdds(rng, odds.dodge)], cfg.knobs);
      }
      step = g.next(ans);
    }
    const res: GroupResult = step.value;
    rounds.push(res.t);
    total += res.t;
    if (res.winner !== 'player') return { won: false, total, rounds, roundsCleared: r, hpLeft: res.hpLeft };
    hp = Math.min(1, res.hpLeft + ROUND_CLEAR_HEAL);
    en = res.energyLeft;
  }
  return { won: true, total, rounds, roundsCleared: ARENA_ROUNDS, hpLeft: hp };
}

// ── Graceful fallback for saves without persisted skills ────────────────────

export const DEFAULT_ARENA_ATTRIBUTES = { principal: 'vigor', secundario: 'vigor' };

/** A sane generic rookie pair so the Arena opens for EVERY save (legacy
 *  included): physical-combat basic + special, vigor element. */
export function buildDefaultArenaSkills(): StageSkills {
  const base = {
    elementoId: 'vigor',
    area: { tipo: 'unico' as const }, // combate_fisico: alvo único (Q-AREA)
    elementoNome: { pt: 'Vigor', en: 'Vigor' },
    escolaId: 'combate_fisico' as EscolaId,
    recursoId: 'furia' as RecursoId,
  };
  return {
    basica: {
      ...base,
      tipo: 'basica',
      nome: { pt: 'Golpe de Vigor', en: 'Vigor Strike' },
      descricao: {
        pt: 'Um golpe direto e confiável, pronto a cada turno.',
        en: 'A direct, reliable strike, ready every turn.',
      },
      custo: 'baixo',
    },
    especial: {
      ...base,
      tipo: 'especial',
      nome: { pt: 'Fúria de Vigor', en: 'Vigor Fury' },
      descricao: {
        pt: 'Um golpe devastador que precisa de carga — guardado para os momentos decisivos.',
        en: 'A devastating blow that needs charge — saved for the moments that matter.',
      },
      custo: 'alto',
    },
  };
}
