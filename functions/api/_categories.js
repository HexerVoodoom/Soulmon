// Categorias (11/11/2026): UMA lista para tarefas e hábitos — as áreas da vida + Criatividade.
// ESPELHO de `src/types/categories.ts` (a paridade é travada por `categories.parity.test.js`).
export const CATEGORIES = ['sono', 'corpo', 'mente', 'foco', 'aprendizado', 'relacoes', 'casa', 'financas', 'proposito', 'criatividade'];

// Ids antigos (o modelo, o cliente velho e saves antigos ainda os falam) → categoria de hoje.
export const LEGACY_CATEGORY_MAP = {
  Health: 'corpo', Fitness: 'corpo', Wellness: 'mente', Discipline: 'foco',
  Study: 'aprendizado', Social: 'relacoes', Work: 'foco', Creativity: 'criatividade',
};

/** Qualquer id (atual ou antigo) → categoria de hoje; `undefined` se não reconhece. */
export function normalizeCategory(v) {
  if (typeof v !== 'string') return undefined;
  if (CATEGORIES.includes(v)) return v;
  return Object.prototype.hasOwnProperty.call(LEGACY_CATEGORY_MAP, v) ? LEGACY_CATEGORY_MAP[v] : undefined;
}
