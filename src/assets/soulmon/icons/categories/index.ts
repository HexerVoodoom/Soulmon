/**
 * ÍCONES DE CATEGORIA (arte própria, 128², alfa real) — beta-2 (10.1, 13/10/2026): o Santuário do Vínculo trocou o emoji da
 * categoria por estes, que já estavam no repo (o dono pediu "ícones próprios" no lugar de emoji funcional). Fonte única do
 * mapa categoria → arte; a categoria vem do ESTADO e nem sempre é válida (saves antigos gravaram `'study'` em caixa baixa),
 * então a leitura é tolerante e devolve `undefined` quando não há arte (quem chama cai no glifo de antes).
 */
import { normalizeCategory, type ActivityCategory } from '../../../../types/categories';
import creativity from './icon-cat-creativity.png';
import discipline from './icon-cat-discipline.png';
import fitness from './icon-cat-fitness.png';
import social from './icon-cat-social.png';
import study from './icon-cat-study.png';
import wellness from './icon-cat-wellness.png';
import work from './icon-cat-work.png';

/** Arte antiga (desenhada para as 8 categorias de antes) reaproveitada na categoria equivalente de hoje. */
const ARTE_HERDADA: Partial<Record<ActivityCategory, string>> = {
  criatividade: creativity, foco: discipline, corpo: fitness, relacoes: social,
  aprendizado: study, mente: wellness, financas: work,
};

/**
 * SLOTS de arte nova (11/11/2026): largar `icon-cat-<id>.png` (128², alfa real) nesta pasta, com `<id>` = o id da categoria
 * (`sono`, `casa`, `proposito`, ou qualquer outra para trocar a herdada), e a arte entra SOZINHA — sem mexer em código. Sem o
 * arquivo, cai na arte herdada e, sem ela, no glifo (quem chama trata `undefined`). Lista do que falta: `docs/ASSETS-A-GERAR.md`.
 */
const SLOTS = import.meta.glob('./icon-cat-*.png', { eager: true, import: 'default' }) as Record<string, string>;
const ARTE_NOVA: Partial<Record<ActivityCategory, string>> = {};
for (const [path, url] of Object.entries(SLOTS)) {
  const id = /icon-cat-(\w+)\.png$/.exec(path)?.[1];
  const cat = id ? normalizeCategory(id) : undefined;
  // só o nome NOVO vale como slot (`icon-cat-study.png` é a herdada, já mapeada acima)
  if (cat && id === cat) ARTE_NOVA[cat] = url;
}

export const CATEGORY_ICON_ART: Readonly<Partial<Record<ActivityCategory, string>>> = { ...ARTE_HERDADA, ...ARTE_NOVA };

/** A arte da categoria (id novo, id antigo ou caixa baixa de save velho); `undefined` sem categoria ou sem arte. */
export function categoryIconArt(category?: string): string | undefined {
  const cat = normalizeCategory(category);
  return cat ? CATEGORY_ICON_ART[cat] : undefined;
}
