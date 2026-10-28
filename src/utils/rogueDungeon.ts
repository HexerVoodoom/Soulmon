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
import { dungeonFoe } from './dungeonBase';
import { ARENA_SKILL_ODDS, familyOfSkill } from './arena';
import type { DodgeGrade, RingGrade } from './energia';
import { groupFightSteps, type GroupEvent, type GroupResult } from './combate/group';
import { mulberry32 } from './combate/rng';
import type { Combatant } from './combate/curve';

export * from './rogueDungeonSave';
import { ROGUE_FOE_RAMP, ROGUE_FLOORS, ROGUE_PER_FLOOR, ROGUE_MAX_STEPS, ROGUE_COMBAT_EVERY, ROGUE_FLOOR_BONUS, ROGUE_MAX_SCORE, PATH_KINDS, BONUS_KINDS, emptyRun, type PathKind, type BonusKind, type RogueRun } from './rogueDungeonSave';

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
export function resolveStep(r0: RogueRun, kind: PathKind, victory: boolean, hpLeft?: number): RogueRun {
  if (isFinished(r0) || r0.bonusPending) return r0;
  const { pending: _pendente, ...r } = r0; // resolver o passo encerra o desafio em curso
  void _pendente;
  const step = r.step + 1;
  let base: RogueRun = kind === 'combat' && r.shield > 0 ? { ...r, shield: r.shield - 1 } : r;
  // Vida contínua: o que sobrou da luta é a vida da próxima (sem encher); sem `hpLeft` (jogos não-combate) a vida não muda.
  if (kind === 'combat' && victory && typeof hpLeft === 'number' && Number.isFinite(hpLeft)) {
    const { hp: _h, ...rest } = base; void _h;
    const hp = Math.max(0.01, Math.min(1, hpLeft));
    base = hp < 1 ? { ...rest, hp } : rest;
  }
  if (!victory && kind === 'combat') return { ...base, step, over: true };
  if (!victory) return { ...base, step };
  return { ...base, step, won: r.won + 1, bonusPending: step < ROGUE_MAX_STEPS };
}

/** Entrar num desafio que não é combate: grava o `pending` (o passo já está em jogo). Combate resolve na hora, sem pending. */
export const startChallenge = (r: RogueRun, kind: PathKind): RogueRun => (isFinished(r) || r.bonusPending || kind === 'combat' ? r : { ...r, pending: kind });

/** Voltou a uma incursão com desafio em curso (saiu/fechou sem terminar): o passo é CONSUMIDO como derrota do desafio. Sem pending → a mesma referência. */
export function consumePending(r: RogueRun): RogueRun {
  if (!r.pending) return r;
  if (isFinished(r) || r.bonusPending) { const { pending: _p, ...rest } = r; void _p; return rest; }
  return resolveStep(r, r.pending, false);
}

/** Saiu por falha de carga do jogo (rede/chunk): desfaz o `pending` SEM gastar o passo — a falha não foi do jogador. */
export function cancelChallenge(r: RogueRun): RogueRun {
  if (!r.pending) return r;
  const { pending: _p, ...rest } = r; void _p;
  return rest;
}

export const markPaid = (r: RogueRun): RogueRun => (r.paid ? r : { ...r, paid: true });

// ── Combate: o núcleo v3 existente, 1 luta (mesma montagem de `playSequence`) ────────────────────────────────────────

export interface RogueFoeRef { floor: number; slot: number }
/** Força do inimigo pelo andar/passo: o slot da escada sobe com o andar e com o chefe (8º), e cada andar soma golpes. */
export function foeRefFor(step: number): RogueFoeRef {
  const f = floorOf(step);
  const k = stepInFloor(step);
  const rampa = ROGUE_FOE_RAMP.flat + (ROGUE_FOE_RAMP.stepsPerFloor > 0 ? Math.floor(step / ROGUE_FOE_RAMP.stepsPerFloor) : 0);
  return { floor: f + Math.floor(k / 4) + rampa, slot: Math.min(5, f - 1 + (k === ROGUE_PER_FLOOR - 1 ? 2 : k >= 4 ? 1 : 0)) };
}

const RING_GRADES: readonly RingGrade[] = ['ruim', 'bom', 'otimo'];
const DODGE_GRADES: readonly DodgeGrade[] = ['nada', 'bom', 'otimo'];
const pickOdds = (r: () => number, p: readonly number[]): number => { const x = r(); return x < p[0] ? 0 : x < p[0] + p[1] ? 1 : 2; };

/** Combate de UMA luta contra o inimigo do passo. `combatant` = `soulCombatant(estado)`; os bônus da incursão entram por cima. */
export function simulateRogueCombat(
  run: Pick<RogueRun, 'day' | 'power' | 'vigor' | 'shield' | 'hp'>, step: number, combatant: Combatant,
): { won: boolean; hpLeft: number } {
  const c: Combatant = { ...combatant, atk: combatant.atk * (1 + POWER_STEP * run.power), hp: combatant.hp * (1 + VIGOR_STEP * run.vigor) };
  const ref = foeRefFor(step);
  const fseed = dungeonFightSeed(seedOf(run.day, step, 'fight'), ref.floor, ref.slot);
  const foe = dungeonFoe(combatant.level, ref.slot, ref.floor);
  const f = dungeonFight({ combatant: c, family: familyOfSkill(undefined), startShield: run.shield > 0 ? HEAL_SHIELD : 0 }, foe, fseed, true);
  const startHp = hpOf(run);
  const rng = mulberry32((fseed ^ 0x5bd1e995) | 0);
  const odds = ARENA_SKILL_ODDS.media;
  const g = groupFightSteps(f.player, f.foes, { seed: f.seed, startHp, startEnergy: 0, hitScale: f.hitScale });
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
/** Pool por caminho: puzzle = Zip/Patches; minigame = Elemental Fusion/Obstacle Run/PPT/Soul Barrage; explore = prova de mente (Eco). */
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

// No fim de propósito: `qa.masmorraFoco.test.ts` exige que POWER_STEP/VIGOR_STEP/HEAL_SHIELD só apareçam DEPOIS de `simulateRogueCombat`.
import { POWER_STEP, VIGOR_STEP, HEAL_SHIELD, hpOf } from './rogueDungeonSave';

/**
 * A montagem de UMA luta do Calabouço para a CENA (beta3 N7): o mesmo jogador reforçado, o mesmo inimigo e a mesma semente de
 * `simulateRogueCombat`, mas entregues a `RogueFight` (que mostra a luta de verdade, no relógio do núcleo). Pura e determinística:
 * reabrir a luta no mesmo passo dá a mesma luta (nada de repetir de graça para tentar outro resultado).
 */
export function rogueFightSetup(
  run: Pick<RogueRun, 'day' | 'power' | 'vigor' | 'shield' | 'hp'>, step: number, combatant: Combatant,
): { combatant: Combatant; ref: RogueFoeRef; seed: number; startHp: number; foe: ReturnType<typeof dungeonFoe>; startShield: number } {
  const c: Combatant = { ...combatant, atk: combatant.atk * (1 + POWER_STEP * run.power), hp: combatant.hp * (1 + VIGOR_STEP * run.vigor) };
  const ref = foeRefFor(step);
  return {
    combatant: c, ref,
    seed: dungeonFightSeed(seedOf(run.day, step, 'fight'), ref.floor, ref.slot),
    foe: dungeonFoe(combatant.level, ref.slot, ref.floor),
    startShield: run.shield > 0 ? HEAL_SHIELD : 0,
    startHp: hpOf(run),
  };
}
