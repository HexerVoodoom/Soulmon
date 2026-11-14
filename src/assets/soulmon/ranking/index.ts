/**
 * Arte do PÓDIO do ranking (`components/RankingPodium.tsx`, REGISTRO §326, 13/11/2026). Mesmo padrão de `assets/soulmon/hex/index.ts`
 * (`resolveHexCrownArt`): a arte é resolvida por `import.meta.glob`; assim que o PNG cair nesta pasta com o nome-alvo, o pódio passa a
 * usá-lo sozinho. Sem o arquivo, `undefined` → o pódio desenha a versão em CSS (tokens `--sm2-*`). Nenhuma linha de código muda.
 *
 * Nomes-alvo (PNG, alfa real, fila em `docs/ASSETS-A-GERAR.md` → "Pódio do ranking"):
 *  - `podio-1.png` 360×240 · `podio-2.png` 288×180 · `podio-3.png` 288×144 — o pedestal (ouro/prata/bronze), encostado na base do
 *    quadro, SEM número desenhado (o número mora na medalha). A caixa do pedestal tem a MESMA proporção (3:2, 8:5, 2:1): a arte
 *    entra com `object-fit: contain` ancorada embaixo e a altura do pódio não muda quando ela chega.
 *  - `medalha-1.png`, `medalha-2.png`, `medalha-3.png` 128×128 — a medalha da posição, COM o numeral desenhado (1, 2, 3).
 *  - `coroa-1.png` 128×96 — a coroa que fica só sobre o 1º lugar.
 * O lugar vazio (menos de 3 pessoas no placar) reaproveita o pedestal da posição apagado em CSS: não há arte própria.
 */
export type PodiumPlace = 1 | 2 | 3;

const ARTE = import.meta.glob('./{podio-*,medalha-*,coroa-*}.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

const art = (nome: string): string | undefined => ARTE[`./${nome}.png`];

export interface PodiumArt {
  /** Pedestal da posição; `undefined` = pedestal em CSS. */
  pedestal?: string;
  /** Medalha com o numeral; `undefined` = disco em CSS com o número em texto. */
  medal?: string;
  /** Só no 1º lugar; `undefined` = o troféu do inventário de glifos (`emoji_events`). */
  crown?: string;
}

/** A arte de uma posição do pódio. Cada peça cai no fallback em CSS sozinha (pode chegar uma de cada vez). */
export const resolvePodiumArt = (place: PodiumPlace): PodiumArt => ({
  pedestal: art(`podio-${place}`),
  medal: art(`medalha-${place}`),
  crown: place === 1 ? art('coroa-1') : undefined,
});
