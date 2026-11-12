/**
 * A SESSÃO DE FOCO (§300, 12/11/2026): uma tarefa escolhida ao começar (sempre; sem sessão livre), o que o Soulmon já achou
 * e quantos focos já fecharam (os ciclos 25/5). Vive no aparelho: sobrevive a sair da Oficina e a recarregar.
 * Puro nas regras (`normalizeSession`); só `load/save` tocam o storage.
 */
import type { JourneyItem } from './focusJourney';
import { readJson, removeLocal, writeJson } from './safeStorage';
import { STORAGE_KEYS } from './storageKeys';

export interface FocusSessionState { taskId: string; taskName: string; collected: JourneyItem[]; cycles: number; /** Algum foco da sessão deu a chave do Calabouço (§301). */ key?: boolean }

const isItem = (x: unknown): x is JourneyItem => {
  const o = x as Partial<JourneyItem> | null;
  return !!o && (o.kind === 'material' || o.kind === 'food' || o.kind === 'essence') && typeof o.id === 'string' && typeof o.qty === 'number' && o.qty > 0 && o.qty < 1000;
};

export function normalizeFocusSession(raw: unknown): FocusSessionState | null {
  const o = raw as Partial<FocusSessionState> | null;
  if (!o || typeof o.taskId !== 'string' || !o.taskId || typeof o.taskName !== 'string') return null;
  return {
    taskId: o.taskId.slice(0, 120), taskName: o.taskName.slice(0, 200),
    collected: Array.isArray(o.collected) ? o.collected.filter(isItem).slice(0, 200) : [],
    cycles: typeof o.cycles === 'number' && o.cycles >= 0 && o.cycles < 1000 ? Math.floor(o.cycles) : 0,
    ...(o.key === true ? { key: true } : {}),
  };
}
export const loadFocusSession = (): FocusSessionState | null => normalizeFocusSession(readJson<unknown>(STORAGE_KEYS.FOCO_SESSION, null));
export const saveFocusSession = (s: FocusSessionState | null): void => {
  if (!s) { removeLocal(STORAGE_KEYS.FOCO_SESSION); return; }
  writeJson(STORAGE_KEYS.FOCO_SESSION, s, { silent: true });
};
