/**
 * Combat v3 — the PvP duel on the CLIENT side (story PR5, contexto §2.19).
 *
 * The SERVER decides every duel (`functions/api/_duel.js` + `_combate.js`, locked to this core by
 * `functions/api/combate.parity.test.js`). This file is what the client needs to ANIMATE the same fight
 * with the seed and the combatants the server sent, and to play the local training:
 *  - the bucket cheer (`sanitizeTaps`, `bucketTapTimes`, `duelCheerEvents`): the same maths as the server's;
 *  - `simulatePvp`: `fightSteps` with `PVP_HP_SCALE` and the cheer, folded into events + winner + scores;
 *  - `npcCombatant`: the training NPC, the player's level mirror with a small attack handicap (flat ~65% curve).
 *
 * The client NEVER derives the opponent: `me` and `opp` come from `duelStart`.
 */
import { elementHits, type Combatant } from './curve';
import { elementAdvantage } from '../arena';
import { baseDominanteDoElemento } from '../soulProfile/ficha/elementoNome';
import { fightSteps, PVP_HP_SCALE, type FightEvent, type FightFxPair, type FightSide } from './fight';
import { REFERENCE_BUILDS, combatantAt, firstLevelOfStage, stageOfLevel } from './level';
import { CHEER, cheerEvents, cleanStartEnergy, specialOf, type Special } from './specials';

/** Cheer buckets of a duel: 60 s / 3 s = 20. A tap after that does not count. */
export const DUEL_CHEER_BUCKETS = Math.ceil(60 / CHEER.bucketSeconds);

/** Dirty taps from the wire/UI → `DUEL_CHEER_BUCKETS` integers in [0, tapsCapPerBucket]. */
export function sanitizeTaps(raw: unknown): number[] {
  const arr = Array.isArray(raw) ? raw : [];
  return Array.from({ length: DUEL_CHEER_BUCKETS }, (_, i) => {
    const n = Math.floor(Number(arr[i]));
    return Number.isFinite(n) ? Math.min(CHEER.tapsCapPerBucket, Math.max(0, n)) : 0;
  });
}

/** Counts per bucket → tap times (s): the taps of bucket `b` count at its END, `(b + 1) · bucketSeconds`. */
export function bucketTapTimes(counts: readonly number[]): number[] {
  const out: number[] = [];
  counts.forEach((n, b) => { for (let k = 0; k < n; k++) out.push((b + 1) * CHEER.bucketSeconds); });
  return out;
}

/** The `cheer` option of `fight()` for a bucket cheer (sanitised). */
export function duelCheerEvents(rawTaps: unknown, side: 0 | 1 = 0, scale = 1): { t: number; side: 0 | 1; scale?: number }[] {
  return cheerEvents(bucketTapTimes(sanitizeTaps(rawTaps)), side, scale);
}

/** One side of a duel as the server sends it (`duelSide` in `_duel.js`). */
export interface DuelSide {
  readonly combatant: Combatant;
  readonly special: Special;
  /** PR7b (`tal-pvp-05`): rendimento da torcida deste lado (1 sem o talento; o servidor calcula e limita). */
  readonly cheerScale?: number;
  /** Tarefa B (`tal-pvp-04`): energy (of 100) this side opens the fight with. */
  readonly startEnergy?: number;
  /** Tarefa B (`tal-pvp-06`): fraction of the DoT damage this side receives that never lands. */
  readonly dotResist?: number;
  /** The schools of the basic and of the special strike (cosmetic: the form of the blow on screen). */
  readonly fx?: { readonly basica: string | null; readonly especial: string | null; /** PR9: família do especial (lista fechada das 7) — o cliente nomeia o especial do oponente por regra. */ readonly familia?: string | null; /** PR9b: o ID do nome exato do especial (índice do substantivo, formato, elementos) — recomposto no aparelho, nunca texto do save. */ readonly lex?: { readonly n: number; readonly f: number; readonly el: string; readonly elB: string } | null; /** Identidade de combate: o elemento do golpe BÁSICO (o principal do Soulmon) e o do ESPECIAL, derivados do save no servidor. */ readonly elBasica?: string | null; readonly elEspecial?: string | null };
}

export type DuelWinner = 'me' | 'opp' | 'draw';

export interface DuelResult {
  readonly events: FightEvent[];
  /** PR16: os contadores REAIS de status dos dois lados em cada evento (mesma ordem de `events`); só a cena lê. O servidor não envia. */
  readonly fx: FightFxPair[];
  readonly winner: DuelWinner;
  /** HP fraction of each side at the FIRST knock-out (the score). */
  readonly hpMe: number;
  readonly hpOpp: number;
  readonly timeMe: number;
  readonly timeOpp: number;
}

/**
 * Element matchup of the DUEL (owner decision 27/10/2026): the BASIC strike's element of `atk` against the one of `def`, by dominant base
 * (the counter ring only knows the 20 bases). +1 / -1 / 0; a missing element on either side is neutral. Mirrored by `vantagemElemental`
 * in `functions/api/_elementoBase.js` (locked by `elementoBase.parity.test.js`). The badge reads THIS, so it never disagrees with the fight.
 */
export function duelElementAdvantage(atk: string | null | undefined, def: string | null | undefined): -1 | 0 | 1 {
  if (!atk || !def) return 0;
  return elementAdvantage(baseDominanteDoElemento(atk), [baseDominanteDoElemento(def)]);
}

/** Fold the element matchup into the attacker's damage bonus: ±1 displayed hit (`elementHits`), HP/ATK/DEF/SPD and the 5% cap untouched. */
const withElement = (c: Combatant, adv: number, scale: number): Combatant => (adv === 0 || scale === 0 ? c : { ...c, bonus: (1 + c.bonus) / elementHits(adv * scale) - 1 });

/** The whole fight, pure and deterministic; the same function the server runs (`simulateDuel` of `_duel.js`). */
export function simulatePvp(args: { me: Pick<DuelSide, 'combatant' | 'special' | 'cheerScale' | 'startEnergy' | 'dotResist' | 'fx'>; opp: Pick<DuelSide, 'combatant' | 'special' | 'startEnergy' | 'dotResist' | 'fx'>; seed: number; taps?: unknown; /** 0 = Torneio/Duelo ranqueado (sem elemento, padrão); 0.5 = Guerra de Guildas (±0,5 golpe). */ elementScale?: 0 | 0.5 }): DuelResult {
  const advMe = duelElementAdvantage(args.me.fx?.elBasica, args.opp.fx?.elBasica);
  const advOpp = duelElementAdvantage(args.opp.fx?.elBasica, args.me.fx?.elBasica);
  const a: FightSide = { combatant: withElement(args.me.combatant, advMe, args.elementScale ?? 0), special: args.me.special, dotResist: args.me.dotResist };
  const b: FightSide = { combatant: withElement(args.opp.combatant, advOpp, args.elementScale ?? 0), special: args.opp.special, dotResist: args.opp.dotResist };
  const fx: FightFxPair[] = [];
  const g = fightSteps(a, b, { seed: args.seed >>> 0, hpScale: PVP_HP_SCALE, startEnergy: [cleanStartEnergy(args.me.startEnergy), cleanStartEnergy(args.opp.startEnergy)], cheer: duelCheerEvents(args.taps, 0, args.me.cheerScale), fxTrace: fx });
  const events: FightEvent[] = [];
  let hpMe: number | null = null;
  let hpOpp: number | null = null;
  let r = g.next();
  while (!r.done) {
    const e = r.value;
    events.push(e);
    if (e.kind === 'ko' && hpMe === null) {
      hpMe = Math.max(0, Math.min(1, e.hp[0]));
      hpOpp = Math.max(0, Math.min(1, e.hp[1]));
    }
    r = g.next(1);
  }
  const res = r.value;
  const winner: DuelWinner = res.winner === 'draw' ? 'draw' : res.winner === 'A' ? 'me' : 'opp';
  return { events, fx, winner, hpMe: hpMe ?? res.hpA, hpOpp: hpOpp ?? res.hpB, timeMe: res.timeA, timeOpp: res.timeB };
}

/**
 * The training NPC (QA L04-01, decisão do dono 21/10/2026): the balanced MIRROR of the player's own level, with a small
 * ATTACK HANDICAP (`NPC_ATK_HANDICAP`, folded into `Combatant.bonus` as a negative bonus → the NPC needs more hits).
 *
 * Antes era "2 levels abaixo, dentro do estágio" (§2.19): no 1º level de cada estágio o piso do estágio zerava a folga
 * (espelho puro → o jogador vencia só 46–48%) e no meio do rookie a folga era plena (~100%) — a curva tinha um pico e um
 * vale por estágio, e o gate media só a MÉDIA do estágio. Mesmo nível + handicap constante dá uma curva PLANA:
 * medido 60–71% em TODO nível amostrado (primeiro, meio e último de cada estágio; `combate/duel.test.ts`).
 */
export const NPC_LEVEL_GAP = 0;
/** Handicap de ataque do NPC (bônus negativo no `Combatant.bonus`): calibrado para ~65% de vitória do jogador. */
export const NPC_ATK_HANDICAP = 0.055;

/** The training NPC for a player level: the balanced mirror of the same level, with the attack handicap. */
export function npcCombatant(playerLevel: number): Combatant {
  const floor = firstLevelOfStage(stageOfLevel(playerLevel));
  const base = combatantAt(Math.max(floor, Math.floor(playerLevel) - NPC_LEVEL_GAP), REFERENCE_BUILDS.balanced);
  return { ...base, bonus: base.bonus - NPC_ATK_HANDICAP };
}

/** The NPC's side: a plain `direct` special (the training teaches the cheer, not the families). */
export function npcSide(playerLevel: number): DuelSide {
  return { combatant: npcCombatant(playerLevel), special: specialOf('direct') };
}
