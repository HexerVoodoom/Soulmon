// ---------------------------------------------------------------------------
// A VOZ do pet nos momentos que eram mudos (WP3.2).
//
// Concluir tarefa, esfregar, dar banho e terminar uma tarefa assombrada são os
// quatro gestos mais frequentes do app — e nenhum deles gerava fala. O pet
// falava sozinho a cada 3 min (idle) e quando RECUSAVA comida: ou seja, ele
// tinha voz para dizer "não" e não tinha para dizer "que bom".
//
// As frases moram AQUI, e não dentro do componente, por dois motivos:
//  1. o teste precisa varrer todas elas atrás de culpa — e um teste que lê JSX
//     lê o que consegue, não o que existe;
//  2. o desktop herda a mesma voz sem uma segunda implementação (footgun 9).
//
// REGRA DE TOM, e ela é o produto: nenhuma frase cobra. Nada de "deveria",
// "atrasou", "falhou", "esqueceu", "de novo". A tarefa assombrada concluída é
// ALÍVIO, não acerto de contas — a pilha de culpa vira loop de jogo com
// recompensa, que é a peça mais Soulmon do plano. Há teste travando as
// palavras proibidas em PT e EN.
//
// Sem emoji nas frases: quem fala é `speak()`, que os remove de qualquer jeito
// (`speakRaw()` preserva, e é para "+1⚡", não para frase).
// ---------------------------------------------------------------------------

export type PetVoiceKind = 'task' | 'haunted' | 'rub' | 'shower' | 'milestone' | 'cheer' | 'rare';

/**
 * WP2.14 — a taxa da fala rara. ~5% das conclusões.
 *
 * ⚠️ **A taxa NUNCA vira alavanca.** Ela não é ajustável por evento, não sobe
 * com nada e não desce com nada — se um dia virar botão de engajamento, é uma
 * recompensa variável de valor zero sendo usada como isca, que é o desenho
 * que este produto recusa. Vale zero de propósito: o prêmio é a frase.
 */
export const RARE_CHEER_RATE = 0.05;

/** `pick` é 0..1 (o chamador passa `Math.random()`). PURA para o teste poder
 *  provar que a recompensa é idêntica com e sem o sorteio. */
export function rolledRareCheer(pick: number): boolean {
  return pick < RARE_CHEER_RATE;
}

export interface PetVoiceSignal {
  /** Contador que só cresce — o padrão de `feedAnim`/`fullSignal`. */
  n: number;
  kind: PetVoiceKind;
}

interface VoiceLines { pt: string[]; en: string[] }

export const PET_VOICE_LINES: Record<PetVoiceKind, VoiceLines> = {
  task: {
    pt: ['Mais uma fora da sua cabeça!', 'Você fez. Eu vi.', 'Isso conta, viu?'],
    en: ['One more out of your head!', 'You did it. I saw.', 'That counts, you know.'],
  },
  // A que estava te olhando. O alívio é o prêmio — nada de "finalmente".
  haunted: {
    pt: [
      'Aquela que estava te olhando... foi. Respira.',
      'Essa era pesada. Agora ela é só passado.',
      'Ficou leve aqui. Deve ter ficado aí também.',
    ],
    en: [
      'The one that was watching you... is gone. Breathe.',
      'That one was heavy. Now it is just past.',
      'It got lighter in here. Probably out there too.',
    ],
  },
  rub: {
    pt: ['Ahh, isso é bom...', 'Fica mais um pouquinho?', 'Eu gosto de quando você aparece.'],
    en: ['Ahh, that feels good...', 'Stay a little longer?', 'I like it when you show up.'],
  },
  shower: {
    pt: ['Limpinho!', 'Água boa, hein.', 'Agora sim.'],
    en: ['All clean!', 'That water was nice.', 'Much better.'],
  },
  /* WP2.13 — os dias do meio do caminho (`HABIT_CHEER_AT`). Entre o marco de
     21 e o de 66 há quarenta e cinco dias em que nada acontece, e é ali que a
     maioria para. Estas falas não valem NADA — se valessem, teriam virado
     marco por acidente. E nenhuma diz quanto falta: o número que falta é a
     conta que transforma constância em cobrança. */
  cheer: {
    pt: ['Esse aí você não larga, né?', 'Já virou parte do dia.', 'Continua acontecendo. Gosto disso.'],
    en: ['You keep coming back to this one, huh?', 'It became part of the day.', 'It keeps happening. I like that.'],
  },
  /* WP2.14 — a fala RARA. Aparece em ~5% das conclusões e não é anunciada em
     lugar nenhum: sem contador, sem "raro!", sem coleção. Uma surpresa que
     tem medidor deixa de ser surpresa e vira mais uma barra para encher.
     Valor material: ZERO, e há teste. */
  rare: {
    pt: ['Ei… hoje você me parece diferente. Do bem.', 'Guardei esse momento.', 'Acho que estou orgulhoso. É isso?'],
    en: ['Hey… you seem different today. In a good way.', 'I kept this moment.', 'I think I am proud. Is that it?'],
  },
  milestone: {
    pt: ['Olha o tamanho disso agora!', 'Isso aqui virou raiz.', 'Você repetiu tanto que virou seu.'],
    en: ['Look how big this got!', 'This one has roots now.', 'You repeated it enough that it is yours.'],
  },
};

/**
 * WP3.10 — O TRAÇO DE NASCIMENTO NA VOZ.
 *
 * Todo pet nasce com um traço sorteado (`utils/passives.ts`) e ele só existia
 * como EFEITO de regra e uma linha em Estatísticas. Dois pets do mesmo estágio
 * se comportam diferente e falavam exatamente igual — o traço era invisível
 * justamente no canal em que personalidade aparece.
 *
 * Uma fala por traço, por gesto. Substitui a genérica quando existe; onde não
 * existe, a genérica continua valendo (nada de preencher a matriz inteira só
 * para ela existir — frase forçada lê como enchimento).
 *
 * ⚠️ O traço é lido do ESTADO, nunca por parâmetro novo: é isso que faz o
 * desktop herdar sem uma segunda implementação (a mesma regra dos passivos).
 */
const TRAIT_LINES: Partial<Record<string, Partial<Record<PetVoiceKind, VoiceLines>>>> = {
  guloso: {
    task: {
      pt: ['Fez! Isso vira comida, né?', 'Boa! Já deu fome.'],
      en: ['Done! That turns into food, right?', 'Nice! I am hungry already.'],
    },
  },
  carinhoso: {
    rub: {
      pt: ['Não para, não para…', 'Isso aqui é a melhor parte do dia.'],
      en: ['Do not stop, do not stop…', 'This is the best part of the day.'],
    },
  },
  teimoso: {
    haunted: {
      pt: ['Eu sabia que você ia encarar essa.', 'Essa aí resistiu. Você resistiu mais.'],
      en: ['I knew you would face that one.', 'That one held on. You held on longer.'],
    },
  },
  sortudo: {
    rare: {
      pt: ['Hoje o dia está do nosso lado. Sinto isso.', 'Tem alguma coisa boa no ar.'],
      en: ['Today is on our side. I can feel it.', 'There is something good in the air.'],
    },
  },
  madrugador: {
    shower: {
      pt: ['Limpo e acordado. Assim que se faz.', 'Pronto pro dia inteiro.'],
      en: ['Clean and awake. That is how it is done.', 'Ready for the whole day.'],
    },
  },
};

/**
 * Escolhe a frase. `pick` entra por parâmetro (0..1) para o teste ser
 * determinístico sem precisar mexer no `Math.random` global — o chamador em
 * runtime passa `Math.random()`.
 */
export function petVoiceLine(
  kind: PetVoiceKind,
  isPt: boolean,
  pick: number,
  /** WP3.10 — `petPassive` do estado. Sem traço, ou sem fala para este gesto,
   *  cai na genérica: matriz cheia por obrigação vira enchimento. */
  trait?: string,
): string {
  const doTraco = trait ? TRAIT_LINES[trait]?.[kind] : undefined;
  const linhas = (doTraco ?? PET_VOICE_LINES[kind])[isPt ? 'pt' : 'en'];
  const i = Math.min(linhas.length - 1, Math.max(0, Math.floor(pick * linhas.length)));
  return linhas[i];
}
