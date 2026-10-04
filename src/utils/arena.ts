// ⚠️ **SEM CONSUMIDOR — nenhuma tela chama nada daqui** (verificado em
// 07/09/2026: `grep` por `utils/arena` em `src/`, `desktop/` e `functions/`
// devolve só o próprio arquivo e o `arena.test.ts`).
//
// Isso é DECLARADO, não descoberto: são 501 linhas de sistema pronto e
// simulado, esperando uma decisão de produto sobre entrar ou não. O registro
// existe porque este repositório já foi mordido quatro vezes pelo mesmo
// padrão — `weeklyMissions`, `bestiary`, `getLocalizedPrice`, `rebirthRefusal`
// —, e nas quatro o custo não foi o código parado: foi ele parecer ligado.
// Duas delas gravavam campo no save de TODO jogador sem ninguém ler.
//
// **A diferença entre este arquivo e aqueles quatro é que este não escreve
// nada** — é puro, não toca o `GameState`, não custa byte no save de ninguém.
// Enquanto for assim, esperar não tem preço. Se alguém for ligá-lo, ligue
// inteiro; se decidirem que não entra, apague, não deixe morno.
//
// 🏟️ Arena logic — a SECOND, experimental dungeon that battle-tests the
// class-system: the player's ficha (elements + school) drives damage, defense
// and the special-skill archetype, and the enemies come from the bestiary
// pool (stats/elements only — NEVER the pool's `nome`, which carries
// franchise names; the displayed name is always generated here).
//
// Everything in this module is PURE and deterministic given an injected RNG,
// so the balance simulation in `arena.test.ts` can run hundreds of seeded
// runs — that test is the authority on the coefficients below.
import { CLASS_ELEMENT_ORDER } from './soulProfile/types';
import { BASE_ELEMENT_LABELS, DERIVED_ELEMENT_PAIRS } from './soulProfile/derivedElements';
import { CUSTO_PONTO_PAR } from './soulProfile/ficha/cascata';
import type { Ficha, FichaStage } from './soulProfile/ficha/types';
import type { EscolaId, RecursoId } from './soulProfile/ficha/types';
import type { StageSkills } from './soulProfile/ficha/skills';
import { TORCIDA_TAPS_FULL, TORCIDA_TAPS_CAP } from './torcida';
import {
  CHEER_TAPS_CAP, CHEER_TAPS_FULL, DODGE_REDUCE, PVE_FOE_SPECIAL_MULT, RING_MULT, addEnergy, energyFull, spendEnergy,
  type DodgeGrade, type RingGrade,
} from './energia';

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

// Multipliers (tuned by the balance simulation in arena.test.ts).
export const ADVANTAGE_MULT = 1.3;
export const DISADVANTAGE_MULT = 0.8;

/**
 * Attack multiplier of one element vs a defender's element list. Advantage
 * and disadvantage cancel out when both apply (mixed-element defender).
 */
export function elementMultiplier(attackEl: string, defenderEls: string[]): number {
  const adv = defenderEls.some(d => countersElement(attackEl, d));
  const dis = defenderEls.some(d => countersElement(d, attackEl));
  if (adv && !dis) return ADVANTAGE_MULT;
  if (dis && !adv) return DISADVANTAGE_MULT;
  return 1;
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

// ── Player stats & skills ───────────────────────────────────────────────────

/**
 * Equal power budget per stage — roles reshape it, never grow it: the
 * hp×dmg product of every role multiplier pair stays ≈1.
 */
const STAGE_BUDGET: Record<FichaStage, { hp: number; dmg: number }> = {
  rookie:   { hp: 34, dmg: 7 },
  champion: { hp: 40, dmg: 8 },
  ultimate: { hp: 46, dmg: 9 },
  mega:     { hp: 54, dmg: 10 },
  ultra:    { hp: 62, dmg: 11 },
};

/** Role shape from the BASIC skill's dominant school (hp×dmg ≈ constant). */
const ROLE_SHAPE: Record<EscolaId, { hp: number; dmg: number }> = {
  combate_fisico: { hp: 1.25, dmg: 0.8 },
  longo_alcance:  { hp: 0.94, dmg: 1.08 },
  conjuracao:     { hp: 0.96, dmg: 1.1 },
  benca:          { hp: 1.12, dmg: 0.9 },
  maldicao:       { hp: 0.95, dmg: 1.05 },
  evocacao:       { hp: 1.0,  dmg: 1.0 },
};

export interface ArenaPlayerStats { hp: number; dmg: number }

export function getArenaPlayerStats(stage: FichaStage, escolaBasica: EscolaId, hpScale = 1): ArenaPlayerStats {
  const base = STAGE_BUDGET[stage] ?? STAGE_BUDGET.rookie;
  const shape = ROLE_SHAPE[escolaBasica] ?? ROLE_SHAPE.evocacao;
  return { hp: Math.round(base.hp * shape.hp * hpScale), dmg: Math.round(base.dmg * shape.dmg) };
}

/** Turns of charge the special needs before it can fire. */
export const SPECIAL_CHARGE_TURNS = 3;

export interface ArenaSpecialEffect {
  /** Damage multiplier over the basic's budget. */
  mult: number;
  /** How many targets ('all' = every living enemy). */
  targets: 1 | 2 | 'all';
  /** evocacao: extra hits of `echoMult` on the next `echoTurns` player turns. */
  echoMult?: number;
  echoTurns?: number;
  /** benca: heals this fraction of max HP. */
  healFrac?: number;
  /** maldicao: enemies deal (1 − weakenFrac) damage for `weakenTurns` turns. */
  weakenFrac?: number;
  weakenTurns?: number;
}

/**
 * Special-skill effect per school. The numbers were CALIBRATED by the
 * balance simulation in arena.test.ts (win rate per archetype 40–80%,
 * spread ≤ 20pp) — don't hand-tweak without re-running it.
 */
export const SPECIAL_EFFECTS: Record<EscolaId, ArenaSpecialEffect> = {
  combate_fisico: { mult: 2.6, targets: 1 },
  longo_alcance:  { mult: 2.0, targets: 2 },
  conjuracao:     { mult: 2.0, targets: 'all' },
  evocacao:       { mult: 1.2, targets: 1, echoMult: 0.5, echoTurns: 2 },
  benca:          { mult: 1.5, targets: 1, healFrac: 0.1 },
  maldicao:       { mult: 2.2, targets: 1, weakenFrac: 0.3, weakenTurns: 2 },
};

// Timing-bar accuracy → damage, same curve as the dungeon.
export const PERFECT_ACC = 0.92;
export const CRIT_MULT = 1.5;

export function accuracyScale(acc: number): number {
  return 0.25 + 0.75 * acc * acc;
}

// ── Torcida por toques no Duelo da Arena (02/10/2026, H14 / REGISTRO §20) ───
//
// O pet golpeia SOZINHO; o dono TORCE tocando em qualquer lugar. Cada toque
// enche o gauge (`TORCIDA_TAPS_FULL` = 16 desde a rodada 5/I10 — eram 8 —, o mesmo do
// duelo fantasma; o PvE segue em 8) e, com o
// gauge cheio no momento do golpe, o pet GASTA tudo num golpe de TORCIDA.
//
// ⚠️ A torcida só SOMA: sem torcer o golpe é o golpe-base da simulação (nunca
// menos), e o golpe de torcida é UM multiplicador por golpe (`ARENA_TORCIDA_MULT`),
// sem empilhar — toque ilimitado rende no máximo UM golpe de torcida por turno
// (`TORCIDA_TAPS_CAP` toques contam por turno e o gauge zera ao ser gasto).

/**
 * Barra de timing do ATAQUE. DESLIGADA (decisão do dono, 02/10/2026): o pet
 * ataca sozinho. O caminho antigo (`TimingBar` de ataque em `ArenaGame`) fica
 * atrás desta flag, sem apagar. A DEFESA também deixou de ser da barra (TORC-3,
 * 02/10/2026): o pet se defende sozinho (`utils/autoDefesa.ts`, mesma lei
 * 0,70 ± 0,25 da `sampleAcc` abaixo).
 */
export const ARENA_TIMING_ATTACK_ENABLED = false;

/**
 * Precisão do golpe automático do pet. Calibrada para que "sem torcida" renda
 * o mesmo que a simulação base (`accMean` 0,7 ± 0,25): ver `arena.test.ts`.
 * Abaixo de `PERFECT_ACC`: o golpe automático nunca é crítico.
 */
export const ARENA_AUTO_ACC = 0.73;

/** Força do golpe de TORCIDA, sobre o golpe do turno (básico ou especial da escola). */
export const ARENA_TORCIDA_MULT = 1.35;

export interface ArenaTorcidaTurn {
  /** Multiplicador do golpe deste turno: 1 sem torcida, `ARENA_TORCIDA_MULT` com. */
  mult: number;
  /** O gauge estava cheio e foi gasto neste golpe. */
  special: boolean;
  /** Gauge que sobra depois do golpe (0 se gastou). */
  gaugeLeft: number;
}

/**
 * O golpe de torcida de UM turno. `gauge` = toques acumulados até o golpe
 * (o excedente de `TORCIDA_TAPS_FULL` não rende nada). Pura.
 */
export function arenaTorcidaTurn(gauge: number): ArenaTorcidaTurn {
  const g = Math.min(TORCIDA_TAPS_FULL, Math.max(0, Math.floor(Number.isFinite(gauge) ? gauge : 0)));
  const special = g >= TORCIDA_TAPS_FULL;
  return { mult: special ? ARENA_TORCIDA_MULT : 1, special, gaugeLeft: special ? 0 : g };
}

/** One basic (or per-target special) hit. `mult` = elemental multiplier. */
export function playerHitDamage(dmg: number, acc: number, elementMult: number, skillMult = 1): number {
  const crit = acc >= PERFECT_ACC ? CRIT_MULT : 1;
  return Math.max(1, Math.round(dmg * skillMult * accuracyScale(acc) * crit * elementMult));
}

/**
 * Damage the player takes from one enemy attack. Defense accuracy shaves it
 * off linearly (dungeon rule); the player's principal/secundário attributes
 * reduce damage from elements they counter (×DISADVANTAGE_MULT) and take
 * extra from elements that counter them (×ADVANTAGE_MULT).
 */
export function enemyHitDamage(
  atk: number, defAcc: number, enemyEl: string,
  playerAttrs: { principal: string; secundario: string },
  weakened: boolean,
): number {
  const attrs = [playerAttrs.principal, playerAttrs.secundario];
  const defends = attrs.some(a => countersElement(a, enemyEl));
  const exposed = attrs.some(a => countersElement(enemyEl, a));
  let mult = 1;
  if (defends && !exposed) mult = DISADVANTAGE_MULT;
  else if (exposed && !defends) mult = ADVANTAGE_MULT;
  if (weakened) mult *= 1 - (SPECIAL_EFFECTS.maldicao.weakenFrac ?? 0);
  return Math.max(1, Math.ceil(atk * (1 - defAcc) * mult));
}

// ── Enemies from the bestiary pool ──────────────────────────────────────────

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

export interface ArenaEnemy {
  /** GENERATED name (element label + generic noun) — the pool's `nome` is a
   *  locked repo rule: it NEVER reaches the player (franchise names). */
  namePt: string;
  nameEn: string;
  /** Base-element ids (1–2) driving the counter chart. */
  elements: string[];
  hp: number;
  maxHp: number;
  atk: number;
  speed: number;
  points: number;
  cls: ArenaEnemyClass;
  /** Sprite tier for getDungeonEnemySprite (resolved by the component, so
   *  this module stays free of asset imports and fully testable). */
  tier: 'rookie' | 'champion' | 'mega';
}

export const ARENA_ROUNDS = 5;

/** Round composition: 1,3 = one medium · 2 = two weak · 4 = three weak · 5 = boss. */
const ROUND_COMP: ArenaEnemyClass[][] = [
  ['medium'],
  ['weak', 'weak'],
  ['medium'],
  ['weak', 'weak', 'weak'],
  ['boss'],
];

const CLASS_SHAPE: Record<ArenaEnemyClass, { hp: number; atk: number; points: number; tier: ArenaEnemy['tier'] }> = {
  weak:   { hp: 0.52, atk: 0.62, points: 4,  tier: 'rookie' },
  medium: { hp: 1,    atk: 1,    points: 7,  tier: 'champion' },
  boss:   { hp: 2.2,  atk: 1.3,  points: 16, tier: 'mega' },
};

// Round curve for a "medium" enemy at difficulty 1 (simulation-calibrated).
const MEDIUM_HP_BASE = 15;
const MEDIUM_ATK_BASE = 5;
const ROUND_GROWTH = 0.13;      // +13% per round
const DIFFICULTY_GROWTH = 0.15; // +15% per difficulty level

const SIZE_FACTOR: Record<string, number> = {
  'Minúsculo': 0, 'Pequeno': 0.25, 'Médio': 0.5, 'Grande': 0.75, 'Enorme': 1, 'Colossal': 1,
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

function clamp01(x: number): number { return Math.min(1, Math.max(0, x)); }

/**
 * Build the enemies of one round (1-based). Stats DERIVE their shape from
 * the bestiary creature (atributos + hostilidade + tamanho, ±15%) but are
 * normalized to the round's curve; the displayed name is always generated.
 */
export function buildArenaRound(
  roundIdx: number,
  difficulty: number,
  rng: () => number,
  pool: BestiaryCreature[],
  /** Escala de vida dos inimigos (duelo mais longo, 04/10/2026); 1 = a curva de antes. */
  hpScale = 1,
): ArenaEnemy[] {
  const comp = ROUND_COMP[Math.min(Math.max(roundIdx, 1), ARENA_ROUNDS) - 1];
  const curve = (1 + ROUND_GROWTH * (roundIdx - 1)) * (1 + DIFFICULTY_GROWTH * (Math.max(1, difficulty) - 1));
  const mediumHp = MEDIUM_HP_BASE * curve;
  const mediumAtk = MEDIUM_ATK_BASE * curve;

  return comp.map(cls => {
    const shape = CLASS_SHAPE[cls];
    const creature = pool.length > 0 ? pool[Math.floor(rng() * pool.length)] : null;

    const size = clamp01(SIZE_FACTOR[creature?.tamanho ?? ''] ?? 0.5);
    const forca = clamp01((creature?.atributos.forca ?? 5) / 10);
    const magia = clamp01((creature?.atributos.magia ?? 5) / 10);
    const veloc = clamp01((creature?.atributos.velocidade ?? 5) / 10);
    const host = clamp01((creature?.hostilidade ?? 5) / 10);

    // Shape within ±15% of the round curve — the creature flavors, the
    // round curve rules.
    const hpShape = 0.85 + 0.3 * ((size + forca) / 2);
    const atkShape = 0.85 + 0.3 * ((host + Math.max(forca, magia)) / 2);

    const elements = (creature?.elementos ?? []).filter(e => BASE_SET.has(e)).slice(0, 2);
    if (elements.length === 0) {
      elements.push(CLASS_ELEMENT_ORDER[Math.floor(rng() * CLASS_ELEMENT_ORDER.length)]);
    }

    const nouns = CLASS_NOUNS[cls];
    const noun = nouns[Math.floor(rng() * nouns.length)];
    const el = elements[0];

    const hp = Math.max(4, Math.round(mediumHp * shape.hp * hpShape * hpScale));
    return {
      namePt: `${noun.pt} de ${elementLabel(el, true)}`,
      nameEn: `${elementLabel(el, false)} ${noun.en}`,
      elements,
      hp,
      maxHp: hp,
      atk: Math.max(2, Math.round(mediumAtk * shape.atk * atkShape)),
      speed: +(0.95 + 0.5 * veloc + 0.05 * (roundIdx - 1)).toFixed(2),
      points: shape.points + Math.max(0, difficulty - 1),
      cls,
      tier: shape.tier,
    };
  });
}

/** HP fraction recovered when a round is cleared (dungeon-style breather). */
export const ROUND_CLEAR_HEAL = 0.3;

// ── Full-run simulation (the balance test's engine) ─────────────────────────

export interface ArenaArchetypeConfig {
  stage: FichaStage;
  escolaBasica: EscolaId;
  escolaEspecial: EscolaId;
  elementoBasica: string;
  elementoEspecial: string;
  attrs: { principal: string; secundario: string };
}

export interface ArenaSimOptions {
  difficulty?: number;
  accMean?: number;
  /**
   * O pet golpeia sozinho com `ARENA_AUTO_ACC` (sem sortear a precisão do
   * ataque) — é o Duelo como ele é jogado desde 02/10/2026. A DEFESA continua
   * sorteada (`sampleAcc`), e é a mesma lei da defesa automática do jogo
   * (`autoDefense`: 0,70 ± 0,25 uniforme — TORC-3, `arena.test.ts` trava a paridade).
   */
  autoAttack?: boolean;
  /**
   * Toques por turno que a torcida dá antes do golpe do pet (0 = ninguém
   * torce). Entra no gauge de `TORCIDA_TAPS_FULL` com teto por turno de
   * `TORCIDA_TAPS_CAP`; cheio, o golpe do turno vale `ARENA_TORCIDA_MULT`.
   */
  tapsPerTurn?: number;
  rng: () => number;
  pool: BestiaryCreature[];
}

export interface ArenaSimResult { won: boolean; roundsCleared: number }

/**
 * Plays one full 5-round run with the same rules the UI uses: special needs
 * SPECIAL_CHARGE_TURNS basic turns of charge, echo/heal/weaken effects apply,
 * every living enemy attacks after the player's turn, accuracy is sampled
 * around `accMean` (±0.25 uniform). Pure given the rng — this is what the
 * balance test hammers 300+ times per archetype.
 */
export function simulateArenaRun(config: ArenaArchetypeConfig, opts: ArenaSimOptions): ArenaSimResult {
  const { rng, pool } = opts;
  const difficulty = opts.difficulty ?? 1;
  const accMean = opts.accMean ?? 0.7;
  const stats = getArenaPlayerStats(config.stage, config.escolaBasica);
  const special = SPECIAL_EFFECTS[config.escolaEspecial];

  let hp = stats.hp;
  let charge = 0;
  let echoLeft = 0;
  let weakenLeft = 0;
  let gauge = 0;
  const sampleAcc = () => clamp01(accMean + (rng() * 2 - 1) * 0.25);
  const tapsPerTurn = Math.min(TORCIDA_TAPS_CAP, Math.max(0, Math.floor(opts.tapsPerTurn ?? 0)));

  for (let round = 1; round <= ARENA_ROUNDS; round++) {
    const enemies = buildArenaRound(round, difficulty, rng, pool);
    let guard = 0;
    while (enemies.some(e => e.hp > 0) && hp > 0 && guard++ < 200) {
      const alive = () => enemies.filter(e => e.hp > 0);

      // Evocation echo from a previous special.
      if (echoLeft > 0) {
        const t = alive()[0];
        if (t) {
          t.hp -= Math.max(1, Math.round(
            stats.dmg * (special.echoMult ?? 0) * elementMultiplier(config.elementoEspecial, t.elements)));
        }
        echoLeft--;
      }

      // Player action: special when charged, basic otherwise. A torcida só
      // SOMA: sem toques o multiplicador é 1 e o golpe é o de sempre.
      const acc = opts.autoAttack ? ARENA_AUTO_ACC : sampleAcc();
      gauge = Math.min(TORCIDA_TAPS_FULL, gauge + tapsPerTurn);
      const torcida = arenaTorcidaTurn(gauge);
      gauge = torcida.gaugeLeft;
      if (charge >= SPECIAL_CHARGE_TURNS) {
        const targets = special.targets === 'all'
          ? alive()
          : alive().slice(0, special.targets);
        for (const t of targets) {
          t.hp -= playerHitDamage(stats.dmg, acc,
            elementMultiplier(config.elementoEspecial, t.elements), special.mult * torcida.mult);
        }
        if (special.healFrac) hp = Math.min(stats.hp, hp + Math.round(stats.hp * special.healFrac));
        if (special.weakenTurns) weakenLeft = special.weakenTurns;
        if (special.echoTurns) echoLeft = special.echoTurns;
        charge = 0;
      } else {
        const t = alive()[0];
        if (t) {
          t.hp -= playerHitDamage(stats.dmg, acc,
            elementMultiplier(config.elementoBasica, t.elements), torcida.mult);
        }
        charge++;
      }

      // Enemy turns — every living enemy attacks; perfect defense dodges.
      for (const e of alive()) {
        const defAcc = sampleAcc();
        if (defAcc >= PERFECT_ACC) continue; // clean dodge
        hp -= enemyHitDamage(e.atk, defAcc, e.elements[0], config.attrs, weakenLeft > 0);
      }
      if (weakenLeft > 0) weakenLeft--;
    }
    if (hp <= 0) return { won: false, roundsCleared: round - 1 };
    hp = Math.min(stats.hp, hp + Math.round(stats.hp * ROUND_CLEAR_HEAL));
  }
  return { won: true, roundsCleared: ARENA_ROUNDS };
}

// ── Graceful fallback for saves without persisted skills ────────────────────

export const DEFAULT_ARENA_ATTRIBUTES = { principal: 'vigor', secundario: 'vigor' };

/** A sane generic rookie pair so the Arena opens for EVERY save (legacy
 *  included): physical-combat basic + special, vigor element. */
export function buildDefaultArenaSkills(): StageSkills {
  const base = {
    elementoId: 'vigor',
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

// ── ENERGIA no Duelo da Arena (04/10/2026, REGISTRO §20.10) ─────────────────────
//
// O modelo de `utils/energia.ts` entra no Duelo contra NPCs: cada lutador tem UMA
// barra de energia que enche por ataque DADO, ataque SOFRIDO e (só o pet) pelo CHEER.
// Energia cheia = o ESPECIAL: no pet, o especial da ficha (a "carga de turnos" saiu
// da tela — a barra de energia a substitui); no inimigo, um golpe ×`PVE_FOE_SPECIAL_MULT`.
// PvE: o especial do pet pede o ANEL e o do inimigo pode ser ESQUIVADO (mecânicas ativas).
// O caminho antigo (carga em turnos + golpe de torcida ×1,35) fica em `simulateArenaRun`
// com `energy` desligado — atrás de `ARENA_ENERGY_ENABLED = false`, sem apagar.
export const ARENA_ENERGY_ENABLED = true as boolean;

/** Duelos mais longos: vida do pet e dos inimigos × isto (o dano não muda). Calibrado em `arena.test.ts`. */
export const ARENA_HP_SCALE = 1.9;
/** Vida extra dos inimigos, para o pet não ganhar força de graça com a energia (calibrado). */
export const ARENA_FOE_HP_EXTRA = 0.9;

export type ArenaSkill = 'nenhuma' | 'media' | 'boa';

export interface ArenaEnergyResult {
  won: boolean;
  roundsCleared: number;
  /** Turnos do pet jogados. */
  turns: number;
  /** Inimigos derrotados. */
  kills: number;
  /** Duração estimada na cena, em segundos (golpe do pet + um revide por inimigo vivo). */
  seconds: number;
}

/**
 * A run inteira com ENERGIA. Pura dado o `rng`. `skill` modela quem joga as mecânicas do PvE
 * (nota do anel e da esquiva sorteadas): `nenhuma` = nunca age (anel `ruim`, sem esquiva),
 * `media` e `boa` sorteiam as notas. `tapsPerTurn` = toques de cheer entre os golpes do pet.
 */
export function simulateArenaRunEnergy(config: ArenaArchetypeConfig, opts: {
  rng: () => number; pool: BestiaryCreature[]; difficulty?: number; accMean?: number;
  tapsPerTurn?: number; skill?: ArenaSkill; strikeMs?: number; defendMs?: number;
}): ArenaEnergyResult {
  const { rng, pool } = opts;
  const difficulty = opts.difficulty ?? 1;
  const accMean = opts.accMean ?? 0.7;
  const skill = opts.skill ?? 'media';
  const stats = getArenaPlayerStats(config.stage, config.escolaBasica, ARENA_HP_SCALE);
  const special = SPECIAL_EFFECTS[config.escolaEspecial];
  const tapsPerTurn = Math.min(CHEER_TAPS_CAP, Math.max(0, Math.floor(opts.tapsPerTurn ?? 0)));
  const strikeMs = opts.strikeMs ?? 2400;
  const defendMs = opts.defendMs ?? 1400;
  const sampleAcc = () => clamp01(accMean + (rng() * 2 - 1) * 0.25);
  const ringOf = (): RingGrade => {
    const r = rng();
    return skill === 'nenhuma' ? 'ruim'
      : skill === 'media' ? (r < 0.25 ? 'ruim' : r < 0.75 ? 'bom' : 'otimo')
      : (r < 0.1 ? 'ruim' : r < 0.4 ? 'bom' : 'otimo');
  };
  const dodgeOf = (): DodgeGrade => {
    const r = rng();
    return skill === 'nenhuma' ? 'nada'
      : skill === 'media' ? (r < 0.3 ? 'nada' : r < 0.7 ? 'bom' : 'otimo')
      : (r < 0.1 ? 'nada' : r < 0.4 ? 'bom' : 'otimo');
  };

  let hp = stats.hp;
  let pE = 0;
  let meter = 0;
  let echoLeft = 0;
  let weakenLeft = 0;
  let turns = 0;
  let kills = 0;
  let ms = 0;

  for (let round = 1; round <= ARENA_ROUNDS; round++) {
    const enemies = buildArenaRound(round, difficulty, rng, pool, ARENA_HP_SCALE * ARENA_FOE_HP_EXTRA);
    const eEn = enemies.map(() => 0);
    let guard = 0;
    while (enemies.some(e => e.hp > 0) && hp > 0 && guard++ < 400) {
      const alive = () => enemies.filter(e => e.hp > 0);
      turns++;
      if (echoLeft > 0) {
        const t = alive()[0];
        if (t) {
          t.hp -= Math.max(1, Math.round(stats.dmg * (special.echoMult ?? 0) * elementMultiplier(config.elementoEspecial, t.elements)));
        }
        echoLeft--;
      }
      // o cheer: os toques entre os golpes enchem a barra de cheer, que despeja energia no pet.
      meter += tapsPerTurn;
      while (meter >= CHEER_TAPS_FULL) { meter -= CHEER_TAPS_FULL; pE = addEnergy(pE, 'cheer'); }

      const before = alive();
      if (energyFull(pE)) {
        pE = spendEnergy(pE);
        const ring = RING_MULT[ringOf()];
        const targets = special.targets === 'all' ? alive() : alive().slice(0, special.targets);
        for (const t of targets) {
          t.hp -= playerHitDamage(stats.dmg, ARENA_AUTO_ACC, elementMultiplier(config.elementoEspecial, t.elements), special.mult * ring);
          eEn[enemies.indexOf(t)] = addEnergy(eEn[enemies.indexOf(t)], 'taken');
        }
        if (special.healFrac) hp = Math.min(stats.hp, hp + Math.round(stats.hp * special.healFrac));
        if (special.weakenTurns) weakenLeft = special.weakenTurns;
        if (special.echoTurns) echoLeft = special.echoTurns;
      } else {
        const t = alive()[0];
        if (t) {
          t.hp -= playerHitDamage(stats.dmg, ARENA_AUTO_ACC, elementMultiplier(config.elementoBasica, t.elements));
          eEn[enemies.indexOf(t)] = addEnergy(eEn[enemies.indexOf(t)], 'taken');
        }
      }
      pE = addEnergy(pE, 'dealt');
      ms += strikeMs;
      for (const e of before) if (e.hp <= 0) kills++;

      for (const e of alive()) {
        const i = enemies.indexOf(e);
        const fs = energyFull(eEn[i]);
        if (fs) eEn[i] = spendEnergy(eEn[i]);
        const defAcc = sampleAcc();
        if (fs || defAcc < PERFECT_ACC) {
          // O especial do inimigo não é bloqueado de graça: vale o golpe normal × mult, menos a esquiva.
          const base = enemyHitDamage(e.atk, fs ? Math.min(defAcc, PERFECT_ACC - 0.01) : defAcc, e.elements[0], config.attrs, weakenLeft > 0);
          hp -= fs
            ? Math.max(1, Math.round(base * PVE_FOE_SPECIAL_MULT * (1 - DODGE_REDUCE[dodgeOf()])))
            : base;
        }
        eEn[i] = addEnergy(eEn[i], 'dealt');
        pE = addEnergy(pE, 'taken');
        ms += defendMs;
      }
      if (weakenLeft > 0) weakenLeft--;
    }
    if (hp <= 0) return { won: false, roundsCleared: round - 1, turns, kills, seconds: ms / 1000 };
    hp = Math.min(stats.hp, hp + Math.round(stats.hp * ROUND_CLEAR_HEAL));
  }
  return { won: true, roundsCleared: ARENA_ROUNDS, turns, kills, seconds: ms / 1000 };
}
