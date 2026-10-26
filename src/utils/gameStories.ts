/**
 * O CONTEXTO NARRATIVO DOS MINIJOGOS (D-01, 18/10/2026): quem, por quê e o objetivo, em 1–2 frases, ANTES ou DURANTE a rodada.
 *
 * Voz da bíblia (`docs/NARRATIVA-E-UNIVERSO.md` §13): o mundo constata, em 2ª pessoa, curto e concreto — não elogia, não julga, não
 * promete. Regras que todo texto daqui cumpre (e `gameStories.test.ts` trava): nenhuma promessa de efeito cognitivo ("treina a
 * memória"), nenhum veredito, nada de vermelho nem "errou"; o Refúgio é CALMO e sem combate; o Elemental Fusion é o único com combate.
 * Quem escreve a frase é este arquivo — a tela só a mostra (`GameStory` do `GameKit`).
 */
import type { Language } from './i18n';

export type GameStoryId = 'match3' | 'eco' | 'bolhas' | 'troca' | 'picross' | 'revisao' | 'respiracao';

export const GAME_STORY_IDS: readonly GameStoryId[] = ['match3', 'eco', 'bolhas', 'troca', 'picross', 'revisao', 'respiracao'];

export const GAME_STORIES: Record<GameStoryId, { pt: string; en: string }> = {
  match3: {
    pt: 'Três Soulmon da fenda formam um time e barram a passagem. Combine peças de um elemento: cada linha vira um golpe daquele elemento no primeiro da fila, e o seu Soulmon enfrenta um de cada vez.',
    en: 'Three Soulmon from the rift form a team and block the way. Line up tiles of one element: each line becomes a strike of that element on the first in line, and your Soulmon faces them one at a time.',
  },
  eco: {
    pt: 'Pedras antigas respondem ao canto do seu Soulmon. Ele canta uma ordem; você a repete, pedra por pedra, para o eco chegar inteiro.',
    en: 'Old stones answer your Soulmon’s song. It sings an order; you repeat it, stone by stone, so the echo arrives whole.',
  },
  bolhas: {
    pt: 'Os sonhos do seu Soulmon sobem pela Malha como bolhas. Estoure os claros e deixe os fiapos escuros passarem; ele fica por perto.',
    en: 'Your Soulmon’s dreams rise through the Mesh as bubbles. Pop the bright ones and let the dark wisps drift by; it stays close.',
  },
  troca: {
    pt: 'Criaturas cruzam a Malha e o seu Soulmon ajuda a separá-las. A regra de cima diz de que lado cada uma fica, e de vez em quando ela muda.',
    en: 'Creatures cross the Mesh and your Soulmon helps sort them. The rule on top says which side each one goes, and now and then it changes.',
  },
  picross: {
    pt: 'Um desenho antigo está escondido na Malha. Os números marcam onde há traço; pinte os blocos até ele aparecer.',
    en: 'An old drawing hides in the Mesh. The numbers mark where the lines are; fill the blocks until it shows.',
  },
  revisao: {
    pt: 'O seu Soulmon guarda os cartões que você mesmo escreveu e traz de volta os que chegaram à vez. Vire um, olhe, e diga se ele voltou até você.',
    en: 'Your Soulmon keeps the cards you wrote yourself and brings back the ones whose turn has come. Flip one, look, and say whether it came back to you.',
  },
  respiracao: {
    pt: 'O seu Soulmon respira devagar e convida você a acompanhar. Não há placar nem ritmo certo: é só ficar um pouco aqui.',
    en: 'Your Soulmon breathes slowly and invites you to follow. There is no score and no right pace: just stay a little while.',
  },
};

/** A frase do jogo no idioma (`en-US` é o padrão/fallback). */
export function gameStory(id: GameStoryId, language: Language): string {
  return language === 'pt-BR' ? GAME_STORIES[id].pt : GAME_STORIES[id].en;
}
