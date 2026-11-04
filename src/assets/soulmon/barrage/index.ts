/**
 * Arte opcional da Chuva de Almas (04/11/2026). Resolvida por `import.meta.glob` (mesmo padrão de `assets/soulmon/hex/index.ts`):
 * assim que o PNG cair nesta pasta com o nome-alvo, o botão Especial passa a usá-lo sozinho; sem ele, `undefined` → a barra atual (gradiente CSS).
 * Nome-alvo: `barra-especial.png` (ver `docs/ASSETS-A-GERAR.md`).
 */
const ARTE = import.meta.glob('./barra-especial.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export const BARRAGE_ART: { readonly specialBar?: string } = {
  specialBar: ARTE['./barra-especial.png'],
};
