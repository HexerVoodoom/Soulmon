/**
 * Fragmento de Boss (EN "Boss Shard") — moeda NOVA do save (pedido do dono, 03/11/2026): +1 a cada BOSS vencido no Elemental Fusion
 * (`utils/match3Boss.ts`). Ainda sem uso. Campo `bossShards` no `GameState`, só ACRESCENTADO (linha vermelha #20): leitura tolerante por
 * `sanitizeBossShards` no `hydrateSave` e espelho no servidor (`functions/api/_bossShards.js`, paridade em `bossShards.parity.test.js`).
 */
export const BOSS_SHARDS_MAX = 1_000_000;

/** Inteiro de 0 a `BOSS_SHARDS_MAX`; ausente/lixo = `undefined` (save antigo = nenhum fragmento). Idempotente. */
export function sanitizeBossShards(raw: unknown): number | undefined {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return undefined;
  return Math.min(BOSS_SHARDS_MAX, Math.max(0, Math.floor(raw)));
}

/** O saldo depois de ganhar `n` fragmentos (o ausente conta 0). */
export function addBossShards(current: unknown, n = 1): number {
  return Math.min(BOSS_SHARDS_MAX, (sanitizeBossShards(current) ?? 0) + Math.max(0, Math.floor(n)));
}
