/**
 * ÍCONES DE CATEGORIA (arte própria, 128², alfa real) — beta-2 (10.1, 13/10/2026): o Santuário do Vínculo trocou o emoji da
 * categoria por estes, que já estavam no repo (o dono pediu "ícones próprios" no lugar de emoji funcional). Fonte única do
 * mapa categoria → arte; a categoria vem do ESTADO e nem sempre é válida (saves antigos gravaram `'study'` em caixa baixa),
 * então a leitura é tolerante e devolve `undefined` quando não há arte (quem chama cai no glifo de antes).
 */
import creativity from './icon-cat-creativity.png';
import discipline from './icon-cat-discipline.png';
import fitness from './icon-cat-fitness.png';
import health from './icon-cat-health.png';
import social from './icon-cat-social.png';
import study from './icon-cat-study.png';
import wellness from './icon-cat-wellness.png';
import work from './icon-cat-work.png';

export const CATEGORY_ICON_ART: Readonly<Record<string, string>> = {
  Creativity: creativity, Discipline: discipline, Fitness: fitness, Health: health,
  Social: social, Study: study, Wellness: wellness, Work: work,
};

/** A arte da categoria (`'study'`, `'Study'` e `'STUDY'` valem); `undefined` sem categoria ou sem arte. */
export function categoryIconArt(category?: string): string | undefined {
  if (!category) return undefined;
  return CATEGORY_ICON_ART[category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()];
}
