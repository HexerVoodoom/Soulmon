// O TEMA da Arena do jogador, lido pela fonte única (`fighterIdentity`, §11.3): o elemento do golpe básico que ele VÊ no próprio ícone.
import { fighterIdentity } from './fighterIdentity';
import { fichaStageOf } from './soulProfile/ficha/stageSkillsFor';
import { arenaTemaElementos } from './arenaTema';
import type { FichaStage } from './soulProfile/ficha/types';
import type { StageSkills } from './soulProfile/ficha/skills';

export function arenaTemaDoJogador(
  skills: Partial<Record<FichaStage, StageSkills>> | undefined, evolutionStage: string | undefined, petElement?: string,
): string[] {
  return arenaTemaElementos(fighterIdentity(skills?.[fichaStageOf(evolutionStage ?? 'rookie')], petElement).basico.elemento);
}
