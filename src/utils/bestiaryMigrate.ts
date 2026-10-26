/**
 * MIGRAÇÃO DO BESTIÁRIO (QA 25/10/2026). A chave antiga era `<linha>-<tier>` (9 linhas × tiers, ex.: `kaelen-champion`);
 * a nova é `<id da criatura>-<estágio>` (`enemyRoster.ts`). Sem ponte, o save antigo (20/36) abria como 0/155.
 *
 * Cada linha antiga aponta para UMA criatura nova (distintas entre si, para o número de vistas não encolher); os tiers
 * `baby-i`/`baby-ii` viram `rookie`. As chaves antigas são MANTIDAS (cliente antigo ainda as lê; `BestiaryCollection` ignora o que
 * não está no roster) e as novas são ACRESCENTADAS. Idempotente: rodar de novo não muda nada.
 */
import { novoHasForm, type NovoAnyStage } from './novosSoulmonData';

/** Linha antiga -> criatura nova que a herda. Escolha de compatibilidade (não há equivalência de design). */
export const LEGACY_LINE_TO_NOVO: Readonly<Record<string, string>> = {
  kaelen: 'embrit', thalindra: 'bubbo', igni: 'spinvex', astrase: 'runix',
  orrin: 'brawnu', serah: 'sprouti', nautilu: 'gravul', ignar: 'kenjo', lumel: 'solion',
};

const TIER_TO_STAGE: Readonly<Record<string, NovoAnyStage>> = {
  'baby-i': 'rookie', 'baby-ii': 'rookie', rookie: 'rookie', champion: 'champion', ultimate: 'ultimate', mega: 'mega',
};

/** Traduz UMA chave antiga; `null` se já é nova ou desconhecida. */
export function migrateBestiaryKey(key: string): string | null {
  const i = key.indexOf('-');
  if (i <= 0) return null;
  const novo = LEGACY_LINE_TO_NOVO[key.slice(0, i)];
  const stage = TIER_TO_STAGE[key.slice(i + 1)];
  if (!novo || !stage || !novoHasForm(novo, stage)) return null;
  return `${novo}-${stage}`;
}

/** A lista inteira: antigas mantidas + novas acrescentadas, sem duplicata. */
export function migrateBestiary(keys: readonly string[]): string[] {
  const out = [...keys];
  const have = new Set(out);
  for (const k of keys) {
    const n = migrateBestiaryKey(k);
    if (n && !have.has(n)) { have.add(n); out.push(n); }
  }
  return out;
}
