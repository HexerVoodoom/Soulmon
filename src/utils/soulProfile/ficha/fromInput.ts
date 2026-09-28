// ---------------------------------------------------------------------------
// Ficha + skills a partir do perfil salvo — a FONTE ÚNICA dos dois lugares
// que precisam disso: o pipeline completo (que ainda gera bestiário e
// criatura) e a página do Pet (que só quer as skills por forma).
//
// Vive fora do `pipeline.ts` de propósito: aquele módulo importa o pool do
// bestiário (2.000 criaturas, ~104 KB gzip) e a máquina criativa. A página do
// Pet não precisa de nada disso — e, se ela recalculasse a ficha por conta
// própria para ficar leve, seria a regra copiada do footgun 9, divergindo em
// silêncio das skills que o resto do app mostra.
// ---------------------------------------------------------------------------

import type { OracleInput } from '../../oracle';
import { applyRitualAnswers } from '../ritualAnswers';
import { buildFicha } from './buildSheet';
import { buildAllStageSkills, type StageSkills } from './skills';
import { FICHA_STAGE_ORDER, type Ficha, type FichaStage } from './types';

export interface FichaESkills {
  fichaByStage: Record<FichaStage, Ficha>;
  stageSkills: Record<FichaStage, StageSkills>;
  /** Elemento dominante da LEITURA (8 elementos do Oráculo — o mesmo que
   *  `oracle.ts` usa na bio do reveal). Achado do LOOP 2/3 da revisão do
   *  sistema de criação (28/09/2026): era calculado aqui (`oracleAxes`) e
   *  descartado — `computeClassTitle`, no fallback genérico do estágio sem
   *  arquétipo, escolhia o elemento dominante de um sistema DIFERENTE (os 17
   *  elementos do class-system, `Ficha.elementos`), sem nenhuma reconciliação
   *  com o que a bio já tinha dito. Resultado medido: em ~50% dos perfis
   *  sintéticos, a bio e o card da página do Pet nomeavam elementos
   *  OPOSTOS pra mesma criatura no estágio rookie (o mais visto de todos).
   *  Ver `elementoBaseDominante` em `classTitle.ts`. */
  dominantElement: string;
}

/**
 * Constrói a ficha dos 5 estágios e o par de skills de cada um. `seedKey` é a
 * identidade da pessoa (não o salt) — reroll não muda nada disto.
 */
export function buildFichaESkills(
  input: OracleInput,
  seedKey: string,
): FichaESkills {
  const oracleAxes = applyRitualAnswers(input.soulProfile!.oracle, input.answers, input.soulProfile!.psychometric.answeredCount > 0 ? 'longo' : 'curto');
  const fichaByStage = Object.fromEntries(
    FICHA_STAGE_ORDER.map(stage => [stage, buildFicha(input.fullName, oracleAxes, stage, seedKey)]),
  ) as Record<FichaStage, Ficha>;
  return {
    fichaByStage,
    stageSkills: buildAllStageSkills(fichaByStage, seedKey),
    dominantElement: oracleAxes.dominantElement,
  };
}
