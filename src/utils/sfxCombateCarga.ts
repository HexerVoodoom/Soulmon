/**
 * A CARGA SOB DEMANDA dos 7 efeitos de combate (`sfxCombate.ts`, ~6 KB de síntese).
 *
 * Orçamento de bytes do chunk de entrada (19/10/2026): só a cena de luta (`BattleStage`) toca esses sons, então a síntese
 * mora num chunk à parte. A cena chama `prepararSfxCombate()` ao montar — bem antes do primeiro golpe — e `sounds.ts`
 * lê o módulo já carregado por `sfxCombatePronto()`. Se por acaso ainda não chegou, aquele golpe sai mudo e o próximo
 * já toca: nunca espera, nunca toca fora do gesto (o gate de mudo e o gesto continuam sendo os de `play()`).
 * Vive em arquivo próprio (e não em `sounds.ts`) para que quem mocka `sounds.ts` nos testes não precise conhecer a carga.
 */
import { garantirBarramento } from './audioBus';
import { readFlag } from './safeStorage';
import { STORAGE_KEYS } from './storageKeys';
import { prepararSfxLivres, SFX_DE_COMBATE_LIVRES } from './sonsAssets';

type ModuloSfx = typeof import('./sfxCombate');

let modulo: ModuloSfx | null = null;
let carga: Promise<void> | null = null;

/** O módulo da síntese, se já carregado; senão `null`. */
export const sfxCombatePronto = (): ModuloSfx | null => modulo;

/** Dispara (uma vez) a carga do módulo. Idempotente; a promessa nunca rejeita (falha → tenta de novo na próxima). */
export function prepararSfxCombate(): Promise<void> {
  aquecerAmostras();
  if (!carga) {
    carga = import('./sfxCombate').then(
      m => { modulo = m; },
      () => { carga = null; },
    );
  }
  return carga;
}

let aquecido = false;
/**
 * 20/10/2026 (§130): o PADRÃO dos 7 efeitos passou a ser o sample de banco livre (`SFX_DE_COMBATE_LIVRES`, ~50 KB no total,
 * arquivos estáticos fora do chunk). Ao montar a cena de luta: se o interruptor de Efeitos está ligado, decodifica já (quando o
 * barramento existe — a luta foi aberta por um gesto) ou, sem motor de áudio, só aquece o cache HTTP. Mudo → não baixa nada.
 * O 1º golpe que ainda encontrar o buffer não decodificado toca o procedural (fallback), nunca fica à espera.
 */
function aquecerAmostras(): void {
  if (aquecido || readFlag(STORAGE_KEYS.SOUND_MUTED)) return;
  aquecido = true;
  const b = garantirBarramento();
  if (b) { void prepararSfxLivres(b.ctx); return; }
  if (typeof fetch !== 'function') return;
  for (const a of Object.values(SFX_DE_COMBATE_LIVRES)) void fetch(a.url).catch(() => {});
}
