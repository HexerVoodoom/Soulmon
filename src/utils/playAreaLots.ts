/**
 * OS LOTES DAS ÁREAS DE JOGAR (minimal-ui F5 — Exploração e Jogos).
 *
 * Dono único da copy dos lotes destas duas áreas (rótulo PT/EN, o que o leitor
 * de tela anuncia) e da posição do CENTRO DA BASE em % da cena, tirada dos
 * mocks aprovados (`propostas/exploracao/mock.html`,
 * `propostas/jogos/mock.html`) e descontada a barra do topo, que no app mora
 * no `AreaTopBar`, fora da cena.
 *
 * O lote de Jogos se chama "Pedra, papel e tesoura" e não "Duelo" como no
 * mock: a Arena já tem um lote "Duelo" (a `ArenaGame`), e dois lotes com o
 * mesmo nome abrindo jogos diferentes em áreas vizinhas é o jogador tocando
 * no errado.
 */
import type { Language } from './i18n';

export type ExploracaoLotId = 'masmorra' | 'dino';
export type JogosLotId = 'ppt';

interface PlayLotSpec<K extends string> {
  id: K;
  labelPt: string; labelEn: string;
  ariaPt: string; ariaEn: string;
  left: string; top: string;
}

const EXPLORACAO_LOTS: PlayLotSpec<ExploracaoLotId>[] = [
  { id: 'masmorra', labelPt: 'Masmorra', labelEn: 'Dungeon', ariaPt: 'Entrar na Masmorra', ariaEn: 'Enter the Dungeon', left: '27%', top: '36%' },
  { id: 'dino', labelPt: 'Corrida do Dino', labelEn: 'Dino Runner', ariaPt: 'Entrar na Corrida do Dino', ariaEn: 'Enter the Dino Runner', left: '72%', top: '46%' },
];

const JOGOS_LOTS: PlayLotSpec<JogosLotId>[] = [
  { id: 'ppt', labelPt: 'Pedra, papel e tesoura', labelEn: 'Rock, paper, scissors', ariaPt: 'Jogar Pedra, papel e tesoura', ariaEn: 'Play Rock, paper, scissors', left: '50%', top: '40%' },
];

function resolveLots<K extends string>(specs: PlayLotSpec<K>[], language: Language) {
  const isPt = language === 'pt-BR';
  return specs.map(s => ({
    id: s.id,
    label: isPt ? s.labelPt : s.labelEn,
    ariaLabel: isPt ? s.ariaPt : s.ariaEn,
    left: s.left, top: s.top,
  }));
}

export function exploracaoLots(language: Language) { return resolveLots(EXPLORACAO_LOTS, language); }
export function jogosLots(language: Language) { return resolveLots(JOGOS_LOTS, language); }
