import type { Language } from './i18n';

/**
 * Rótulos de dia da semana, num lugar só.
 *
 * Existiam duas cópias idênticas (`CreateModal`, `EditModal`) e as duas eram
 * **só em inglês**, o que quebra a regra de idioma do projeto: `['S','M','T',
 * 'W','T','F','S']` na fileira e `'Sunday'…` no `title`. Além de não localizar,
 * a inicial única é ambígua até em inglês — dois `S` e dois `T` seguidos. Em
 * PT-BR seria pior ainda (`D S T Q Q S S`: dois Q e três S).
 *
 * Por isso o rótulo curto tem **três letras**, que é o menor tamanho em que
 * os sete dias se distinguem nos dois idiomas.
 *
 * Índice = `Date.getDay()` (0 = domingo), a mesma convenção que
 * `activity.weekDays` já usa no GameState — não reordenar.
 */
const SHORT: Record<Language, readonly string[]> = {
  'pt-BR': ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  'en-US': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

const FULL: Record<Language, readonly string[]> = {
  'pt-BR': ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  'en-US': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

/** Rótulo de 3 letras (o que cabe no chip). */
export function weekdayShort(index: number, language: Language): string {
  return (SHORT[language] ?? SHORT['en-US'])[index] ?? '';
}

/** Nome inteiro — vai no `title` e no `aria-label` do chip. */
export function weekdayFull(index: number, language: Language): string {
  return (FULL[language] ?? FULL['en-US'])[index] ?? '';
}

/** Os sete índices, na ordem de `Date.getDay()`. */
export const WEEKDAY_INDEXES = [0, 1, 2, 3, 4, 5, 6] as const;
