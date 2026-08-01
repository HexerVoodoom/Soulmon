import { CATEGORY_ICONS } from '../types/category-icons';
import type { ActivityCategory } from '../types/attributes';

export interface SuggestedTask {
  name: string;
  category: ActivityCategory;
  emoji: string;
}

/**
 * Sugestão de tarefas via IA (functions/api/suggest-tasks.js — mesmo provedor
 * do chat do pet, Groq). Usada no onboarding do tutorial (criação da 1ª
 * tarefa obrigatória). Nunca lança — em qualquer falha (rede, IA fora do ar,
 * resposta inválida) retorna [] e quem chamou cai pro fallback manual.
 */
export async function suggestTasks(
  goalText: string,
  categories: ActivityCategory[],
  language: 'pt-BR' | 'en-US',
): Promise<SuggestedTask[]> {
  try {
    const { aiFetch } = await import('./aiClient');
    const res = await aiFetch('/api/suggest-tasks', { goalText, categories, language });
    if (!res.ok) return [];
    const data = await res.json();
    const raw = Array.isArray(data.suggestions) ? data.suggestions : [];
    return raw.map((s: { name: string; category: ActivityCategory }) => ({
      name: s.name,
      category: s.category,
      emoji: CATEGORY_ICONS[s.category] ?? '✨',
    }));
  } catch {
    return [];
  }
}
