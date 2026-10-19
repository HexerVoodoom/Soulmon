/**
 * A CARGA SOB DEMANDA dos 7 efeitos de combate (`sfxCombate.ts`, ~6 KB de síntese).
 *
 * Orçamento de bytes do chunk de entrada (19/10/2026): só a cena de luta (`BattleStage`) toca esses sons, então a síntese
 * mora num chunk à parte. A cena chama `prepararSfxCombate()` ao montar — bem antes do primeiro golpe — e `sounds.ts`
 * lê o módulo já carregado por `sfxCombatePronto()`. Se por acaso ainda não chegou, aquele golpe sai mudo e o próximo
 * já toca: nunca espera, nunca toca fora do gesto (o gate de mudo e o gesto continuam sendo os de `play()`).
 * Vive em arquivo próprio (e não em `sounds.ts`) para que quem mocka `sounds.ts` nos testes não precise conhecer a carga.
 */
type ModuloSfx = typeof import('./sfxCombate');

let modulo: ModuloSfx | null = null;
let carga: Promise<void> | null = null;

/** O módulo da síntese, se já carregado; senão `null`. */
export const sfxCombatePronto = (): ModuloSfx | null => modulo;

/** Dispara (uma vez) a carga do módulo. Idempotente; a promessa nunca rejeita (falha → tenta de novo na próxima). */
export function prepararSfxCombate(): Promise<void> {
  if (!carga) {
    carga = import('./sfxCombate').then(
      m => { modulo = m; },
      () => { carga = null; },
    );
  }
  return carga;
}
