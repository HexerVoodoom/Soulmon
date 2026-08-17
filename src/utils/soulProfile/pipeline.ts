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

import { generateOracle, hashString, normalizeName } from '../oracle';
import type { OracleInput, OracleResult } from '../oracle';
import type { SoulProfile } from './profile';
import { buildFicha } from './ficha/buildSheet';
import { selectCompanion, type CapturaAvaliacao } from './ficha/capture';
import { FICHA_STAGE_ORDER, type Ficha, type FichaStage } from './ficha/types';
import { selectBestiaryLineage, type BestiaryPick } from './bestiary/select';
import { buildAllStageSkills, type StageSkills } from './ficha/skills';

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

/** Identidade estável da pessoa — mesma pessoa, mesma ficha, com ou sem
 *  reroll. NÃO inclui o salt de propósito. */
function identityKey(input: OracleInput): string {
  return [
    normalizeName(input.fullName), input.birthDate, input.birthTime,
    input.birthPlace.trim().toLowerCase(),
    JSON.stringify(input.soulProfile?.psychometric.traitPoints ?? input.answers ?? {}),
  ].join('|');
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

  const fichaByStage = Object.fromEntries(
    FICHA_STAGE_ORDER.map(stage => [stage, buildFicha(input.fullName, soul.oracle, stage, idKey)])
  ) as Record<FichaStage, Ficha>;

  const companion = selectCompanion(fichaByStage.rookie, idKey);

  const stageSkills = buildAllStageSkills(fichaByStage, idKey);

  const bestiaryLineage = selectBestiaryLineage(
    soul.oracle, `${idKey}|${salt}`, FICHA_STAGE_ORDER,
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
