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

export type PetVoiceKind = 'task' | 'haunted' | 'rub' | 'shower' | 'milestone';

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
  milestone: {
    pt: ['Olha o tamanho disso agora!', 'Isso aqui virou raiz.', 'Você repetiu tanto que virou seu.'],
    en: ['Look how big this got!', 'This one has roots now.', 'You repeated it enough that it is yours.'],
  },
};

/**
 * Escolhe a frase. `pick` entra por parâmetro (0..1) para o teste ser
 * determinístico sem precisar mexer no `Math.random` global — o chamador em
 * runtime passa `Math.random()`.
 */
export function petVoiceLine(kind: PetVoiceKind, isPt: boolean, pick: number): string {
  const linhas = PET_VOICE_LINES[kind][isPt ? 'pt' : 'en'];
  const i = Math.min(linhas.length - 1, Math.max(0, Math.floor(pick * linhas.length)));
  return linhas[i];
}
