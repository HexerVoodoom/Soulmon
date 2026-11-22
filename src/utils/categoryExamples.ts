import type { ActivityCategory } from '../types/categories';

/**
 * Exemplo do campo de nome por categoria (spec 3.2, decisão do dono 22/11/2026).
 * Aparece só como placeholder, ou seja, só com o campo vazio: texto digitado
 * nunca é trocado. A dica de sintaxe da captura rápida saiu; o parse continua.
 */
export const CATEGORY_EXAMPLES: Record<ActivityCategory, { pt: string; en: string }> = {
  sono: { pt: 'Deitar às 22h30', en: 'Lights out at 10:30 p.m.' },
  corpo: { pt: 'Caminhar 20 minutos', en: 'Walk 20 minutes' },
  mente: { pt: 'Meditar 10 minutos', en: 'Meditate 10 minutes' },
  foco: { pt: 'Foco profundo ou projeto por 25 minutos', en: 'Deep work block, 25 minutes' },
  aprendizado: { pt: 'Ler 10 páginas', en: 'Read 10 pages' },
  relacoes: { pt: 'Ligar para um amigo', en: 'Call a friend' },
  casa: { pt: 'Arrumar a mesa', en: 'Tidy the desk' },
  financas: { pt: 'Anotar os gastos do dia', en: "Log today's spending" },
  proposito: { pt: 'Escrever no diário de gratidão', en: 'Write in the gratitude journal' },
  criatividade: { pt: 'Desenhar por 15 minutos', en: 'Sketch for 15 minutes' },
};

export function categoryExample(category: string | undefined, isPt: boolean): string {
  const ex = category ? CATEGORY_EXAMPLES[category as ActivityCategory] : undefined;
  const fallback = CATEGORY_EXAMPLES.corpo;
  const pick = ex ?? fallback;
  return `${isPt ? 'Exemplo' : 'Example'}: ${isPt ? pick.pt : pick.en}`;
}
