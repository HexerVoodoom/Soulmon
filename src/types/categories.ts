/**
 * AS CATEGORIAS — FONTE ÚNICA (tarefas, hábitos, Home, catálogo, onboarding).
 *
 * Antes havia DUAS taxonomias: 8 `ActivityCategory` em inglês (chips de criar/
 * editar e persistência) e 9 `LifeArea` (catálogo e onboarding). O dono pediu
 * (11/11/2026) UMA só, a dos hábitos, mais Criatividade. O id é o da área
 * (`sono`, `corpo`…) e é o que se grava no save. Ids antigos (`Health`,
 * `Wellness`…) continuam entrando — `normalizeCategory` os traduz no hydrate.
 *
 * Módulo de DADOS puro: não importa nada do app (attributes.ts e
 * activityCatalog.ts reexportam daqui).
 */

export type LifeArea =
  | 'sono'
  | 'corpo'
  | 'mente'
  | 'foco'
  | 'aprendizado'
  | 'relacoes'
  | 'casa'
  | 'financas'
  | 'proposito'
  | 'criatividade';

/** Ordem de exibição (chips, onboarding, catálogo). */
export const LIFE_AREAS: LifeArea[] = [
  'sono', 'corpo', 'mente', 'foco', 'aprendizado', 'relacoes', 'casa', 'financas', 'proposito', 'criatividade',
];

export type ActivityCategory = LifeArea;
export const ACTIVITY_CATEGORIES: readonly ActivityCategory[] = LIFE_AREAS;

/** Nome bilíngue de cada categoria. */
export const LIFE_AREA_LABEL: Record<LifeArea, { pt: string; en: string }> = {
  sono: { pt: 'Sono', en: 'Sleep' },
  corpo: { pt: 'Corpo', en: 'Body' },
  mente: { pt: 'Mente', en: 'Mind' },
  foco: { pt: 'Foco e Trabalho', en: 'Focus & Work' },
  aprendizado: { pt: 'Aprendizado', en: 'Learning' },
  relacoes: { pt: 'Relações', en: 'Relationships' },
  casa: { pt: 'Casa', en: 'Home' },
  financas: { pt: 'Finanças', en: 'Finances' },
  proposito: { pt: 'Propósito', en: 'Purpose' },
  criatividade: { pt: 'Criatividade', en: 'Creativity' },
};

/** Ids das 8 categorias antigas → categoria equivalente de hoje. */
export const LEGACY_CATEGORY_MAP: Readonly<Record<string, ActivityCategory>> = {
  Health: 'corpo',
  Fitness: 'corpo',
  Wellness: 'mente',
  Discipline: 'foco',
  Study: 'aprendizado',
  Social: 'relacoes',
  Work: 'foco',
  Creativity: 'criatividade',
};

/**
 * Qualquer id (atual, antigo, caixa baixa de saves velhos como `'study'`) →
 * categoria atual; `undefined` se não reconhece. Nunca lança.
 */
export function normalizeCategory(raw: unknown): ActivityCategory | undefined {
  if (typeof raw !== 'string' || !raw) return undefined;
  if ((LIFE_AREAS as string[]).includes(raw)) return raw as ActivityCategory;
  const cap = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  return Object.prototype.hasOwnProperty.call(LEGACY_CATEGORY_MAP, cap) ? LEGACY_CATEGORY_MAP[cap] : undefined;
}
