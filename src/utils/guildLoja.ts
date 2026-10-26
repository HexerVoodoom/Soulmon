/**
 * A LOJA DO CLÃ — espelho do catálogo para EXIBIR (rodada 5, lane A; REGISTRO-DE-DECISOES §175).
 *
 * A verdade mora no servidor (`functions/api/_lojaCla.js`): é ele quem decide preço, saldo e compra; o cliente
 * manda só `itemId` + `opId` e NUNCA um preço. Este arquivo só diz como desenhar cada item (nome, arte reaproveitada
 * da decoração existente) e o preço que o servidor cobra — `guildLoja.test.ts` prova que os ids e os preços batem.
 * Só cosmético da Casa: nada aqui dá vantagem de jogo.
 */
import type { Language } from './i18n';

export interface LojaItem {
  /** Id ESTÁVEL (nunca renomear nem reaproveitar). */
  id: string;
  /** Preço em Bits do clã (espelho; o servidor é quem cobra). */
  preco: number;
  /** Id da decoração cuja arte já existe (`DECOR_ART`). */
  arte: string;
  /** Inglês primeiro. */
  nameEn: string;
  namePt: string;
}

export const LOJA_ITENS: readonly LojaItem[] = [
  { id: 'loja-fogueira-roda', preco: 250, arte: 'furn-campfire', nameEn: 'Circle campfire', namePt: 'Fogueira da roda' },
  { id: 'loja-lanterna-latao', preco: 150, arte: 'furn-lantern', nameEn: 'Brass lantern', namePt: 'Lanterna de latão' },
  { id: 'loja-cogumelos-brilho', preco: 200, arte: 'furn-mushrooms', nameEn: 'Glow mushrooms', namePt: 'Cogumelos luminosos' },
  { id: 'loja-tapete-circuito', preco: 500, arte: 'furn-circuit-mat', nameEn: 'Circuit rug', namePt: 'Tapete de circuito' },
  { id: 'loja-cristal-menor', preco: 400, arte: 'furn-crystal', nameEn: 'Small crystal', namePt: 'Cristal pequeno' },
  { id: 'loja-poco-desejos', preco: 600, arte: 'furn-well', nameEn: 'Wishing well', namePt: 'Poço dos desejos' },
  { id: 'loja-ampulheta', preco: 800, arte: 'furn-hourglass', nameEn: 'Hourglass', namePt: 'Ampulheta' },
  { id: 'loja-deck-clareira', preco: 300, arte: 'furn-deck', nameEn: 'Clearing deck', namePt: 'Deck da clareira' },
];

export const LOJA_ID_RE = /^loja-[a-z0-9-]{2,40}$/;
export const lojaItemDe = (id: string): LojaItem | undefined => LOJA_ITENS.find(i => i.id === id);

/** Copy da Loja (EN primeiro, PT-BR depois). Nunca cobra nem culpa; sem nada por pessoa. */
const LOJA_COPY = {
  titulo: ['Shop', 'Loja'],
  linha: ['Things for the house, bought with the clan’s Bits.', 'Coisas para a casa, com os Bits do clã.'],
  saldo: ['Clan Bits to use: {n}', 'Bits do clã para usar: {n}'],
  naCasa: ['In the house', 'Na casa'],
  comprar: ['Get for {n} Bits', 'Levar por {n} Bits'],
  juntando: ['Grows with the clan’s Bits.', 'Cresce com os Bits do clã.'],
  jaTem: ['In the house', 'Na casa'],
  ok: ['The house has something new.', 'A casa ganhou uma coisa nova.'],
} as const;
export type LojaKey = keyof typeof LOJA_COPY;
export const LOJA_COPY_TABLE = LOJA_COPY;

export function lojaText(language: Language, key: LojaKey, vars?: Record<string, string | number>): string {
  const [en, pt] = LOJA_COPY[key];
  const base: string = language === 'pt-BR' ? pt : en;
  return vars ? base.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? '')) : base;
}
