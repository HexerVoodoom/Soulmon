import { STORAGE_KEYS } from './storageKeys';
import { readLocal, writeLocal } from './safeStorage';

/** Teto do texto cru guardado na quarentena (chars). Acima disso corta e marca `cortado: true`. */
export const QUARENTENA_MAX_CHARS = 1_000_000;

/**
 * L08-01 — guarda o texto CRU de um save local que não virou estado, ANTES de
 * qualquer sobrescrita. Idempotente (mesmo texto = não regrava). Nunca lança;
 * se a cota negar, tenta uma versão menor e depois desiste em silêncio.
 * Uma quarentena nova de texto DIFERENTE substitui a anterior (chave única).
 */
export function quarentenarSaveLocal(cru: string, motivo: string): boolean {
  try {
    const cortado = cru.length > QUARENTENA_MAX_CHARS;
    const texto = cortado ? cru.slice(0, QUARENTENA_MAX_CHARS) : cru;
    const atual = readLocal(STORAGE_KEYS.SAVE_QUARANTINE);
    if (atual) {
      try { if ((JSON.parse(atual) as { cru?: unknown })?.cru === texto) return true; } catch { /* regrava */ }
    }
    const monta = (t: string, c: boolean) => JSON.stringify({
      formato: 'soulmon-save-quarantine-v1',
      salvoEm: new Date().toISOString(),
      saveId: readLocal(STORAGE_KEYS.SAVE_ID) ?? '',
      motivo,
      cru: t,
      ...(c ? { cortado: true } : {}),
    });
    if (writeLocal(STORAGE_KEYS.SAVE_QUARANTINE, monta(texto, cortado), { silent: true })) return true;
    return writeLocal(STORAGE_KEYS.SAVE_QUARANTINE, monta(texto.slice(0, 50_000), true), { silent: true });
  } catch { return false; }
}
