import { BIFURCACAO, ROTEIRO } from './copy';
import type { Quadro, Bilingue } from './types';

const f = (c: string, i: number): Bilingue => ROTEIRO[c][i];

/** Cena 2: tela preta, o ancião fala no escuro, clareia: mão estendida. */
export const CENA_2: Quadro[] = [
  { tipo: 'cena', preto: true, musica: 'suspense', fala: f('c2', 0) },
  { tipo: 'cena', fundo: 'bg-malha-clara', npc: 'velado-anciao-mao', parallax: true, transicaoPreta: true, fala: f('c2', 1) },
  { tipo: 'cena', fundo: 'bg-malha-clara', npc: 'velado-anciao-mao', parallax: true, fala: f('c2', 2) },
];

/** Cena 3: fuga em vídeo mudo (base dungeon-vhs: overlay de glitch por cima). */
export const CENA_3: Quadro[] = [
  { tipo: 'cena', fundo: 'bg-malha-escura', npc: 'velado-anciao-preocupado', efeito: 'glitch', fala: f('c3', 0) },
  { tipo: 'video', video: 'video-fuga', efeito: 'glitch', fala: f('c3', 1) },
];

/** Cenas 4, 6 e 7 entram como slots; as outras frentes fornecem o componente. */
export const SLOT_PUZZLE: Quadro = { tipo: 'slot', slot: 'puzzle' };
export const SLOT_TAREFA: Quadro = { tipo: 'slot', slot: 'tarefa' };
export const SLOT_DUELO: Quadro = { tipo: 'slot', slot: 'duelo' };

/** Cena 5: bifurcação (escolha cosmética, guardada). */
export const CENA_5: Quadro[] = [
  { tipo: 'cena', fundo: 'bg-bifurcacao', npc: 'velado-anciao', parallax: true, fala: f('c5', 0) },
  { tipo: 'escolha', fundo: 'bg-bifurcacao', npc: 'velado-anciao', pergunta: BIFURCACAO.pergunta, opcoes: BIFURCACAO.opcoes },
];

/** Cena 8: resgate. Vídeo mudo + quadros; clarão turquesa na lanterna-granada. */
export const CENA_8: Quadro[] = [
  { tipo: 'video', video: 'video-resgate', fala: f('c8', 0) },
  { tipo: 'cena', fundo: 'bg-malha-escura', npc: 'velado-mao-lanterna', efeito: 'clarao', fala: f('c8', 1) },
  { tipo: 'cena', fundo: 'bg-malha-clara', npc: 'velado-mao', transicaoPreta: true, fala: f('c8', 2) },
];

/** Cena 9: apresentação da CORE → Home. */
export const CENA_9: Quadro[] = [
  { tipo: 'cena', fundo: 'bg-core-cidade', npc: 'velado-anciao', parallax: true, transicaoPreta: true, fala: f('c9', 0) },
  { tipo: 'cena', fundo: 'bg-core-cidade', npc: 'velado-anciao', parallax: true, fala: f('c9', 1) },
];

/** Cenas 2–9 (0–1 são do ritual/nascimento atuais; 4/6/7 são slots). */
export const SEQUENCIA_VELADO: Quadro[] = [
  ...CENA_2, ...CENA_3, SLOT_PUZZLE, ...CENA_5, SLOT_TAREFA, SLOT_DUELO, ...CENA_8, ...CENA_9,
];
