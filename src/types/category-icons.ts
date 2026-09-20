import { ActivityCategory } from './attributes';
/*
 * `CATEGORY_ICON_IMG` / `categoryIconImg` (os PNG pixel `icon-cat-*.png`)
 * SAÍRAM em 20/09/2026 (canvas Atividades, D-A7 / achado 3): ícone de
 * categoria é ícone de INTERFACE, mora fora do visor e é vetor —
 * `CATEGORY_ICON_NAME` abaixo. Os PNG ficam em `src/assets/soulmon/icons/
 * categories/` só como arquivo de arte; nenhum componente os importa.
 */

/**
 * Categoria → nome de ícone Material Symbols Rounded (`<Icon>`).
 *
 * **Todo nome aqui está no inventário de 99 de `src/styles/tokens.md`.** A
 * fonte é um SUBSET: nome fora da lista não renderiza glifo nenhum e não dá
 * erro — o `<span>` fica vazio. Ao acrescentar categoria, ou o nome sai do
 * inventário, ou o inventário é regerado (comando no tokens.md) com bump do
 * `CACHE_VERSION` do `public/sw.js`.
 *
 * É o ÚNICO caminho: os chips de criação/edição e o onboarding também
 * desenham por aqui (D-A7).
 */
export const CATEGORY_ICON_NAME: Record<ActivityCategory, string> = {
  Health: 'favorite',
  Creativity: 'palette',
  Discipline: 'bolt',
  Study: 'psychology',
  Work: 'inventory_2',
  Social: 'chat_bubble',
  Wellness: 'spa',
  Fitness: 'accessibility_new',
};

/**
 * Tolerância: a categoria vem do ESTADO e nem
 * sempre é uma `ActivityCategory` válida (saves antigos gravaram `'study'` em
 * caixa baixa; há tarefa sem categoria). Devolve `undefined` nesses casos, e
 * quem chama simplesmente não desenha ícone.
 */
export function categoryIconName(category?: string): string | undefined {
  if (!category) return undefined;
  const key = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  return CATEGORY_ICON_NAME[key as ActivityCategory];
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
