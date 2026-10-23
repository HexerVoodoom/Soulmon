/**
 * Usos do botão "Gerar Soulmon" (Configurações) durante o teste fechado (23/10/2026, dono):
 * todo testador tem `MAX_GENERATE_CHARACTER_USES` pedidos de geração, gastos só quando o pedido PARTE
 * (pagamento conferido e geração iniciada). O contador mora no aparelho (`STORAGE_KEYS.GENERATE_CHARACTER_USES`);
 * quem decide de verdade o custo é o servidor (`_aiGuard`, tetos de geração). Leitura tolerante: valor
 * ilegível ou negativo conta como 0 gasto, valor acima do máximo conta como máximo.
 */
import { STORAGE_KEYS } from './storageKeys';
import { readLocal, writeLocal } from './safeStorage';

export const MAX_GENERATE_CHARACTER_USES = 3;

/** Quantos usos já foram gastos (0..MAX). */
export function generateCharacterUsed(): number {
  const n = Math.floor(Number(readLocal(STORAGE_KEYS.GENERATE_CHARACTER_USES)));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, MAX_GENERATE_CHARACTER_USES);
}

/** Quantos usos ainda restam (MAX..0). */
export function generateCharacterUsesLeft(): number {
  return MAX_GENERATE_CHARACTER_USES - generateCharacterUsed();
}

/** Gasta um uso e devolve quantos restam. Nunca passa de MAX nem fica negativo. */
export function spendGenerateCharacterUse(): number {
  const usado = Math.min(generateCharacterUsed() + 1, MAX_GENERATE_CHARACTER_USES);
  writeLocal(STORAGE_KEYS.GENERATE_CHARACTER_USES, String(usado));
  return MAX_GENERATE_CHARACTER_USES - usado;
}
