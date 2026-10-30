/**
 * O ATAQUE AO BOSQUE vira LUTA DE VERDADE (30/10/2026, pedido do dono; REGISTRO §204).
 *
 * Quando o servidor sorteia "proteger" (`claSortear` → `task: 'protect'`), o jogador entra num combate em grupo do núcleo v3
 * (`groupFightSteps`, a mesma família da Masmorra/Calabouço) contra `GROVE_RAID_FOES` pragas do Bosque (`GROVE_RAIDERS`),
 * todas de uma vez, na `BattleStage` com torcida, anel do especial e esquiva. A força de cada praga é a do slot fácil da
 * escada (`dungeonFoe(level, slot 0..2, andar 1)` — a mesma régua que a defesa antiga já usava), relativa ao level.
 *
 * REGRAS DE DESFECHO (iguais à defesa antiga, só que jogadas):
 *  · vencer → o app chama `claProteger`: a proteção do dia conta (é o que faz o dia valer para o crescimento);
 *  · perder → NADA se perde (a planta nunca morre nem perde qualidade, D-14..D-17) e dá para tentar de novo com outra semente;
 *  · recompensa = a proteção em si (sem Bits/itens novos), então nada farmável nasce aqui.
 * AUTORIDADE: o servidor segue dono de QUEM protege e QUANDO (sorteio do dia, 1 proteção/dia por selo). O resultado da luta
 * não paga nada além da proteção que o cliente já declarava antes (a defesa antiga também decidia no cliente), por isso não
 * há re-simulação no servidor — ver o REGISTRO para o gatilho de rever.
 */
import { dungeonFight, type DungeonPlayerCfg } from './dungeonFight';
import { dungeonFoe } from './dungeonBase';
import { groupFight, type GroupResult } from './combate/group';
import type { FightSide } from './combate/fight';
import { mulberry32 } from './combate/rng';
import { GROVE_RAIDERS } from './temaInimigos';
import type { RosterEntry } from './enemyRoster';
import type { DodgeGrade, RingGrade } from './energia';

export const GROVE_RAID_FOES = 3;
/** Os slots fáceis da escada (os três mais fracos do andar 1). */
const SLOTS = [0, 1, 2] as const;

/** A formação (PURA dada a semente): 3 pragas distintas; no máx. 1 champion (o 3º slot, o mais forte). */
export function groveRaidLineup(seed: number): RosterEntry[] {
  const rng = mulberry32(seed | 0);
  const rookies = GROVE_RAIDERS.filter(e => e.stage === 'rookie').slice();
  const champs = GROVE_RAIDERS.filter(e => e.stage === 'champion');
  const out: RosterEntry[] = [];
  for (let i = 0; i < GROVE_RAID_FOES - 1; i++) out.push(rookies.splice(Math.floor(rng() * rookies.length), 1)[0]);
  out.push(champs[Math.floor(rng() * champs.length)]);
  return out;
}

export interface GroveRaidRound {
  player: FightSide;
  foes: FightSide[];
  seed: number;
  hitScale(who: number, n: number): number;
  castScale(i: { who: number; ring: RingGrade | null; dodge: DodgeGrade | null }): number;
}

/** A rodada (PURA): o jogador da Masmorra (`dungeonFight`) contra os 3 slots fáceis AO MESMO TEMPO. */
export function groveRaidRound(p: DungeonPlayerCfg, seed: number): GroveRaidRound {
  const L = p.combatant.level;
  const f = dungeonFight(p, dungeonFoe(L, SLOTS[0], 1), seed, true);
  return { player: f.player, foes: SLOTS.map(s => dungeonFoe(L, s, 1)), seed: f.seed, hitScale: f.hitScale, castScale: f.castScale };
}

/** Joga a luta inteira sem cena (testes e paridade): `ring`/`dodge` respondem cada especial. */
export function simulateGroveRaid(p: DungeonPlayerCfg, seed: number, ring: RingGrade = 'bom', dodge: DodgeGrade = 'bom'): GroupResult {
  const r = groveRaidRound(p, seed);
  return groupFight(r.player, r.foes, { seed: r.seed, startHp: 1, startEnergy: 0, hitScale: r.hitScale }, who =>
    r.castScale(who === 0 ? { who, ring, dodge: null } : { who, ring: null, dodge }));
}

/** O desfecho: só a vitória protege; perder não custa nada. */
export const groveRaidOutcome = (r: Pick<GroupResult, 'winner'>): { protects: boolean; cost: 0 } => ({ protects: r.winner === 'player', cost: 0 });
