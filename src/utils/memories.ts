// ---------------------------------------------------------------------------
// WP4.8 — MEMÓRIAS aos 30 e 90 dias.
//
// O app conta o dia (relatório diário), a semana (relatório semanal) e nunca
// contou a HISTÓRIA. Aos 30 e aos 90 dias existe algo que nenhuma das duas
// telas alcança: um apanhado do que essas semanas foram — as formas que a
// criatura viveu, os sonhos que ela trouxe, e o que a pessoa escreveu no
// primeiro minuto.
//
// Duas regras, e as duas são sobre o que ele NÃO é:
//  · **não é um balanço.** Nada de "você concluiu N tarefas", nada de
//    percentual, nada de comparação com o mês anterior. Um resumo de trinta
//    dias com números vira avaliação de desempenho da própria vida, e este
//    produto não faz isso nem no dia, quanto mais no mês.
//  · **não é um gatilho de volta.** Aparece uma vez, dentro do relatório que
//    a pessoa já ia ver, e não gera push, badge nem lembrete.
//
// Os marcos são 30 e 90 porque são os dois que a pessoa reconhece sem contar
// ("faz um mês", "faz uns três meses"). 60 não é um marco de ninguém.
// ---------------------------------------------------------------------------

export const MEMORY_MARKS = [30, 90] as const;
export type MemoryMark = (typeof MEMORY_MARKS)[number];

/**
 * O marco que este dia cruza, ou `null`.
 *
 * `daysWithPet` vem de `daysTogether` (`utils/anniversary.ts`), que já devolve
 * `null` quando não há `bornAt` ou quando o relógio andou para trás — e sem
 * idade não há memória, nunca uma inventada.
 *
 * Compara com IGUALDADE, não com `>=`: o cartão é do DIA do marco. Com `>=`
 * ele apareceria todo dia depois do trigésimo, e a coisa que fazia dele um
 * momento (ser raro) desapareceria na segunda vez.
 */
export function memoryMarkFor(daysWithPet: number | null): MemoryMark | null {
  if (daysWithPet === null) return null;
  return MEMORY_MARKS.find(m => m === daysWithPet) ?? null;
}

export interface MemoriesInput {
  daysWithPet: number | null;
  /** Marcos já mostrados (`memoriesShown` no save). */
  shown?: readonly number[];
}

/**
 * Mostra a memória? `null` = não.
 *
 * A trava do `shown` existe porque o relatório diário pode ser reaberto e o
 * dia do jogador pode ser recalculado — e um "momento" que acontece duas
 * vezes deixa de ser um momento.
 */
export function memoryToShow(input: MemoriesInput): MemoryMark | null {
  const marco = memoryMarkFor(input.daysWithPet);
  if (marco === null) return null;
  return (input.shown ?? []).includes(marco) ? null : marco;
}

/** Registra o marco como mostrado. IDEMPOTENTE (o updater roda 2×). */
export function markMemoryShown(shown: readonly number[] | undefined, mark: MemoryMark): number[] {
  const atual = shown ?? [];
  return atual.includes(mark) ? [...atual] : [...atual, mark];
}
