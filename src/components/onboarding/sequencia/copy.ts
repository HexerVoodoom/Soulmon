import type { Language } from '../../../utils/i18n';
import type { Bilingue } from './types';

/**
 * Roteiro do ancião Remendado (resgatador neutro). Tom: calmo, curto, sem prometer saúde
 * nem cura: o Soulmon ajuda a constância, não trata ninguém. Cenas 0–9 do plano §3.
 * Cada fala existe em EN e PT; o idioma entra por `t()`.
 */
export const t = (b: Bilingue, language: Language): string => (language === 'pt-BR' ? b.pt : b.en);

export const ROTEIRO: Record<string, Bilingue[]> = {
  // 0 — Ritual do oráculo (o ancião conduz as perguntas atuais)
  c0: [
    { en: 'Sit a moment. I only want to know you a little before we start.', pt: 'Sente um instante. Só quero te conhecer um pouco antes de começarmos.' },
    { en: 'Answer as you like. Nothing here is a test.', pt: 'Responda do seu jeito. Nada aqui é prova.' },
  ],
  // 1 — Nascimento
  c1: [
    { en: 'Your shadow is taking shape. Give it a moment.', pt: 'A sua sombra está tomando forma. Dê um instante a ela.' },
    { en: 'There. Small, but it is yours.', pt: 'Pronto. Pequena, mas é sua.' },
  ],
  // 2 — Acorde
  c2: [
    { en: 'Wake up. Slowly. There is no hurry yet.', pt: 'Acorde. Devagar. Ainda não há pressa.' },
    { en: 'I am a Remendado. I mend what is coming undone. Take my hand.', pt: 'Sou um Remendado. Remendo o que está se desfazendo. Pegue a minha mão.' },
    { en: 'You are in the Mesh. We cannot stay here.', pt: 'Você está na Malha. Não podemos ficar aqui.' },
  ],
  // 3 — Fuga
  c3: [
    { en: 'Do not look back. Keep your shadow close.', pt: 'Não olhe para trás. Mantenha a sua sombra perto.' },
    { en: 'It is an Undone, one who lost the thread. It follows the noise.', pt: 'É um Desfeito, alguém que perdeu o fio. Ele segue o barulho.' },
  ],
  // 4 — A parede
  c4: [
    { en: 'A wall of loose pieces. Put them in order and it opens.', pt: 'Uma parede de peças soltas. Coloque-as em ordem e ela se abre.' },
    { en: 'Take your time. Mistakes only cost a little.', pt: 'Sem pressa. Errar custa pouco.' },
  ],
  // 5 — Bifurcação
  c5: [
    { en: 'The path splits. I have taken both before.', pt: 'O caminho se divide. Já passei pelos dois.' },
    { en: 'Which one do you feel like taking?', pt: 'Qual deles você sente vontade de seguir?' },
  ],
  // 6 — O Desfeito alcança (tarefa real + alimentar, D11/D24)
  c6: [
    { en: 'It caught up. Something real can hold it back: a small task of yours.', pt: 'Ele nos alcançou. Algo real pode segurá-lo: uma tarefa pequena sua.' },
    { en: 'Pick one you can do now. I will wait.', pt: 'Escolha uma que você consiga fazer agora. Eu espero.' },
    { en: 'Did you really do it?', pt: 'Você fez de verdade?' },
    { en: 'Not yet? No trouble. Let us do it together. I will keep you company.', pt: 'Ainda não? Sem problema. Vamos juntos, eu faço companhia.' },
    { en: 'Good. That gave your shadow strength. Strength is a task plus food. Open the bag and feed it.', pt: 'Bom. Isso deu força à sua sombra. Força é tarefa mais alimento. Abra a bolsa e alimente-a.' },
  ],
  // 7 — Duelo em dupla
  c7: [
    { en: 'Stay behind me. I will take the hits, not you.', pt: 'Fique atrás de mim. Eu levo os golpes, não você.' },
    { en: 'That is enough. We only needed to slow it.', pt: 'Basta. Só precisávamos atrasá-lo.' },
  ],
  // 8 — Resgate
  c8: [
    { en: 'Now!', pt: 'Agora!' },
    { en: 'One of ours, the Hand of the Veiled, throws the lantern. Close your eyes.', pt: 'Um dos nossos, o Velado da Mão, lança a lanterna. Feche os olhos.' },
    { en: 'Gone, for now. Come. We are almost home.', pt: 'Foi embora, por ora. Venha. Estamos quase em casa.' },
  ],
  // 9 — CORE
  c9: [
    { en: 'This is CORE, a city of Soulmon who lost their Veiled and found each other.', pt: 'Esta é a CORE, uma cidade de Soulmon que perderam os seus Velados e se encontraram.' },
    { en: 'You and your shadow can stay as long as you like. Walk around. I will be near.', pt: 'Você e a sua sombra podem ficar o quanto quiserem. Ande por aí. Estarei por perto.' },
  ],
};

export const BIFURCACAO = {
  pergunta: { en: 'Which way?', pt: 'Qual caminho?' } as Bilingue,
  opcoes: [
    { id: 'luz', rotulo: { en: 'The lit path', pt: 'O caminho iluminado' } },
    { id: 'sombra', rotulo: { en: 'The quiet path', pt: 'O caminho quieto' } },
  ],
};

/** Cena 1 (D18): o berço revelado, sem esperar a API. */
export const BERCO = {
  titulo: { en: 'The cradle', pt: 'O berço' } as Bilingue,
  legenda: { en: 'This is the cradle your shadow was born in. It will outgrow it.', pt: 'Este é o berço em que a sua sombra nasceu. Ela vai crescer além dele.' } as Bilingue,
};

export const ANCIAO = { nome: { en: 'The Elder', pt: 'O Ancião' } as Bilingue };

export const UI = {
  pular: { en: 'Skip', pt: 'Pular' } as Bilingue,
  continuar: { en: 'Continue', pt: 'Continuar' } as Bilingue,
  reverHistoria: { en: 'Replay the story', pt: 'Rever a história' } as Bilingue,
  semArte: { en: 'art pending', pt: 'arte pendente' } as Bilingue,
};
