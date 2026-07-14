import type { ActivityCategory } from '../types/attributes';

export interface FoodItem {
  name: string;
  emoji: string;
  category: ActivityCategory;
}

export const FOOD_BY_CATEGORY: Record<ActivityCategory, FoodItem> = {
  Fitness:    { name: 'Protein',  emoji: '🥩', category: 'Fitness' },
  Health:     { name: 'Salad',    emoji: '🥗', category: 'Health' },
  Study:      { name: 'Apple',    emoji: '🍎', category: 'Study' },
  Work:       { name: 'Coffee',   emoji: '☕', category: 'Work' },
  Wellness:   { name: 'Juice',    emoji: '🧃', category: 'Wellness' },
  Discipline: { name: 'Rice',     emoji: '🍚', category: 'Discipline' },
  Social:     { name: 'Pizza',    emoji: '🍕', category: 'Social' },
  Creativity: { name: 'Candy',    emoji: '🍭', category: 'Creativity' },
};

export const CATEGORY_EMOJIS: Record<ActivityCategory, string> = {
  Health: '💪',
  Study: '📚',
  Social: '👥',
  Creativity: '🎨',
  Discipline: '🎯',
  Work: '💼',
  Wellness: '🧘',
  Fitness: '🏋️',
};

export const AI_CATEGORY_MAP: Record<string, ActivityCategory> = {
  Physical: 'Health',
  Mental: 'Study',
  Social: 'Social',
  Creative: 'Creativity',
};
