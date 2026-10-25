/**
 * L5-D2: a DEFESA do jardim. Proteger a planta é um combate FÁCIL contra 3 inimigos aleatórios, jogado com o mesmo
 * motor da Masmorra (`playSequence`, escada do andar 1: slots 0..2 = os três mais fracos). Sem custo: perder não gasta
 * nada, dá para tentar de novo. Quem decide QUE hoje é dia de proteger é o servidor (`claSortear`); aqui só se luta.
 * Os inimigos nunca têm nome de atacante (nada de "yeti"/"corvo"): só aparece o sprite.
 */
import { playSequence } from './dungeonFight';
import { REFERENCE_BUILDS } from './combate/level';
import { getDungeonEnemySprite } from './sprites';
import { mulberry32 } from './combate/rng';
import { soulCombatant, type SoulXPState } from './soulXP';

export const DEFESA_INIMIGOS = 3;
const SLOTS_FACEIS = [0, 1, 2] as const;

export interface DefesaResultado { won: boolean; fightsWon: number }

/** Joga a defesa (PURA dada a semente): o jogador no level dele contra os 3 slots mais fracos do andar 1. */
export function lutarDefesa(estado: SoulXPState, seed: number): DefesaResultado {
  const level = soulCombatant(estado).level;
  const r = playSequence(
    { level, build: REFERENCE_BUILDS.balanced, family: 'direct' },
    SLOTS_FACEIS.map(slot => ({ slot, floor: 1 })),
    seed,
  );
  return { won: r.won, fightsWon: r.fightsWon };
}

/** Os 3 sprites dos inimigos da defesa (sem nome), sorteados com a semente; nunca a linha do próprio jogador. */
export function inimigosDaDefesa(seed: number, linhaDoJogador?: string): string[] {
  const rng = mulberry32(seed | 0);
  const tiers = ['baby-i', 'baby-ii', 'rookie'] as const;
  return tiers.map(t => getDungeonEnemySprite(t, linhaDoJogador, rng).sprite);
}
