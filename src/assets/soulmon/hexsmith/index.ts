/**
 * Arte dos 2 botões de RENOMEAR da Hexsmith (lápis = nome do Soulmon, chama = nome do especial). Slots de troca automática:
 * assim que `btn-lapis.(webp|png)` / `btn-chama.(webp|png)` (hexágono com o ícone, mesmo estilo e tamanho dos 5 da tela, alfa real)
 * cair nesta pasta, a tela passa a usá-los; enquanto não existirem, `undefined` → hexágono GENERATIVO em código
 * (`components/hex/HexRenameButton.tsx`). Pedido de arte: `docs/ASSETS-A-GERAR.md` (primeira linha).
 */
const ARTE = import.meta.glob('./btn-{lapis,chama}.{webp,png}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const find = (nome: string): string | undefined => ARTE[`./${nome}.webp`] ?? ARTE[`./${nome}.png`];

export const HEXSMITH_RENAME_ART = { lapis: find('btn-lapis'), chama: find('btn-chama') } as const;
