// A JORNADA DO FOCO no servidor (§247): espelho de `src/utils/focusJourney.ts` só no que paga (baús pela seed, relógio, loot, tetos).
// Paridade em `src/utils/focusJourney.parity.test.ts`. O desenho da trilha é só do cliente.

export const JOURNEY_KEYS = ['bancada', 'relampago', 'quadrantes', 'brejo', 'elo', 'pena'];
export const JOURNEY_MODES = { p25: { focusMin: 25, chests: 6 }, p50: { focusMin: 50, chests: 10 } };
export const SPECIAL_CHANCE = 0.4;
export const JOURNEY_ITEMS_DAILY_CAP = 16;
export const JOURNEY_ESSENCES_DAILY_CAP = 8;
export const JOURNEY_COMPLETIONS_REWARDED = 4;
export const JOURNEY_MAX_PAUSES = 3;
export const JOURNEY_MAX_PAUSED_MS = 30 * 60_000;
export const ENV_ELEMENT = { forest: 'planta', shore: 'agua', cavern: 'terra', garden: 'fada', workshop: 'industrial', observatory: 'espaco' };
/** Espelho de `FOCUS_ENVIRONMENTS[].materials` (`src/utils/focusExpedition.ts`). */
export const ENV_MATERIALS = {
  forest: ['moss', 'laurel', 'down', 'fang'], shore: ['pebble', 'prism', 'essence', 'keepsake'], cavern: ['ore', 'spark', 'cipher', 'crest'],
  garden: ['moss', 'essence', 'page', 'prism'], workshop: ['gear', 'ink', 'spark', 'ribbon'], observatory: ['cipher', 'down', 'page', 'laurel'],
};
/** Espelho de `FOOD_BY_CATEGORY` (`src/constants/labels.ts`), na mesma ordem. */
export const JOURNEY_FOODS = ['🥩', '🥗', '🍎', '☕', '🧃', '🍚', '🍕', '🍭'];

export function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function journeyChests(seed, mode) {
  const n = JOURNEY_MODES[mode].chests;
  const rng = mulberry(seed ^ 0x51ed);
  const out = [];
  for (let k = 0; k < n; k++) {
    const jitter = (rng() - 0.5) * (0.5 / n);
    const special = rng() < SPECIAL_CHANCE;
    const type = special ? JOURNEY_KEYS[Math.min(JOURNEY_KEYS.length - 1, Math.floor(rng() * JOURNEY_KEYS.length))] : 'common';
    out.push({ k, at: Math.round(((k + 0.5) / n + jitter) * 1e6) / 1e6, type });
  }
  return out;
}

export function focusElapsed(c, now) {
  const parado = Math.min(JOURNEY_MAX_PAUSED_MS, c.pausedMs + (c.pausedAt !== null ? Math.max(0, now - c.pausedAt) : 0));
  return Math.max(0, now - c.startAt - parado);
}
export function journeyProgress(c, now) {
  return Math.min(1, focusElapsed(c, now) / (JOURNEY_MODES[c.mode].focusMin * 60_000));
}

export function chestLoot(seed, chest, keys, env) {
  const rng = mulberry((seed ^ Math.imul(chest.k + 1, 0x9e3779b1)) >>> 0);
  const mats = ENV_MATERIALS[env];
  const pick = (a) => a[Math.min(a.length - 1, Math.floor(rng() * a.length))];
  const mat = () => ({ kind: 'material', id: pick(mats), qty: 1 });
  const food = () => ({ kind: 'food', id: pick(JOURNEY_FOODS), qty: 1 });
  const ess = (qty) => ({ kind: 'essence', id: ENV_ELEMENT[env], qty });
  const common = () => [Math.floor(rng() * 5) < 4 ? mat() : food()];
  if (chest.type === 'common' || !keys.includes(chest.type)) return common();
  switch (chest.type) {
    case 'bancada': return [food(), food()];
    case 'relampago': return [mat(), mat()];
    case 'quadrantes': { const a = mat(); let b = mat(); for (let i = 0; i < 4 && b.id === a.id; i++) b = mat(); return [a, b]; }
    case 'brejo': return [ess(2)];
    case 'elo': return [mat(), food()];
    case 'pena': return [ess(1), mat()];
    default: return common();
  }
}

export function completionLoot(seed, nth, env) {
  if (nth === 1) return chestLoot(seed, { k: 999, at: 1, type: 'common' }, [], env);
  if (nth <= JOURNEY_COMPLETIONS_REWARDED) {
    const rng = mulberry((seed ^ 0xc0ffee) >>> 0);
    return [{ kind: 'essence', id: ENV_ELEMENT[env], qty: 1 }, { kind: 'food', id: JOURNEY_FOODS[Math.min(JOURNEY_FOODS.length - 1, Math.floor(rng() * JOURNEY_FOODS.length))], qty: 1 }];
  }
  return [];
}

export const emptyLedger = (day) => ({ day, items: 0, ess: 0, done: 0, claims: [] });

export function capLoot(ledger, claimId, items) {
  if (ledger.claims.includes(claimId)) return { granted: [], ledger };
  let it = ledger.items;
  let ess = ledger.ess;
  const granted = [];
  for (const x of items) {
    if (x.kind === 'essence') { const q = Math.min(x.qty, JOURNEY_ESSENCES_DAILY_CAP - ess); if (q > 0) { granted.push({ ...x, qty: q }); ess += q; } }
    else { const q = Math.min(x.qty, JOURNEY_ITEMS_DAILY_CAP - it); if (q > 0) { granted.push({ ...x, qty: q }); it += q; } }
  }
  return { granted, ledger: { ...ledger, items: it, ess, claims: [...ledger.claims, claimId].slice(-80) } };
}
