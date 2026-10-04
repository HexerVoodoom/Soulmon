/**
 * ANIVERSÁRIO DA CRIATURA (WP1.16, parte 2).
 *
 * O `bornAt` existe para duas coisas, e esta é a segunda: marcar o dia em que
 * a relação faz um mês ou um ano. Módulo PURO — `now` entra por parâmetro.
 *
 * As regras, e cada uma existe porque a alternativa seria pior:
 *  · **sem `bornAt` não há aniversário.** Save antigo não comemora nada, e não
 *    se inventa uma data para ele ter o que comemorar.
 *  · **nada de XP, nada de item, nada de push.** O Vínculo não pede ação nova
 *    (é a invariante de `bond.ts`), e um aniversário que rende recompensa vira
 *    mais uma coisa a não perder. O que ele rende é UMA fala.
 *  · **só marcos redondos.** Mês cheio e ano cheio. "Faz 47 dias" é um
 *    contador, não uma data.
 */

import { dayKeyParts } from './playerDay';

/** `'2026-09-06'` → `{y, m, d}`; `null` para qualquer coisa que não seja isso.
 *  Aceita também `"Sun Oct 04 2026"`: é o que `playerDayKey` devolve e, por
 *  isso, o que `bornAt` e o `todayKey` do App sempre foram — só o ISO fazia
 *  `daysTogether`/`anniversaryOn` devolverem `null` para todo save real. */
function parse(dayKey: string | undefined): { y: number; m: number; d: number } | null {
  return dayKeyParts(dayKey);
}

export type AnniversaryKind = 'month' | 'year';

/**
 * O aniversário que HOJE completa, ou `null`.
 *
 * `todayKey` é o dia do jogador (mesma régua de `bornAt`), nunca `new Date()`
 * lá dentro: as duas pontas têm de vir do mesmo relógio, senão em fuso negativo
 * o aniversário cai no dia errado — que é o bug clássico deste campo.
 */
export function anniversaryOn(
  bornAt: string | undefined,
  todayKey: string,
): AnniversaryKind | null {
  const nasc = parse(bornAt);
  const hoje = parse(todayKey);
  if (!nasc || !hoje) return null;

  // O próprio dia do nascimento não é aniversário de nada.
  const mesmoDiaDoMes = nasc.d === hoje.d;
  if (!mesmoDiaDoMes) return null;

  const mesesVividos = (hoje.y - nasc.y) * 12 + (hoje.m - nasc.m);
  if (mesesVividos <= 0) return null;

  // Ano tem precedência: 12 meses é um ano, e anunciar "faz 12 meses" no dia em
  // que faz 1 ano seria a leitura mais pobre das duas.
  if (mesesVividos % 12 === 0) return 'year';
  return 'month';
}

/**
 * "Dias juntos" — quantos dias desde o nascimento, contando hoje.
 *
 * Só cresce por construção, e é isso que o torna admissível como número
 * exibido (C.3 #2): não existe leitura em que ele desça, então ele não pode
 * virar placar de desempenho.
 */
export function daysTogether(bornAt: string | undefined, todayKey: string): number | null {
  const a = parse(bornAt);
  const b = parse(todayKey);
  if (!a || !b) return null;
  const ini = Date.UTC(a.y, a.m - 1, a.d);
  const fim = Date.UTC(b.y, b.m - 1, b.d);
  if (fim < ini) return null; // relógio do aparelho voltou: silêncio, não número negativo
  return Math.round((fim - ini) / 86400000) + 1;
}
