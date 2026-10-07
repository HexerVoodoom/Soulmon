// ---------------------------------------------------------------------------
// PR15b — recalcula, DEPOIS de uma evolução, tudo o que o save guarda em cache a partir da ficha
// (skills com poder real, classes, companheiro, manifestação) usando o registro `fichaJornada`, e devolve o
// espelho derivado (plano + família) que completa o registro. Fora do `App.tsx` e por import DINÂMICO: puxa o
// motor da ficha, que não pode entrar no bundle inicial. Pura no sentido que importa: mesma entrada = mesma
// saída (nada de relógio nem `Math.random`; a semente é a identidade da pessoa).
// ---------------------------------------------------------------------------

import type { OracleInput } from '../../oracle';
import type { FichaJornada } from '../../fichaJornada';
import { ESTAGIOS_COM_JANELA } from '../../fichaJornada';
import { buildFichaESkills } from './fromInput';
import { identityKey } from '../identity';
import { withRealPowerAllStages } from './realSkillPower';
import { computeClassTitlesAllStages } from './classTitle';
import { manifestacaoDaFicha } from './manifestacao';
import { selectCompanion } from './capture';
import { companheiroVisivel } from './companheiro';
import type { FichaStage } from './types';

export async function recalcularCaches(saved: OracleInput & { seed?: number }, jornada: FichaJornada) {
  const { fichaByStage, stageSkills, dominantElement, planoByStage } = buildFichaESkills(saved, identityKey(saved), jornada);
  const skills = await withRealPowerAllStages(fichaByStage, stageSkills);
  const classTitles = await computeClassTitlesAllStages(fichaByStage, dominantElement);
  const derivado: Partial<Record<FichaStage, { plano: Record<string, number> | null; familia: string }>> = {};
  for (const stage of ESTAGIOS_COM_JANELA) {
    if (!jornada.estagios[stage]) continue;
    derivado[stage] = { plano: (planoByStage[stage] as Record<string, number> | undefined) ?? null, familia: stageSkills[stage].especial.familia as string };
  }
  return {
    skills,
    classTitles,
    manifestacao: manifestacaoDaFicha(fichaByStage),
    companheiro: companheiroVisivel(selectCompanion(fichaByStage.mega, identityKey(saved))),
    derivado,
  };
}
