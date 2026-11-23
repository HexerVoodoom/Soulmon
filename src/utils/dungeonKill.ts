// 🎁 O ABATE de um inimigo da Masmorra, fora de `dungeonRewards.ts` (que o `App` importa estático): aqui mora o elenco de inimigos
// (`enemyRoster` + dados, ~28 KB). O `App` chama esta função por `import()` (orçamento de bytes, REGISTRO §497); a descida que
// continua sozinha (`dungeonAway.ts`, chunk preguiçoso) importa direto.
import type { GameState } from '../contexts/GameStateContext';
import { rosterEntryOfKey } from './enemyRoster';
import { applyElementsDefeated, dexIdsOfFoe } from './elementDex';
import { applyEssences, applyEssencesAway, essenceDropsOfFoe } from './essences';

/** Um inimigo vencido: abate, bestiário e elemento do dex (a mesma conta de `handleDungeonEnemyDefeated`). */
export function applyEnemyDefeated<T extends Pick<GameState, 'dungeonKills' | 'bestiary' | 'defeatedElements' | 'essences' | 'essenceAway'>>(prev: T, enemyKey?: string, away?: { dayKey: string }): T {
  const abatido: T = {
    ...prev,
    dungeonKills: (prev.dungeonKills ?? 0) + 1,
    bestiary: enemyKey && !(prev.bestiary ?? []).includes(enemyKey) ? [...(prev.bestiary ?? []), enemyKey] : prev.bestiary,
  };
  // Dex de elementos (27/10/2026): vencer um inimigo IDENTIFICADO libera o elemento dele (composto = só o composto).
  const comDex = applyElementsDefeated(abatido, dexIdsOfFoe(rosterEntryOfKey(enemyKey)));
  // Essências (28/10/2026, REGISTRO §183): a do PRÓPRIO elemento, pelo estágio. Luta ativa = sem teto; descida automática (`away`) = teto diário.
  const e = rosterEntryOfKey(enemyKey);
  const drops = essenceDropsOfFoe(e, e?.stage);
  return away ? applyEssencesAway(comDex, drops, away.dayKey) : applyEssences(comDex, drops);
}
