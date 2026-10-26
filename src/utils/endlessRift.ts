// ENDLESS RIFT (M6) — a masmorra, com score MENSAL que reinicia. Ids de save e arquivos da masmorra NÃO mudam;
// só o nome visível ("Endless Rift" / "Fenda Sem Fim") e este placar mensal por cima da descida sem teto.
//
// SCORE = a camada mais funda LIMPA no mês (UTC, `YYYY-MM`). Mesmo número que o servidor ranqueia
// (`functions/api/_rankings.js`, jogo `endless-rift`, período `monthly`, teto 999).
//
// FAIXAS DE RECOMPENSA por profundidade atingida no mês (UMA vez por mês cada; limiares CONSERVADORES, o dono calibra
// quando houver dado real; a escada de marcos de vida `DUNGEON_DEPTH_MARKS` vai a 999, então 25/100/250 são metas
// de um mês, não de uma vida):
//   faixa 1 · camada  25 · MATERIAL (fragmentos do Soulsmith — fonte que já existe).
//   faixa 2 · camada 100 · mais BITS — creditados pelo funil existente (`creditMinigameBits` / `onEarnPoints`), então o teto
//                          diário de Bits vale; nenhuma fonte nova de moeda fora do funil.
//   faixa 3 · camada 250 · COMPETITIVA: entra no ranking mensal (o cliente só envia o score a partir daqui). O prêmio
//                          em Créditos do top 3 (50/25/10) é pago SÓ pelo servidor (`functions/api/_riftPayout.js`).
// Nada aqui toca Créditos: o cliente nunca credita.

export const RIFT_GAME_ID = 'endless-rift';

export interface RiftTier { readonly tier: 1 | 2 | 3; readonly layer: number; readonly fragments: number; readonly bits: number }
export const RIFT_TIERS: readonly RiftTier[] = [
  { tier: 1, layer: 25, fragments: 20, bits: 0 },
  { tier: 2, layer: 100, fragments: 0, bits: 100 },
  { tier: 3, layer: 250, fragments: 0, bits: 0 },
];
/** Profundidade mínima para entrar no ranking mensal (faixa 3). */
export const RIFT_RANKING_FROM = 250;
const MAX_LAYER = 999;

/**
 * Registro do mês no save. `m` = `YYYY-MM` (UTC); `best` = camada mais funda do mês; `claimed` = maior faixa já paga;
 * `base` = a PRIMEIRA camada limpa no mês (a descida retoma perto do recorde: ali o progresso NOVO do mês é 1).
 * Ausente em registro antigo = 1 (legado: progresso = `best`).
 */
export interface RiftMonth { m: string; best: number; claimed: number; base?: number }
export interface RiftMonthState { riftMonth?: RiftMonth }

/** `YYYY-MM` em UTC (mesma chave do servidor: `monthKey`). */
export function riftMonthKey(nowMs: number): string {
  const d = new Date(nowMs);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

const int = (v: unknown, lo: number, hi: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.floor(v))) : lo;

/** Leitura tolerante: lixo/ausente → `undefined` (= score 0 no mês atual). */
export function sanitizeRiftMonth(raw: unknown): RiftMonth | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  if (typeof r.m !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(r.m)) return undefined;
  const best = int(r.best, 0, MAX_LAYER);
  const base = typeof r.base === 'number' && Number.isFinite(r.base) ? int(r.base, 1, MAX_LAYER) : undefined;
  return { m: r.m, best, claimed: int(r.claimed, 0, RIFT_TIERS.length), ...(base !== undefined ? { base } : {}) };
}

/** Progresso NOVO do mês: camadas além do ponto de retomada (`base`). Mês sem `base` (legado/zerado) = a própria camada. */
export function riftProgress(m: Pick<RiftMonth, 'best' | 'base'>): number {
  return m.best <= 0 ? 0 : Math.max(0, m.best - (m.base ?? 1) + 1);
}

/** O registro do mês de AGORA: mês velho (ou ausente) reinicia em zero. */
export function currentRiftMonth(raw: unknown, nowMs: number): RiftMonth {
  const m = riftMonthKey(nowMs);
  const s = sanitizeRiftMonth(raw);
  return s && s.m === m ? s : { m, best: 0, claimed: 0 };
}

export function riftBestThisMonth(state: RiftMonthState, nowMs: number): number {
  return currentRiftMonth(state.riftMonth, nowMs).best;
}

/**
 * Registra uma camada LIMPA no mês. Idempotente: a mesma camada de novo não paga nada.
 * `newTiers` = as faixas cruzadas AGORA (cada uma paga uma vez por mês).
 */
export function applyRiftLayer<T extends RiftMonthState>(prev: T, layer: number, nowMs: number): { next: T; newTiers: RiftTier[] } {
  const cur = currentRiftMonth(prev.riftMonth, nowMs);
  const lay = int(layer, 0, MAX_LAYER);
  const best = Math.max(cur.best, lay);
  // 1ª camada limpa do mês fixa o ponto de retomada: as FAIXAS pagam por progresso NOVO no mês, não por retomar perto do recorde vitalício
  // (QA beta3 R3: 1 camada no mês novo cruzava as faixas 25 e 100 de graça). Registro antigo sem `base` segue como era (progresso = best).
  const base = cur.base ?? (cur.best === 0 && lay > 0 ? lay : undefined);
  const prog = riftProgress({ best, base });
  const crossed = RIFT_TIERS.filter(t => t.tier > cur.claimed && t.layer <= prog);
  const claimed = crossed.length ? crossed[crossed.length - 1].tier : cur.claimed;
  if (best === cur.best && claimed === cur.claimed && base === cur.base && prev.riftMonth?.m === cur.m) return { next: prev, newTiers: [] };
  return { next: { ...prev, riftMonth: { m: cur.m, best, claimed, ...(base !== undefined ? { base } : {}) } }, newTiers: crossed };
}

export function riftTierTotals(tiers: readonly RiftTier[]): { fragments: number; bits: number } {
  return tiers.reduce((a, t) => ({ fragments: a.fragments + t.fragments, bits: a.bits + t.bits }), { fragments: 0, bits: 0 });
}
