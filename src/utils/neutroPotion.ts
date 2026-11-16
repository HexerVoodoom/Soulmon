/**
 * POÇÃO DO NEUTRO (16/11/2026, dono, REGISTRO §452) — a poção raríssima. Dono único da RECEITA e do progresso; `elementPotion.ts` só delega.
 *
 * Custo (de propósito ENORME): 100 essências de CADA elemento BASE (os 20) + 50 essências de CADA um dos OUTROS elementos COMPOSTOS do
 * catálogo de essências (190 pares + 40 trios + 19 quádruplos = 249; o `neutro` e o `pesadelo` NÃO entram: o primeiro é o próprio alvo,
 * o segundo não tem receita). Só ESSÊNCIAS: nenhuma poção-base é consumida (diferente dos compostos comuns). Funções PURAS; o gasto
 * passa por `spendEssences` (tudo-ou-nada, soma `essenceSpent`, que o servidor já aceita como único jeito de o saldo baixar).
 */
import { BASE_ELEMENT_IDS, ESSENCE_ELEMENT_IDS, essenceComposition } from './elementDex';
import { ELEMENTO_NEUTRO_ID } from './elementoNeutro';
import type { EssenceDrop } from './essences';

export const NEUTRO_POTION_COSTS = { eachBase: 100, eachComposite: 50 } as const;

export type NeutroGrupo = 'base' | 'par' | 'trio' | 'quad';
export const NEUTRO_GRUPOS: readonly NeutroGrupo[] = ['base', 'par', 'trio', 'quad'];

/** O grupo de um elemento do catálogo de essências, pelo número de componentes distintos (1, 2, 3, 4). */
function grupoDe(id: string): NeutroGrupo {
  const n = essenceComposition(id)?.length ?? 1;
  return n <= 1 ? 'base' : n === 2 ? 'par' : n === 3 ? 'trio' : 'quad';
}

/** Os ids de cada grupo, na ordem do catálogo (calculado uma vez). */
export const NEUTRO_IDS_POR_GRUPO: Readonly<Record<NeutroGrupo, readonly string[]>> = (() => {
  const g: Record<NeutroGrupo, string[]> = { base: [], par: [], trio: [], quad: [] };
  for (const id of ESSENCE_ELEMENT_IDS) g[grupoDe(id)].push(id);
  return g;
})();

/** O custo completo: 20 × 100 + 249 × 50. */
export const NEUTRO_POTION_COST: readonly EssenceDrop[] = (() => {
  const out: EssenceDrop[] = [];
  for (const id of ESSENCE_ELEMENT_IDS) out.push({ id, qty: BASE_ELEMENT_IDS.includes(id) ? NEUTRO_POTION_COSTS.eachBase : NEUTRO_POTION_COSTS.eachComposite });
  return out;
})();

export const NEUTRO_TOTAL = NEUTRO_POTION_COST.length;

export interface NeutroGrupoProgresso {
  grupo: NeutroGrupo;
  total: number;
  /** Quantos já têm o que a receita pede deles. */
  feitos: number;
  /** Quanto pedem de cada um. */
  cada: number;
  /** Os que ainda faltam, com `tem`/`precisa`, na ordem do catálogo. */
  faltam: { id: string; tem: number; precisa: number }[];
}

export interface NeutroProgresso {
  grupos: NeutroGrupoProgresso[];
  feitos: number;
  total: number;
  completo: boolean;
}

/** O progresso do jogador, agrupado por tipo ("x de 269 completos"). Saldo ausente conta como 0. */
export function neutroProgresso(essences: Record<string, number> | undefined): NeutroProgresso {
  const need = new Map(NEUTRO_POTION_COST.map(c => [c.id, c.qty]));
  const grupos = NEUTRO_GRUPOS.map((grupo): NeutroGrupoProgresso => {
    const ids = NEUTRO_IDS_POR_GRUPO[grupo];
    const faltam: NeutroGrupoProgresso['faltam'] = [];
    for (const id of ids) {
      const precisa = need.get(id) ?? 0;
      const tem = essences?.[id] ?? 0;
      if (tem < precisa) faltam.push({ id, tem, precisa });
    }
    return { grupo, total: ids.length, feitos: ids.length - faltam.length, cada: grupo === 'base' ? NEUTRO_POTION_COSTS.eachBase : NEUTRO_POTION_COSTS.eachComposite, faltam };
  });
  const feitos = grupos.reduce((s, g) => s + g.feitos, 0);
  return { grupos, feitos, total: NEUTRO_TOTAL, completo: feitos === NEUTRO_TOTAL };
}

/** Dá para criar a poção do Neutro com este saldo? */
export const canAffordNeutroPotion = (essences: Record<string, number> | undefined): boolean => NEUTRO_POTION_COST.every(c => (essences?.[c.id] ?? 0) >= c.qty);

export const isNeutroPotion = (id: unknown): boolean => id === ELEMENTO_NEUTRO_ID;
