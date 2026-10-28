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
// 14/10/2026 (dono): o RESTAURANTE EM OBRA, canto de baixo à direita (Higgsfield gpt_image_2_5 flare, 300², alfa real). Só vitrine, sem ação.
import loteRestaurante from './lote-mercado-restaurante.png';
import loteTorneio from './lote-arena-torneio.png';
import loteDuelo from './lote-arena-duelo.png';
import loteGuerra from './lote-arena-guerra.png';

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
  restaurante: loteRestaurante,
} as const;

// W5 (19/10/2026): a Guerra foi repintada (coliseu em pedra petróleo com bandeiras vermelhas, sem ossos/grifo; escolha padrão `arena-guerra-a`, 512², alfa real). A versão de 18/10 (grifo e serpente de ossos) saiu do bundle.
// beta3 N10: a Fenda Sem Fim (Masmorra) mora na Arena; reusa a arte do prédio da Masmorra.
export const ARENA_LOT_ART = { torneio: loteTorneio, duelo: loteDuelo, guerra: loteGuerra, fenda: loteEndlessRift } as const;

// ── Exploração e Jogos (F5, PR #118) ───────────────────────────────────────
// Fundos reduzidos para 760×1344 (a mesma medida do Mercado/Arena) para caber
// no teto de 400 KB por imagem de `orcamentoDeBytes.contract.test.ts`.
import bgExploracao from './bg-exploracao.png';
import bgJogos from './bg-jogos.png';
// 28/10/2026 (beta3, aprovado pelo dono): prédio PRÓPRIO do Endless Rift (`p2-01-endless-rift`, 512²→300², alfa binário); `lote-exploracao-masmorra.png` fica em disco, sem import.
import loteEndlessRift from './lote-exploracao-endless-rift.png';
import loteJogosDungeon from './lote-jogos-dungeon-cripta.png';
import lotePpt from './lote-jogos-ppt.png';
// ⚠️ SEM CONSUMIDOR desde 30/09/2026: `lote-exploracao-dino.png` só emprestava a
// arte ao Ateliê da Mente, que ganhou prédio próprio. O arquivo fica em disco
// (fora do bundle, sem import) para quando a Corrida ganhar lote de novo.
import lotePasseio from './lote-exploracao-passeio.png';
// 🛠️ 04/10/2026: prédios PRÓPRIOS da Oficina do Foco (oficina de artesão com timers de cristal, NPC Tique)
// e do Caderno (casinha-tinteiro com pena, NPC Sépia) — `entrada-dono/lote-exploracao-*` (GPT Image 2.5
// Flare, alfa real), mesmo pós dos lotes-v2 (300², alfa binário). Até aqui emprestavam o Observatório e a
// Biblioteca. As versões `-b` ficaram fora do bundle (`E:/Soulmon-assets/instalados/alternativas/`).
// 🏞️ 07/10/2026 (escolha do dono): Oficina = santuário do domínio Akasha, Caderno = santuário do Pântano (cópias de `dominios/*/predios`, alfa real).
import loteOficina from './lote-exploracao-oficina-v3.png';
// 🏡 11/10/2026 (pedido do dono: "o prédio do jornal é massa mas muito misturado com o background"): o Caderno troca o santuário do
// Pântano (verde-escuro sobre a clareira verde-escura) pelo chalé de sapé `-campina`, que já estava em disco — amarelo-quente
// sobre o fundo teal, é o prédio que mais SE DESTACA da Exploração (medido sobre o fundo; folha de contato na PR). O Pântano fica em disco.
// 11/10/2026 (dono, 2ª rodada: "o ícone do prédio do jornal não tá legal"): o chalé de sapé era bonito mas NÃO DIZ "caderno" —
// lia como uma casa qualquer. Volta a casa do TINTEIRO com a pena no telhado (`lote-exploracao-caderno.png`, arte própria que já
// estava em disco): é o único dos três que se reconhece como diário só pela silhueta. O chalé `-campina` e o santuário `-pantano`
// ficam em disco, sem import. (Se o dono achar que mistura com o fundo de novo, a alternativa é o halo, não outro chalé.)
// 18/10/2026 (revisão 2, D6): Caderno e Oficina fora do tema (casa do tinteiro / torre branca) -> prédios NOVOS no kit do Mapa (pedra petróleo, cobre, cristais turquesa, vinhas): Caderno = scriptorium com livro aberto e pena; Oficina = ampulhetas de cristal. Os antigos ficam em disco, sem import.
import loteCaderno from './lote-exploracao-caderno-v3.png';
// 🎨 07/10/2026: o dono NÃO gostou da reforma e Mente/Oficina/Caderno/Amigos voltaram à arte original (as `-akasha`/`-deserto`/`-campina` ficam em disco, sem import). Nota antiga da reforma: prédios de DOMÍNIO (`../../dominios/<dom>/predios`, arte própria já no repo) copiados
// para cá — o contrato de geometria lê só esta pasta. Trocaram os quatro lotes teal-sobre-teal (Mente, Oficina, Caderno e
// os do Hall); as artes antigas ficam em disco, sem import (`lote-jogos-mente`, `lote-exploracao-oficina`/`caderno`,
// `lote-hall-amigos`/`guilda`), para voltar se o dono quiser.
import loteMente from './lote-jogos-mente.png';
import loteRefugio from './lote-jogos-refugio.png';

export const PLAY_AREA_BG = { exploracao: bgExploracao, jogos: bgJogos } as const;

// `passeio` (30/09/2026, leva lotes-v2): a ilha flutuante com arco de raízes.
export const EXPLORACAO_LOT_ART = { passeio: lotePasseio, oficina: loteOficina, caderno: loteCaderno, refugio: loteRefugio } as const;

// 🏛️ Os três prédios de Jogos (30/09/2026). O Salão herda as duas artes que já
// eram dele por conteúdo (o PPT; o Dino mudou da Exploração para cá).
// `mente` e `refugio`: prédios próprios desde 30/09/2026 (leva lotes-v2). 04/10/2026 (J5): o Refúgio
// trocou a casinha de cogumelo PROVISÓRIA pela casa-gruta com cachoeira e lago (`entrada-dono/36-*`).
// beta3 M3: o Refúgio foi para a Exploração; o Calabouço reusa a arte da Masmorra (provisória).
export const JOGOS_LOT_ART = { salao: lotePpt, mente: loteMente, dungeon: loteJogosDungeon } as const;

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
// 14/10/2026 (lote P2b): prédio próprio do Perfil, o espelho que lê a alma (Higgsfield gpt_image_2_5 flare, 300², alfa real).
import lotePerfil from './lote-laboratorio-perfil.png';
import loteBiblioteca from './lote-hall-biblioteca.png';
// 07/10/2026 (escolha do dono): o Círculo de Amigos usa o abrigo do domínio Terra.
import loteAmigos from './lote-hall-amigos-terra.png';
import loteGuilda from './lote-hall-guilda-luz.png';

// D-50 (19/10/2026): a Biblioteca e o Círculo de Amigos mudaram do Hall para o Laboratório — a arte é a mesma de antes.
export const LABORATORIO_LOT_ART = {
  evolucao: loteEvolucao,
  pet: lotePet,
  stats: loteStats,
  perfil: lotePerfil,
  biblioteca: loteBiblioteca,
  amigos: loteAmigos,
} as const;

// W5 (19/10/2026, escolha do dono): o Grove ganhou prédio PRÓPRIO — pavilhão de cristal em volta de uma árvore jovem luminosa (Higgsfield gpt_image_2_5 flare, 512², alfa real).
// O chalé de campina (`lote-hall-amigos-campina.png`) que ele emprestava fica em disco, sem import.
import loteGrove from './lote-hall-grove.png';

export const HALL_LOT_ART = {
  guilda: loteGuilda,
  grove: loteGrove,
  // `feira` (01/10/2026, leva lotes-v2 `lote-arena-feira`, a tenda-cúpula listrada própria): mudou da Arena para o Hall em 11/10/2026
  // (a Feira é a Missão da guilda). O arquivo mantém o nome da leva.
  feira: loteFeira,
} as const;
