/**
 * Migração dos ids de CAMINHO — dono único (29/09/2026).
 *
 * O dono pediu: "remova toda menção a virus, data e vacina e substitua por
 * poder, harmonia e benevolência". A correspondência é pela ordem dita:
 *
 *   vírus  → poder        (`virus`   → `power`)
 *   dado   → harmonia     (`data`    → `harmony`)
 *   vacina → benevolência (`vaccine` → `benevolence`)
 *
 * Ninguém usou o app em produção (CLAUDE.md), mas o save do DONO pode existir
 * num aparelho — por isso a migração, e não um corte seco. Este é o ÚNICO
 * arquivo de código que ainda soletra os ids antigos (há guard em
 * `branchRename.contract.test.ts`); o resto do app só conhece os novos.
 *
 * Regras:
 *  - PURA: nada de localStorage, React ou relógio.
 *  - IDEMPOTENTE: se nada mudou, devolve a MESMA referência (footgun 6 — o
 *    updater pode rodar duas vezes e a adoção da nuvem roda depois do load).
 *  - Portas de entrada que chamam isto: `hydrateSave` (localStorage E nuvem,
 *    em `GameStateContext.tsx`), `adoptCloudSave` (`cloudSave.ts`) e o overlay
 *    (`desktop/renderer/src/cloudSync.ts`, que IMPORTA — footgun 9).
 */

export type NewBranch = 'power' | 'harmony' | 'benevolence';

// Os ids antigos são montados por partes para que este seja o único ponto em
// que eles existem — e para que um grep pelo id inteiro não ache nada fora
// daqui a não ser registro histórico.
const OLD_V = 'vir' + 'us';
const OLD_D = 'da' + 'ta';
const OLD_A = 'vacc' + 'ine';

const BRANCH_MAP: Record<string, NewBranch> = {
  [OLD_V]: 'power',
  [OLD_D]: 'harmony',
  [OLD_A]: 'benevolence',
};

const TIERS = ['champion', 'ultimate', 'mega'] as const;

/** Campos de pontos: nome antigo → nome novo. */
const POINT_FIELDS: ReadonlyArray<[string, string]> = [
  [OLD_V + 'Points', 'powerPoints'],
  [OLD_D + 'Points', 'harmonyPoints'],
  [OLD_A + 'Points', 'benevolencePoints'],
];

/** Emojis dos chips: antigo → novo (a pastinha é indexada por emoji). */
export const LEGACY_CHIP_EMOJI: Readonly<Record<string, string>> = {
  '\u{1F9A0}': '\u{1F44A}', // chip de poder
  '\u{1F4BE}': '\u{1F3B6}', // chip de harmonia
  '\u{1F489}': '\u{1F932}', // chip de benevolência
};

/** Ramo antigo → novo. Devolve o próprio valor se não for um ramo antigo. */
export function legacyBranchToNew<T>(b: T): T | NewBranch {
  return typeof b === 'string' && b in BRANCH_MAP ? BRANCH_MAP[b] : b;
}

/** Id de forma antigo (`champion-<ramo antigo>`) → novo. Qualquer outro valor volta igual. */
export function legacyFormIdToNew<T>(id: T): T | string {
  if (typeof id !== 'string') return id;
  const i = id.indexOf('-');
  if (i < 0) return id;
  const tier = id.slice(0, i);
  const branch = id.slice(i + 1);
  if (!(TIERS as readonly string[]).includes(tier) || !(branch in BRANCH_MAP)) return id;
  return `${tier}-${BRANCH_MAP[branch]}`;
}

/** Inverso de `legacyFormIdToNew` — só para LEITURA de chaves já gravadas. */
export function newFormIdToLegacy(id: string): string | null {
  const i = id.indexOf('-');
  if (i < 0) return null;
  const tier = id.slice(0, i);
  const branch = id.slice(i + 1);
  if (!(TIERS as readonly string[]).includes(tier)) return null;
  const old = Object.keys(BRANCH_MAP).find((k) => BRANCH_MAP[k] === branch);
  return old ? `${tier}-${old}` : null;
}

/** Chaves de campo cujo VALOR é um ramo. */
const BRANCH_VALUE_KEYS = new Set(['currentBranch', 'branch', 'attribute', 'attr', 'forecastBranch', 'dominantBranch']);

type Json = unknown;

function isPlain(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/** Um objeto `{virus, data, vaccine}` (pontos por ramo)? */
function isBranchRecord(o: Record<string, unknown>): boolean {
  return OLD_V in o || OLD_A in o;
}

/**
 * Colisão entre chave antiga e nova no mesmo objeto (save meio migrado).
 * Pastinha SOMA (são itens distintos que o jogador tem); o resto fica com o
 * MAIOR número — pontos e contadores só crescem, e somar contaria duas vezes.
 */
function mergeCount(out: Record<string, unknown>, k: string, v: unknown, sum: boolean): void {
  const a = out[k];
  if (typeof a === 'number' && typeof v === 'number') out[k] = sum ? a + v : Math.max(a, v);
}

function walk(v: Json, parentKey: string | null, seen: WeakSet<object>): Json {
  // Ciclo (save hostil/corrompido): não recursa de novo — devolve como está
  // e deixa quem serializa decidir (a adoção da nuvem recusa).
  if (v && typeof v === 'object') {
    if (seen.has(v)) return v;
    seen.add(v);
  }
  if (typeof v === 'string') {
    const f = legacyFormIdToNew(v);
    if (f !== v) return f;
    if (parentKey && BRANCH_VALUE_KEYS.has(parentKey)) return legacyBranchToNew(v);
    return v;
  }
  if (Array.isArray(v)) {
    let changed = false;
    const out = v.map((x) => {
      const y = walk(x, parentKey, seen);
      if (y !== x) changed = true;
      return y;
    });
    return changed ? out : v;
  }
  if (!isPlain(v)) return v;
  const branchRecord = isBranchRecord(v);
  const isInventory = parentKey === 'foodInventory';
  let changed = false;
  const out: Record<string, unknown> = {};
  for (const [k, x] of Object.entries(v)) {
    let nk = k;
    const pf = POINT_FIELDS.find(([o]) => o === k);
    if (pf) nk = pf[1];
    else if (branchRecord && k in BRANCH_MAP) nk = BRANCH_MAP[k];
    else if (isInventory && k in LEGACY_CHIP_EMOJI) nk = LEGACY_CHIP_EMOJI[k];
    else {
      const f = legacyFormIdToNew(k) as string;
      if (f !== k) nk = f;
      else if (k.includes(':') || k.includes('-')) {
        // chaves compostas (ex.: bestiário `linha-tier`, `form:x`) que carregam um id de forma
        nk = k.replace(/(champion|ultimate|mega)-([a-z]+)/g, (m) => legacyFormIdToNew(m) as string);
      }
    }
    const nx = walk(x, k, seen);
    if (nk !== k || nx !== x) changed = true;
    if (nk in out) mergeCount(out, nk, nx, isInventory);
    else out[nk] = nx;
  }
  return changed ? out : v;
}

/**
 * Reescreve TODO id antigo de caminho no save. Idempotente: um save sem nada
 * antigo volta como a MESMA referência. Valores não-objeto voltam intactos.
 */
export function migrateBranchIds<T>(state: T): T {
  if (!isPlain(state)) return state;
  return walk(state, null, new WeakSet()) as T;
}

/** Há algum resto antigo? (para testes e diagnóstico) */
export function hasLegacyBranchIds(state: unknown): boolean {
  return migrateBranchIds(state) !== state;
}
