/**
 * O ELEMENTO DO ORÁCULO → ELEMENTO CONHECIDO (dono, 27/10/2026, REGISTRO §150 revisto).
 *
 * O oráculo (`oracle.ts › ElementId`) tem 8 ids. Até 26/10 `planta` virava `vida` e `industrial` virava `aco` (alias de
 * exibição). Desde 27/10/2026 o alias foi APAGADO: planta e industrial são BASE do class-system e têm ícone, FX, cenário
 * e criatura próprios; passam direto, nunca viram aço/vida. Id desconhecido → `undefined`.
 */
import { elementoConhecidoLeve as elementoConhecido } from './soulProfile/ficha/elementoIds';

/** Id do oráculo (ou já da classe) → elemento CONHECIDO do app (base + pares); lixo → `undefined`. */
export function elementoDoOraculo(id: string | null | undefined): string | undefined {
  if (!id) return undefined;
  return elementoConhecido(id) ? id : undefined;
}
