/**
 * O ELEMENTO DO ORÁCULO → A CLASSE — dono único do mapa (dono, 20/10/2026, REGISTRO §150).
 *
 * O oráculo (`oracle.ts › ElementId`) tem 8 ids; `planta` e `industrial` não existem nos 17 base nem nos 136 pares.
 * Decisão do dono: planta → `vida`; industrial → `aco` (par marcial+terra; na Arena a vantagem usa a base dominante → `marcial`).
 * A normalização é NA LEITURA (nenhum campo novo no save). Quem precisa de arte/forma/aura/cena usa `aliasDoOraculo`;
 * quem precisa de um elemento que o app conhece (Perfil, Arena) usa `elementoDoOraculo`.
 *
 * ⚠️ `derivedElements.ts` NÃO importa este arquivo (ciclo): ele importa o tipo de lá, e `ELEMENT_BRIDGE` (pesos) é
 * conferido por teste de consistência.
 */
import type { ElementoSoDoOraculo } from './soulProfile/derivedElements';
import { elementoConhecido } from './soulProfile/ficha/elementoNome';

/** Um elemento só-do-oráculo novo obriga uma entrada aqui (erro de compilação). */
export const ORACULO_PARA_CLASSE: Readonly<Record<ElementoSoDoOraculo, string>> = { planta: 'vida', industrial: 'aco' };

const MAPA: Readonly<Record<string, string | undefined>> = ORACULO_PARA_CLASSE;

/** Id do oráculo (ou já da classe) → elemento CONHECIDO do app (17 base + pares); lixo → `undefined`. */
export function elementoDoOraculo(id: string | null | undefined): string | undefined {
  if (!id) return undefined;
  const mapped = MAPA[id] ?? id;
  return elementoConhecido(mapped) ? mapped : undefined;
}

/** Só traduz o id do oráculo, sem validar (para os mapas de arte, que têm o próprio fallback). */
export function aliasDoOraculo(id: string): string {
  return MAPA[id] ?? id;
}
