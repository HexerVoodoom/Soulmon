import { readJson, removeLocal, writeJson } from '../../../utils/safeStorage';
import { STORAGE_KEYS } from '../../../utils/storageKeys';
import { normalizar } from './introMaquina';
import type { Progresso } from './introTipos';

/** Progresso local da intro (retoma depois de fechar o app). Não é save de jogo: não vai ao servidor. */
export function lerProgresso(): Progresso {
  return normalizar(readJson<unknown>(STORAGE_KEYS.INTRO_NARRATIVA_PROGRESSO, null));
}
export function gravarProgresso(p: Progresso): void {
  writeJson(STORAGE_KEYS.INTRO_NARRATIVA_PROGRESSO, p);
}
export function limparProgresso(): void {
  removeLocal(STORAGE_KEYS.INTRO_NARRATIVA_PROGRESSO);
}
