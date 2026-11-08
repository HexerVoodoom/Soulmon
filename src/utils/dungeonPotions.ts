// 🧪 AS POÇÕES QUE FICAM COM O SOULMON NA MASMORRA (pedido do dono, 08/11/2026 — REGISTRO).
//
// Ao SAIR da tela com a descida ainda viva (`dungeonAway`), o jogador escolhe quantas poções de cura deixar com o Soulmon, por tipo.
// Durante a descida fora do app o Soulmon usa uma sozinho a cada queda (`applyDungeonAway`, o mesmo efeito do Coraçãozinho na tela:
// volta com 50% do HP e a luta continua). Quando a descida acaba, o que sobrou VOLTA para o inventário.
//
// PURO e IDEMPOTENTE. O estoque mora em `dungeonPotions` (campo do save, FORA de `dungeonAway` de propósito: o registro da descida é
// apagado em vários caminhos e o estoque não pode sumir junto). O invariante é "estoque sem descida volta para o inventário":
// `devolverPocoes` o aplica em todo fim de descida e no carregamento do save. O save é do cliente (o servidor não valida `dungeonAway`
// nem este campo): o total (inventário + estoque) nunca sobe por estas funções, só se move.
import type { GameState } from '../contexts/GameStateContext';
import { HEART_ITEM_EMOJI } from './shop';

/** Os TIPOS de poção de cura (chave do `foodInventory`). Hoje só o Coraçãozinho; um tipo novo entra aqui e o modal/uso já o acompanham. */
export const HEAL_POTIONS: readonly string[] = [HEART_ITEM_EMOJI];

/** Teto sanitário por tipo (o save é do cliente). */
const MAX_STOCK = 9999;

export type PotionStock = Record<string, number>;
type S = Pick<GameState, 'foodInventory' | 'dungeonAway' | 'dungeonPotions'>;

const int = (n: unknown): number => (typeof n === 'number' && Number.isFinite(n) ? Math.min(MAX_STOCK, Math.max(0, Math.floor(n))) : 0);

/** Higieniza o estoque do disco/nuvem: só tipos conhecidos, inteiros ≥ 1; vazio → `undefined`. */
export function sanitizeDungeonPotions(raw: unknown): PotionStock | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const out: PotionStock = {};
  for (const k of HEAL_POTIONS) {
    const n = int((raw as Record<string, unknown>)[k]);
    if (n > 0) out[k] = n;
  }
  return Object.keys(out).length ? out : undefined;
}

export const potionsTotal = (stock: PotionStock | undefined): number => HEAL_POTIONS.reduce((a, k) => a + int(stock?.[k]), 0);

/** Quantas poções de cura o jogador tem no inventário, por tipo (só os tipos com ao menos 1). */
export function healPotionsOwned(inv: Readonly<Record<string, number>> | undefined): PotionStock {
  const out: PotionStock = {};
  for (const k of HEAL_POTIONS) {
    const n = int(inv?.[k]);
    if (n > 0) out[k] = n;
  }
  return out;
}

const setCount = (inv: Record<string, number>, k: string, n: number): Record<string, number> => {
  const next = { ...inv };
  if (n > 0) next[k] = n; else delete next[k];
  return next;
};

/**
 * Deixa com o Soulmon `wanted[tipo]` poções de cada tipo (o ESTOQUE passa a ser exatamente isso, limitado ao que o jogador tem:
 * inventário + o que já estava deixado). IDEMPOTENTE: aplicar o mesmo pedido duas vezes não gasta nada a mais. Sem descida viva
 * não deixa nada (devolve o MESMO objeto).
 */
export function deixarPocoes<T extends S>(prev: T, wanted: PotionStock): T {
  if (!prev.dungeonAway) return prev;
  let inv: Record<string, number> = { ...prev.foodInventory };
  const stock: PotionStock = {};
  let mudou = false;
  for (const k of HEAL_POTIONS) {
    const tem = int(inv[k]);
    const ja = int(prev.dungeonPotions?.[k]);
    const quer = Math.min(tem + ja, int(wanted[k]));
    if (quer !== ja) mudou = true;
    inv = setCount(inv, k, tem + ja - quer);
    if (quer > 0) stock[k] = quer;
  }
  if (!mudou) return prev;
  return { ...prev, foodInventory: inv, dungeonPotions: Object.keys(stock).length ? stock : undefined };
}

/**
 * Estoque sem descida viva volta inteiro para o inventário (a descida acabou, foi retirada ou o registro sumiu). Com descida viva, ou
 * sem estoque, devolve o MESMO objeto — chamar de novo não muda nada.
 */
export function devolverPocoes<T extends S>(prev: T): T {
  if (prev.dungeonAway || !prev.dungeonPotions) return prev;
  return recolherPocoes(prev);
}

/** Traz o estoque de volta para o inventário MESMO com a descida viva (o jogador voltou à tela e pode usá-lo ele mesmo). */
export function recolherPocoes<T extends S>(prev: T): T {
  if (!prev.dungeonPotions) return prev;
  let inv: Record<string, number> = { ...prev.foodInventory };
  for (const k of HEAL_POTIONS) {
    const n = int(prev.dungeonPotions[k]);
    if (n > 0) inv = setCount(inv, k, int(inv[k]) + n);
  }
  return { ...prev, foodInventory: inv, dungeonPotions: undefined };
}

/** Gasta UMA poção do estoque (a primeira por ordem de `HEAL_POTIONS`). Sem estoque → `null`. Não muta a entrada. */
export function gastarUmaDoEstoque(stock: PotionStock | undefined): { stock: PotionStock | undefined; tipo: string } | null {
  for (const k of HEAL_POTIONS) {
    const n = int(stock?.[k]);
    if (n <= 0) continue;
    const next: PotionStock = { ...stock };
    if (n - 1 > 0) next[k] = n - 1; else delete next[k];
    return { stock: Object.keys(next).length ? next : undefined, tipo: k };
  }
  return null;
}

/** Tudo o que o jogador tem de cada tipo de poção de cura: inventário + o que já deixou com o Soulmon. */
export function pocoesDoJogador(s: Pick<GameState, 'foodInventory' | 'dungeonPotions'>): PotionStock {
  const out: PotionStock = {};
  for (const k of HEAL_POTIONS) {
    const n = Math.min(MAX_STOCK * 2, int(s.foodInventory?.[k]) + int(s.dungeonPotions?.[k]));
    if (n > 0) out[k] = n;
  }
  return out;
}
