/**
 * Arte das áreas do Mapa (minimal-ui F5) — fundo 9:16 de cada área e os
 * "lotes" isométricos (construções clicáveis) dentro dela. Pixel art liberada
 * fora do visor (D2, 23/09/2026); lotes com alfa real.
 *
 * Origem: os mocks aprovados em `product/squad-minimal-ui/propostas/<area>/arte/`
 * (recortes 300² dos `internas-v4` de `E:/Soulmon-assets/iso-20260923/`).
 * ⚠️ O fundo da Arena ainda é o PROVISÓRIO do mock — o 9:16 definitivo
 * (`bg-arena-v4-916`) está na fila de `docs/design/minimal-ui/BACKLOG-CREDITOS.md` (#8).
 * O build converte os PNG para WebP.
 */
import bgMercado from './bg-mercado.png';
import bgArena from './bg-arena.png';
import loteItens from './lote-loja-itens.png';
import loteDecoracao from './lote-loja-decoracao.png';
import loteBackground from './lote-loja-background.png';
import loteConquistas from './lote-loja-conquistas.png';
import loteTorneio from './lote-arena-torneio.png';
import loteDuelo from './lote-arena-duelo.png';

export const AREA_BG = { mercado: bgMercado, arena: bgArena } as const;

export const MERCADO_LOT_ART = {
  itens: loteItens,
  decoracao: loteDecoracao,
  background: loteBackground,
  conquistas: loteConquistas,
} as const;

export const ARENA_LOT_ART = { torneio: loteTorneio, duelo: loteDuelo } as const;
