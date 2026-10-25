/**
 * CALABOUÇO ROGUELIKE (beta3 M7, 25/10/2026) — lógica PURA (sem React/storage; `day` por parâmetro).
 *
 * Incursão do dia: 3 andares × 8 desafios = 24 tentativas. A cada passo o jogador escolhe 1 de 3 caminhos sorteados
 * (semente = dia + passo, então recarregar não rerrola) entre combate / quebra-cabeça / minigame / ferramenta de
 * Exploração; combate é OBRIGATÓRIO a cada 3 passos e no último do andar. Vencido o desafio, escolhe 1 de 3 bônus
 * (valem só na incursão). Perder um combate encerra o dia; errar um desafio que não é combate gasta o passo e segue.
 * Reset diário = o dia do jogador: outro dia = incursão nova, sem bônus.
 * Score do ranking = desafios vencidos + `ROGUE_FLOOR_BONUS` por andar concluído (máx. `ROGUE_MAX_SCORE`).
 */
import { dungeonFight, dungeonFightSeed } from './dungeonFight';
import { dungeonFoe } from './dungeon';
import { ARENA_SKILL_ODDS, familyOfSkill } from './arena';
import type { DodgeGrade, RingGrade } from './energia';
import { groupFightSteps, type GroupEvent, type GroupResult } from './combate/group';
import { mulberry32 } from './combate/rng';
import type { Combatant } from './combate/curve';

export const ROGUE_FLOORS = 3;
export const ROGUE_PER_FLOOR = 8;
export const ROGUE_MAX_STEPS = ROGUE_FLOORS * ROGUE_PER_FLOOR; // 24
export const ROGUE_COMBAT_EVERY = 3;
export const ROGUE_FLOOR_BONUS = 3;
export const ROGUE_MAX_SCORE = ROGUE_MAX_STEPS + ROGUE_FLOORS * ROGUE_FLOOR_BONUS; // 33 (espelho: functions/api/_rankings.js)

export type PathKind = 'combat' | 'puzzle' | 'minigame' | 'explore';
export type BonusKind = 'power' | 'vigor' | 'heal';
export const PATH_KINDS: readonly PathKind[] = ['combat', 'puzzle', 'minigame', 'explore'];
export const BONUS_KINDS: readonly BonusKind[] = ['power', 'vigor', 'heal'];

/** Cada `power` = +6% ATK, cada `vigor` = +10% HP, cada `heal` = escudo de 15% do HP no próximo combate. */
export const POWER_STEP = 0.06;
export const VIGOR_STEP = 0.1;
export const HEAL_SHIELD = 0.15;

export interface RogueRun {
  /** Dia do jogador (ISO) a que a incursão pertence. */
  day: string;
  /** Passos já resolvidos (vencidos ou errados), 0..24. */
  step: number;
  /** Desafios vencidos. */
  won: number;
  /** Combate perdido = dia encerrado. */
  over: boolean;
  power: number;
  vigor: number;
  /** Escudos de cura guardados (1 consumido por combate). */
  shield: number;
  /** Há um bônus a escolher antes do próximo passo. */
  bonusPending: boolean;
  /** Bits do fim da incursão já pagos (uma vez). */
  paid: boolean;
}

export const emptyRun = (day: string): RogueRun => ({ day, step: 0, won: 0, over: false, power: 0, vigor: 0, shield: 0, bonusPending: false, paid: false });

const int = (v: unknown, max: number): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0);

/** Leitura tolerante do save: lixo vira `undefined`; números ficam dentro dos tetos. */
export function sanitizeRogueRun(raw: unknown): RogueRun | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  if (typeof r.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(r.day)) return undefined;
  const step = int(r.step, ROGUE_MAX_STEPS);
  const won = Math.min(int(r.won, ROGUE_MAX_STEPS), step);
  return {
    day: r.day, step, won, over: r.over === true,
    power: int(r.power, ROGUE_MAX_STEPS), vigor: int(r.vigor, ROGUE_MAX_STEPS), shield: int(r.shield, ROGUE_MAX_STEPS),
    bonusPending: r.bonusPending === true, paid: r.paid === true,
  };
}

/** A incursão de HOJE: a guardada se for do mesmo dia, senão uma nova (sem bônus). */
export const runForDay = (saved: RogueRun | undefined, day: string): RogueRun => (saved && saved.day === day ? saved : emptyRun(day));

export const isFinished = (r: RogueRun): boolean => r.over || r.step >= ROGUE_MAX_STEPS;
export const floorOf = (step: number): number => Math.min(ROGUE_FLOORS, Math.floor(step / ROGUE_PER_FLOOR) + 1);
export const stepInFloor = (step: number): number => step % ROGUE_PER_FLOOR;
/** Combate obrigatório: 3º e 6º desafio do andar e o último (8º). */
export const isForcedCombat = (step: number): boolean => { const k = stepInFloor(step); return (k + 1) % ROGUE_COMBAT_EVERY === 0 || k === ROGUE_PER_FLOOR - 1; };

/** Andares concluídos = andares inteiros já passados (o passo conta, ganhando ou errando). */
export const floorsCleared = (r: RogueRun): number => Math.floor(r.step / ROGUE_PER_FLOOR);
export const rogueScore = (r: RogueRun): number => Math.min(ROGUE_MAX_SCORE, r.won + floorsCleared(r) * ROGUE_FLOOR_BONUS);
/** Bits do fim do dia: 1 por desafio vencido (o teto diário de minigames do app é quem limita de verdade). */
export const rogueBits = (r: RogueRun): number => r.won;

const hash = (s: string): number => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const seedOf = (day: string, step: number, salt: string): number => hash(`${day}|${step}|${salt}`);

function shuffled<T>(arr: readonly T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Os caminhos do passo: combate forçado = 1 caminho; senão 3 distintos dos 4. Determinístico por (dia, passo). */
export function pathsFor(day: string, step: number): PathKind[] {
  if (isForcedCombat(step)) return ['combat'];
  return shuffled(PATH_KINDS, mulberry32(seedOf(day, step, 'paths'))).slice(0, 3);
}

/** Os 3 bônus oferecidos depois de um desafio (ordem sorteada). */
export const bonusChoices = (day: string, step: number): BonusKind[] => shuffled(BONUS_KINDS, mulberry32(seedOf(day, step, 'bonus')));

export function applyBonus(r: RogueRun, kind: BonusKind): RogueRun {
  if (!r.bonusPending) return r;
  const next = { ...r, bonusPending: false };
  if (kind === 'power') next.power += 1;
  else if (kind === 'vigor') next.vigor += 1;
  else next.shield += 1;
  return next;
}

/** Resolve o passo: vitória abre a escolha de bônus; derrota de combate encerra o dia; erro fora de combate só gasta o passo. */
export function resolveStep(r: RogueRun, kind: PathKind, victory: boolean): RogueRun {
  if (isFinished(r) || r.bonusPending) return r;
  const step = r.step + 1;
  const base = kind === 'combat' && r.shield > 0 ? { ...r, shield: r.shield - 1 } : r;
  if (!victory && kind === 'combat') return { ...base, step, over: true };
  if (!victory) return { ...base, step };
  return { ...base, step, won: r.won + 1, bonusPending: step < ROGUE_MAX_STEPS };
}

export const markPaid = (r: RogueRun): RogueRun => (r.paid ? r : { ...r, paid: true });

// ── Combate: o núcleo v3 existente, 1 luta (mesma montagem de `playSequence`) ────────────────────────────────────────

export interface RogueFoeRef { floor: number; slot: number }
/** Força do inimigo pelo andar/passo: o slot da escada sobe com o andar e com o chefe (8º), e cada andar soma golpes. */
export function foeRefFor(step: number): RogueFoeRef {
  const f = floorOf(step);
  const k = stepInFloor(step);
  return { floor: f + Math.floor(k / 4), slot: Math.min(5, f - 1 + (k === ROGUE_PER_FLOOR - 1 ? 2 : k >= 4 ? 1 : 0)) };
}

const RING_GRADES: readonly RingGrade[] = ['ruim', 'bom', 'otimo'];
const DODGE_GRADES: readonly DodgeGrade[] = ['nada', 'bom', 'otimo'];
const pickOdds = (r: () => number, p: readonly number[]): number => { const x = r(); return x < p[0] ? 0 : x < p[0] + p[1] ? 1 : 2; };

/** Combate de UMA luta contra o inimigo do passo. `combatant` = `soulCombatant(estado)`; os bônus da incursão entram por cima. */
export function simulateRogueCombat(
  run: Pick<RogueRun, 'day' | 'power' | 'vigor' | 'shield'>, step: number, combatant: Combatant,
): { won: boolean; hpLeft: number } {
  const c: Combatant = { ...combatant, atk: combatant.atk * (1 + POWER_STEP * run.power), hp: combatant.hp * (1 + VIGOR_STEP * run.vigor) };
  const ref = foeRefFor(step);
  const fseed = dungeonFightSeed(seedOf(run.day, step, 'fight'), ref.floor, ref.slot);
  const foe = dungeonFoe(combatant.level, ref.slot, ref.floor);
  const f = dungeonFight({ combatant: c, family: familyOfSkill(undefined), startShield: run.shield > 0 ? HEAL_SHIELD : 0 }, foe, fseed, true);
  const rng = mulberry32((fseed ^ 0x5bd1e995) | 0);
  const odds = ARENA_SKILL_ODDS.media;
  const g = groupFightSteps(f.player, f.foes, { seed: f.seed, startHp: 1, startEnergy: 0, hitScale: f.hitScale });
  let s = g.next();
  while (!s.done) {
    const e: GroupEvent = s.value;
    let ans: number | undefined;
    if (e.kind === 'cast') {
      ans = f.castScale(e.who === 0
        ? { who: 0, ring: RING_GRADES[pickOdds(rng, odds.ring)], dodge: null }
        : { who: e.who, ring: null, dodge: DODGE_GRADES[pickOdds(rng, odds.dodge)] });
    }
    s = g.next(ans);
  }
  const res: GroupResult = s.value;
  return { won: res.winner === 'player', hpLeft: res.hpLeft };
}

// ── Desafios de JOGOS REAIS (não-combate) ───────────────────────────────────────────────────────────────────────────
// Cada caminho que não é combate sorteia (determinístico por dia+passo) um minigame real do app em "modo desafio"
// (`challenge` do componente: meta curta, sem Bits/recorde/ranking do jogo; o que conta é o ranking do Calabouço).

export type ChallengeGame = 'match3' | 'dino' | 'rps' | 'zip' | 'patches' | 'eco' | 'barrage';
export type LightKind = Exclude<PathKind, 'combat'>;
/** Pool por caminho: puzzle = Zip/Patches; minigame = Match 3/Obstacle Run/PPT/Soul Barrage; explore = prova de mente (Eco). */
export const CHALLENGE_POOL: Record<LightKind, readonly ChallengeGame[]> = {
  puzzle: ['zip', 'patches'],
  minigame: ['match3', 'dino', 'rps', 'barrage'],
  explore: ['eco'],
};

export interface RogueChallenge { kind: LightKind; game: ChallengeGame; goal: number }

/** Meta de cada jogo (cresce com o andar). match3 = vencer 1 inimigo; zip/patches = resolver 1 puzzle (goal 1). */
export function goalFor(game: ChallengeGame, floor: number): number {
  switch (game) {
    case 'dino': return 150 + 50 * floor;      // pontos de corrida (~10/s)
    case 'rps': return floor >= 3 ? 3 : 2;     // rodadas ganhas antes do Soulmon
    case 'eco': return 3 + floor;              // comprimento do eco repetido (início = 3)
    case 'barrage': return 12 + 4 * floor;     // segundos sobrevividos
    default: return 1;
  }
}

export function challengeFor(day: string, step: number, kind: LightKind): RogueChallenge {
  const pool = CHALLENGE_POOL[kind];
  const rng = mulberry32(seedOf(day, step, `ch-${kind}`));
  const game = pool[Math.floor(rng() * pool.length)];
  return { kind, game, goal: goalFor(game, floorOf(step)) };
}
