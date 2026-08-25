// Purchasable pet-box backgrounds (pure CSS — no assets needed, 8-bit vibes).
// Keyed by shop item id; CompanionHUD is fully transparent when nothing is
// equipped (see utils/shop.ts for prices — 'bg-room' is free/pre-owned).
//
// COMPOSIÇÃO (utils/petStage.ts): cada cenário é um palco. A linha do chão de
// TODOS eles fica em GROUND_Y (74%) — é onde os pés do pet caem e onde a
// decoração se apoia. Cenário com o piso desenhado em outra altura faz a
// decoração flutuar; por isso os gradientes abaixo foram alinhados a 74%, e
// não o inverso. `setting` diz que tipo de decoração faz sentido ali e `slots`
// diz quais espaços aquele cenário oferece (nem todo cenário tem parede).
import { type SlotId, type StageSetting } from './petStage';
import bgMatrixImg from '../assets/backgrounds/bg-matrix.png';
import bgOceanImg from '../assets/backgrounds/bg-ocean.png';
import bgGameboyImg from '../assets/backgrounds/bg-gameboy.png';
import bgAtticImg from '../assets/backgrounds/bg-attic.png';
import bgArcadeImg from '../assets/backgrounds/bg-arcade.png';
import bgLibraryImg from '../assets/backgrounds/bg-library.png';
import bgShrineImg from '../assets/backgrounds/bg-shrine.png';
import bgRooftopImg from '../assets/backgrounds/bg-rooftop.png';
import bgCloudseaImg from '../assets/backgrounds/bg-cloudsea.png';
import bgObservatoryImg from '../assets/backgrounds/bg-observatory.png';
import bgSwampImg from '../assets/backgrounds/bg-swamp.png';

/**
 * Só chão — para cenas de céu aberto sem nenhuma superfície vertical (planície
 * de neve, deserto, pico da montanha). Um estandarte pendurado no nada ali
 * pareceria bug, não decoração.
 */
const GROUND_SLOTS: SlotId[] = ['rug', 'floor-left', 'trophy', 'floor-right'];
/** Chão + o espaço suspenso (parede, mastro, galho) — o conjunto completo. */
const FULL_SLOTS: SlotId[] = [...GROUND_SLOTS, 'wall'];

export interface PetBackground {
  namePt: string;
  nameEn: string;
  /** CSS `background` shorthand value. */
  css: string;
  /** Onde a cena se passa — define que decoração combina (ver petStage.ts). */
  setting: StageSetting;
  /** Espaços de decoração que ESTE cenário oferece. */
  slots: SlotId[];
  /**
   * Cor de base atrás da arte, para cenário PINTADO (`url(...)`). O visor
   * desenha a arte com `auto 100%` para não deformar o pixel nem perder a
   * linha do chão; numa caixa mais larga que a proporção da arte sobra área, e
   * é esta cor que a preenche. Ausente em cenário de gradiente, que se estica
   * sozinho.
   */
  baseColor?: string;
  /**
   * Altura (%) em que o CHÃO começa neste cenário — o horizonte. Tem que ser
   * MENOR OU IGUAL a GROUND_Y, senão o pet e a decoração ficam apoiados no céu.
   * É um número declarado, e não deduzido do CSS, porque o CSS de um cenário é
   * uma pilha de gradientes onde "74%" tanto pode ser a linha do piso quanto a
   * coordenada horizontal de uma estrela — foi exatamente assim que a primeira
   * versão do teste passou sem verificar nada. Ausente em cenários 'void'.
   */
  horizonY?: number;
}

export const PET_BACKGROUNDS: Record<string, PetBackground> = {
  // Cenário comprado com Emblemas (aba Torneio da loja).
  'bg-arena-champion': {
    namePt: 'Arena dos Campeões',
    nameEn: "Champions' Arena",
    css: [
      'radial-gradient(60px 22px at 50% 86%, rgba(255,215,120,0.55), transparent 70%)',
      'linear-gradient(180deg, transparent 70%, #b98a3a 70%, #b98a3a 74%, transparent 74%)',
      'repeating-linear-gradient(90deg, #7a5a2a 0 14px, #8b6832 14px 28px)',
      'linear-gradient(180deg, #2b2140 0%, #4a3866 58%, #7a5a2a 58%)',
    ].join(', '),
    setting: 'outdoor', slots: FULL_SLOTS, horizonY: 58,
  },
  'bg-arena-spotlight': {
    namePt: 'Arena sob Holofotes',
    nameEn: 'Spotlight Arena',
    css: [
      'radial-gradient(70px 34px at 50% 88%, rgba(255,246,200,0.75), transparent 72%)',
      'repeating-linear-gradient(200deg, rgba(255,246,200,0.16) 0 7px, transparent 7px 32px)',
      'repeating-linear-gradient(160deg, rgba(255,246,200,0.16) 0 7px, transparent 7px 32px)',
      'linear-gradient(180deg, transparent 74%, #3a3450 74%, #3a3450 78%, transparent 78%)',
      'linear-gradient(180deg, #0d0a18 0%, #1a1430 52%, #2a2140 74%)',
    ].join(', '),
    setting: 'outdoor', slots: FULL_SLOTS, horizonY: 74,
  },
  'bg-room': {
    namePt: 'Quarto',
    nameEn: 'Bedroom',
    css: [
      'radial-gradient(30px 38px at 74% 28%, #bae6fd 49%, transparent 51%)',
      'linear-gradient(180deg, transparent 40%, #d8bd8f 40%, #d8bd8f 42%, transparent 42%)',
      'linear-gradient(90deg, transparent 62%, #d8bd8f 62%, #d8bd8f 64%, transparent 64%)',
      'linear-gradient(180deg, transparent 74%, #b98f5c 74%, #b98f5c 78%, #8a6a42 78%)',
      'linear-gradient(180deg, #fdf1de 0%, #fbe6c6 60%, #f6d9a8 100%)',
    ].join(', '),
    setting: 'indoor', slots: FULL_SLOTS, horizonY: 74,
  },
  'bg-night': {
    namePt: 'Céu Noturno',
    nameEn: 'Night Sky',
    css: [
      'radial-gradient(1px 1px at 12% 22%, #fff 50%, transparent 51%)',
      'radial-gradient(1px 1px at 34% 10%, #fff 50%, transparent 51%)',
      'radial-gradient(2px 2px at 58% 30%, #ffe9a8 50%, transparent 51%)',
      'radial-gradient(1px 1px at 76% 14%, #fff 50%, transparent 51%)',
      'radial-gradient(1px 1px at 90% 40%, #fff 50%, transparent 51%)',
      'radial-gradient(1px 1px at 22% 48%, #fff 50%, transparent 51%)',
      'linear-gradient(180deg, transparent 74%, #2a2550 74%, #2a2550 78%, #191436 78%)',
      'linear-gradient(180deg, #0b1026 0%, #1b2350 70%, #2c2a5e 100%)',
    ].join(', '),
    setting: 'outdoor', slots: GROUND_SLOTS, horizonY: 74,   // céu aberto: nada onde pendurar
  },
  'bg-desert': {
    namePt: 'Deserto Pixel',
    nameEn: 'Pixel Desert',
    css: [
      'radial-gradient(28px 28px at 78% 22%, #ffd75e 49%, transparent 51%)',
      'linear-gradient(180deg, transparent 66%, #c98a4b 66%, #c98a4b 74%, #b0713a 74%)',
      'linear-gradient(180deg, #ff9a5c 0%, #ffb56b 55%, #e8a05c 100%)',
    ].join(', '),
    setting: 'outdoor', slots: GROUND_SLOTS, horizonY: 66,   // céu aberto: nada onde pendurar
  },
  'bg-matrix': {
    namePt: 'Matriz Verde',
    nameEn: 'Green Matrix',
    css: `url(${bgMatrixImg})`,
    setting: 'void', slots: [],
  },
  'bg-forest': {
    namePt: 'Floresta Nativa',
    nameEn: 'Native Forest',
    css: [
      'radial-gradient(22px 30px at 18% 62%, #166534 49%, transparent 51%)',
      'radial-gradient(26px 34px at 46% 60%, #15803d 49%, transparent 51%)',
      'radial-gradient(22px 30px at 74% 63%, #166534 49%, transparent 51%)',
      'radial-gradient(18px 26px at 95% 64%, #15803d 49%, transparent 51%)',
      'linear-gradient(180deg, transparent 74%, #14532d 74%, #14532d 80%, #052e16 80%)',
      'linear-gradient(180deg, #7dd3fc 0%, #bae6fd 55%, #86efac 100%)',
    ].join(', '),
    setting: 'outdoor', slots: FULL_SLOTS, horizonY: 74,
  },
  'bg-ocean': {
    namePt: 'Fundo do Mar',
    nameEn: 'Deep Sea',
    css: `url(${bgOceanImg})`,
    setting: 'void', slots: [],
  },
  'bg-gameboy': {
    namePt: 'LCD Retrô',
    nameEn: 'Retro LCD',
    css: `url(${bgGameboyImg})`,
    setting: 'void', slots: [],
  },
  'bg-snow': {
    namePt: 'Terra Gelada',
    nameEn: 'Freezeland',
    css: [
      'radial-gradient(2px 2px at 14% 22%, #fff 50%, transparent 51%)',
      'radial-gradient(2px 2px at 38% 12%, #fff 50%, transparent 51%)',
      'radial-gradient(2px 2px at 60% 28%, #fff 50%, transparent 51%)',
      'radial-gradient(2px 2px at 84% 16%, #fff 50%, transparent 51%)',
      'radial-gradient(2px 2px at 26% 46%, #fff 50%, transparent 51%)',
      'radial-gradient(2px 2px at 70% 52%, #fff 50%, transparent 51%)',
      'linear-gradient(180deg, transparent 74%, #e0f2fe 74%, #e0f2fe 82%, #bae6fd 82%)',
      'linear-gradient(180deg, #60a5fa 0%, #93c5fd 55%, #dbeafe 100%)',
    ].join(', '),
    setting: 'outdoor', slots: GROUND_SLOTS, horizonY: 74,   // céu aberto: nada onde pendurar
  },
  'bg-lava': {
    namePt: 'Montanha de Lava',
    nameEn: 'Lava Mountain',
    css: [
      'radial-gradient(3px 3px at 28% 64%, #fde047 50%, transparent 51%)',
      'radial-gradient(2px 2px at 55% 56%, #fb923c 50%, transparent 51%)',
      'radial-gradient(3px 3px at 78% 68%, #fde047 50%, transparent 51%)',
      'radial-gradient(2px 2px at 42% 38%, #f97316 50%, transparent 51%)',
      'linear-gradient(180deg, transparent 74%, #ea580c 74%, #f97316 80%, #7c2d12 80%)',
      'linear-gradient(180deg, #1c0a06 0%, #431407 60%, #7c2d12 100%)',
    ].join(', '),
    setting: 'outdoor', slots: FULL_SLOTS, horizonY: 74,
  },
  'bg-sakura': {
    namePt: 'Cerejeira',
    nameEn: 'Cherry Blossom',
    css: [
      'radial-gradient(3px 3px at 18% 28%, #f472b6 50%, transparent 51%)',
      'radial-gradient(2px 2px at 42% 14%, #f9a8d4 50%, transparent 51%)',
      'radial-gradient(3px 3px at 64% 34%, #f472b6 50%, transparent 51%)',
      'radial-gradient(2px 2px at 84% 20%, #f9a8d4 50%, transparent 51%)',
      'radial-gradient(3px 3px at 30% 52%, #ec4899 50%, transparent 51%)',
      'radial-gradient(2px 2px at 74% 58%, #f472b6 50%, transparent 51%)',
      'linear-gradient(180deg, transparent 74%, #86efac 74%)',
      'linear-gradient(180deg, #fdf2f8 0%, #fce7f3 55%, #fbcfe8 100%)',
    ].join(', '),
    setting: 'outdoor', slots: FULL_SLOTS, horizonY: 74,
  },
  'bg-toytown': {
    namePt: 'Cidade dos Brinquedos',
    nameEn: 'Toy Town',
    css: [
      'radial-gradient(4px 4px at 20% 28%, #fff 50%, transparent 51%)',
      'radial-gradient(4px 4px at 55% 16%, #fff 50%, transparent 51%)',
      'radial-gradient(4px 4px at 82% 34%, #fff 50%, transparent 51%)',
      'linear-gradient(180deg, transparent 74%, #f87171 74%, #f87171 82%, #fbbf24 82%, #fbbf24 90%, #34d399 90%)',
      'linear-gradient(180deg, #a5f3fc 0%, #cffafe 60%, #fef9c3 100%)',
    ].join(', '),
    setting: 'outdoor', slots: FULL_SLOTS, horizonY: 74,
  },
  'bg-synthwave': {
    namePt: 'Synthwave',
    nameEn: 'Synthwave',
    css: [
      'radial-gradient(30px 30px at 50% 34%, #fbbf24 49%, transparent 51%)',
      'linear-gradient(180deg, transparent 33%, rgba(219,39,119,0.5) 34%, transparent 35%, transparent 40%, rgba(219,39,119,0.5) 41%, transparent 42%)',
      'linear-gradient(180deg, transparent 74%, rgba(244,114,182,0.9) 74%, transparent 75.5%, transparent 82%, rgba(244,114,182,0.65) 82%, transparent 83.5%, transparent 90%, rgba(244,114,182,0.45) 90%, transparent 91.5%)',
      'linear-gradient(180deg, #2e1065 0%, #6d28d9 40%, #db2777 72%, #1e1b4b 74%, #312e81 100%)',
    ].join(', '),
    setting: 'outdoor', slots: GROUND_SLOTS, horizonY: 74,   // só a grade: nada onde pendurar
  },
  // ── Cenários PINTADOS (kit v1.2) ──────────────────────────────────────────
  // Os oito abaixo não são gradiente: são arte de verdade, 1200×648, desenhada
  // com o chão JÁ na linha do palco. É por isso que o `horizonY` deles não
  // aparece em camada nenhuma de CSS — não há camada. O teste de deriva em
  // `petStage.test.ts` só sabe conferir gradiente, então ele pula quem começa
  // com `url(`; o que garante estes é a arte ter sido encomendada para a
  // caixa, do mesmo jeito que a decoração.
  //
  // O `baseColor` existe por causa destes oito e só deles: o VISOR os desenha
  // com `auto 100%` (ver CompanionHUD), porque a ALTURA é o eixo onde mora a
  // linha do chão e é ela que tem de mapear 1:1 sempre. `cover` — que foi a
  // primeira tentativa — parece certo no celular e QUEBRA no desktop: numa
  // caixa de 1500x185 (~8:1) ele escala pela LARGURA e o chão vai parar
  // centenas de px abaixo da borda inferior, com a decoração apoiada no que
  // sobrou do meio da parede. Com `auto 100%` o corte fica nas laterais, e a
  // cor (amostrada da faixa de baixo do próprio PNG, para ler como
  // continuação da cena e não como buraco) preenche o que sobra quando a caixa
  // é larga demais para a arte. Cenário de gradiente não precisa dela: um
  // gradiente não tem tamanho intrínseco, então `auto` já vira 100%.
  'bg-attic': {
    namePt: 'Sótão na Chuva', nameEn: 'Rainy Attic',
    css: `url(${bgAtticImg})`, baseColor: '#02120e',
    setting: 'indoor', slots: FULL_SLOTS, horizonY: 72,
  },
  'bg-arcade': {
    namePt: 'Sala de Fliperama', nameEn: 'Arcade Room',
    css: `url(${bgArcadeImg})`, baseColor: '#071d1b',
    setting: 'indoor', slots: FULL_SLOTS, horizonY: 62,
  },
  'bg-library': {
    namePt: 'Biblioteca Arcana', nameEn: 'Arcane Library',
    css: `url(${bgLibraryImg})`, baseColor: '#031615',
    setting: 'indoor', slots: FULL_SLOTS, horizonY: 70,
  },
  'bg-shrine': {
    namePt: 'Santuário de Pedra', nameEn: 'Stone Shrine',
    css: `url(${bgShrineImg})`, baseColor: '#142f2b',
    setting: 'outdoor', slots: FULL_SLOTS, horizonY: 72,
  },
  'bg-rooftop': {
    namePt: 'Telhado da Cidade', nameEn: 'City Rooftop',
    css: `url(${bgRooftopImg})`, baseColor: '#031515',
    setting: 'outdoor', slots: FULL_SLOTS, horizonY: 70,
  },
  'bg-cloudsea': {
    // Cume acima das nuvens: não há parede, mastro nem galho — só o chão.
    namePt: 'Mar de Nuvens', nameEn: 'Sea of Clouds',
    css: `url(${bgCloudseaImg})`, baseColor: '#0e2f2a',
    setting: 'outdoor', slots: GROUND_SLOTS, horizonY: 73,
  },
  'bg-observatory': {
    namePt: 'Observatório', nameEn: 'Observatory',
    css: `url(${bgObservatoryImg})`, baseColor: '#395146',
    setting: 'indoor', slots: FULL_SLOTS, horizonY: 74,
  },
  'bg-swamp': {
    // Pântano: raiz e cipó por toda parte, mas nada que leia como "pendurado
    // de propósito" acima da cabeça do pet.
    namePt: 'Pântano Fosforescente', nameEn: 'Glowing Swamp',
    css: `url(${bgSwampImg})`, baseColor: '#021513',
    setting: 'outdoor', slots: GROUND_SLOTS, horizonY: 74,
  },
  // ── Mission-exclusive backgrounds (utils/missions.ts) — never sold ─────────
  'bg-mission-filecity': {
    namePt: 'Cidade do Arquivo',
    nameEn: 'File City',
    css: [
      'radial-gradient(10px 10px at 24% 62%, #f97316 49%, transparent 51%)',
      'radial-gradient(12px 12px at 52% 60%, #ef4444 49%, transparent 51%)',
      'radial-gradient(10px 10px at 78% 63%, #f97316 49%, transparent 51%)',
      'radial-gradient(40px 22px at 25% 70%, #4ade80 49%, transparent 51%)',
      'radial-gradient(48px 26px at 55% 72%, #22c55e 49%, transparent 51%)',
      'radial-gradient(40px 22px at 82% 71%, #4ade80 49%, transparent 51%)',
      'linear-gradient(180deg, transparent 74%, #15803d 74%)',
      'linear-gradient(180deg, #7dd3fc 0%, #bae6fd 60%, #a7f3d0 100%)',
    ].join(', '),
    setting: 'outdoor', slots: FULL_SLOTS, horizonY: 74,
  },
  'bg-mission-infinity': {
    namePt: 'Monte Infinito',
    nameEn: 'Mount Infinity',
    css: [
      'radial-gradient(2px 2px at 16% 18%, #fff 50%, transparent 51%)',
      'radial-gradient(2px 2px at 42% 10%, #e9d5ff 50%, transparent 51%)',
      'radial-gradient(2px 2px at 70% 22%, #fff 50%, transparent 51%)',
      'radial-gradient(2px 2px at 88% 12%, #e9d5ff 50%, transparent 51%)',
      'radial-gradient(90px 70px at 50% 96%, #1e1b4b 49%, transparent 51%)',
      'radial-gradient(50px 44px at 50% 78%, #312e81 49%, transparent 51%)',
      'linear-gradient(180deg, transparent 74%, #241a5c 74%, #241a5c 79%, #1a1145 79%)',
      'linear-gradient(180deg, #0f0428 0%, #2e1065 60%, #4c1d95 100%)',
    ].join(', '),
    setting: 'outdoor', slots: GROUND_SLOTS, horizonY: 74,   // céu aberto: nada onde pendurar
  },
  'bg-mission-coliseum': {
    namePt: 'Coliseu Digital',
    nameEn: 'Digital Coliseum',
    css: [
      'radial-gradient(9px 12px at 15% 42%, #78350f 49%, transparent 51%)',
      'radial-gradient(9px 12px at 38% 42%, #78350f 49%, transparent 51%)',
      'radial-gradient(9px 12px at 62% 42%, #78350f 49%, transparent 51%)',
      'radial-gradient(9px 12px at 85% 42%, #78350f 49%, transparent 51%)',
      'linear-gradient(180deg, transparent 30%, #b45309 30%, #92400e 52%, transparent 52%)',
      'linear-gradient(180deg, transparent 74%, #fbbf24 74%, #f59e0b 84%, #d97706 84%)',
      'linear-gradient(180deg, #fde68a 0%, #fcd34d 55%, #fbbf24 100%)',
    ].join(', '),
    setting: 'outdoor', slots: FULL_SLOTS, horizonY: 74,
  },
  'bg-mission-abyss': {
    namePt: 'Abismo da Masmorra',
    nameEn: 'Dungeon Abyss',
    css: [
      'radial-gradient(3px 3px at 24% 36%, #f87171 50%, transparent 51%)',
      'radial-gradient(2px 2px at 66% 24%, #fb7185 50%, transparent 51%)',
      'radial-gradient(3px 3px at 82% 56%, #f87171 50%, transparent 51%)',
      'radial-gradient(120% 70% at 50% 110%, rgba(190,18,60,0.5), transparent 60%)',
      'repeating-linear-gradient(0deg, rgba(255,0,51,0.07) 0 2px, transparent 2px 6px)',
      'linear-gradient(180deg, transparent 74%, #3a0713 74%, #3a0713 79%, #1b0208 79%)',
      'linear-gradient(180deg, #0c0104 0%, #1c0308 60%, #2c0510 100%)',
    ].join(', '),
    setting: 'outdoor', slots: FULL_SLOTS, horizonY: 74,
  },
  'bg-mission-dinoland': {
    namePt: 'Vale dos Dinos',
    nameEn: 'Dino Valley',
    css: [
      'radial-gradient(26px 26px at 74% 30%, #fde047 49%, transparent 51%)',
      'radial-gradient(70px 46px at 22% 84%, #14532d 49%, transparent 51%)',
      'radial-gradient(56px 60px at 88% 80%, #713f12 49%, transparent 51%)',
      'radial-gradient(4px 4px at 88% 56%, #f97316 50%, transparent 51%)',
      'linear-gradient(180deg, transparent 74%, #365314 74%)',
      'linear-gradient(180deg, #fb923c 0%, #f97316 45%, #c2410c 70%, #7c2d12 100%)',
    ].join(', '),
    setting: 'outdoor', slots: FULL_SLOTS, horizonY: 74,
  },
  'bg-mission-aurora': {
    namePt: 'Aurora Digital',
    nameEn: 'Digital Aurora',
    css: [
      'radial-gradient(2px 2px at 20% 30%, #fff 50%, transparent 51%)',
      'radial-gradient(2px 2px at 56% 16%, #fff 50%, transparent 51%)',
      'radial-gradient(2px 2px at 84% 34%, #fff 50%, transparent 51%)',
      'linear-gradient(115deg, transparent 30%, rgba(74,222,128,0.4) 40%, rgba(45,212,191,0.35) 50%, transparent 62%)',
      'linear-gradient(65deg, transparent 42%, rgba(167,139,250,0.35) 52%, transparent 64%)',
      'linear-gradient(180deg, transparent 74%, #e0f2fe 74%)',
      'linear-gradient(180deg, #020617 0%, #0f172a 55%, #1e293b 100%)',
    ].join(', '),
    setting: 'outdoor', slots: GROUND_SLOTS, horizonY: 74,   // céu aberto: nada onde pendurar
  },
};
