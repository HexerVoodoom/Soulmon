// ---------------------------------------------------------------------------
// Pipeline completo do oráculo: leitura → distribuição → bestiário → criatura.
//
//   soulProfile (leitura)                       [profile.ts]
//     → ficha do class-system nos 5 estágios    [ficha/buildSheet.ts]
//     → companheiro capturável (mecânica real)  [ficha/capture.ts]
//     → criatura-inspiração do bestiário        [bestiary/select.ts]
//     → geração da criatura                     [../oracle.ts]
//
// A ficha e o companheiro são ESTÁVEIS por pessoa (seed = identidade, não
// salt): reroll troca a criatura, não quem a pessoa é. A inspiração do
// bestiário entra o salt — reroll re-sorteia dentro da mesma faixa alinhada.
//
// A inspiração alimenta a máquina de famílias por TEXTO (as menções de
// bicho na descrição), nunca por nome: o nome da criatura do bestiário não
// aparece em prompt de imagem nem em texto visível — há teste travando.
// ---------------------------------------------------------------------------

import { generateOracle } from '../oracle';
import type { OracleInput, OracleResult } from '../oracle';
import type { SoulProfile } from './profile';
import { buildFichaESkills } from './ficha/fromInput';
import { selectCompanion, type CapturaAvaliacao } from './ficha/capture';
import { FICHA_STAGE_ORDER, type Ficha, type FichaStage } from './ficha/types';
import { selectBestiaryLineage, type BestiaryPick } from './bestiary/select';
import type { StageSkills } from './ficha/skills';
import { applyRitualAnswers } from './ritualAnswers';
import { identityKey } from './identity';

export interface OracleComplete {
  result: OracleResult;
  /** A ficha do class-system em cada estágio de evolução. */
  fichaByStage: Record<FichaStage, Ficha>;
  /** Companheiro que a ficha rookie captura de verdade (ou null se nenhuma
   *  captura é legal — não acontece na prática, a simulação cobre). */
  companion: CapturaAvaliacao | null;
  /** A criatura do bestiário que inspirou a geração (= linhagem no 1º estágio). */
  bestiaryPick: BestiaryPick;
  /** Uma inspiração por estágio, encadeada por PROXIMIDADE DE ESPÉCIE: cada
   *  estágio pontua o pool com bônus de parentesco ao pick anterior (família,
   *  biologia, elementos, tamanho) — dragão tende a dragão, e a travessia só
   *  acontece com forte sobreposição dos outros aspectos. */
  bestiaryLineage: Record<FichaStage, BestiaryPick>;
  /** O par básica/especial de cada estágio, derivado da ficha (função da
   *  IDENTIDADE, como a ficha — reroll não troca as skills). */
  stageSkills: Record<FichaStage, StageSkills>;
}


/**
 * Gera o oráculo COMPLETO — exige `input.soulProfile` (o caminho legado, sem
 * perfil, continua sendo `generateOracle` puro e não passa por aqui).
 */
export function generateOracleComplete(input: OracleInput, seed?: number): OracleComplete {
  const soul: SoulProfile | undefined = input.soulProfile;
  if (!soul) throw new Error('generateOracleComplete exige soulProfile — use generateOracle para o caminho legado');

  const idKey = identityKey(input);
  const salt = seed ?? Math.floor(Math.random() * 0xffffffff);

  // Os eixos que alimentam TUDO o que vem daqui já levam as 6 respostas do
  // ritual — é a mesma leitura que o `generateOracle` usa para criar a
  // criatura. Sem isso, ficha, companheiro, skills e bestiário ficavam surdos
  // ao ritual (medido: respostas opostas davam resultado idêntico).
  const oracleAxes = applyRitualAnswers(soul.oracle, input.answers);

  // ficha + skills pela fonte única (a página do Pet consome a MESMA função)
  const { fichaByStage, stageSkills } = buildFichaESkills(input, idKey);

  const companion = selectCompanion(fichaByStage.rookie, idKey);

  const bestiaryLineage = selectBestiaryLineage(
    oracleAxes, `${idKey}|${salt}`, FICHA_STAGE_ORDER,
  ) as Record<FichaStage, BestiaryPick>;
  const bestiaryPick = bestiaryLineage[FICHA_STAGE_ORDER[0]];

  // O texto de inspiração é a DESCRIÇÃO com o nome da criatura removido —
  // o que sobra são as menções de bicho/matéria que a máquina de famílias
  // sabe ler. O nome fica só no bestiaryPick, para transparência interna.
  const nome = bestiaryPick.creature.nome;
  const texto = bestiaryPick.creature.descricao
    .split(new RegExp(nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'))
    .join(' ');

  const result = generateOracle({
    ...input,
    bestiaryInspiration: {
      texto,
      familia: bestiaryPick.creature.familia,
      biologia: bestiaryPick.creature.biologia,
    },
  }, salt);

  return { result, fichaByStage, companion, bestiaryPick, bestiaryLineage, stageSkills };
}
