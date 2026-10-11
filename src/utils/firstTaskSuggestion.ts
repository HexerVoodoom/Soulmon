/**
 * A PRIMEIRA TAREFA do onboarding (11/10/2026, pedido do dono: "na hora de criar
 * os hábitos senti falta de criar TAREFA também").
 *
 * Hábito = constância (as sugestões do catálogo); tarefa = execução (uma coisa
 * pontual que sai da cabeça). O passo "Seu ponto de partida" passou a oferecer
 * UMA tarefa já preenchida, que a pessoa pode reescrever ou esvaziar.
 *
 * Funções PURAS. Regras que seguem do motor de tarefas:
 *  - esforço 1 (rápida): pesa 1 na meta do dia, nunca mais que um hábito — não
 *    há recompensa por contagem, e uma tarefa só não estoura `dailyGoalFor`;
 *  - sem prazo, sem foco, sem alarme: nasce `open` e não cobra nada;
 *  - texto vazio = sem tarefa (a pessoa pode recusar).
 */
import type { LifeArea } from '../types/activityCatalog';
import type { ActivityCategory } from '../types/attributes';

export interface FirstTaskDraft {
  name: string;
  category: ActivityCategory;
  emoji: string;
}

type Bilingual = { en: string; pt: string };

const BY_AREA: Record<LifeArea, { name: Bilingual; category: ActivityCategory; emoji: string }> = {
  sono: { name: { en: "Set tonight's bedtime alarm", pt: 'Programar o despertador de hoje à noite' }, category: 'Wellness', emoji: '🌙' },
  corpo: { name: { en: 'Book a check-up or a class', pt: 'Marcar uma consulta ou uma aula' }, category: 'Health', emoji: '🩺' },
  mente: { name: { en: 'Write down what is on my mind', pt: 'Anotar o que está na minha cabeça' }, category: 'Wellness', emoji: '📝' },
  foco: { name: { en: 'Clear my desk for 10 minutes', pt: 'Arrumar minha mesa por 10 minutos' }, category: 'Work', emoji: '🧹' },
  aprendizado: { name: { en: 'Pick the next thing I want to learn', pt: 'Escolher a próxima coisa que quero aprender' }, category: 'Study', emoji: '📚' },
  relacoes: { name: { en: 'Message someone I miss', pt: 'Mandar mensagem para alguém de quem sinto falta' }, category: 'Social', emoji: '💌' },
  casa: { name: { en: 'Tidy one corner of the house', pt: 'Arrumar um cantinho da casa' }, category: 'Discipline', emoji: '🏠' },
  financas: { name: { en: 'Check my balance and one bill', pt: 'Conferir meu saldo e uma conta' }, category: 'Discipline', emoji: '💰' },
  proposito: { name: { en: 'Write one thing I want this month', pt: 'Escrever uma coisa que quero neste mês' }, category: 'Creativity', emoji: '🧭' },
};

const GENERIC = {
  name: { en: 'Finish one small thing I have been putting off', pt: 'Terminar uma coisinha que venho adiando' },
  category: 'Discipline' as ActivityCategory,
  emoji: '✅',
};

/** A sugestão vem da PRIMEIRA área escolhida; sem área, uma frase genérica. */
export function suggestFirstTask(areas: LifeArea[], isPt: boolean): FirstTaskDraft {
  const pick = (areas.length > 0 ? BY_AREA[areas[0]] : undefined) ?? GENERIC;
  return { name: isPt ? pick.name.pt : pick.name.en, category: pick.category, emoji: pick.emoji };
}

/** O rascunho que SAI do onboarding: o texto da pessoa vence a sugestão;
 *  vazio/espaços devolve `null` (sem tarefa). */
export function firstTaskFrom(text: string, areas: LifeArea[], isPt: boolean): FirstTaskDraft | null {
  const name = text.trim().slice(0, 80);
  if (!name) return null;
  const base = suggestFirstTask(areas, isPt);
  return { ...base, name };
}
