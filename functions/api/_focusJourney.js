// A JORNADA DO FOCO no servidor (§247): espelho de `src/utils/focusJourney.ts` só no que paga (baús pela seed, relógio, loot, tetos).
// Paridade em `src/utils/focusJourney.parity.test.ts`. O desenho da trilha é só do cliente.

export const JOURNEY_KEYS = ['bancada', 'relampago', 'quadrantes', 'brejo', 'elo', 'pena'];
export const JOURNEY_MODES = { p25: { focusMin: 25, chests: 6 }, p50: { focusMin: 50, chests: 10 } };
export const SPECIAL_CHANCE = 0.4;
export const JOURNEY_ITEMS_DAILY_CAP = 28;
export const JOURNEY_ESSENCES_DAILY_CAP = 8;
export const JOURNEY_SESSION_ITEMS_CAP = { p25: 6, p50: 10 };
export const ESSENCE_BY_ELEMENTS = {
  1: { common: 0.10, special: 1 }, 2: { common: 0.15, special: 1 }, 3: { common: 0.20, special: 2 }, 4: { common: 0.25, special: 2 },
};
export const JOURNEY_COMPLETIONS_REWARDED = 4;
/** Focos extras por dia (depois dos 4 recompensados) que ainda dão um item simples (§302). */
export const JOURNEY_EXTRA_COMPLETIONS = 3;
export const JOURNEY_MAX_PAUSES = 3;
export const JOURNEY_MAX_PAUSED_MS = 30 * 60_000;
export const ENV_ELEMENTS = {
  forest: ['planta', 'vida', 'vigor', 'ar'], shore: ['agua', 'eletricidade', 'som'], cavern: ['terra', 'fogo', 'sombra', 'morte'],
  garden: ['fada', 'luz', 'arcano'], workshop: ['industrial', 'marcial', 'vileza'], observatory: ['espaco', 'tempo', 'gravidade'],
};
const pickElement = (env, r) => { const a = ENV_ELEMENTS[env]; return a[Math.min(a.length - 1, Math.floor(r * a.length))]; };
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

export function chestLoot(seed, chest, keys, env, elems = ENV_ELEMENTS[env].length) {
  const tier = ESSENCE_BY_ELEMENTS[Math.max(1, Math.min(4, Math.floor(elems) || 1))];
  const rng = mulberry((seed ^ Math.imul(chest.k + 1, 0x9e3779b1)) >>> 0);
  const mats = ENV_MATERIALS[env];
  const pick = (a) => a[Math.min(a.length - 1, Math.floor(rng() * a.length))];
  const mat = () => ({ kind: 'material', id: pick(mats), qty: 1 });
  const food = () => ({ kind: 'food', id: pick(JOURNEY_FOODS), qty: 1 });
  const ess = (qty) => ({ kind: 'essence', id: pickElement(env, rng()), qty });
  const common = () => (rng() < tier.common ? [ess(1)] : [Math.floor(rng() * 5) < 4 ? mat() : food()]);
  if (chest.type === 'common' || !keys.includes(chest.type)) return common();
  switch (chest.type) {
    case 'bancada': return [food()];
    case 'relampago': return [mat()];
    case 'quadrantes': return [mat()];
    case 'brejo': return [ess(tier.special)];
    case 'elo': return [mat()];
    case 'pena': return [mat()];
    default: return common();
  }
}

export function completionLoot(seed, nth, env) {
  if (nth === 1) return chestLoot(seed, { k: 999, at: 1, type: 'common' }, [], env);
  if (nth <= JOURNEY_COMPLETIONS_REWARDED) {
    const rng = mulberry((seed ^ 0xc0ffee) >>> 0);
    return [{ kind: 'essence', id: pickElement(env, rng()), qty: 1 }, { kind: 'food', id: JOURNEY_FOODS[Math.min(JOURNEY_FOODS.length - 1, Math.floor(rng() * JOURNEY_FOODS.length))], qty: 1 }];
  }
  /* Ciclos extras do Pomodoro (§302): do 5º ao 7º foco do dia, UM item simples (baú comum), sem Bits; depois disso nada. */
  if (nth <= JOURNEY_COMPLETIONS_REWARDED + JOURNEY_EXTRA_COMPLETIONS) return chestLoot(seed, { k: 998, at: 1, type: 'common' }, [], env);
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
