import { STORAGE_KEYS } from './storageKeys';
import { readLocal, writeLocal, removeLocal } from './safeStorage';

/**
 * ADR-004 (D2/D3) — a REVISÃO do save na nuvem, a que este aparelho viu por
 * último. Mora FORA do GameState (não viaja no save) e o dono é `cloudSave.ts`,
 * que reexporta estas funções. Fica em módulo próprio para o provider poder
 * ler sem depender do módulo que os testes de contexto substituem por mock.
 *
 * Formato: `{"saveId":string,"r":number}`. Só vale para o `saveId` gravado
 * junto: trocar de conta torna a revisão antiga invisível.
 */
export function lerRevisao(saveId: string): number | null {
  try {
    const bruto = readLocal(STORAGE_KEYS.SAVE_REVISION);
    if (!bruto) return null;
    const o = JSON.parse(bruto) as { saveId?: unknown; r?: unknown } | null;
    if (!o || typeof o !== 'object' || o.saveId !== saveId) return null;
    return typeof o.r === 'number' && Number.isInteger(o.r) && o.r >= 0 ? o.r : null;
  } catch { return null; }
}

/** Grava a revisão vista. Valor inválido não grava. Nunca lança. */
export function gravarRevisao(saveId: string, r: number): boolean {
  if (!saveId || !Number.isInteger(r) || r < 0) return false;
  return writeLocal(STORAGE_KEYS.SAVE_REVISION, JSON.stringify({ saveId, r }), { silent: true });
}

export function esquecerRevisao(): void {
  removeLocal(STORAGE_KEYS.SAVE_REVISION, { silent: true });
}
