// ---------------------------------------------------------------------------
// FEITOS (rodada 6, L4): os contadores VITALÍCIOS que alimentam as conquistas permanentes dos recursos que ainda não tinham
// contador no save (Chuva de Almas, Trilha, Colcha, Calabouço, Corrida Normal/dash, PPT Normal, Loja do Clã, "Gerar de novo",
// Preparar o Foco, rankings). UM objeto no save (`GameState.feats`), chaves FECHADAS, inteiros 0..FEAT_CAP.
//
// O que NÃO é: não conta tarefa (proibição do CLAUDE.md), não é sequência, não cobra. É só "usei este recurso", derivado de um
// EVENTO que o jogo já emitia. Nada novo sai do aparelho além do próprio save.
//
// Dois tipos: `add` (soma 1 por evento) e `max` (guarda o maior valor visto). Espelho do servidor: `functions/api/_dailyMissions.js`
// (`FEAT_KEYS`, `sanitizeFeats`), travado por `dailyMissions.parity.test.js`.
// ---------------------------------------------------------------------------

export const FEAT_CAP = 999999;

/** Soma 1 por evento. */
export const FEAT_ADD_KEYS = [
  'zipSolved', 'patchesSolved', 'rogueFloors', 'dinoDashSmashed', 'pptNormalWins', 'clanShopBuys', 'regens', 'focusPrepared',
] as const;
/** Guarda o maior valor. */
export const FEAT_MAX_KEYS = ['barrageBest', 'dinoNormalBest', 'rankTier'] as const;

export const FEAT_KEYS = [...FEAT_ADD_KEYS, ...FEAT_MAX_KEYS] as const;
export type FeatKey = typeof FEAT_KEYS[number];
export type Feats = Partial<Record<FeatKey, number>>;

const isMax = (k: FeatKey): boolean => (FEAT_MAX_KEYS as readonly string[]).includes(k);

/** Aplica um evento. Sem mudança devolve o MESMO objeto (idempotente em re-render do updater). */
export function applyFeat(f: Feats | undefined, key: FeatKey, value = 1): Feats {
  const cur = f ?? {};
  if (!(FEAT_KEYS as readonly string[]).includes(key) || !Number.isFinite(value) || value <= 0) return cur;
  const v = Math.floor(value);
  const old = cur[key] ?? 0;
  const next = isMax(key) ? Math.max(old, v) : old + v;
  const clamped = Math.min(FEAT_CAP, next);
  return clamped === old ? cur : { ...cur, [key]: clamped };
}

/** Higienização (load e servidor): só chaves do catálogo, inteiros 1..FEAT_CAP. Lixo = undefined. */
export function sanitizeFeats(raw: unknown): Feats | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = raw as Record<string, unknown>;
  const out: Feats = {};
  for (const k of FEAT_KEYS) {
    const v = Object.prototype.hasOwnProperty.call(r, k) ? r[k] : undefined;
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) out[k] = Math.min(FEAT_CAP, Math.floor(v));
  }
  return out;
}

// Barramento mínimo: os componentes emitem, o App aplica no save (um assinante só). Sem assinante, é no-op.
type Listener = (key: FeatKey, value: number) => void;
let listener: Listener | null = null;
export function subscribeFeats(fn: Listener): () => void {
  listener = fn;
  return () => { if (listener === fn) listener = null; };
}
export function emitFeat(key: FeatKey, value = 1): void {
  try { listener?.(key, value); } catch { /* o contador nunca atrapalha o jogo */ }
}

/** Índice da faixa de ranking (madeira 0 … diamante 5), para `rankTier`. */
export const RANK_TIER_ORDER = ['madeira', 'bronze', 'prata', 'ouro', 'platina', 'diamante'] as const;
