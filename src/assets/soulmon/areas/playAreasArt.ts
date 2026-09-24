/**
 * Arte das áreas de JOGAR do Mapa (minimal-ui F5, Exploração + Jogos) — o
 * fundo 9:16 de cada área e os "lotes" isométricos (construções clicáveis).
 * Pixel art liberada fora do visor (D2, 23/09/2026); lotes com alfa real.
 *
 * Origem: os mocks aprovados em `product/squad-minimal-ui/propostas/<area>/arte/`
 * (`exploracao/` e `jogos/`). Os fundos foram reduzidos para 760×1344 (mesma
 * medida dos fundos do Mercado/Arena) para caber no teto de 400 KB por imagem
 * de `orcamentoDeBytes.contract.test.ts`; o build converte os PNG para WebP.
 *
 * Arquivo separado do `index.ts` das áreas de loja de propósito: cada fatia de
 * F5 dona da sua arte, sem as duas brigarem pelo mesmo módulo.
 */
import bgExploracao from './bg-exploracao.png';
import bgJogos from './bg-jogos.png';
import loteMasmorra from './lote-exploracao-masmorra.png';
import loteDino from './lote-exploracao-dino.png';
import lotePpt from './lote-jogos-ppt.png';

export const PLAY_AREA_BG = { exploracao: bgExploracao, jogos: bgJogos } as const;

export const EXPLORACAO_LOT_ART = { masmorra: loteMasmorra, dino: loteDino } as const;

export const JOGOS_LOT_ART = { ppt: lotePpt } as const;
