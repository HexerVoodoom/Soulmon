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
import loteFeira from './lote-arena-feira.png';
import loteMercadoConquistas from './lote-mercado-conquistas.png';
// ⚒️ 07/10/2026: o Ferreiro — a oficina de lava do domínio Fogo (`dominios/fogo/predios/lote-fogo-oficina`). Pedido de arte PRÓPRIA em `docs/ARTE-MELHORIAS-FUTURAS.md`.
import loteFerreiro from './lote-mercado-ferreiro.png';
import loteTorneio from './lote-arena-torneio.png';
import loteDuelo from './lote-arena-duelo.png';

// ⚠️ SEM CONSUMIDOR desde 01/10/2026: `lote-loja-conquistas.png` só emprestava a arte à Feira, que ganhou a tenda-cúpula própria.
// O arquivo fica em disco (fora do bundle, sem import).
export const AREA_BG = { mercado: bgMercado, arena: bgArena } as const;

export const MERCADO_LOT_ART = {
  itens: loteItens,
  decoracao: loteDecoracao,
  background: loteBackground,
  // 30/09/2026 (leva lotes-v2, aprovada pelo dono): a torre-treliça própria.
  conquistas: loteMercadoConquistas,
  ferreiro: loteFerreiro,
} as const;

// `feira` (01/10/2026, leva lotes-v2 `lote-arena-feira`, versão limpa): a tenda-cúpula listrada própria.
export const ARENA_LOT_ART = { torneio: loteTorneio, duelo: loteDuelo, feira: loteFeira } as const;

// ── Exploração e Jogos (F5, PR #118) ───────────────────────────────────────
// Fundos reduzidos para 760×1344 (a mesma medida do Mercado/Arena) para caber
// no teto de 400 KB por imagem de `orcamentoDeBytes.contract.test.ts`.
import bgExploracao from './bg-exploracao.png';
import bgJogos from './bg-jogos.png';
import loteMasmorra from './lote-exploracao-masmorra.png';
import lotePpt from './lote-jogos-ppt.png';
// ⚠️ SEM CONSUMIDOR desde 30/09/2026: `lote-exploracao-dino.png` só emprestava a
// arte ao Ateliê da Mente, que ganhou prédio próprio. O arquivo fica em disco
// (fora do bundle, sem import) para quando a Corrida ganhar lote de novo.
import lotePasseio from './lote-exploracao-passeio.png';
// 🛠️ 04/10/2026: prédios PRÓPRIOS da Oficina do Foco (oficina de artesão com timers de cristal, NPC Tique)
// e do Caderno (casinha-tinteiro com pena, NPC Sépia) — `entrada-dono/lote-exploracao-*` (GPT Image 2.5
// Flare, alfa real), mesmo pós dos lotes-v2 (300², alfa binário). Até aqui emprestavam o Observatório e a
// Biblioteca. As versões `-b` ficaram fora do bundle (`E:/Soulmon-assets/instalados/alternativas/`).
import loteOficina from './lote-exploracao-oficina-deserto.png';
import loteCaderno from './lote-exploracao-caderno-campina.png';
// 🎨 07/10/2026 (reforma dos lotes): prédios de DOMÍNIO (`../../dominios/<dom>/predios`, arte própria já no repo) copiados
// para cá — o contrato de geometria lê só esta pasta. Trocaram os quatro lotes teal-sobre-teal (Mente, Oficina, Caderno e
// os do Hall); as artes antigas ficam em disco, sem import (`lote-jogos-mente`, `lote-exploracao-oficina`/`caderno`,
// `lote-hall-amigos`/`guilda`), para voltar se o dono quiser.
import loteMente from './lote-jogos-mente-akasha.png';
import loteRefugio from './lote-jogos-refugio.png';

export const PLAY_AREA_BG = { exploracao: bgExploracao, jogos: bgJogos } as const;

// `passeio` (30/09/2026, leva lotes-v2): a ilha flutuante com arco de raízes.
export const EXPLORACAO_LOT_ART = { masmorra: loteMasmorra, passeio: lotePasseio, oficina: loteOficina, caderno: loteCaderno } as const;

// 🏛️ Os três prédios de Jogos (30/09/2026). O Salão herda as duas artes que já
// eram dele por conteúdo (o PPT; o Dino mudou da Exploração para cá).
// `mente` e `refugio`: prédios próprios desde 30/09/2026 (leva lotes-v2). 04/10/2026 (J5): o Refúgio
// trocou a casinha de cogumelo PROVISÓRIA pela casa-gruta com cachoeira e lago (`entrada-dono/36-*`).
export const JOGOS_LOT_ART = { salao: lotePpt, mente: loteMente, refugio: loteRefugio } as const;

// ── Guilda, Laboratório e Hall (29/09/2026) ────────────────────────────────
// 🌙 Fundos 760×1344 do Hall e do Laboratório. 04/10/2026 (H18): REFEITOS na receita dos
// aprovados (GPT Image 2, 9:16, terreno denso com plataformas esculpidas — `entrada-dono/05-bg-*`)
// e com o mesmo pós de Arena/Exploração/Mercado/Jogos: cover 760×1344 lanczos, grade-to-home,
// 0 px de matiz 262–345 (WebP q85 ≈ 306/327 KB, teto 400). As posições dos lotes em
// `utils/areaSheetCopy.ts` (`LABORATORIO_LOTS`/`HALL_LOTS`) seguem as plataformas novas.
import bgHall from './bg-hall.png';
import bgLaboratorio from './bg-laboratorio.png';

export const HALL_BG = bgHall;
export const LABORATORIO_BG = bgLaboratorio;

// 🏗️ Prédios próprios do Laboratório e do Hall (30/09/2026, leva lotes-v2
// aprovada pelo dono — `E:/Soulmon-assets/out/rodada3/lotes-v2/MANIFEST.md`,
// versão limpa `final/`, 300² alfa binário). Até aqui eram empréstimos das
// isométricas do Mercado e de Jogos.
import loteEvolucao from './lote-laboratorio-evolucao.png';
import lotePet from './lote-laboratorio-pet.png';
import loteStats from './lote-laboratorio-stats.png';
import loteBiblioteca from './lote-hall-biblioteca.png';
import loteAmigos from './lote-hall-amigos-campina.png';
import loteGuilda from './lote-hall-guilda-luz.png';

export const LABORATORIO_LOT_ART = {
  evolucao: loteEvolucao,
  pet: lotePet,
  stats: loteStats,
} as const;

export const HALL_LOT_ART = {
  biblioteca: loteBiblioteca,
  amigos: loteAmigos,
  guilda: loteGuilda,
} as const;
