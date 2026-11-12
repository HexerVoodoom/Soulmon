import { emptyPurpose, PURPOSE_MAX_PRIORITIES, setGoal, setMotive, setPath, setPlan, type Purpose, type PurposePath } from './purpose';
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
  path?: PurposePath,
): Purpose | undefined {
  // Sem destino (Satisfação, Ressurgimento ou destino pulado): só o caminho, se houve escolha das cartas.
  if (!data) return path ? { ...setPath(emptyPurpose(), path, now), promptedExisting: true } : undefined;
  let p: Purpose = setGoal(setPath(emptyPurpose(), data.path ?? path ?? 'ambicao', now), { text: data.goalText, areas: data.areas }, now);
  if (!p.goal) return undefined;
  if (data.motive) p = setMotive(p, data.motive);
  if (data.plan) p = setPlan(p, data.plan);
  const priorities = data.priorityItemIds
    .map(cid => createdActivities.find(a => a.catalogId === cid)?.id)
    .filter((id): id is string => !!id);
  return { ...p, priorities: [...new Set(priorities)].slice(0, PURPOSE_MAX_PRIORITIES), promptedExisting: true };
}
