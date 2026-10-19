/**
 * O QUE DA ÁRVORE DO BOSQUE VAI PARA O SAVE (`GameState.bosqueArvores`): tipos e higienização. Módulo mínimo de
 * propósito — o `GameStateContext` (chunk de entrada) só precisa disto; a conta dos níveis mora em `bosqueArvores.ts`,
 * carregada sob demanda.
 */
export type EstacaoBosque = 'outono' | 'inverno' | 'primavera' | 'verao';
/** Ordem no panorama, da esquerda para a direita (começa no outono: o ano do hemisfério sul). */
export const ESTACOES_BOSQUE: readonly EstacaoBosque[] = ['outono', 'inverno', 'primavera', 'verao'];

/** Pico guardado de UMA estação. `completaEm`/`perfeitaEm` = ano do ciclo em que chegou ao 4 / ao 5. */
export interface ArvoreSalva { nivel: number; ciclo: number; completaEm?: number; perfeitaEm?: number }
export type BosqueArvores = Partial<Record<EstacaoBosque, ArvoreSalva>>;

const ano = (n: unknown): number | undefined => (typeof n === 'number' && Number.isInteger(n) && n >= 2000 && n <= 2200 ? n : undefined);

/** Higieniza o que veio do save (dado não confiável). */
export function sanitizeBosqueArvores(raw: unknown): BosqueArvores {
  const out: BosqueArvores = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const e of ESTACOES_BOSQUE) {
    const r = (raw as Record<string, unknown>)[e] as Record<string, unknown> | undefined;
    const ciclo = ano(r?.ciclo);
    if (!r || ciclo === undefined) continue;
    const nivel = typeof r.nivel === 'number' && Number.isFinite(r.nivel) ? Math.min(4, Math.max(1, Math.floor(r.nivel))) : 1;
    const completaEm = ano(r.completaEm);
    const perfeitaEm = ano(r.perfeitaEm);
    const perfeita = completaEm !== undefined && perfeitaEm !== undefined && perfeitaEm > completaEm ? perfeitaEm : undefined;
    out[e] = { nivel, ciclo, ...(completaEm !== undefined ? { completaEm } : {}), ...(perfeita !== undefined ? { perfeitaEm: perfeita } : {}) };
  }
  return out;
}

