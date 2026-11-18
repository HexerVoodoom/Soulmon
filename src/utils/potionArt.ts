// Arte da POÇÃO de Elemento: `assets/soulmon/items/pocao-<id>.png` (128², alfa real, pintado) para os 20 elementos BASE (09/11/2026)
// e os 59 COMPOSTOS curados (18/11/2026). Elemento sem poção própria (derivados não curados) → `undefined`, e quem chama cai no ícone do elemento.
const POCOES = import.meta.glob('../assets/soulmon/items/pocao-*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export const potionArt = (elementId: string): string | undefined => POCOES[`../assets/soulmon/items/pocao-${elementId}.png`];
