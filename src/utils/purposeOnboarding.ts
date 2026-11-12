import { emptyPurpose, PURPOSE_MAX_PRIORITIES, setGoal, setMotive, setPlan, type Purpose } from './purpose';
import type { OnboardingCompleteData } from '../components/SoulmonOnboarding';

/**
 * O que o onboarding colheu vira o `Purpose` do save (E1/E2).
 * As prioridades chegam como ids do CATÁLOGO (as atividades ainda não existiam
 * no onboarding) e viram o id da atividade criada a partir daquele item.
 * `promptedExisting: true`: quem já passou por aqui nunca recebe o modal do
 * jogador existente.
 */
export function purposeFromOnboarding(
  data: OnboardingCompleteData['purpose'],
  createdActivities: ReadonlyArray<{ id: string; catalogId?: string | null }>,
  now: Date,
): Purpose | undefined {
  if (!data) return undefined;
  let p: Purpose = setGoal({ ...emptyPurpose(), ...(data.path ? { path: data.path } : {}) }, { text: data.goalText, areas: data.areas }, now);
  if (!p.goal) return undefined;
  if (data.motive) p = setMotive(p, data.motive);
  if (data.plan) p = setPlan(p, data.plan);
  const priorities = data.priorityItemIds
    .map(cid => createdActivities.find(a => a.catalogId === cid)?.id)
    .filter((id): id is string => !!id);
  return { ...p, priorities: [...new Set(priorities)].slice(0, PURPOSE_MAX_PRIORITIES), promptedExisting: true };
}
