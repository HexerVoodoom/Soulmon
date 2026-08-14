import { ActivityCategory } from './attributes';
import iconHealth from '../assets/soulmon/icons/categories/icon-cat-health.png';
import iconCreativity from '../assets/soulmon/icons/categories/icon-cat-creativity.png';
import iconDiscipline from '../assets/soulmon/icons/categories/icon-cat-discipline.png';
import iconStudy from '../assets/soulmon/icons/categories/icon-cat-study.png';
import iconWork from '../assets/soulmon/icons/categories/icon-cat-work.png';
import iconSocial from '../assets/soulmon/icons/categories/icon-cat-social.png';
import iconWellness from '../assets/soulmon/icons/categories/icon-cat-wellness.png';
import iconFitness from '../assets/soulmon/icons/categories/icon-cat-fitness.png';

/** Ícone pixel-art (gerado no Higgsfield) pra chip de seleção de categoria —
 *  visual apenas. `CATEGORY_ICONS` (emoji) continua sendo o valor gravado no
 *  `emoji` da tarefa/atividade (texto livre, usado no título) — não dá pra
 *  trocar aquele por imagem sem reescrever a estrutura de dados. */
export const CATEGORY_ICON_IMG: Record<ActivityCategory, string> = {
  Health: iconHealth,
  Creativity: iconCreativity,
  Discipline: iconDiscipline,
  Study: iconStudy,
  Work: iconWork,
  Social: iconSocial,
  Wellness: iconWellness,
  Fitness: iconFitness,
};

/**
 * Ícone emoldurado do kit para uma categoria vinda do ESTADO — que nem sempre
 * é uma `ActivityCategory` válida: saves antigos e dados semeados gravaram a
 * categoria em caixa baixa (`'study'`), e há tarefa sem categoria nenhuma.
 * Devolve `undefined` nesses casos, para quem chama cair de volta no emoji
 * em vez de renderizar uma imagem quebrada.
 */
export function categoryIconImg(category?: string): string | undefined {
  if (!category) return undefined;
  const key = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  return CATEGORY_ICON_IMG[key as ActivityCategory];
}

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
