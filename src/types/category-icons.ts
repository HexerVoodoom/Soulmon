import { ActivityCategory } from './attributes';

// Mapeamento fixo de ícones por categoria
export const CATEGORY_ICONS: Record<ActivityCategory, string> = {
  Health: '🏥',
  Creativity: '🎨',
  Discipline: '⚡',
  Study: '📚',
  Work: '💼',
  Social: '👥',
  Wellness: '🧘',
  Fitness: '💪',
};

// Nome em PT-BR — a categoria em si (chave) é sempre em inglês internamente
// (persistida no GameState), mas o app é sempre bilíngue na UI.
export const CATEGORY_LABELS_PT: Record<ActivityCategory, string> = {
  Health: 'Saúde',
  Creativity: 'Criatividade',
  Discipline: 'Disciplina',
  Study: 'Estudos',
  Work: 'Trabalho',
  Social: 'Social',
  Wellness: 'Bem-estar',
  Fitness: 'Fitness',
};

export function categoryLabel(cat: ActivityCategory, isPt: boolean): string {
  return isPt ? CATEGORY_LABELS_PT[cat] : cat;
}
