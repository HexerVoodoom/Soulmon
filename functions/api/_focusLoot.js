/** Forma segura do ledger diário de recompensas da Oficina (espelho de src/utils/focusExpedition.ts). */
export const FOCUS_LOOT_DAILY_CAP = 8;

export function sanitizeFocusLoot(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = /** @type {Record<string, unknown>} */ (raw);
  if (typeof r.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(r.day)) return undefined;
  const items = typeof r.items === 'number' && Number.isFinite(r.items) ? Math.floor(r.items) : -1;
  if (items < 0 || items > FOCUS_LOOT_DAILY_CAP || !Array.isArray(r.claims)) return undefined;
  const claims = [...new Set(r.claims.filter((id) => typeof id === 'string' && /^[\w:-]{1,120}$/.test(id)))].slice(0, FOCUS_LOOT_DAILY_CAP);
  return { day: r.day, items, claims };
}
