/**
 * DESGARRADOS COMO OPONENTES (27/10/2026, decisão do dono) — onde o Soulmon desgarrado (estágio forte, `wildFoeLabel`) aparece
 * além da Fenda: como UM dos 3 desafios da Arena (às vezes) e como o adversário que preenche o Torneio quando não há par humano.
 * Tudo determinístico (semente da run / id da conta + dia), nunca `Math.random`.
 */
import { ENEMY_ROSTER, type RosterEntry } from './enemyRoster';
import { isStrayFoe } from './wildFoeLabel';
import { mulberry32 } from './combate/rng';

/** Chance de uma semente de run da Arena ser de Desgarrado. */
export const STRAY_SEED_CHANCE = 0.12;
const STRAY_MIX = 0x57a7c0de;

/** A run da Arena com esta semente enfrenta Desgarrados? (puro; a semente é a da run, a mesma do card). */
export const isStraySeed = (seed: number): boolean => mulberry32((seed ^ STRAY_MIX) | 0)() < STRAY_SEED_CHANCE;

/**
 * Três sementes de cards para a Arena com NO MÁXIMO um Desgarrado (re-sorteia os extras). `draw` dá sementes novas.
 * Sem Desgarrado em boa parte das vezes: ele é ocasional por desenho.
 */
export function arenaCardSeeds(draw: () => number, n = 3): number[] {
  const out: number[] = [];
  let strays = 0;
  while (out.length < n) {
    let s = draw();
    if (isStraySeed(s)) {
      if (strays >= 1) { while (isStraySeed(s)) s = (s + 1) | 0; } else strays += 1; // o extra vira a semente vizinha comum
    }
    out.push(s);
  }
  return out;
}

export const STRAY_ROSTER: readonly RosterEntry[] = ENEMY_ROSTER.filter(e => isStrayFoe(e.stage) && e.kind !== 'combinado');

/** O Desgarrado que preenche o Torneio sem par, estável por conta e dia (`dayKey` = AAAA-MM-DD). */
export function strayForTournament(saveId: string, dayKey: string): RosterEntry {
  let h = 2166136261;
  for (const ch of `${saveId}|${dayKey}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return STRAY_ROSTER[mulberry32(h | 0)() * STRAY_ROSTER.length | 0];
}
