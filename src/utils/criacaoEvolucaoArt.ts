// Artes da CRIAÇÃO (tela do ovo-cristal) e da EVOLUÇÃO (EvolutionCeremony) — leva de 03/11/2026,
// revisão visual aprovada pelo dono (P1+P2 das duas telas). Fonte: E:/Soulmon-assets/criacao-evolucao/
// (PNG alfa real, exceto os fundos). Folhas fatiadas por projeção de alfa em células iguais, alinhadas pela base
// (`A_CRACK`, `B_*` de N quadros: tira horizontal, um quadro por célula quadrada).
import aBg from '../assets/soulmon/criacao-evolucao/a-bg.png';
import aHalo from '../assets/soulmon/criacao-evolucao/a-halo.png';
import aCrack from '../assets/soulmon/criacao-evolucao/a-crack.png';
import aCrystalOpen from '../assets/soulmon/criacao-evolucao/a-crystal-open.png';
import aFxTouch from '../assets/soulmon/criacao-evolucao/a-fx-touch.png';
import aHatchLight from '../assets/soulmon/criacao-evolucao/a-hatch-light.png';
// O fundo da evolução (B-bg2) SUBSTITUIU o arquivo de sempre, `bg/evolucao-bg.png` (= `SCENE_BG.evolucao`).
import bBg2 from '../assets/soulmon/bg/evolucao-bg.png';
import bCrystalBuild from '../assets/soulmon/criacao-evolucao/b-crystal-build.png';
import bCracks from '../assets/soulmon/criacao-evolucao/b-cracks.png';
import bFlash from '../assets/soulmon/criacao-evolucao/b-flash.png';
import bLeaves from '../assets/soulmon/criacao-evolucao/b-leaves.png';
import bCard from '../assets/soulmon/criacao-evolucao/b-card.png';
import bPedestal from '../assets/soulmon/criacao-evolucao/b-pedestal.png';
import bShards from '../assets/soulmon/criacao-evolucao/b-shards.png';

/** Uma tira de `frames` quadros iguais lado a lado. */
export interface Tira { src: string; frames: number }

export const CRIACAO_ART = {
  /** Fundo 720×1280 opaco: nicho de pedra, altar com runa no terço de baixo (centro do altar ≈ 71% da altura). */
  bg: aBg,
  /** Anel de runas que respira sob o cristal. */
  halo: aHalo,
  /** O cristal em 3 níveis de rachadura (0 inteiro, 1 fios, 2 luz vazando). */
  crack: { src: aCrack, frames: 3 } as Tira,
  /** O cristal já aberto, luz saindo: a espera da geração depois do "Chocar". */
  crystalOpen: aCrystalOpen,
  /** Lascas e faíscas de um toque (4 quadros). */
  fxTouch: { src: aFxTouch, frames: 4 } as Tira,
  /** A luz de Chocar (estrela turquesa). */
  hatchLight: aHatchLight,
} as const;

export const EVOLUCAO_ART = {
  /** Fundo 720×1280 opaco: santuário, altar circular com o centro em ≈ 61% da altura. */
  bg: bBg2,
  /** O cristal carregando (3 quadros: apagado → aceso → transbordando). */
  build: { src: bCrystalBuild, frames: 3 } as Tira,
  /** O cristal rachando (5 quadros). */
  cracks: { src: bCracks, frames: 5 } as Tira,
  flash: bFlash,
  /** Folhas e brilhos subindo (6 quadros). */
  leaves: { src: bLeaves, frames: 6 } as Tira,
  /** Moldura do cartão final: soquete redondo à esquerda (antes) e à direita (depois), cordão de luz. */
  card: bCard,
  pedestal: bPedestal,
  /** 8 cacos de cristal (tira de 8 células 64²). */
  shards: { src: bShards, frames: 8 } as Tira,
} as const;
