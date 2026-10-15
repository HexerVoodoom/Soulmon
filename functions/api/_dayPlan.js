/** Forma segura do plano do dia (espelho de src/utils/dayPlan.ts › sanitizeDayPlan; REGISTRO §65). */
export const DAY_PLAN_MAX_IDS = 200;
const ID_RE = /^[\w:.-]{1,120}$/;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

function cleanIds(v) {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.filter((x) => typeof x === 'string' && ID_RE.test(x)))].slice(0, DAY_PLAN_MAX_IDS);
}

export function sanitizeDayPlan(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = /** @type {Record<string, unknown>} */ (raw);
  if (typeof r.day !== 'string' || !DAY_RE.test(r.day)) return undefined;
  const offered = cleanIds(r.offered);
  const picked = cleanIds(r.picked).filter((id) => offered.includes(id));
  return { day: r.day, offered, picked, confirmed: r.confirmed === true };
}
