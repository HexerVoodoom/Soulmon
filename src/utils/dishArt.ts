// Arte pixel dos PRATOS do Restaurante (06/11/2026). Fronteira de troca no molde de `itemArt.ts`/`decorArt.ts`:
// a tela importa daqui e não conhece PNG nenhum. Arquivos: assets/soulmon/pratos/prato-<dishId>.png (96², alfa real),
// descobertos por glob EAGER: prato sem PNG ainda cai no emoji de `Dish.icon` (que continua a identidade em push/log/fallback).
// Fila de geração (12 pratos, prompts prontos): docs/ASSETS-A-GERAR.md › "Pratos do Restaurante".
const FILES = import.meta.glob('../assets/soulmon/pratos/prato-*.png', { eager: true, import: 'default' }) as Record<string, string>;

/** dishId → URL da arte, só dos pratos que já têm PNG instalado. */
export const DISH_ART: Record<string, string> = {};
for (const [path, url] of Object.entries(FILES)) {
  const id = path.split('/').pop()!.replace(/^prato-|\.png$/g, '');
  DISH_ART[id] = url;
}

export const dishArt = (id: string): string | undefined => DISH_ART[id];
