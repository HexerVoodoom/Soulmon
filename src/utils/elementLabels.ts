// Rótulos dos 20 elementos BASE (PT/EN). Módulo leve, sem dependência de combate: `arena.ts` re-exporta daqui, e quem precisa só
// do nome (essências, overlay desktop via `specialItemUse`) importa este arquivo sem arrastar o motor da Arena.
import { BASE_ELEMENT_LABELS } from './soulProfile/derivedElements';

export const BASE_ELEMENT_LABELS_EN: Record<string, string> = {
  fogo: 'Fire', agua: 'Water', terra: 'Earth', ar: 'Air', eletricidade: 'Lightning',
  arcano: 'Arcane', sombra: 'Shadow', luz: 'Light', vileza: 'Vileness', morte: 'Death',
  vida: 'Life', vigor: 'Vigor', marcial: 'Martial', tempo: 'Time', som: 'Sound',
  gravidade: 'Gravity', espaco: 'Space', fada: 'Fairy', industrial: 'Industrial', planta: 'Plant',
};

export function elementLabel(id: string, isPt: boolean): string {
  return isPt
    ? (BASE_ELEMENT_LABELS as Record<string, string>)[id] ?? id
    : BASE_ELEMENT_LABELS_EN[id] ?? id;
}
