/**
 * O par de skills da ficha do estágio ATUAL do pet (PR1b/B2): o mesmo `skills?.[stage]` da Arena,
 * num lugar só para as 4 telas de luta (Arena, Masmorra, Pesadelo, Duelo/Torneio).
 */
import { getStageLevel } from '../../../types/progression';
import type { StageSkills } from './skills';
import type { FichaStage } from './types';

/** Estágios que a ficha conhece; os dois níveis de bebê do pet caem em `rookie`. */
export function fichaStageOf(evolutionStage: string): FichaStage {
  const nivel = getStageLevel(evolutionStage);
  return (['rookie', 'champion', 'ultimate', 'mega', 'ultra'].includes(nivel) ? nivel : 'rookie') as FichaStage;
}

export type FichaSkills = Partial<Record<FichaStage, StageSkills>>;

export function stageSkillsFor(skills: FichaSkills | undefined | null, evolutionStage: string): StageSkills | undefined {
  return skills?.[fichaStageOf(evolutionStage)];
}

/**
 * PR9: o cache `soulmonSkills` do save é gravado UMA vez; um save anterior ao PR9 guarda skills sem `familia` (nome e
 * efeito da geração antiga). Quando a página do Pet recalcula do perfil local, esse cache velho é trocado pelo novo —
 * o cache que já tem a família do especial em todos os estágios que carrega fica como está.
 */
export function skillsTemFamilia(skills: FichaSkills | null | undefined): boolean {
  const pares = skills ? Object.values(skills) : [];
  return pares.length > 0 && pares.every(p => typeof p?.especial?.familia === 'string');
}
