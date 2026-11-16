/**
 * POÇÃO DO NEUTRO (16/11/2026, dono, REGISTRO §452) — a poção rara. Dono único da RECEITA e do progresso.
 *
 * Custo: para CADA um dos 20 elementos BASE, 100 essências dele OU 1 poção-base dele (a mistura vale, por elemento), MAIS 50 essências
 * do NEUTRO (as que o Corvo deixa). Nada dos compostos. Exige o Neutro já conhecido (Corvo vencido). Tudo-ou-nada.
 * Funções PURAS; o gasto real roda em `craftPotion` (`elementPotion.ts`) via `spendEssences` (soma `essenceSpent`).
 */
import { BASE_ELEMENT_IDS } from './elementDex';
import { ELEMENTO_NEUTRO_ID } from './elementoNeutro';
import { POTION_COSTS, POTION_PREFIX } from './potionCosts';
import type { EssenceDrop } from './essences';

export const NEUTRO_POTION_COSTS = { eachBase: POTION_COSTS.baseOwn, basePotion: 1, neutroEssence: POTION_COSTS.compositeFinal } as const;

type Saldo = Record<string, number> | undefined;

export interface NeutroBaseRow { id: string; essencia: number; pocao: number; ok: boolean; via: 'essencia' | 'pocao' | null }
export interface NeutroProgresso {
  bases: NeutroBaseRow[];
  basesFeitas: number;
  basesTotal: number;
  neutro: number;
  neutroNeed: number;
  completo: boolean;
}

/** Progresso por elemento base (100 essências OU 1 poção) e do neutro (x/50). Prefere pagar com essência quando ela basta. */
export function neutroProgresso(essences: Saldo, inventory?: Saldo): NeutroProgresso {
  const bases = BASE_ELEMENT_IDS.map((id): NeutroBaseRow => {
    const essencia = essences?.[id] ?? 0;
    const pocao = inventory?.[POTION_PREFIX + id] ?? 0;
    const via = essencia >= NEUTRO_POTION_COSTS.eachBase ? 'essencia' : pocao >= NEUTRO_POTION_COSTS.basePotion ? 'pocao' : null;
    return { id, essencia, pocao, ok: via !== null, via };
  });
  const basesFeitas = bases.filter(b => b.ok).length;
  const neutro = essences?.[ELEMENTO_NEUTRO_ID] ?? 0;
  return { bases, basesFeitas, basesTotal: bases.length, neutro, neutroNeed: NEUTRO_POTION_COSTS.neutroEssence, completo: basesFeitas === bases.length && neutro >= NEUTRO_POTION_COSTS.neutroEssence };
}

/** O que gastar: essências e poções-base. `null` se falta qualquer coisa. */
export function neutroPlano(essences: Saldo, inventory?: Saldo): { essences: EssenceDrop[]; potions: EssenceDrop[] } | null {
  const p = neutroProgresso(essences, inventory);
  if (!p.completo) return null;
  const ess: EssenceDrop[] = [{ id: ELEMENTO_NEUTRO_ID, qty: NEUTRO_POTION_COSTS.neutroEssence }];
  const pots: EssenceDrop[] = [];
  for (const b of p.bases) {
    if (b.via === 'essencia') ess.push({ id: b.id, qty: NEUTRO_POTION_COSTS.eachBase });
    else pots.push({ id: b.id, qty: NEUTRO_POTION_COSTS.basePotion });
  }
  return { essences: ess, potions: pots };
}

export const canAffordNeutroPotion = (essences: Saldo, inventory?: Saldo): boolean => neutroPlano(essences, inventory) !== null;
