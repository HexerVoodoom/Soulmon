/**
 * O DESCANSO entre focos (§301, 12/11/2026, pedido do dono): ao atravessar a porta no fim do mapa o Soulmon chega à sala de
 * descanso (oásis, uma por cenário) por 5 min (ritmo 25/5; no 50/10, 10 min). A conta é por TIMESTAMP: `startedAt` é o instante
 * em que o foco acabou (relógio do aparelho), então sair do app, recarregar ou voltar tarde não muda nada. Puro nas regras;
 * só `loadRest/saveRest` tocam o storage. O aviso com o app fechado usa o alarme nativo que já existe (`utils/focusNotify.ts`).
 */
import { isFocusEnvironmentId, type FocusEnvironmentId } from './focusExpedition';
import type { JourneyItem, JourneyMode } from './focusJourney';
import { readJson, removeLocal, writeJson } from './safeStorage';
import { STORAGE_KEYS } from './storageKeys';

/** Minutos de descanso por ritmo (25/5 e 50/10). */
export const REST_MIN: Record<JourneyMode, number> = { p25: 5, p50: 10 };
/** Descanso esquecido há mais que isto é descartado (a sessão já não é desta hora). */
export const REST_STALE_MS = 12 * 60 * 60_000;

export interface RestState {
  /** Instante (ms, relógio do aparelho) em que o descanso começou = quando o foco acabou. */
  startedAt: number;
  mode: JourneyMode; env: FocusEnvironmentId;
  /** O que o baú do fim do foco deu (aparece no «Baú aberto» da sala). */
  items: JourneyItem[];
  /** A chave do Calabouço veio com este foco. */
  key: boolean;
}

export const restEndsAt = (r: Pick<RestState, 'startedAt' | 'mode'>): number => r.startedAt + REST_MIN[r.mode] * 60_000;
export const restLeftMs = (r: Pick<RestState, 'startedAt' | 'mode'>, now: number): number => Math.max(0, restEndsAt(r) - now);
export const restOver = (r: Pick<RestState, 'startedAt' | 'mode'>, now: number): boolean => restLeftMs(r, now) === 0;

const isItem = (x: unknown): x is JourneyItem => {
  const o = x as Partial<JourneyItem> | null;
  return !!o && (o.kind === 'material' || o.kind === 'food' || o.kind === 'essence') && typeof o.id === 'string' && typeof o.qty === 'number' && o.qty > 0 && o.qty < 1000;
};
export function normalizeRest(raw: unknown, now: number): RestState | null {
  const o = raw as Partial<RestState> | null;
  if (!o || typeof o.startedAt !== 'number' || !Number.isFinite(o.startedAt)) return null;
  if (o.mode !== 'p25' && o.mode !== 'p50') return null;
  if (!isFocusEnvironmentId(o.env)) return null;
  if (now - o.startedAt > REST_STALE_MS) return null;
  return { startedAt: Math.min(o.startedAt, now), mode: o.mode, env: o.env as FocusEnvironmentId, items: Array.isArray(o.items) ? o.items.filter(isItem).slice(0, 50) : [], key: o.key === true };
}
export const loadRest = (now = Date.now()): RestState | null => normalizeRest(readJson<unknown>(STORAGE_KEYS.FOCO_REST, null), now);
export const saveRest = (r: RestState | null): void => {
  if (!r) { removeLocal(STORAGE_KEYS.FOCO_REST); return; }
  writeJson(STORAGE_KEYS.FOCO_REST, r, { silent: true });
};

/** O descanso que nasce quando o foco acaba: `focusEnd` é o fim no relógio do SERVIDOR; `delta` = servidor − aparelho. */
export function restFromFocusEnd(focusEnd: number | null, delta: number, now: number, rest: Pick<RestState, 'mode' | 'env' | 'items' | 'key'>): RestState {
  const local = focusEnd === null ? now : focusEnd - delta;
  return { ...rest, startedAt: Math.min(now, local) };
}

/** "HH:mm" do alarme nativo (sempre o MINUTO SEGUINTE ao instante: o alarme dispara no início do minuto e, se já passou, vai para amanhã). */
export function alarmClock(at: number): string {
  const d = new Date(Math.ceil(at / 60_000) * 60_000);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
