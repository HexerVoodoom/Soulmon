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
// 15/09/2026 — os 19 cenários que eram gradiente CSS (ou 800² antigos) viraram arte pintada 1200×648 (leva cenarios-20260915).
import bgRoomImg from '../assets/backgrounds/bg-room.png';
import bgArenaChampionImg from '../assets/backgrounds/bg-arena-champion.png';
import bgArenaSpotlightImg from '../assets/backgrounds/bg-arena-spotlight.png';
import bgNightImg from '../assets/backgrounds/bg-night.png';
import bgDesertImg from '../assets/backgrounds/bg-desert.png';
import bgForestImg from '../assets/backgrounds/bg-forest.png';
import bgSnowImg from '../assets/backgrounds/bg-snow.png';
import bgLavaImg from '../assets/backgrounds/bg-lava.png';
import bgSakuraImg from '../assets/backgrounds/bg-sakura.png';
import bgToytownImg from '../assets/backgrounds/bg-toytown.png';
import bgSynthwaveImg from '../assets/backgrounds/bg-synthwave.png';
import bgMissionFilecityImg from '../assets/backgrounds/bg-mission-filecity.png';
import bgMissionInfinityImg from '../assets/backgrounds/bg-mission-infinity.png';
import bgMissionColiseumImg from '../assets/backgrounds/bg-mission-coliseum.png';
import bgMissionAbyssImg from '../assets/backgrounds/bg-mission-abyss.png';
import bgMissionDinolandImg from '../assets/backgrounds/bg-mission-dinoland.png';
import bgMissionAuroraImg from '../assets/backgrounds/bg-mission-aurora.png';
// 30/09/2026 — fundos-v2 (rodada 3, aprovados pelo dono): os 5 estágios do Bosque
// deixam de ser gradiente e ganham arte pintada noturna; campina e cavernas são os
// postais do Passeio que faltavam (as duas regiões tinham `bgId: null`).
import bgGuildClareiraImg from '../assets/backgrounds/bg-guild-clareira.png';
import bgGuildRamagemImg from '../assets/backgrounds/bg-guild-ramagem.png';
import bgGuildCopaImg from '../assets/backgrounds/bg-guild-copa.png';
import bgGuildMataImg from '../assets/backgrounds/bg-guild-mata.png';
import bgGuildBosqueAntigoImg from '../assets/backgrounds/bg-guild-bosque-antigo.png';
import bgCampinaImg from '../assets/backgrounds/bg-campina.png';
import bgCavernasImg from '../assets/backgrounds/bg-cavernas.png';

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
    css: `url(${bgArenaChampionImg})`, baseColor: '#00100f',
    setting: 'outdoor', slots: FULL_SLOTS, horizonY: 58,
  },
  'bg-arena-spotlight': {
    namePt: 'Arena sob Holofotes',
    nameEn: 'Spotlight Arena',
    css: `url(${bgArenaSpotlightImg})`, baseColor: '#170c12',
    setting: 'outdoor', slots: FULL_SLOTS, horizonY: 74,
  },
  'bg-room': {
    namePt: 'Quarto',
    nameEn: 'Bedroom',
    css: `url(${bgRoomImg})`, baseColor: '#031716',
    setting: 'indoor', slots: FULL_SLOTS, horizonY: 74,
  },
  'bg-night': {
    namePt: 'Céu Noturno',
    nameEn: 'Night Sky',
    css: `url(${bgNightImg})`, baseColor: '#12111b',
    setting: 'outdoor', slots: GROUND_SLOTS, horizonY: 74,   // céu aberto: nada onde pendurar
  },
  'bg-desert': {
    namePt: 'Deserto Pixel',
    nameEn: 'Pixel Desert',
    css: `url(${bgDesertImg})`, baseColor: '#051a15',
    setting: 'outdoor', slots: GROUND_SLOTS, horizonY: 66,   // céu aberto: nada onde pendurar
  },
  'bg-matrix': {
    namePt: 'Matriz Verde',
    nameEn: 'Green Matrix',
    css: `url(${bgMatrixImg})`, baseColor: '#071d1d',
    // 15/09/2026: a arte nova tem chão em 74% — deixou de ser 'void'.
    setting: 'outdoor', slots: GROUND_SLOTS, horizonY: 74,
  },
  'bg-forest': {
    namePt: 'Floresta Nativa',
    nameEn: 'Old-Growth Forest',
    css: `url(${bgForestImg})`, baseColor: '#061414',
    setting: 'outdoor', slots: FULL_SLOTS, horizonY: 74,
  },
  'bg-ocean': {
    namePt: 'Fundo do Mar',
    nameEn: 'Deep Sea',
    css: `url(${bgOceanImg})`, baseColor: '#2b372b',
    // 15/09/2026: a arte nova tem chão em 74% — deixou de ser 'void'.
    setting: 'outdoor', slots: GROUND_SLOTS, horizonY: 74,
  },
  'bg-gameboy': {
    namePt: 'LCD Retrô',
    nameEn: 'Retro LCD',
    css: `url(${bgGameboyImg})`, baseColor: '#2f3e2b',
    // 15/09/2026: a arte nova tem chão em 74% — deixou de ser 'void'.
    setting: 'indoor', slots: GROUND_SLOTS, horizonY: 74,
  },
  'bg-snow': {
    namePt: 'Terra Gelada',
    nameEn: 'Frostlands',
    css: `url(${bgSnowImg})`, baseColor: '#12747b',
    setting: 'outdoor', slots: GROUND_SLOTS, horizonY: 74,   // céu aberto: nada onde pendurar
  },
  'bg-lava': {
    namePt: 'Montanha de Lava',
    nameEn: 'Lava Mountain',
    css: `url(${bgLavaImg})`, baseColor: '#051414',
    setting: 'outdoor', slots: FULL_SLOTS, horizonY: 74,
  },
  'bg-sakura': {
    namePt: 'Cerejeira',
    nameEn: 'Cherry Blossom',
    css: `url(${bgSakuraImg})`, baseColor: '#011210',
    setting: 'outdoor', slots: FULL_SLOTS, horizonY: 74,
  },
  'bg-toytown': {
    namePt: 'Cidade dos Brinquedos',
    nameEn: 'Toy Town',
    css: `url(${bgToytownImg})`, baseColor: '#041d21',
    setting: 'outdoor', slots: FULL_SLOTS, horizonY: 74,
  },
  'bg-synthwave': {
    namePt: 'Synthwave',
    nameEn: 'Synthwave',
    css: `url(${bgSynthwaveImg})`, baseColor: '#051316',
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
    nameEn: 'Archive City',
    css: `url(${bgMissionFilecityImg})`, baseColor: '#163a30',
    setting: 'outdoor', slots: FULL_SLOTS, horizonY: 74,
  },
  'bg-mission-infinity': {
    namePt: 'Monte Infinito',
    nameEn: 'Mount Infinity',
    css: `url(${bgMissionInfinityImg})`, baseColor: '#051513',
    setting: 'outdoor', slots: GROUND_SLOTS, horizonY: 74,   // céu aberto: nada onde pendurar
  },
  'bg-mission-coliseum': {
    namePt: 'Coliseu Digital',
    nameEn: 'Digital Coliseum',
    css: `url(${bgMissionColiseumImg})`, baseColor: '#053d3d',
    setting: 'outdoor', slots: FULL_SLOTS, horizonY: 74,
  },
  'bg-mission-abyss': {
    namePt: 'Abismo da Masmorra',
    nameEn: 'Dungeon Abyss',
    css: `url(${bgMissionAbyssImg})`, baseColor: '#041816',
    setting: 'outdoor', slots: FULL_SLOTS, horizonY: 74,
  },
  'bg-mission-dinoland': {
    namePt: 'Vale dos Dinos',
    nameEn: 'Dino Valley',
    css: `url(${bgMissionDinolandImg})`, baseColor: '#12453e',
    setting: 'outdoor', slots: FULL_SLOTS, horizonY: 74,
  },
  'bg-mission-aurora': {
    namePt: 'Aurora Digital',
    nameEn: 'Digital Aurora',
    css: `url(${bgMissionAuroraImg})`, baseColor: '#041a18',
    setting: 'outdoor', slots: GROUND_SLOTS, horizonY: 74,   // céu aberto: nada onde pendurar
  },
  // ── Cenários do BOSQUE da Guilda (`docs/PLANO-GUILDA.md` §7 e §9) ──────────
  // Ganhos por CONQUISTA (7 dias distintos de fio — `mine.groveScenes`, G12: ficam
  // com quem sai), nunca vendidos: ficam FORA de `SHOP_BG_ACCENTS`, e por isso
  // fora da loja e do sorteio da masmorra — o mesmo desenho dos `bg-mission-*`.
  // Arte pintada 1200×648 desde 30/09/2026 (fundos-v2): mesma câmera nos cinco,
  // mais elementos a cada estágio; o chão começa em 66% (≤ GROUND_Y). `baseColor`
  // amostrada da faixa de baixo (5%) de cada PNG, como nos outros pintados.
  'bg-guild-clareira': {
    namePt: 'Clareira', nameEn: 'Clearing',
    css: `url(${bgGuildClareiraImg})`, baseColor: '#173537',
    setting: 'outdoor', slots: GROUND_SLOTS, horizonY: 66,
  },
  'bg-guild-ramagem': {
    namePt: 'Ramagem', nameEn: 'Boughs',
    css: `url(${bgGuildRamagemImg})`, baseColor: '#173739',
    setting: 'outdoor', slots: FULL_SLOTS, horizonY: 66,
  },
  'bg-guild-copa': {
    namePt: 'Copa', nameEn: 'Canopy',
    css: `url(${bgGuildCopaImg})`, baseColor: '#18373b',
    setting: 'outdoor', slots: FULL_SLOTS, horizonY: 66,
  },
  'bg-guild-mata': {
    namePt: 'Mata', nameEn: 'Thicket',
    css: `url(${bgGuildMataImg})`, baseColor: '#19373b',
    setting: 'outdoor', slots: FULL_SLOTS, horizonY: 66,
  },
  'bg-guild-bosque-antigo': {
    namePt: 'Bosque antigo', nameEn: 'Old grove',
    css: `url(${bgGuildBosqueAntigoImg})`, baseColor: '#19363b',
    setting: 'outdoor', slots: FULL_SLOTS, horizonY: 66,
  },
  // ── Postais do Passeio (`data/travessiasCatalog.ts`, 30/09/2026) ──────────
  // Só o postal da região — NUNCA vendidos: ficam fora de `shop.ts` e de
  // `SHOP_BG_ACCENTS` (e por isso fora da loja e do sorteio da masmorra), como os
  // `bg-mission-*` e os `bg-guild-*`. Chão em ~74%.
  'bg-campina': {
    namePt: 'Campina', nameEn: 'Meadow',
    css: `url(${bgCampinaImg})`, baseColor: '#172a2d',
    setting: 'outdoor', slots: GROUND_SLOTS, horizonY: 74,   // céu aberto: nada onde pendurar
  },
  'bg-cavernas': {
    namePt: 'Cavernas', nameEn: 'Caves',
    css: `url(${bgCavernasImg})`, baseColor: '#183135',
    setting: 'outdoor', slots: FULL_SLOTS, horizonY: 74,
  },
};

/**
 * O cenário equipado é ESCURO? Decide qual `anim-sleep-z` a Home usa (R2-4,
 * 21/09/2026): a folha clara sobre cenário escuro, a teal sobre claro.
 * Luminância relativa da `baseColor` (a cor atrás da arte) < 0,5 = escuro;
 * sem cenário — ou cenário sem `baseColor` — o que se vê é o
 * `--sm2-viewport-bg`, escuro nos dois temas, então também é escuro.
 */
export function isDarkBackground(id: string | null | undefined): boolean {
  const hex = id ? PET_BACKGROUNDS[id]?.baseColor : undefined;
  const m = hex && /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return true;
  const v = parseInt(m[1], 16);
  const lin = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  const lum = 0.2126 * lin(v >> 16) + 0.7152 * lin((v >> 8) & 255) + 0.0722 * lin(v & 255);
  return lum < 0.5;
}
