/**
 * Atualização do app nativo: decisão PURA (sem DOM/rede) entre bloquear, sugerir ou nada.
 * Regra: versão instalada (versionCode) < mínima → 'block'; < recomendada → 'suggest'; senão 'none'.
 * Qualquer dado ausente/inválido (sem rede, JSON torto, versão ilegível) → 'none' (fail-open: nunca prender ninguém por erro).
 */
export interface AppVersionConfig { minVersionCode: number; recommendedVersionCode: number }
export type UpdateDecision = 'block' | 'suggest' | 'none';

const codigo = (v: unknown): number | null => (typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : null);

export function parseAppConfig(raw: unknown): AppVersionConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const min = codigo(r.minVersionCode);
  const rec = codigo(r.recommendedVersionCode);
  if (min === null || rec === null) return null;
  return { minVersionCode: min, recommendedVersionCode: rec };
}

/** `App.getInfo().build` no Android é o versionCode como texto. */
export function parseInstalledBuild(build: unknown): number | null {
  if (typeof build === 'string' && build.trim() === '') return null;
  const n = typeof build === 'string' ? Number(build.trim()) : build;
  return codigo(n);
}

export function decideUpdate(installed: number | null, cfg: AppVersionConfig | null): UpdateDecision {
  if (installed === null || !cfg) return 'none';
  if (installed < cfg.minVersionCode) return 'block';
  if (installed < cfg.recommendedVersionCode) return 'suggest';
  return 'none';
}
