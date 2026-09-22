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
  const r = await suggestTasksResult(goalText, categories, language);
  return r.ok ? r.items : [];
}

/** O mesmo pedido, sem apagar a diferença entre "veio vazio" e "quebrou". */
export type SuggestTasksResult =
  | { ok: true; items: SuggestedTask[] }
  /** `offline`: o aparelho declara sem rede, ou a requisição nem saiu.
   *  `error`: o servidor/provedor respondeu, mas não com sugestões. */
  | { ok: false; reason: 'offline' | 'error' };

/**
 * E1 (QA rodada 2): o tutorial tratava rede caída como "a IA não sugeriu
 * nada", e a pessoa lia isso como "digitei errado". Aqui a falha vem com
 * nome; `suggestTasks` continua devolvendo `[]` para quem não precisa saber.
 * Nunca lança.
 */
export async function suggestTasksResult(
  goalText: string,
  categories: ActivityCategory[],
  language: 'pt-BR' | 'en-US',
): Promise<SuggestTasksResult> {
  const semRede = typeof navigator !== 'undefined' && navigator.onLine === false;
  try {
    const { aiFetch } = await import('./aiClient');
    const res = await aiFetch('/api/suggest-tasks', { goalText, categories, language });
    if (!res.ok) return { ok: false, reason: semRede ? 'offline' : 'error' };
    const data = await res.json();
    const raw = Array.isArray(data.suggestions) ? data.suggestions : [];
    return {
      ok: true,
      items: raw.map((s: { name: string; category: ActivityCategory }) => ({
        name: s.name,
        category: s.category,
        emoji: CATEGORY_ICONS[s.category] ?? '✨',
      })),
    };
  } catch {
    return { ok: false, reason: semRede ? 'offline' : 'error' };
  }
}

// ---------------------------------------------------------------------------
// NUDGE DE TAREFA MÍNIMA
//
// O achado central do modelo de Fogg (B=MAP) é que o gargalo quase nunca é
// Motivação — é Habilidade. As pessoas já querem fazer; elas não conseguem
// fazer AGORA, com a energia e o tempo que têm. Por isso reduzir o tamanho do
// hábito funciona melhor, e dura mais, do que tentar aumentar a vontade.
//
// Aqui isso é só um convite: a heurística sugere uma versão de dois minutos
// quando a tarefa cadastrada parece grande. Nunca bloqueia, nunca corrige o
// texto do usuário, e some se ele ignorar — a meta é dele.
// ---------------------------------------------------------------------------

interface UnitRule {
  /** Casa a unidade escrita pelo usuário. */
  match: RegExp;
  /** A partir de quanto vale sugerir começar menor. */
  threshold: number;
  /** Versão mínima sugerida. */
  small: { pt: string; en: string };
}

const UNIT_RULES: UnitRule[] = [
  { match: /\b(minutos?|mins?)\b/i, threshold: 20, small: { pt: '5 minutos', en: '5 minutes' } },
  { match: /\b(horas?|hrs?|h)\b/i, threshold: 1, small: { pt: '10 minutos', en: '10 minutes' } },
  { match: /\b(k[mM]|quil[oô]metros?|kilometers?)\b/i, threshold: 3, small: { pt: '1 km', en: '1 km' } },
  { match: /\b(p[aá]ginas?|pages?)\b/i, threshold: 10, small: { pt: '1 página', en: '1 page' } },
  { match: /\b(cap[ií]tulos?|chapters?)\b/i, threshold: 1, small: { pt: '1 página', en: '1 page' } },
  { match: /\b(vezes|reps?|repeti[çc][õo]es|flex[õo]es|push-?ups?)\b/i, threshold: 15, small: { pt: '5 repetições', en: '5 reps' } },
];

/**
 * Devolve uma sugestão de versão mínima, ou `null` se a tarefa já parece
 * pequena o bastante (o caso mais comum — o nudge tem que ser raro para não
 * virar ruído).
 */
export function minimumViableHint(taskName: string, language: 'pt-BR' | 'en-US'): string | null {
  const name = taskName.trim();
  if (!name) return null;

  const numberMatch = name.match(/(\d+(?:[.,]\d+)?)/);
  if (!numberMatch) return null;
  const amount = parseFloat(numberMatch[1].replace(',', '.'));
  if (!Number.isFinite(amount)) return null;

  // Só olha o trecho DEPOIS do número: "5km em 30 dias" fala de km, não de dias.
  const afterNumber = name.slice(numberMatch.index! + numberMatch[1].length);
  const rule = UNIT_RULES.find(r => r.match.test(afterNumber));
  if (!rule || amount <= rule.threshold) return null;

  const isPt = language === 'pt-BR';
  const small = isPt ? rule.small.pt : rule.small.en;
  return isPt
    ? `Que tal começar com ${small}? Aparecer todo dia vale mais que um dia grande — dá pra aumentar depois.`
    : `How about starting with ${small}? Showing up daily beats one big day — you can scale it up later.`;
}
