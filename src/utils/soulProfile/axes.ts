// ---------------------------------------------------------------------------
// Eixos do oráculo a partir do perfil de alma.
//
// Portado de `teste-personalidade/src/lib/oracle/generate.ts`. É a peça que
// SUBSTITUI a metade "leitura" do `oracle.ts`: onde antes 8 elementos, 5
// papéis, 3 alinhamentos e 9 reinos saíam de um punhado de baldes discretos
// (signo solar, ascendente aproximado pela hora, animal chinês, rashi, 4
// números e 6 perguntas de quiz), agora saem de traços contínuos 0-100 do Big
// Five + HEXACO, dos eixos junguianos, da distribuição REAL do mapa astral e
// de 6 números da numerologia completa.
//
// Toda fórmula abaixo é uma soma ponderada documentada e determinística — sem
// RNG, ao contrário do desempate por hash do `oracle.ts` original, porque aqui
// os insumos já são contínuos.
//
// As tabelas de afinidade (`NUMBER_ELEMENTS`, `NUMBER_ROLES`,
// `NUMBER_ALIGNMENT`, `ROLE_ALIGNMENT`, `REALM_WEIGHTS`) são IMPORTADAS do
// `oracle.ts` de propósito: são vocabulário do jogo, não deste motor, e uma
// segunda cópia divergiria em silêncio (footgun 9 do CLAUDE.md).
// ---------------------------------------------------------------------------

import {
  ALIGNMENT_ORDER, ELEMENT_ORDER, REALM_ORDER, ROLE_ORDER,
  NUMBER_ALIGNMENT, NUMBER_ELEMENTS, NUMBER_ROLES, REALM_WEIGHTS, ROLE_ALIGNMENT,
  hashString,
  type AlignmentId, type ElementId, type RealmId, type RoleId,
} from '../oracle';
import { computeDominantClassElements } from './derivedElements';
import { CLASS_ELEMENT_ORDER, type ClassElementId, type OracleAxes } from './types';

export interface OracleAxesInput {
  /** Escores 0-100 dos fatores do Big Five + HEXACO. */
  traits: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
    honestyHumility: number;
  };
  /** Escores 0-100 por faceta, chaveados "dimensão:faceta" — as mesmas chaves
   *  de `TraitScore.facets`. Opcional; cai no escore do traço-pai. */
  facets?: Record<string, number>;
  /** 0-100 na direção do PRIMEIRO polo de cada eixo (E, S, T, J). */
  jung: { EI: number; SN: number; TF: number; JP: number };
  /** Somas ponderadas cruas de elemento do mapa astral (`distribution.elements`). */
  astrologyElements: { fogo: number; terra: number; ar: number; 'água': number };
  /** Somas ponderadas cruas de polaridade (`distribution.polarities`). */
  astrologyPolarities: { diurno: number; noturno: number };
  /** Números centrais da numerologia lidos para afinidade de elemento/papel/
   *  alinhamento (caminho de vida, expressão, motivação, impressão, dia
   *  natalício, maturidade). */
  numerologyNumbers: number[];
}

function facet(inputs: OracleAxesInput, dimension: string, name: string, fallback: number): number {
  return inputs.facets?.[`${dimension}:${name}`] ?? fallback;
}

/**
 * Encolhe um eixo junguiano na direção do meio.
 *
 * Cada eixo (EI/SN/TF/JP) é medido por UM único item de escolha forçada, então
 * o escore nunca é um meio-termo: é exatamente 0 ou 100. Os coeficientes das
 * fórmulas abaixo foram calibrados assumindo variação contínua, como a dos
 * traços — com um insumo binário, o mesmo coeficiente vira um interruptor que
 * move o eixo em dezenas de pontos por causa de uma pergunta só.
 *
 * Medido: `alcance` (que carrega `jung.TF * 0.3`) e `magico` (que carrega dois
 * termos junguianos) venciam juntos 66% dos perfis numa simulação de 400,
 * contra 40% de linha de base para dois papéis entre cinco — pior que o
 * oráculo LEGADO, que ficava em 34%.
 *
 * Encolher pela metade preserva a MÉDIA do termo (o valor esperado de um
 * binário 0/100 continua 50) e corta o salto pela metade. O sinal continua
 * valendo; ele só para de decidir sozinho. Quando um formulário mais longo
 * tiver vários itens por eixo, o escore volta a ser contínuo e este
 * amortecedor pode subir para 1.
 */
const JUNG_DAMPING = 0.5;
function soft(axisScore: number): number {
  return 50 + (axisScore - 50) * JUNG_DAMPING;
}

/** Reescala um registro para que os valores somem 100, preservando zeros. */
function toShare<K extends string>(record: Record<K, number>, order: K[]): Record<K, number> {
  const total = order.reduce((sum, k) => sum + Math.max(0, record[k]), 0);
  if (total <= 0) {
    return Object.fromEntries(order.map((k) => [k, 100 / order.length])) as Record<K, number>;
  }
  return Object.fromEntries(
    order.map((k) => [k, Number(((Math.max(0, record[k]) / total) * 100).toFixed(2))])
  ) as Record<K, number>;
}

function argmax<K extends string>(record: Record<K, number>, order: K[]): K {
  return order.reduce((best, k) => (record[k] > record[best] ? k : best), order[0]);
}

/**
 * Constrói os eixos do oráculo a partir das leituras psicométrica, junguiana,
 * astrológica e numerológica.
 *
 * Os coeficientes abaixo foram calibrados empiricamente (simulação de 2000
 * perfis), não no olho: o critério é que nenhum elemento/papel/alinhamento/
 * reino tenha vantagem ESTRUTURAL sobre os outros — quem vence tem que vencer
 * pela pessoa, não pela forma da fórmula. Os comentários registram cada
 * assimetria encontrada e o que a corrigiu; mexer num coeficiente sem refazer
 * a simulação reabre exatamente o buraco que ele fechou.
 */
export function generateOracleAxes(inputs: OracleAxesInput): OracleAxes {
  const { traits, jung, astrologyElements, astrologyPolarities, numerologyNumbers } = inputs;

  // ---- Elementos: a divisão de elementos do próprio mapa astral é o sinal
  // primário dos quatro elementos com que ele divide o nome; os traços entram
  // como empurrão secundário, que é o que deixa duas pessoas igualmente
  // "terra" no mapa registrarem curiosidade/organização diferentes.
  //
  // Atenção: agua/fogo/terra/ar dividem UM pool astrológico de 60 pontos entre
  // os 4 (média ~15 cada, não 60), enquanto sombra/luz/planta/industrial
  // puxam cada um de termos de traço independentes e não compartilhados.
  // sombra/luz empilhavam ainda um bônus de polaridade (até 20) EM CIMA de um
  // termo de traço de peso cheio (até 60), o que lhes dava teto e média
  // estruturalmente maiores que os de todo mundo — e isso, combinado com o
  // peso de `akasha` ser exatamente `{ luz: 3, sombra: 3 }` (o único reino que
  // dobra dois elementos a peso cheio), fazia akasha vencer uma fatia
  // desproporcional dos perfis independentemente da pessoa.
  const astroTotal =
    astrologyElements.fogo + astrologyElements.terra + astrologyElements.ar + astrologyElements['água'] || 1;
  // ar e terra têm a mesma forma de fórmula que agua/fogo, mas NUMBER_ELEMENTS
  // dá ao ar um bônus primário (+6) em 2 dos 12 números (3 e 5) contra 1 do
  // terra (4) — assimetria real da tabela (copiada, e de resto intocada) que
  // puxava ar acima de terra na simulação. Compensado nos coeficientes de
  // traço, não mexendo na tabela de numerologia.
  const elements: Record<ElementId, number> = {
    agua: (astrologyElements['água'] / astroTotal) * 60 + traits.agreeableness * 0.4,
    fogo: (astrologyElements.fogo / astroTotal) * 60 + traits.extraversion * 0.4,
    terra: (astrologyElements.terra / astroTotal) * 60 + traits.conscientiousness * 0.47,
    ar: (astrologyElements.ar / astroTotal) * 60 + traits.openness * 0.35,
    sombra: traits.neuroticism * 0.45 + (100 - traits.honestyHumility) * 0.15 +
      (astrologyPolarities.noturno / (astrologyPolarities.diurno + astrologyPolarities.noturno || 1)) * 12,
    luz: traits.honestyHumility * 0.45 +
      (astrologyPolarities.diurno / (astrologyPolarities.diurno + astrologyPolarities.noturno || 1)) * 12 +
      traits.agreeableness * 0.15,
    planta: traits.agreeableness * 0.4 +
      facet(inputs, 'conscientiousness', 'persistência', traits.conscientiousness) * 0.4,
    // Este teste define UMA faceta por traço ("organização" para
    // conscienciosidade — ver questions.ts), então "prudência" sempre cai no
    // mesmo traits.conscientiousness de que "organização" já é derivada.
    // Empilhar os dois termos nesse único traço (0.5+0.3) dava ao industrial
    // quase o dobro do peso efetivo de traço único de todos os outros
    // elementos, e ele vencia o argmax ~31% das vezes numa simulação de 2000
    // perfis (esperado ~12,5%). Misturar jung.JP ("estrutura" — tematicamente
    // o mesmo sinal organizado/metódico, mas insumo genuinamente
    // independente) espalha esse peso por duas fontes não correlacionadas em
    // vez de contar a mesma duas vezes.
    industrial: facet(inputs, 'conscientiousness', 'organização', traits.conscientiousness) * 0.5 +
      soft(jung.JP) * 0.25,
  };
  // Bônus primário/secundário da numerologia, espelhando o próprio
  // `addScore(primary, pts); addScore(secondary, 1)` do oracle.ts — dar +6 aos
  // dois deixava "luz" (primário OU secundário em 6 dos 12 números, o dobro de
  // qualquer outro) ainda mais desproporcionalmente provável de dominar.
  for (const n of numerologyNumbers) {
    const [primary, secondary] = NUMBER_ELEMENTS[n] ?? [];
    if (primary) elements[primary] += 6;
    if (secondary) elements[secondary] += 1;
  }

  // ---- Papéis: físico/tanque/alcance reaproveitam a mesma divisão
  // astrológica que move fogo/terra/ar/água — o oracle.ts faz o mesmo via
  // elemento do signo → papel. Mágico, em vez disso, segue Abertura e o eixo
  // Sensação↔iNtuição (100 − SN, já que SN pontua na direção de Sensação).
  //
  // "prudência" e "assertividade" não são facetas que este teste coleta (só
  // existe uma por traço), então todo uso delas cai no escore do traço. Tudo
  // bem onde o papel mistura sinais não relacionados, mas suporte/tanque/
  // fisico apoiavam-se cada um num único traço com coeficiente (0.7/0.5/0.6)
  // bem acima do maior do magico (0.4), o que lhes dava variância maior e os
  // fazia vencer o argmax muito acima da linha de base de 1 em 5 (suporte
  // ~29%, tanque ~25%, magico ~9,5%). Nenhum termo primário passa de ~0.45.
  const roles: Record<RoleId, number> = {
    suporte: traits.agreeableness * 0.45 + (astrologyElements['água'] / astroTotal) * 30 +
      (100 - traits.honestyHumility) * 0.1,
    tanque: facet(inputs, 'conscientiousness', 'prudência', traits.conscientiousness) * 0.35 +
      (100 - traits.neuroticism) * 0.3 + (astrologyElements.terra / astroTotal) * 20,
    fisico: facet(inputs, 'extraversion', 'assertividade', traits.extraversion) * 0.55 +
      (astrologyElements.fogo / astroTotal) * 40,
    // Ao contrário dos outros 4, magico não tem termo astrológico diluindo-o
    // (fisico/tanque/alcance/suporte misturam uma fatia COMPARTILHADA, que na
    // média fica bem abaixo do próprio máximo por ser dividida em 4) — então
    // seus 3 termos independentes somavam peso cheio (1.0) e superavam
    // estruturalmente todos os outros papéis na média.
    magico: traits.openness * 0.4 + soft(100 - jung.SN) * 0.22 + soft(100 - jung.JP) * 0.13,
    // O termo astro_ar do alcance compõe com o próprio bônus de ar na tabela
    // de elementos, e ar é o alvo primário/secundário mais frequente da
    // numerologia — então alcance pegava carona nesse mesmo sinal correlato.
    alcance: facet(inputs, 'conscientiousness', 'prudência', traits.conscientiousness) * 0.4 +
      soft(jung.TF) * 0.3 + (astrologyElements.ar / astroTotal) * 25,
  };
  for (const n of numerologyNumbers) {
    roles[NUMBER_ROLES[n]] += 4;
  }

  // ---- Alinhamento: o papel puxa para o alinhamento que o oracle.ts já mapeia
  // para ele; Extroversão/assertividade reforça Poder, Honestidade-Humildade
  // baixa (busca de status) reforça mais, e Abertura reforça Harmonia.
  //
  // ROLE_ALIGNMENT manda 2 papéis para harmonia, 2 para benevolencia e só 1
  // (fisico) para poder — somar os escores crus dos papéis dava a poder
  // aproximadamente metade do sinal derivado de papel dos outros dois,
  // independentemente da pessoa (poder vencia ~20% contra 43% da benevolencia,
  // para 3 opções com linha de base ~33%). Dividir pela quantidade de papéis
  // que alimentam cada alinhamento remove essa assimetria de contagem.
  const rolesPerAlignment: Record<AlignmentId, number> = { poder: 0, harmonia: 0, benevolencia: 0 };
  for (const role of ROLE_ORDER) rolesPerAlignment[ROLE_ALIGNMENT[role]]++;
  const alignments: Record<AlignmentId, number> = { poder: 0, harmonia: 0, benevolencia: 0 };
  for (const role of ROLE_ORDER) {
    const target = ROLE_ALIGNMENT[role];
    alignments[target] += (roles[role] * 0.5) / rolesPerAlignment[target];
  }
  // Com o termo de papel já sem divisão, os bônus de poder passavam dos outros
  // dois — aparados, e o de benevolencia subido para compensar a amabilidade
  // ser um dos sinais de papel "macios" (diluídos pelo astro).
  alignments.poder += facet(inputs, 'extraversion', 'assertividade', traits.extraversion) * 0.2 +
    (100 - traits.honestyHumility) * 0.15;
  alignments.harmonia += traits.openness * 0.3;
  alignments.benevolencia += traits.agreeableness * 0.4;
  for (const n of numerologyNumbers) {
    alignments[NUMBER_ALIGNMENT[n]] += 4;
  }

  // ---- Reinos: escore dos elementos pela tabela de geografia do mundo do
  // próprio Soulmon, mais o mesmo tipo de "assinatura" determinística por
  // pessoa que o oracle.ts adiciona (`hashString(...) % 4`) — sem ela, todo
  // mundo cujos escores de elemento caem num formato parecido (comum, já que
  // vários reinos compartilham elementos) converge para o MESMO reino sempre;
  // a assinatura quebra isso sem tornar o resultado menos determinístico.
  const inputKey = JSON.stringify(inputs);
  const realms: Record<RealmId, number> = Object.fromEntries(
    REALM_ORDER.map((realm) => {
      const score = Object.entries(REALM_WEIGHTS[realm]).reduce(
        (sum, [el, weight]) => sum + (weight ?? 0) * elements[el as ElementId],
        0
      );
      return [realm, score + (hashString(`${inputKey}|${realm}`) % 4)];
    })
  ) as Record<RealmId, number>;

  // ---- Ponte com o class-system: os 6 elementos de nome compartilhado são
  // copiados direto; os outros 11 não têm sinal ancorado nos dados e ficam num
  // piso pequeno, para que quem consome consiga distinguir "não modelado"
  // (isto) de "modelado e pontuou zero" sem divisão por zero.
  const classElements: Record<ClassElementId, number> = {
    fogo: elements.fogo, agua: elements.agua, terra: elements.terra, ar: elements.ar,
    sombra: elements.sombra, luz: elements.luz,
    eletricidade: 5, arcano: traits.openness * 0.15 + soft(100 - jung.SN) * 0.1,
    vileza: (100 - traits.honestyHumility) * 0.15, morte: traits.neuroticism * 0.1,
    vida: traits.agreeableness * 0.15, vigor: traits.conscientiousness * 0.1,
    marcial: facet(inputs, 'extraversion', 'assertividade', traits.extraversion) * 0.15,
    tempo: 5, som: 5, gravidade: 5, espaco: 5,
  };

  const sharedClassElements = toShare(classElements, CLASS_ELEMENT_ORDER);

  return {
    elements: toShare(elements, ELEMENT_ORDER),
    roles: toShare(roles, ROLE_ORDER),
    alignments: toShare(alignments, ALIGNMENT_ORDER),
    realms: toShare(realms, REALM_ORDER),
    classElements: sharedClassElements,
    dominantElement: argmax(elements, ELEMENT_ORDER),
    dominantRole: argmax(roles, ROLE_ORDER),
    dominantAlignment: argmax(alignments, ALIGNMENT_ORDER),
    dominantRealm: argmax(realms, REALM_ORDER),
    dominantClassElements: computeDominantClassElements(sharedClassElements),
  };
}
