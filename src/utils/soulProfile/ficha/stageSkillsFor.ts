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
