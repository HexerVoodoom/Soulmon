/**
 * Arte do SOULSMITH (Vitra), mesma regra da Hexsmith (`assets/soulmon/hex`): resolvida por `import.meta.glob`; assim que o PNG cair nesta pasta
 * com o nome-alvo a tela passa a usá-lo sozinha; sem arquivo → `undefined` e a tela desenha a figura de vidro em SVG (`components/forge/VitraMap.tsx`).
 *
 * Nome-alvo: `vitra-mapa.png` (quadrada, 1:1, fundo opaco: a figura de vidro soprado no centro, preto no miolo e luz/cor para as bordas).
 * Prompt completo e checklist de identidade em `docs/ASSETS-A-GERAR.md` (seção "Soulsmith (Vitra) — mapa de chakras").
 */
const ARTE = import.meta.glob('./vitra-mapa.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

/** A placa do mapa do Soulsmith, ou `undefined` (= use a figura em SVG). */
export const VITRA_MAP_ART: string | undefined = ARTE['./vitra-mapa.png'];
