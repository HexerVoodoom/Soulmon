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

export type ExploracaoLotId = 'passeio' | 'oficina' | 'caderno' | 'refugio';
export type JogosLotId = 'salao' | 'mente' | 'dungeon';

interface PlayLotSpec<K extends string> {
  id: K;
  labelPt: string; labelEn: string;
  ariaPt: string; ariaEn: string;
  left: string; top: string;
  /** Largura em % da cena; sem ela, a do molde (`LOT_WIDTH_DEFAULT`, 38%). */
  width?: string;
}

// 🧩 W12 (20/10/2026, dono: "encaixa bem certinho os prédios nas áreas"): posições REMEDIDAS nos PNG (`tools/w12-mapas.py`, tabela PLAT; prévias em
// `_gemini_out/w5-arte-20261019/previas/w12-*`). Referência: tela 390×844 (o `cover` corta ~11% de cada lado). Jogos: o círculo de cima (centro 52/31, 74%×24% da cena),
// o lobo de cima da clareira de baixo (53/59) e o de baixo (51/76). Exploração: Masmorra e Passeio recentrados nos tablados (os dois de baixo ficam como estavam: chão
// livre, sem borda).
// 🔭 02/10/2026 (H10 de Jogos + auditoria de proporção do H12): os sprites de torre/casa são ALTOS e
// ESTREITOS (opaco ~52% da largura), então no lote padrão de 38% o prédio ocupava ~20% da tela, pequeno
// perto do tablado/clareira. Lotes maiores (46–56%) mantendo o centro do tablado/clareira (o `top` foi
// recalculado para a base do prédio ficar onde já estava).
// 🗺️ 01/10/2026 (H10, navegação do dono): os dois prédios da Exploração estavam
// soltos sobre o caminho. O fundo tem DOIS tablados de pedra escura (o de cima à
// esquerda e o do meio à direita) — cada prédio agora assenta no centro do seu.
const EXPLORACAO_LOTS: PlayLotSpec<ExploracaoLotId>[] = [
  // 🧭 O Passeio (30/09/2026, decisão do dono — `REGISTRO-DE-DECISOES.md` §5.6):
  // a clareira da DIREITA, do outro lado do caminho. Os lotes têm 38% de largura
  // centrados no `left`, então 27% ocupa 8–46% e 70% ocupa 51–89%: não se tocam.
  // EN "Stroll" e não "Trail": trilha é justamente o lugar que o parecer de
  // menores veta para as Travessias (04 R-3).
  { id: 'passeio', labelPt: 'Passeio', labelEn: 'Stroll', ariaPt: 'Abrir o Passeio', ariaEn: 'Open the Stroll', left: '79.9%', top: '34.1%', width: '56%' }, // tablado do meio, à direita
  // 🛠️ 04/10/2026 (pedido do dono, `docs/PLANO-OFICINA-FOCO.md`): a GRANDE clareira de baixo, que estava
  // vazia, ganha dois prédios lado a lado — técnicas de foco/produtividade e o Caderno (journaling).
  // PT "Caderno" e não "Diário": já existe o Diário de Aventuras (o álbum do pet).
  { id: 'oficina', labelPt: 'Oficina do Foco', labelEn: 'Focus Workshop', ariaPt: 'Entrar na Oficina do Foco', ariaEn: 'Enter the Focus Workshop', left: '28%', top: '86%', width: '62%' },
  { id: 'caderno', labelPt: 'Caderno', labelEn: 'Journal', ariaPt: 'Abrir o Caderno', ariaEn: 'Open the Journal', left: '28%', top: '54%', width: '47%' }, // W5 (19/10/2026): arte nova (caixa opaca 54%) → 44% -> 47% para manter ≥24% da cena; 18/10/2026 (§88): a arte repintada ficou mais estreita na caixa, então 40% -> 44% (centro mantido). 11/10/2026 (dono): o Caderno/Jornal sobe para o espaço ENTRE a Masmorra e a Oficina do Foco (coluna da esquerda: 3 prédios); o canto de baixo à direita, onde ele estava, fica LIVRE (reservado p/ um prédio futuro). Chalé campina (opaco ~89% da caixa).
  // 🫧 beta3 M3 (25/10/2026): o Refúgio saiu de Jogos para a Exploração (id e comportamento mantidos). Coluna da direita, entre o Passeio (base 34%) e o Preparar (base 84%).
  { id: 'refugio', labelPt: 'Refúgio', labelEn: 'Refuge', ariaPt: 'Entrar no Refúgio', ariaEn: 'Enter the Refuge', left: '78%', top: '57%', width: '40%' },
];

// 🍄 01/10/2026 (H13, navegação do dono): redistribuídos pelas duas clareiras de
// terra. Salão e Ateliê dividem a clareira oval de cima, cada um no seu lado e
// longe da borda; o Refúgio desce para o meio da clareira de baixo, longe da
// escadinha (antes encostava nela).
const JOGOS_LOTS: PlayLotSpec<JogosLotId>[] = [
  { id: 'salao', labelPt: 'Salão de Jogos', labelEn: 'Game Hall', ariaPt: 'Entrar no Salão de Jogos', ariaEn: 'Enter the Game Hall', left: '51.7%', top: '31.2%', width: '58%' }, // W12 (20/10/2026): DESCE 28→31 e centraliza na clareira de cima (centro medido ~52/31), maior 52→58%
  { id: 'mente', labelPt: 'Ateliê da Mente', labelEn: 'Mind Workshop', ariaPt: 'Entrar no Ateliê da Mente', ariaEn: 'Enter the Mind Workshop', left: '53.2%', top: '58.5%', width: '55%' }, // W12: maior 50→55%, centrado no lobo de cima da clareira de baixo (53/59); os três ficam em coluna (H11: o rótulo do Salão não encosta no Ateliê, nem o rótulo deste no Refúgio)
  // 🗝️ beta3 M3 (25/10/2026): o Calabouço (jogo rogue, lane M7) ocupa o lugar que o Refúgio deixou — lobo de baixo da clareira. Arte PROVISÓRIA (reusa a da Masmorra).
  { id: 'dungeon', labelPt: 'Calabouço', labelEn: 'Dungeon', ariaPt: 'Entrar no Calabouço', ariaEn: 'Enter the Dungeon', left: '51.2%', top: '90%', width: '46%' },
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
