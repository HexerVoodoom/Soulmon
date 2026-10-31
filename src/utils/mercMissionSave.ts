/** Tipos e leitura tolerante do save SEM o catálogo de atividades: o GameStateContext (entrada) importa daqui. */
export type MercOrdem = 'filtrador' | 'tecelao' | 'rompente';
export const MERC_ORDENS: readonly MercOrdem[] = ['filtrador', 'tecelao', 'rompente'];

export interface MercMissionState { day: string; ordem: MercOrdem; activityId: string; done: boolean }

/** Leitura tolerante: forma errada = ausente. Idempotente. Espelho exato: `functions/api/_mercMission.js`. */
export function sanitizeMercMission(raw: unknown): MercMissionState | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  if (typeof r.day !== 'string' || r.day.length === 0 || r.day.length > 40) return undefined;
  if (typeof r.ordem !== 'string' || !(MERC_ORDENS as readonly string[]).includes(r.ordem)) return undefined;
  if (typeof r.activityId !== 'string' || r.activityId.length === 0 || r.activityId.length > 64) return undefined;
  return { day: r.day, ordem: r.ordem as MercOrdem, activityId: r.activityId, done: r.done === true };
}

