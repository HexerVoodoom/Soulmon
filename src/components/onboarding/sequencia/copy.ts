import type { Language } from '../../../utils/i18n';

export interface Bilingue { en: string; pt: string }

/**
 * Roteiro do ancião Remendado (resgatador neutro). Tom: calmo, curto, sem prometer saúde
 * nem cura: o Soulmon ajuda a constância, não trata ninguém. Lugar = a Malha (nunca "outro mundo");
 * a ameaça do Desfeito não nasce de nada que a pessoa fez (L3 da bíblia).
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
};

/** Quem fala (rótulo curto acima da fala). */
export const FALANTE = {
  anciao: { en: 'The Elder', pt: 'O Ancião' } as Bilingue,
  desfeito: { en: 'The Undone', pt: 'O Desfeito' } as Bilingue,
  mao: { en: 'Hand of the Veiled', pt: 'Velado da Mão' } as Bilingue,
};

/**
 * Intro narrativa (plano docs/PLANO-INTRO-NARRATIVA.md §4 e §11.4), 9 cenas.
 * Rascunho para a revisão da squad-narrativa: as falas 3 e 8 foram reescritas (lugar = a Malha).
 */
export const INTRO = {
  /** Cena 1 */
  acorda: { en: 'Wake up… we have to go.', pt: 'Acorda… temos que ir.' } as Bilingue,
  /** Cena 2 */
  precisamos: { en: 'We have to move.', pt: 'Precisamos ir.' } as Bilingue,
  /** Cena 3 (Desfeito) */
  desfeito: { en: 'I heard you coming. Everything here is coming undone, and I came to finish the job.', pt: 'Ouvi vocês chegando. Tudo aqui está se desfazendo, e eu vim terminar o serviço.' } as Bilingue,
  /** Cena 4 */
  tarefa: { en: 'Do a task. Your Soulmon needs strength to fight. Then feed it.', pt: 'Cumpra uma tarefa. Seu Soulmon precisa de força para lutar. Depois, alimente-o.' } as Bilingue,
  prontos: { en: 'Now we are ready.', pt: 'Agora estamos prontos.' } as Bilingue,
  /** Cena 5 (corte da luta) */
  basta: { en: 'Enough. We only had to buy time.', pt: 'Basta. Só precisamos ganhar tempo.' } as Bilingue,
  /** Cena 6 (voz de cima) */
  suba: { en: 'Come on, climb up quickly!', pt: 'Vamos, suba depressa!' } as Bilingue,
  /** Cena 8 (duas falas, com a pausa no meio) */
  bemVindo1: { en: 'Welcome to CORE. A new place for you…', pt: 'Bem-vindo à CORE. Um lugar novo para você…' } as Bilingue,
  bemVindo2: { en: '…and a very old one for the Mesh.', pt: '…e muito antigo para a Malha.' } as Bilingue,
  /** Cena 9 */
  descanse: { en: 'You have much to find. Take your time, come back when you like. Now, rest.', pt: 'Você tem muito a descobrir. Faça no seu tempo e volte quando quiser. Agora, descanse.' } as Bilingue,
};

/** Narração por texto das cenas visuais (leitor de tela e movimento reduzido). */
export const ARIA = {
  preto: { en: 'Darkness. A voice, close by.', pt: 'Escuridão. Uma voz, bem perto.' } as Bilingue,
  olho: { en: 'Your eyes open slowly. The Elder stands over you.', pt: 'Seus olhos se abrem devagar. O Ancião está ao seu lado.' } as Bilingue,
  costas: { en: 'The Elder turns his back to you and starts to walk.', pt: 'O Ancião vira de costas e começa a andar.' } as Bilingue,
  tunel: { en: 'You run through a dark teal tunnel. Crystals, copper pipes and plants pass by on the walls, with old glowing drawings.', pt: 'Vocês correm por um túnel turquesa escuro. Cristais, canos de cobre e plantas passam pelas paredes, com desenhos antigos que brilham.' } as Bilingue,
  penhasco: { en: 'A cliff edge. Floating islands drift far below and beyond.', pt: 'A beira de um despenhadeiro. Ilhas flutuantes ao longe.' } as Bilingue,
  cristal: { en: 'The Elder and the Hand of the Veiled place their hands on a crystal. It begins to glow.', pt: 'O Ancião e o Velado da Mão apoiam as mãos num cristal. Ele começa a brilhar.' } as Bilingue,
  branco: { en: 'The light grows until everything is white.', pt: 'A luz cresce até tudo ficar branco.' } as Bilingue,
  cidade: { en: 'A city square. An identical crystal stands nearby. This is CORE.', pt: 'Uma praça de cidade. Um cristal igual ao outro, ali perto. Esta é a CORE.' } as Bilingue,
  fade: { en: 'The screen fades to black.', pt: 'A tela escurece.' } as Bilingue,
};

/** Cena 1 (D18): o berço revelado, sem esperar a API. */
export const BERCO = {
  titulo: { en: 'The cradle', pt: 'O berço' } as Bilingue,
  legenda: { en: 'This is the cradle your shadow was born in. It will outgrow it.', pt: 'Este é o berço em que a sua sombra nasceu. Ela vai crescer além dele.' } as Bilingue,
};

export const ANCIAO = { nome: FALANTE.anciao };

export const UI = {
  pular: { en: 'Skip', pt: 'Pular' } as Bilingue,
  continuar: { en: 'Continue', pt: 'Continuar' } as Bilingue,
  reverHistoria: { en: 'Replay the story', pt: 'Rever a história' } as Bilingue,
  semArte: { en: 'art pending', pt: 'arte pendente' } as Bilingue,
  subir: { en: 'Climb', pt: 'Subir' } as Bilingue,
  atacar: { en: 'Attack', pt: 'Atacar' } as Bilingue,
  jaFiz: { en: 'I did it', pt: 'Já fiz' } as Bilingue,
};
