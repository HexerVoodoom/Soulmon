// ---------------------------------------------------------------------------
// Banco de itens do teste de personalidade — 14 itens (eram 20 até 11/10/2026).
//
// Portado de `teste-personalidade/src/lib/personality/questions.ts`. A única
// mudança estrutural é a que o Soulmon exige de TODO texto de UI: cada
// enunciado e cada alternativa nasce em PT **e** EN (`LText`), em vez da string
// única em português da origem. A psicometria — quais itens existem, em que
// dimensão pontuam, o chaveamento direto/invertido e os pesos dos cenários —
// é idêntica, e é o que os testes travam.
//
// Por que 20 itens (resumo; a íntegra está em `docs/ORACULO.md`):
//
// - **Seis fatores, não cinco.** Big Five (Costa & McCrae, 1992; Goldberg,
//   1993) + Honestidade-Humildade do HEXACO (Ashton & Lee, 2007). O sexto
//   fator replica em estudos lexicais em várias línguas e separa "gentil" de
//   "íntegro" — distinção que importa quando a saída alimenta algo parecido
//   com alinhamento de criatura.
//
// - **Sem itens-espelho (11/10/2026, pedido do dono: "pergunta de confirmação
//   meio redundante, só pra verificar consistência"). ** Cada fator tem UM item
//   Likert; o invertido que só repetia a pergunta saiu. Custo assumido: sem
//   par, o índice de inconsistência fica em 0 e o de aquiescência deixa de
//   valer (o banco não é mais balanceado) — ambos só alimentavam um aviso na
//   OraclePage (ferramenta de criação), nunca o jogador nem a criatura.
//
// - **Formatos misturados.** Concordância Likert, escolha forçada (ipsativa)
//   para os 4 eixos junguianos, e 4 cenários situacionais escolhidos para que
//   a união deles ainda cubra os 6 fatores — os escores de fator não repousam
//   só nos 12 itens Likert.
//
// Os itens são paráfrases originais escritas contra as definições dos
// construtos citados. O pool público IPIP (Goldberg et al., 2006) serviu só de
// referência de estilo — nenhum texto de item foi copiado dele.
// ---------------------------------------------------------------------------

import type { ForcedChoiceItem, Item, LikertItem, ScenarioItem } from "./types";

const likert: LikertItem[] = [
  // Abertura
  {
    id: "O-ima-1", kind: "likert", dimension: "openness", facet: "imaginação", positive: true,
    text: {
      pt: "Passo bastante tempo imaginando cenários e possibilidades que ainda não existem.",
      en: "I spend a good deal of time imagining scenarios and possibilities that don't exist yet.",
    },
  },

  // Conscienciosidade
  {
    id: "C-org-1", kind: "likert", dimension: "conscientiousness", facet: "organização", positive: true,
    text: {
      pt: "Gosto que minhas coisas e meus compromissos estejam em ordem.",
      en: "I like my things and my commitments to be in order.",
    },
  },

  // Extroversão
  {
    id: "E-soc-1", kind: "likert", dimension: "extraversion", facet: "sociabilidade", positive: true,
    text: {
      pt: "Estar com bastante gente me deixa mais animado, não mais cansado.",
      en: "Being around a lot of people leaves me energized, not drained.",
    },
  },

  // Amabilidade
  {
    id: "A-coo-1", kind: "likert", dimension: "agreeableness", facet: "cooperação", positive: true,
    text: {
      pt: "Prefiro ceder um pouco a transformar uma divergência em briga.",
      en: "I'd rather give a little ground than turn a disagreement into a fight.",
    },
  },

  // Neuroticismo
  {
    id: "N-ans-1", kind: "frequency", dimension: "neuroticism", facet: "ansiedade", positive: true,
    text: {
      pt: "Com que frequência você se preocupa com coisas que talvez nem aconteçam?",
      en: "How often do you worry about things that may never happen?",
    },
  },

  // Honestidade-Humildade
  {
    id: "H-sin-1", kind: "likert", dimension: "honestyHumility", facet: "sinceridade", positive: true,
    text: {
      pt: "Não me sinto confortável em manipular alguém, mesmo que fosse dar certo.",
      en: "I'm not comfortable manipulating someone, even if it would work.",
    },
  },
];

/**
 * Um item de escolha forçada por eixo junguiano. As duas opções são escritas
 * para serem igualmente aceitáveis socialmente, então a escolha reflete
 * preferência e não qual resposta pega melhor. A opção A sempre pontua para o
 * primeiro polo (E, S, T, J).
 */
const forcedChoice: ForcedChoiceItem[] = [
  {
    id: "J-EI-1", kind: "forced-choice", dimension: "EI", facet: "fonte de energia",
    prompt: {
      pt: "Depois de uma semana pesada, o que te recompõe mais?",
      en: "After a heavy week, what restores you most?",
    },
    a: { text: { pt: "Sair e estar com gente de quem eu gosto", en: "Going out and being with people I like" } },
    b: { text: { pt: "Um tempo sozinho, no meu ritmo", en: "Time alone, at my own pace" } },
  },
  {
    id: "J-SN-1", kind: "forced-choice", dimension: "SN", facet: "foco perceptivo",
    prompt: {
      pt: "Ao avaliar uma proposta, você confia mais em:",
      en: "When weighing a proposal, you trust more in:",
    },
    a: { text: { pt: "Dados concretos e no que já foi testado na prática", en: "Hard data and what's already been tested in practice" } },
    b: { text: { pt: "No padrão que você percebe e no potencial que aquilo tem", en: "The pattern you notice and the potential you see in it" } },
  },
  {
    id: "J-TF-1", kind: "forced-choice", dimension: "TF", facet: "critério de decisão",
    prompt: {
      pt: "Numa decisão difícil que afeta outras pessoas, o que pesa mais?",
      en: "In a hard decision that affects other people, what weighs more?",
    },
    a: { text: { pt: "Qual opção é mais justa e coerente, olhando de fora", en: "Which option is fairest and most consistent, seen from outside" } },
    b: { text: { pt: "Como cada pessoa envolvida vai ser afetada", en: "How each person involved will be affected" } },
  },
  {
    id: "J-JP-1", kind: "forced-choice", dimension: "JP", facet: "estrutura",
    prompt: {
      pt: "Uma viagem ideal para você é:",
      en: "Your ideal trip is:",
    },
    a: { text: { pt: "Planejada, com roteiro e reservas feitas", en: "Planned, with an itinerary and bookings made" } },
    b: { text: { pt: "Em aberto, decidindo os próximos passos no caminho", en: "Open-ended, deciding the next steps along the way" } },
  },
];

/**
 * 4 itens situacionais, escolhidos para que a união dos `covers` ainda cubra as
 * 6 dimensões de traço — os escores de fator não repousam só nos itens Likert.
 */
const scenarios: ScenarioItem[] = [
  {
    id: "S-1", kind: "scenario",
    situation: {
      pt: "Seu grupo tem um trabalho importante para entregar e o combinado está desmoronando: ninguém fez a parte que prometeu e falta pouco tempo.",
      en: "Your group has an important deliverable and the plan is falling apart: nobody did the part they promised and there's little time left.",
    },
    covers: ["conscientiousness", "extraversion", "agreeableness", "neuroticism"],
    options: [
      {
        id: "a",
        text: { pt: "Assumo o comando, redistribuo as tarefas e cobro cada um.", en: "I take charge, redistribute the tasks and hold each person to them." },
        weights: { conscientiousness: 4, extraversion: 4, agreeableness: 1, neuroticism: 1 },
      },
      {
        id: "b",
        text: { pt: "Faço eu mesmo a parte que falta, sem criar atrito.", en: "I do the missing part myself, without creating friction." },
        weights: { conscientiousness: 4, extraversion: 1, agreeableness: 3, neuroticism: 2 },
      },
      {
        id: "c",
        text: { pt: "Chamo o grupo para conversar e entender o que travou cada um.", en: "I get the group talking to understand what blocked each of them." },
        weights: { conscientiousness: 2, extraversion: 3, agreeableness: 4, neuroticism: 1 },
      },
      {
        id: "d",
        text: { pt: "Fico ansioso, mas espero que alguém tome a frente.", en: "I get anxious, but wait for someone else to step up." },
        weights: { conscientiousness: 0, extraversion: 0, agreeableness: 2, neuroticism: 4 },
      },
    ],
  },
  {
    id: "S-2", kind: "scenario",
    situation: {
      pt: "Você recebe uma oferta para mudar de cidade por uma oportunidade promissora, mas incerta.",
      en: "You get an offer to move to another city for a promising but uncertain opportunity.",
    },
    covers: ["openness", "conscientiousness", "neuroticism"],
    options: [
      {
        id: "a",
        text: { pt: "Aceito rápido — a novidade em si já vale o risco.", en: "I accept fast — the newness alone is worth the risk." },
        weights: { openness: 4, conscientiousness: 1, neuroticism: 1 },
      },
      {
        id: "b",
        text: { pt: "Monto uma planilha, avalio cenários e decido com calma.", en: "I build a spreadsheet, weigh the scenarios and decide calmly." },
        weights: { openness: 3, conscientiousness: 4, neuroticism: 1 },
      },
      {
        id: "c",
        text: { pt: "Recuso: o que eu já construí aqui vale mais que a aposta.", en: "I decline: what I've built here is worth more than the bet." },
        weights: { openness: 1, conscientiousness: 3, neuroticism: 2 },
      },
      {
        id: "d",
        text: { pt: "Fico dias sem dormir pensando nisso e adio a resposta.", en: "I lose sleep over it for days and put off answering." },
        weights: { openness: 2, conscientiousness: 0, neuroticism: 4 },
      },
    ],
  },
  {
    id: "S-4", kind: "scenario",
    situation: {
      pt: "Um amigo próximo te conta uma decisão que você acha claramente equivocada.",
      en: "A close friend tells you about a decision you think is clearly a mistake.",
    },
    covers: ["agreeableness", "extraversion", "honestyHumility"],
    options: [
      {
        id: "a",
        text: { pt: "Falo com franqueza o que penso, mesmo que ele não queira ouvir.", en: "I say frankly what I think, even if they don't want to hear it." },
        weights: { agreeableness: 1, extraversion: 3, honestyHumility: 4 },
      },
      {
        id: "b",
        text: { pt: "Faço perguntas até ele mesmo enxergar os furos.", en: "I ask questions until they see the holes themselves." },
        weights: { agreeableness: 3, extraversion: 2, honestyHumility: 3 },
      },
      {
        id: "c",
        text: { pt: "Apoio a decisão dele — não é minha vida.", en: "I back their decision — it's not my life." },
        weights: { agreeableness: 4, extraversion: 1, honestyHumility: 2 },
      },
      {
        id: "d",
        text: { pt: "Concordo na frente dele e comento com outra pessoa depois.", en: "I agree to their face and bring it up with someone else later." },
        weights: { agreeableness: 2, extraversion: 2, honestyHumility: 0 },
      },
    ],
  },
  {
    id: "S-6", kind: "scenario",
    situation: {
      pt: "Você é criticado publicamente por algo em que se esforçou bastante.",
      en: "You're publicly criticized for something you worked hard on.",
    },
    covers: ["neuroticism", "agreeableness", "honestyHumility", "extraversion"],
    options: [
      {
        id: "a",
        text: { pt: "Rebato na hora e defendo meu trabalho.", en: "I push back on the spot and defend my work." },
        weights: { neuroticism: 2, agreeableness: 0, honestyHumility: 2, extraversion: 4 },
      },
      {
        id: "b",
        text: { pt: "Escuto, considero se há razão e respondo depois com calma.", en: "I listen, consider whether there's a point, and answer calmly later." },
        weights: { neuroticism: 1, agreeableness: 3, honestyHumility: 4, extraversion: 2 },
      },
      {
        id: "c",
        text: { pt: "Fico abalado e reviso tudo o que fiz procurando o erro.", en: "I'm shaken and go back over everything looking for the mistake." },
        weights: { neuroticism: 4, agreeableness: 3, honestyHumility: 3, extraversion: 1 },
      },
      {
        id: "d",
        text: { pt: "Não deixo transparecer nada e sigo como se não fosse comigo.", en: "I don't let anything show and carry on as if it weren't about me." },
        weights: { neuroticism: 2, agreeableness: 2, honestyHumility: 1, extraversion: 0 },
      },
    ],
  },
];

/**
 * A ordem de apresentação intercala os três formatos para que ninguém encare
 * uma sequência longa do mesmo tipo de pergunta.
 */
function interleave(): Item[] {
  const out: Item[] = [];
  const l = [...likert];
  const f = [...forcedChoice];
  const s = [...scenarios];
  let cycle = 0;
  while (l.length || f.length || s.length) {
    for (let i = 0; i < 3 && l.length; i++) out.push(l.shift()!);
    if (f.length) out.push(f.shift()!);
    if (cycle % 2 === 1 && s.length) out.push(s.shift()!);
    cycle++;
  }
  return out;
}

export const items: Item[] = interleave();
export const totalItems = items.length;

export const likertItems = likert;
export const forcedChoiceItems = forcedChoice;
export const scenarioItems = scenarios;
