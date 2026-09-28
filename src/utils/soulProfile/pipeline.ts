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

import { generateOracleAsync } from '../oracle';
import type { OracleInput, OracleInputWithClass, OracleResult } from '../oracle';
import type { SoulProfile } from './profile';
import { buildFichaESkills } from './ficha/fromInput';
import { selectCompanion, type CapturaAvaliacao } from './ficha/capture';
import { FICHA_STAGE_ORDER, type Ficha, type FichaStage } from './ficha/types';
import { selectBestiaryLineage, type BestiaryPick } from './bestiary/select';
import type { StageSkills } from './ficha/skills';
import { computeClassTitle } from './ficha/classTitle';
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
 * perfil, continua sendo `generateOracle` puro e não passa por aqui). Async
 * por causa da classe (`ficha/classTitle.ts` chama o motor real do
 * class-system por import dinâmico) — os dois call sites reais já rodam
 * dentro de `await import('../utils/soulProfile')`, então só ganham um
 * `await` a mais.
 */
/** A BASE de um nome do bestiário — tira o prefixo procedural e o elemento.
 *  Mesma forma que `scripts/bestiario-procedencia.mjs` usa para filtrar; aqui
 *  é só para o prompt, então é uma regex local e não um import de script de
 *  build (o bundle não carrega `scripts/`). */
function baseDeInspiracao(nome: string): string {
  const m = /^(?:Titânico|Espiritual|Cristalino|Corrompido|Ancião)\s+(.+?)\s+de\s+\S+$/.exec(nome);
  return (m ? m[1] : nome).trim();
}

export async function generateOracleComplete(input: OracleInput, seed?: number): Promise<OracleComplete> {
  const soul: SoulProfile | undefined = input.soulProfile;
  if (!soul) throw new Error('generateOracleComplete exige soulProfile — use generateOracleAsync para o caminho legado');

  const idKey = identityKey(input);
  const salt = seed ?? Math.floor(Math.random() * 0xffffffff);

  // Os eixos que alimentam TUDO o que vem daqui já levam as 6 respostas do
  // ritual — é a mesma leitura que o `generateOracle` usa para criar a
  // criatura. Sem isso, ficha, companheiro, skills e bestiário ficavam surdos
  // ao ritual (medido: respostas opostas davam resultado idêntico).
  const oracleAxes = applyRitualAnswers(soul.oracle, input.answers, soul.psychometric.answeredCount > 0 ? 'longo' : 'curto');

  // ficha + skills pela fonte única (a página do Pet consome a MESMA função)
  const { fichaByStage, stageSkills } = buildFichaESkills(input, idKey);

  // A captura é avaliada na ficha MEGA — a mesma mecânica real (Evocação +
  // afinidade elemental contra `poderBase`), mas sobre a alma já
  // concentrada. ⚠️ Até 28/09/2026 era a ficha ROOKIE: com o orçamento do
  // primeiro estágio só criaturas de `poderBase` baixo eram capturáveis, e o
  // Loop A (N=400) mediu 12 das 32 criaturas do registro como companheiro de
  // alguém, 5 delas cobrindo 80%. Na mega: 32/32, top 5 = 22%.
  const companion = selectCompanion(fichaByStage.mega, idKey);

  const bestiaryLineage = selectBestiaryLineage(
    oracleAxes, `${idKey}|${salt}`, FICHA_STAGE_ORDER,
  ) as Record<FichaStage, BestiaryPick>;
  const bestiaryPick = bestiaryLineage[FICHA_STAGE_ORDER[0]];

  // O texto de inspiração é a DESCRIÇÃO com o nome removido — o que sobra são
  // as menções de bicho/matéria que a máquina de famílias sabe ler.
  const nome = bestiaryPick.creature.nome;
  const texto = bestiaryPick.creature.descricao
    .split(new RegExp(nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'))
    .join(' ');

  /* ⚠️ **O NOME passou a ir NO PROMPT em 27/09/2026 (D-B1, decisão do dono).**
   *
   * Até aqui ele era deliberadamente retido ("o nome fica só no bestiaryPick,
   * para transparência interna") e `pipeline.test.ts` travava a ausência dele
   * nos 11 prompts. O dono decidiu o contrário **sabendo do risco de direito
   * autoral**, e o desenho que ele pediu é este: tenta COM o nome; se o
   * provedor recusar, a 2ª tentativa vai sem.
   *
   * Duas coisas que fazem isso NÃO ser "pedir uma cópia", e que não podem cair
   * junto:
   *   1. o nome entra só em `imagePrompt`. O `imagePromptFallback` segue
   *      limpo, e é ele que `functions/api/generate-sprite.js` usa quando
   *      `isRefusal` reconhece a recusa do provedor. **Quem decide o limite é
   *      o provedor**, não uma lista nossa;
   *   2. a cláusula `Do not copy any existing franchise character` continua
   *      nas DUAS variantes (`oracle.ts` › `composeSpritePrompt`). Citar de
   *      onde veio a inspiração não é licença para devolver personagem
   *      registrado.
   *
   * Vai a BASE, não o nome procedural inteiro: "Ocapi (Okapia johnstoni)" é
   * dica de desenho; "Titânico Ocapi (Okapia johnstoni) de Água" só gasta
   * prompt com o prefixo e o elemento, que já estão descritos em outro lugar.
   */
  const nomeInspiracao = baseDeInspiracao(nome);

  // ⚠️ Achado de 28/09/2026: a linhagem inteira (um pick por estágio,
  // encadeado por proximidade de espécie) já era calculada aqui e descartada
  // — nada em `generateOracle` recebia mais que o pick do estágio 0. Agora a
  // base de cada estágio (mesma extração de nome que o estágio 0 já usa) vai
  // junto, para variar só o `imagePrompt` de champion/perfeito/mega/ultra —
  // nome, família e identidade continuam fixos pelo estágio 0.
  const bestiaryLineageNomes = {
    rookie: nomeInspiracao,
    champion: baseDeInspiracao(bestiaryLineage.champion.creature.nome),
    perfeito: baseDeInspiracao(bestiaryLineage.ultimate.creature.nome),
    mega: baseDeInspiracao(bestiaryLineage.mega.creature.nome),
    ultra: baseDeInspiracao(bestiaryLineage.ultra.creature.nome),
  };

  // Classe REAL só como ingrediente extra do prompt de sprite — nunca em
  // texto que o jogador vê (nome/bio/descrição por forma continuam sem
  // tocar nisso). Usa a ficha ULTRA (a mais concentrada; mede 100% de
  // arquétipo pleno) e só entra quando o arquétipo é PLENO — o fallback
  // genérico ("Adept of X") não acrescenta nada que `dominantClass` já não
  // desse. Falha aqui nunca pode derrubar a geração inteira.
  let promptClassFlavor: string | undefined;
  try {
    const classe = await computeClassTitle(fichaByStage.ultra, oracleAxes.dominantElement);
    if (classe.origem === 'arquetipo') promptClassFlavor = classe.nome.en;
  } catch {
    // sem o traço extra — o prompt de 3 traços já funcionava sozinho
  }

  const entrada: OracleInputWithClass = {
    ...input,
    bestiaryInspiration: {
      texto,
      familia: bestiaryPick.creature.familia,
      biologia: bestiaryPick.creature.biologia,
      nome: nomeInspiracao,
    },
    bestiaryLineageNomes,
    // Achado do LOOP 1 (28/09/2026): `companion` já era calculado por
    // `selectCompanion` acima e nunca chegava ao jogador — agora vira a
    // última frase da bio (via `companionName`), só quando a captura de
    // verdade da mecânica (Evocação + afinidade elemental) achou alguém.
    companionName: companion ? companion.criatura.nome : undefined,
    promptClassFlavor,
  };
  const result = await generateOracleAsync(entrada, salt);

  return { result, fichaByStage, companion, bestiaryPick, bestiaryLineage, stageSkills };
}
