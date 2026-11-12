import type { ActivityCategory } from '../types/attributes';

export interface FoodItem {
  name: string;
  emoji: string;
  category: ActivityCategory;
}

export const FOOD_BY_CATEGORY: Record<ActivityCategory, FoodItem> = {
  sono:         { name: 'Juice',    emoji: '🧃', category: 'sono' },
  corpo:        { name: 'Protein',  emoji: '🥩', category: 'corpo' },
  mente:        { name: 'Salad',    emoji: '🥗', category: 'mente' },
  foco:         { name: 'Coffee',   emoji: '☕', category: 'foco' },
  aprendizado:  { name: 'Apple',    emoji: '🍎', category: 'aprendizado' },
  relacoes:     { name: 'Pizza',    emoji: '🍕', category: 'relacoes' },
  casa:         { name: 'Rice',     emoji: '🍚', category: 'casa' },
  financas:     { name: 'Coffee',   emoji: '☕', category: 'financas' },
  proposito:    { name: 'Rice',     emoji: '🍚', category: 'proposito' },
  criatividade: { name: 'Candy',    emoji: '🍭', category: 'criatividade' },
};

/** As 8 comidas distintas (10 categorias dividem 8 comidas/artes: `financas` come Café e `proposito`, Arroz). */
export const UNIQUE_FOODS: FoodItem[] = Object.values(FOOD_BY_CATEGORY).filter((f, i, a) => a.findIndex(g => g.emoji === f.emoji) === i);

export const CATEGORY_EMOJIS: Record<ActivityCategory, string> = {
  sono: '🌙', corpo: '💪', mente: '🧘', foco: '🎯', aprendizado: '📚',
  relacoes: '👥', casa: '🏠', financas: '💼', proposito: '🧭', criatividade: '🎨',
};

export const AI_CATEGORY_MAP: Record<string, ActivityCategory> = {
  Physical: 'corpo',
  Mental: 'aprendizado',
  Social: 'relacoes',
  Creative: 'criatividade',
};
