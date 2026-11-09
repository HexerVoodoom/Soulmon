// Arte da POÇÃO de Elemento (09/11/2026): `assets/soulmon/items/pocao-<id>.png` (128², alfa real, pintado) para os 20 elementos BASE.
// Elemento sem poção própria (compostos) → `undefined`, e quem chama cai no ícone do elemento.
const POCOES = import.meta.glob('../assets/soulmon/items/pocao-*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export const potionArt = (elementId: string): string | undefined => POCOES[`../assets/soulmon/items/pocao-${elementId}.png`];
