/**
 * OS LOTES DAS ÁREAS DE JOGAR (minimal-ui F5 — Exploração e Jogos).
 *
 * Dono único da copy dos lotes destas duas áreas (rótulo PT/EN, o que o leitor
 * de tela anuncia) e da posição do CENTRO DA BASE em % da cena, tirada dos
 * mocks aprovados (`propostas/exploracao/mock.html`,
 * `propostas/jogos/mock.html`) e descontada a barra do topo, que no app mora
 * no `AreaTopBar`, fora da cena.
 *
 * O lote de Jogos se chama "Pedra, papel e tesoura" e não "Duelo" como no
 * mock: a Arena já tem um lote "Duelo" (a `ArenaGame`), e dois lotes com o
 * mesmo nome abrindo jogos diferentes em áreas vizinhas é o jogador tocando
 * no errado.
 *
 * 🏛️ **Os três prédios de Jogos (30/09/2026, pedido do dono).** A área Jogos
 * deixou de ter um lote só e passou a ter TRÊS construções, cada uma com um
 * propósito (`docs/BENCHMARK-MINIJOGOS.md` §6):
 *  · **Salão de Jogos** — jogos livres, sem outra pretensão: Corrida com obstáculos
 *    (que saiu da Exploração, que ficou só com a Masmorra) e PPT;
 *  · **Ateliê da Mente** — jogos que exercitam uma função (memória de
 *    sequência, inibição, troca de regra, lógica, revisão espaçada);
 *  · **Refúgio** — para momentos difíceis: respiração e bolhas calmas. Não
 *    paga nada, não pontua, e mostra o aviso de ajuda profissional.
 * As posições repetem o arranjo de três construções do Laboratório e do Hall.
 *
 * 🧭 **O Passeio (30/09/2026, pedido do dono).** A Exploração volta a ter dois
 * lotes: a Masmorra e o Passeio — para onde o Soulmon sai à noite e as
 * Travessias que abrem regiões novas (`components/play/PasseioSheet.tsx`).
 */
import type { Language } from './i18n';

export type ExploracaoLotId = 'masmorra' | 'passeio' | 'oficina' | 'caderno';
export type JogosLotId = 'salao' | 'mente' | 'refugio';

interface PlayLotSpec<K extends string> {
  id: K;
  labelPt: string; labelEn: string;
  ariaPt: string; ariaEn: string;
  left: string; top: string;
  /** Largura em % da cena; sem ela, a do molde (`LOT_WIDTH_DEFAULT`, 38%). */
  width?: string;
}

// 🔭 02/10/2026 (H10 de Jogos + auditoria de proporção do H12): os sprites de torre/casa são ALTOS e
// ESTREITOS (opaco ~52% da largura), então no lote padrão de 38% o prédio ocupava ~20% da tela, pequeno
// perto do tablado/clareira. Lotes maiores (46–56%) mantendo o centro do tablado/clareira (o `top` foi
// recalculado para a base do prédio ficar onde já estava).
// 🗺️ 01/10/2026 (H10, navegação do dono): os dois prédios da Exploração estavam
// soltos sobre o caminho. O fundo tem DOIS tablados de pedra escura (o de cima à
// esquerda e o do meio à direita) — cada prédio agora assenta no centro do seu.
const EXPLORACAO_LOTS: PlayLotSpec<ExploracaoLotId>[] = [
  { id: 'masmorra', labelPt: 'Masmorra', labelEn: 'Dungeon', ariaPt: 'Entrar na Masmorra', ariaEn: 'Enter the Dungeon', left: '24%', top: '22%', width: '52%' }, // tablado de cima, à esquerda
  // 🧭 O Passeio (30/09/2026, decisão do dono — `REGISTRO-DE-DECISOES.md` §5.6):
  // a clareira da DIREITA, do outro lado do caminho. Os lotes têm 38% de largura
  // centrados no `left`, então 27% ocupa 8–46% e 70% ocupa 51–89%: não se tocam.
  // EN "Stroll" e não "Trail": trilha é justamente o lugar que o parecer de
  // menores veta para as Travessias (04 R-3).
  { id: 'passeio', labelPt: 'Passeio', labelEn: 'Stroll', ariaPt: 'Abrir o Passeio', ariaEn: 'Open the Stroll', left: '76%', top: '37%', width: '56%' }, // tablado do meio, à direita
  // 🛠️ 04/10/2026 (pedido do dono, `docs/PLANO-OFICINA-FOCO.md`): a GRANDE clareira de baixo, que estava
  // vazia, ganha dois prédios lado a lado — técnicas de foco/produtividade e o Caderno (journaling).
  // PT "Caderno" e não "Diário": já existe o Diário de Aventuras (o álbum do pet).
  { id: 'oficina', labelPt: 'Oficina do Foco', labelEn: 'Focus Workshop', ariaPt: 'Entrar na Oficina do Foco', ariaEn: 'Enter the Focus Workshop', left: '28%', top: '86%', width: '50%' },
  { id: 'caderno', labelPt: 'Caderno', labelEn: 'Journal', ariaPt: 'Abrir o Caderno', ariaEn: 'Open the Journal', left: '71%', top: '90%', width: '40%' },
];

// 🍄 01/10/2026 (H13, navegação do dono): redistribuídos pelas duas clareiras de
// terra. Salão e Ateliê dividem a clareira oval de cima, cada um no seu lado e
// longe da borda; o Refúgio desce para o meio da clareira de baixo, longe da
// escadinha (antes encostava nela).
const JOGOS_LOTS: PlayLotSpec<JogosLotId>[] = [
  { id: 'salao', labelPt: 'Salão de Jogos', labelEn: 'Game Hall', ariaPt: 'Entrar no Salão de Jogos', ariaEn: 'Enter the Game Hall', left: '31%', top: '36%', width: '46%' },
  { id: 'mente', labelPt: 'Ateliê da Mente', labelEn: 'Mind Workshop', ariaPt: 'Entrar no Ateliê da Mente', ariaEn: 'Enter the Mind Workshop', left: '69%', top: '39%', width: '52%' },
  { id: 'refugio', labelPt: 'Refúgio', labelEn: 'Refuge', ariaPt: 'Entrar no Refúgio', ariaEn: 'Enter the Refuge', left: '50%', top: '76%', width: '64%' },
];

function resolveLots<K extends string>(specs: PlayLotSpec<K>[], language: Language) {
  const isPt = language === 'pt-BR';
  return specs.map(s => ({
    id: s.id,
    label: isPt ? s.labelPt : s.labelEn,
    ariaLabel: isPt ? s.ariaPt : s.ariaEn,
    left: s.left, top: s.top,
    ...(s.width ? { width: s.width } : {}),
  }));
}

export function exploracaoLots(language: Language) { return resolveLots(EXPLORACAO_LOTS, language); }
export function jogosLots(language: Language) { return resolveLots(JOGOS_LOTS, language); }
