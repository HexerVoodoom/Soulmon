// 💗 Coraçãozinho na QUEDA e ✨ Faísca de Alma (decisão do dono, 30/10/2026 — REGISTRO §180).
//
//  · Coraçãozinho: além de curar fora da luta, na Masmorra/Fenda Sem Fim, quando o Soulmon cai (HP 0) e o jogador TEM ao menos 1,
//    abre-se a oferta "Usar Coraçãozinho" ANTES do resultado de derrota. Aceitar gasta 1 do inventário e o Soulmon volta com 50% do
//    HP MÁXIMO; a luta CONTINUA de onde parou (o inimigo mantém o HP que tinha). Recusar = a derrota de sempre.
//    Limite: nenhum além do estoque (cada queda reoferece enquanto houver Coraçãozinho). Perder continua não custando coração.
//  · Faísca de Alma: item NOVO (não é o coração). Cai da Masmorra como o coraçãozinho; na luta, um botão enche a barra do especial.
//
// Determinismo: a continuação é uma luta NOVA do núcleo (`groupFightSteps`) com semente derivada (`reviveSeed`), HP inicial 50%,
// energia 0 e o HP do inimigo no ponto da queda (`startFoesHp`) — mesmas entradas, mesma luta. Funções PURAS.

import { ENERGY_TRIGGER } from './combate/specials';
import { HEART_ITEM_EMOJI, SPARK_ITEM_EMOJI } from './shop';

export const REVIVE_HP_FRAC = 0.5;
export { SPARK_ITEM_EMOJI };
/** Chance de a Faísca cair por inimigo derrotado (sem teto diário: o item só tem valor dentro da luta). */
export const SPARK_DROP_CHANCE = 0.04;
/** A Faísca enche a barra do especial por inteiro. */
export const SPARK_ENERGY = ENERGY_TRIGGER;

type Inv = Readonly<Record<string, number>>;

export const heartsOwned = (inv: Inv | undefined): number => Math.max(0, Math.floor(inv?.[HEART_ITEM_EMOJI] ?? 0));
export const sparksOwned = (inv: Inv | undefined): number => Math.max(0, Math.floor(inv?.[SPARK_ITEM_EMOJI] ?? 0));

/** A oferta só existe com ao menos 1 Coraçãozinho. */
export const canOfferRevive = (inv: Inv | undefined): boolean => heartsOwned(inv) >= 1;

/** Gasta 1 do item; sem estoque devolve o MESMO objeto (idempotente sobre o `prev`). Zerado, a chave some. */
export function consumeOne(inv: Record<string, number>, emoji: string): Record<string, number> {
  const n = Math.floor(inv[emoji] ?? 0);
  if (n <= 0) return inv;
  const next = { ...inv };
  if (n - 1 > 0) next[emoji] = n - 1; else delete next[emoji];
  return next;
}

export const addOne = (inv: Record<string, number>, emoji: string): Record<string, number> => ({ ...inv, [emoji]: Math.max(0, Math.floor(inv[emoji] ?? 0)) + 1 });

/** Semente da continuação n (1, 2…) de uma luta: derivada, nunca a mesma da luta original. */
export const reviveSeed = (fightSeed: number, n: number): number => (fightSeed ^ Math.imul(n, 0x9e3779b1)) | 0;

/** Ponto de partida da continuação: HP do Soulmon = 50% do máximo; o inimigo segue com a fração que tinha na queda. */
export function reviveStart(foeFracAtFall: number): { hp: number; foesHp: number[]; energy: number } {
  const f = Number.isFinite(foeFracAtFall) ? foeFracAtFall : 1;
  return { hp: REVIVE_HP_FRAC, foesHp: [Math.min(1, Math.max(1e-6, f))], energy: 0 };
}

export const rollSparkDrop = (rnd: () => number = Math.random): boolean => rnd() < SPARK_DROP_CHANCE;
