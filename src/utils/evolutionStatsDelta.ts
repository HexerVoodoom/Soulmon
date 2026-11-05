/**
 * O QUE A EVOLUÇÃO MUDOU NOS ATRIBUTOS DO SOULMON (05/11/2026, pedido do dono: "depois que evolui, um modalzinho mostrando
 * quanto aumentou de cada atributo"). LEITURA pura: nenhuma fórmula nova.
 *
 * Os atributos são os de COMBATE do Soulmon, exatamente os que a luta usa:
 *  · Ataque/Defesa/Velocidade ← `soulCombatant(...)` (`utils/soulXP.ts`), o mesmo combatente da Arena, da Fenda e do Pesadelo;
 *  · Vida ← `hpPoints(combatant.hp)` (`utils/combate/fight.ts`), o número que a Arena mostra ("Vida") e a barra de HP da luta.
 * O bônus (talentos/equipamento) fica de fora: ele é igual antes e depois, então não é efeito da evolução.
 *
 * `antes` e `depois` são dois SAVES (o de antes de evoluir e o já evoluído); a diferença sai da própria derivação do combate,
 * nunca de uma conta paralela. O delta pode ser NEGATIVO: ao evoluir, os pontos de alinhamento voltam a zero (§209) e a
 * distribuição de ATK/DEF/SPD volta ao equilíbrio, então um Soulmon muito especializado pode perder 1 ponto em um atributo
 * enquanto os outros sobem. A tela mostra isso sem esconder (sem vermelho, sem veredito).
 */
import { soulCombatant, soulLevel, type SoulXPState } from './soulXP';
import { hpPoints } from './combate/fight';

export type EvoStatId = 'hp' | 'atk' | 'def' | 'spd';

/** A ordem em que a tela lista (a mesma da ficha da Arena: Vida primeiro). */
export const EVO_STAT_ORDER: readonly EvoStatId[] = ['hp', 'atk', 'def', 'spd'];

export interface EvoStatRow {
  id: EvoStatId;
  before: number;
  after: number;
  /** `after - before`; pode ser 0 ou negativo. */
  delta: number;
}

export interface EvoStatsDelta {
  levelBefore: number;
  levelAfter: number;
  rows: EvoStatRow[];
}

function statsOf(state: SoulXPState): Record<EvoStatId, number> {
  const c = soulCombatant(state);
  return { hp: hpPoints(c.hp), atk: Math.round(c.atk), def: Math.round(c.def), spd: Math.round(c.spd) };
}

export function evolutionStatsDelta(before: SoulXPState, after: SoulXPState): EvoStatsDelta {
  const a = statsOf(before);
  const b = statsOf(after);
  return {
    levelBefore: soulLevel(before),
    levelAfter: soulLevel(after),
    rows: EVO_STAT_ORDER.map(id => ({ id, before: a[id], after: b[id], delta: b[id] - a[id] })),
  };
}

/** O texto do delta: "+N", "+0" ou "−N" (menos tipográfico). */
export function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return `\u2212${Math.abs(delta)}`;
  return '+0';
}
