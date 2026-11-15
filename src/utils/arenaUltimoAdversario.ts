// ---------------------------------------------------------------------------
// ARENA: O ÚLTIMO ADVERSÁRIO DROPA EM DOBRO (decisão do dono, 14/11/2026, REGISTRO §384).
//
// Pedido, nas palavras dele: "Derrotar todos na arena deve dar bônus de elemento. Faz o último adversário dropar o dobro e está
// resolvido". A Arena já paga essência por inimigo derrotado (`essenceDropsOfFoe`, creditada por `onElementsDefeated` a cada rodada
// vencida). O bônus é o ÚLTIMO adversário da run (o último inimigo da rodada `ARENA_ROUNDS`, o chefe) deixar `ARENA_ULTIMO_DROP_MULT`
// vezes o drop dele. Só existe em run vencida (é a vitória dessa rodada que paga); sem teto diário próprio — o teto por elemento
// (`ESSENCE_MAX_PER_ELEMENT`, em `applyEssences`) continua valendo. Não é Bit nem Honra.
//
// ⚰️ §372 (14/11/2026, mesmo dia): "run vencida = +1 Presa (`fang`), 1×/dia" — REVOGADO por §384. Apagados `arenaClearBonus.ts`,
// `arenaClearBonusCopy.ts` e o `onRunCleared` do `ArenaGame`. Saves que já receberam a Presa ficam como estão.
// ---------------------------------------------------------------------------

import type { EssenceDrop } from './essences';

/** Quantas vezes o drop do último adversário vale. */
export const ARENA_ULTIMO_DROP_MULT = 2;

/**
 * Os drops de UMA rodada vencida. `porInimigo` = os drops de cada inimigo, na ordem da rodada. Na última rodada (`ultimaRodada`), o
 * último inimigo dropa `ARENA_ULTIMO_DROP_MULT`×; `dobrados` = o que ele entregou JÁ multiplicado (vazio fora da última rodada).
 * `drops` é exatamente o que vai para o updater (`applyEssences`): a tela mostra o mesmo vetor.
 */
export function arenaRoundDrops(porInimigo: readonly (readonly EssenceDrop[])[], ultimaRodada: boolean): { drops: EssenceDrop[]; dobrados: EssenceDrop[] } {
  if (!ultimaRodada || porInimigo.length === 0) return { drops: porInimigo.flat(), dobrados: [] };
  const ultimo = porInimigo[porInimigo.length - 1].map(d => ({ id: d.id, qty: d.qty * ARENA_ULTIMO_DROP_MULT }));
  return { drops: [...porInimigo.slice(0, -1).flat(), ...ultimo], dobrados: ultimo };
}
