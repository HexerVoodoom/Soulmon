/**
 * PROGRESSÃO DE NÍVEL DO CATÁLOGO (docs/PLANO-CATALOGO-ATIVIDADES.md §4).
 *
 * Função PURA: recebe a constância (já calculada por `utils/habitRhythm.ts`
 * → `constancy()`) e devolve uma SUGESTÃO, nunca uma mudança automática. Quem
 * decide subir ou descer de nível é sempre o jogador — o motor só oferece o
 * convite.
 *
 * Regras do plano, com a correção da revisão de psicologia (A6,
 * `docs/reviews/2026-09-28-catalogo-psicologia.md`), aplicadas aqui e só aqui
 * (nenhum outro arquivo reinventa o limiar):
 *  - Subir: sugere nível+1 quando a constância de `LEVEL_UP_WINDOW_DAYS` (21)
 *    dias for `>= LEVEL_UP_CONSTANCY_RATIO` (0.8) E o item já está no nível
 *    atual há pelo menos `LEVEL_MIN_DAYS` (21) dias — Lally 2010: mediana de
 *    66 dias até a automaticidade, então não acelerar demais. **Nunca** para
 *    item `optInOnly` (mais frequência não é progresso em TCC de autoajuda).
 *  - Descer: oferta gentil (nunca punição, nunca "descer"/"Nível 1" na tela —
 *    ver `catalogLevelDownCopy`) depois de `LEVEL_DOWN_WINDOW_DAYS` (14) dias
 *    CONSECUTIVOS com a constância de 7 dias abaixo de
 *    `LEVEL_DOWN_CONSTANCY_RATIO` (0.4). Dias perdoados (ausência, escudo,
 *    folga semanal) NÃO contam para esse contador — é obrigação de quem
 *    chama excluí-los antes de somar `lowConstancyDays`.
 *  - Nunca as duas ao mesmo tempo, e nunca fora do intervalo [1,3].
 *  - Depois de uma recusa da oferta de descer, cooldown de
 *    `LEVEL_DOWN_COOLDOWN_DAYS` (14) antes de oferecer de novo.
 */
import type { CatalogLevel } from '../types/activityCatalog';

/** Constância mínima, medida na janela de `LEVEL_UP_WINDOW_DAYS`, para
 *  sugerir subir de nível. */
export const LEVEL_UP_CONSTANCY_RATIO = 0.8;

/**
 * A janela em que a constância de subida é medida — 21 dias, NÃO os 7 de
 * `CONSTANCY_WINDOW_DAYS` (`habitRhythm.ts`). Achado da revisão de
 * psicologia: o comentário antigo dizia "3 semanas" mas quem chamasse
 * `constancy()` com a janela padrão (7 dias) veria uma única semana boa,
 * depois de 21 dias no nível, já disparar o convite de subir. Quem chama
 * `suggestLevelChange` tem que calcular `ratio` sobre ESTA janela — não a de
 * hábito comum — e o teste de fiação (`catalogLevel.test.ts`) prova isso.
 */
export const LEVEL_UP_WINDOW_DAYS = 21;

/** Dias mínimos no nível atual antes de poder subir — Lally 2010: não
 *  acelerar a automaticidade além do que a pesquisa sustenta. */
export const LEVEL_MIN_DAYS = 21;

/** Constância (na janela de 7 dias — `CONSTANCY_WINDOW_DAYS`) abaixo da qual,
 *  sustentada por `LEVEL_DOWN_WINDOW_DAYS` dias CONSECUTIVOS, oferece-se
 *  (gentilmente) deixar o item mais leve. */
export const LEVEL_DOWN_CONSTANCY_RATIO = 0.4;

/**
 * Dias CONSECUTIVOS de baixa constância (ratio de 7 dias < 0.4) antes da
 * oferta. "Consecutivos" desfaz a ambiguidade que a revisão de psicologia
 * apontou: não é "em algum ponto dentro da janela", é uma sequência sem
 * interrupção — e dias perdoados (ausência ≥2 dias, dia protegido por
 * escudo, folga semanal) não entram nessa sequência.
 */
export const LEVEL_DOWN_WINDOW_DAYS = 14;

/** Depois de uma recusa da oferta de "deixar mais leve", não oferecer de
 *  novo por este tanto de dias. A recusa não gera nada — nem registro
 *  visível, nem penalidade — só este intervalo antes de perguntar de novo. */
export const LEVEL_DOWN_COOLDOWN_DAYS = 14;

export type LevelSuggestion = 'up' | 'down' | null;

export interface LevelProgressInput {
  currentLevel: CatalogLevel;
  /** Item nunca sobe de nível quando `optInOnly` (protocolos de TCC —
   *  mais frequência não é o objetivo). Pode descer normalmente. */
  optInOnly?: boolean;
  /** Ratio de constância (0..1) medido em `LEVEL_UP_WINDOW_DAYS` dias —
   *  usado só para decidir SUBIR. */
  ratio: number;
  /** Dias desde que o item está no `currentLevel`. */
  daysAtLevel: number;
  /** Dias CONSECUTIVOS em que a constância de 7 dias ficou abaixo de
   *  `LEVEL_DOWN_CONSTANCY_RATIO` — sem contar dias perdoados (ausência,
   *  escudo, folga semanal). Usado só para decidir DESCER. */
  lowConstancyDays: number;
  /** Dias desde a última vez que a pessoa RECUSOU a oferta de descer, ou
   *  `undefined`/`Infinity` se nunca recusou. Enquanto `< LEVEL_DOWN_COOLDOWN_DAYS`,
   *  não oferece de novo. */
  daysSinceLastDownDecline?: number;
}

/**
 * Sugestão de nível — NUNCA aplica nada; só diz o que oferecer. `null` =
 * nenhuma oferta agora.
 */
export function suggestLevelChange(input: LevelProgressInput): LevelSuggestion {
  const { currentLevel, optInOnly, ratio, daysAtLevel, lowConstancyDays, daysSinceLastDownDecline } = input;

  if (
    !optInOnly &&
    currentLevel < 3 &&
    ratio >= LEVEL_UP_CONSTANCY_RATIO &&
    daysAtLevel >= LEVEL_MIN_DAYS
  ) {
    return 'up';
  }
  const emCooldown = daysSinceLastDownDecline !== undefined && daysSinceLastDownDecline < LEVEL_DOWN_COOLDOWN_DAYS;
  if (
    currentLevel > 1 &&
    ratio < LEVEL_DOWN_CONSTANCY_RATIO &&
    lowConstancyDays >= LEVEL_DOWN_WINDOW_DAYS &&
    !emCooldown
  ) {
    return 'down';
  }
  return null;
}

/** Aplica a sugestão (chamado só depois que o JOGADOR aceitou o convite). */
export function applyLevelChange(
  currentLevel: CatalogLevel,
  direction: 'up' | 'down',
): CatalogLevel {
  const next = direction === 'up' ? currentLevel + 1 : currentLevel - 1;
  return Math.max(1, Math.min(3, next)) as CatalogLevel;
}

/**
 * A6 da revisão de psicologia: o convite de descer NUNCA pode mostrar
 * "descer" nem "Nível 1" — isso vira um placar que desce, e nenhum número
 * exposto do produto pode diminuir. Os dois botões têm o MESMO peso visual
 * (nenhum é "cancelar"/ghost); recusar não gera nada.
 */
export function catalogLevelDownCopy(language: 'pt-BR' | 'en-US' = 'en-US') {
  const isPt = language === 'pt-BR';
  return {
    title: isPt ? 'Quer deixar este mais leve por um tempo?' : 'Want to make this lighter for a while?',
    body: isPt ? 'Dá pra voltar quando quiser.' : 'You can switch back anytime.',
    confirmLabel: isPt ? 'Deixar mais leve' : 'Make it lighter',
    declineLabel: isPt ? 'Manter como está' : 'Keep it as is',
  };
}
