/**
 * Combat v3 — the PvP duel on the CLIENT side (story PR5, contexto §2.19).
 *
 * The SERVER decides every duel (`functions/api/_duel.js` + `_combate.js`, locked to this core by
 * `functions/api/combate.parity.test.js`). This file is what the client needs to ANIMATE the same fight
 * with the seed and the combatants the server sent, and to play the local training:
 *  - the bucket cheer (`sanitizeTaps`, `bucketTapTimes`, `duelCheerEvents`): the same maths as the server's;
 *  - `simulatePvp`: `fightSteps` with `PVP_HP_SCALE` and the cheer, folded into events + winner + scores;
 *  - `npcCombatant`: the training NPC, "2 levels below" the player (inside the player's stage).
 *
 * The client NEVER derives the opponent: `me` and `opp` come from `duelStart`.
 */
import type { Combatant } from './curve';
import { fightSteps, PVP_HP_SCALE, type FightEvent, type FightFxPair, type FightSide } from './fight';
import { REFERENCE_BUILDS, combatantAt, firstLevelOfStage, stageOfLevel } from './level';
import { CHEER, cheerEvents, specialOf, type Special } from './specials';

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

/** The whole fight, pure and deterministic; the same function the server runs (`simulateDuel` of `_duel.js`). */
export function simulatePvp(args: { me: Pick<DuelSide, 'combatant' | 'special' | 'cheerScale'>; opp: Pick<DuelSide, 'combatant' | 'special'>; seed: number; taps?: unknown }): DuelResult {
  const a: FightSide = { combatant: args.me.combatant, special: args.me.special };
  const b: FightSide = { combatant: args.opp.combatant, special: args.opp.special };
  const fx: FightFxPair[] = [];
  const g = fightSteps(a, b, { seed: args.seed >>> 0, hpScale: PVP_HP_SCALE, cheer: duelCheerEvents(args.taps, 0, args.me.cheerScale), fxTrace: fx });
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
 * Levels the training NPC sits below the player (§2.19: "2 levels abaixo"). The NPC never leaves the player's
 * STAGE: crossing a stage boundary drops the base stats by a whole step and the player wins 99% (measured), so
 * the NPC level is `max(first level of the stage, L − NPC_LEVEL_GAP)`. Measured 77.8–91.3% per stage (`combate/duel.test.ts`).
 */
export const NPC_LEVEL_GAP = 2;

/** The training NPC for a player level: the balanced mirror `NPC_LEVEL_GAP` levels below, inside the same stage. */
export function npcCombatant(playerLevel: number): Combatant {
  const floor = firstLevelOfStage(stageOfLevel(playerLevel));
  return combatantAt(Math.max(floor, Math.floor(playerLevel) - NPC_LEVEL_GAP), REFERENCE_BUILDS.balanced);
}

/** The NPC's side: a plain `direct` special (the training teaches the cheer, not the families). */
export function npcSide(playerLevel: number): DuelSide {
  return { combatant: npcCombatant(playerLevel), special: specialOf('direct') };
}
