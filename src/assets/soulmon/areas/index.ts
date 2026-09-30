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

// ⚠️ `feira`: PLACEHOLDER (a arte `lote-arena-feira` — tenda-cúpula listrada — vem da leva de
// arte, `utils/fairArt.ts`). Só trocar o import.
export const ARENA_LOT_ART = { torneio: loteTorneio, duelo: loteDuelo, feira: loteConquistas } as const;

// ── Exploração e Jogos (F5, PR #118) ───────────────────────────────────────
// Fundos reduzidos para 760×1344 (a mesma medida do Mercado/Arena) para caber
// no teto de 400 KB por imagem de `orcamentoDeBytes.contract.test.ts`.
import bgExploracao from './bg-exploracao.png';
import bgJogos from './bg-jogos.png';
import loteMasmorra from './lote-exploracao-masmorra.png';
import loteDino from './lote-exploracao-dino.png';
import lotePpt from './lote-jogos-ppt.png';

export const PLAY_AREA_BG = { exploracao: bgExploracao, jogos: bgJogos } as const;

// ⚠️ `passeio` (30/09/2026): PLACEHOLDER — a galeria de quadros de paisagem da
// loja de cenários lê como "postais das regiões" até a squad-arte gerar a arte
// própria do Passeio. Só trocar o import.
export const EXPLORACAO_LOT_ART = { masmorra: loteMasmorra, passeio: loteBackground } as const;

// 🏛️ Os três prédios de Jogos (30/09/2026). O Salão herda as duas artes que já
// eram dele por conteúdo (o PPT; o Dino mudou da Exploração para cá).
// ⚠️ `mente` e `refugio`: PLACEHOLDERS — reaproveitam isométricas instaladas
// até a squad-arte gerar as próprias (fila em `docs/ASSETS-A-GERAR.md`). Só
// trocar os imports.
export const JOGOS_LOT_ART = { salao: lotePpt, mente: loteDino, refugio: loteDecoracao } as const;

// ── Guilda, Laboratório e Hall (29/09/2026) ────────────────────────────────
// ⚠️ PLACEHOLDERS: ainda não existe arte de lote própria para estas
// construções — reaproveitam as isométricas já instaladas até a squad-arte
// gerar as definitivas (fila em `docs/ASSETS-A-GERAR.md`). Só trocar os imports.
export const LABORATORIO_LOT_ART = {
  evolucao: loteBackground,
  pet: loteItens,
  stats: loteConquistas,
} as const;

export const HALL_LOT_ART = {
  biblioteca: lotePpt,
  amigos: loteDecoracao,
  guilda: loteConquistas,
} as const;
