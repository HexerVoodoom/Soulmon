import { ARIA, INTRO, type Bilingue } from './copy';
import type { Fala, Quadro } from './introTipos';

const anciao = (txt: Bilingue): Fala => ({ quem: 'anciao', txt });

/** Tempo do túnel (D-04, ~12 s). */
export const TUNEL_MS = 12000;

/**
 * As 9 cenas (plano §3). Índice 0 = cena 1. Cada cena é uma lista de quadros; a máquina
 * (`introMaquina.ts`) só anda por aqui. Arte ausente vira silhueta nomeada no player.
 */
export const CENAS: Quadro[][] = [
  // 1 Acorda
  [
    { tipo: 'preto', falaAposMs: 1200, aria: ARIA.preto, fala: anciao(INTRO.acorda) },
    { tipo: 'olho', fundo: 'bg-malha-escura', npc: 'velado-anciao', aria: ARIA.olho },
  ],
  // 2 Túnel
  [
    { tipo: 'cena', fundo: 'bg-malha-escura', npc: 'velado-anciao-costas', aria: ARIA.costas, fala: anciao(INTRO.precisamos) },
    { tipo: 'tunel', ms: TUNEL_MS, aria: ARIA.tunel },
  ],
  // 3 Despenhadeiro
  [
    { tipo: 'cena', fundo: 'penhasco-panorama', frente: 'penhasco-borda', parallax: true, autoMs: 3200, aria: ARIA.penhasco },
    { tipo: 'cena', fundo: 'penhasco-panorama', frente: 'penhasco-borda', npc: 'desfeito', efeito: 'glitch', aria: ARIA.penhasco, fala: { quem: 'desfeito', txt: INTRO.desfeito } },
  ],
  // 4 Tarefa + alimentar
  [
    { tipo: 'cena', fundo: 'penhasco-panorama', frente: 'penhasco-borda', npc: 'velado-anciao-preocupado', aria: ARIA.penhasco, fala: anciao(INTRO.tarefa) },
    { tipo: 'slot', slot: 'tarefa', aria: ARIA.penhasco },
    { tipo: 'slot', slot: 'alimentar', aria: ARIA.penhasco },
    { tipo: 'cena', fundo: 'penhasco-panorama', frente: 'penhasco-borda', npc: 'velado-anciao-preocupado', aria: ARIA.penhasco, fala: anciao(INTRO.prontos) },
  ],
  // 5 Luta 2x1
  [
    { tipo: 'slot', slot: 'duelo', aria: ARIA.penhasco },
    { tipo: 'cena', fundo: 'penhasco-panorama', frente: 'penhasco-borda', npc: 'velado-anciao-preocupado', aria: ARIA.penhasco, fala: anciao(INTRO.basta) },
  ],
  // 6 Corda
  [
    { tipo: 'slot', slot: 'corda', aria: ARIA.penhasco },
  ],
  // 7 Cristal
  [
    { tipo: 'cristal', aria: ARIA.cristal },
  ],
  // 8 Cidade CORE
  [
    { tipo: 'cena', fundo: 'bg-core-cidade', npc: 'velado-anciao', cristal: true, entradaBranco: true, aria: ARIA.cidade, fala: anciao(INTRO.bemVindo1) },
    { tipo: 'cena', fundo: 'bg-core-cidade', npc: 'velado-anciao', cristal: true, aria: ARIA.cidade, fala: anciao(INTRO.bemVindo2) },
  ],
  // 9 Descanso
  [
    { tipo: 'cena', fundo: 'bg-core-cidade', npc: 'velado-anciao', cristal: true, aria: ARIA.cidade, fala: anciao(INTRO.descanse) },
    { tipo: 'fade', aria: ARIA.fade },
  ],
];
