// 🎞️ Dungeon floor backgrounds — the five "classic" floors (1..5). They were
// pure CSS gradients until 30/09/2026 (Retro Pet/VHS/Neon Sunset/CRT/Glitch —
// two of them magenta, outside the kit); the owner approved five painted
// 1080×1920 scenes (SQUAD-ARTE rodada 3, `extras/MANIFEST.md`) in the same
// petrol/turquoise/copper palette as the Home, and they replaced the gradients
// one for one. The scenes are not persisted anywhere (the run draws them into
// `useState` in `DungeonGame`), so there is no id to keep: only the names
// changed. (The VHS scanline overlay that DungeonGame used to layer on top is
// gone since the canvas Jogos, DECISÕES §25: the scene is the `cover` of a
// visor now — `games/GameKit.tsx` — and continuous motion without purpose was
// the thing `prefers-reduced-motion` never reached.)
import classicRetro from '../assets/soulmon/bg/dungeon-classic-retro.png';
import classicVhs from '../assets/soulmon/bg/dungeon-classic-vhs.png';
import classicSol from '../assets/soulmon/bg/dungeon-classic-sol.png';
import classicCrt from '../assets/soulmon/bg/dungeon-classic-crt.png';
import classicGlitch from '../assets/soulmon/bg/dungeon-classic-glitch.png';

export interface DungeonScene {
  namePt: string;
  nameEn: string;
  /** CSS `background` SHORTHAND for the battlefield (goes in `background`,
   *  never `backgroundColor` — see `GameVisor`). */
  bg: string;
  /** Accent color for the floor label / borders. */
  accent: string;
}

// `url(...) center/cover <cor>`: the trailing color is the fallback painted
// while the image loads (or if it never does) — the scene's own mean color,
// measured on the PNG, so the visor doesn't flash the default glass.
export const DUNGEON_SCENES: DungeonScene[] = [
  { nameEn: 'Floating Garden', namePt: 'Jardim Flutuante', accent: '#5fd6a8', bg: `url(${classicRetro}) center/cover #204442` },
  { nameEn: 'Terrace of Two Suns', namePt: 'Terraço dos Dois Sóis', accent: '#d9a45c', bg: `url(${classicVhs}) center/cover #264a4c` },
  { nameEn: 'Broken Observatory', namePt: 'Observatório Partido', accent: '#6fd3e8', bg: `url(${classicSol}) center/cover #284d51` },
  { nameEn: 'Mirror Lake', namePt: 'Lago-Espelho', accent: '#7fd6e0', bg: `url(${classicCrt}) center/cover #24494b` },
  { nameEn: 'Fractured Archipelago', namePt: 'Arquipélago Fraturado', accent: '#3fd2d9', bg: `url(${classicGlitch}) center/cover #244749` },
];

// Shop pet-box backgrounds doubling as dungeon floors (accent picked per bg).
// Kept as ids into PET_BACKGROUNDS so the CSS lives in one place.
import { PET_BACKGROUNDS } from './backgrounds';
import dungeonBg1 from '../assets/soulmon/bg/dungeon-1.png';
import dungeonBg2 from '../assets/soulmon/bg/dungeon-2.png';
import dungeonBg3 from '../assets/soulmon/bg/dungeon-3.png';
import dungeonBg4 from '../assets/soulmon/bg/dungeon-4.png';
import dungeonBg5 from '../assets/soulmon/bg/dungeon-5.png';
import dungeonBg6 from '../assets/soulmon/bg/dungeon-6.png';
import dungeonBg7 from '../assets/soulmon/bg/dungeon-7.png';
import dungeonBg8 from '../assets/soulmon/bg/dungeon-8.png';
import dungeonBg9 from '../assets/soulmon/bg/dungeon-9.png';
import dungeonBg10 from '../assets/soulmon/bg/dungeon-10.png';
import ruinedHall from '../assets/soulmon/bg/minigame-dino.png';
import arenaNight from '../assets/soulmon/bg/tournament-night.png';
import arenaFinal from '../assets/soulmon/bg/tournament-final.png';

// Cenários espirituais (Soulmon) — cavernas geradas, uma paleta por "andar".
const SPIRIT_BG_SCENES: DungeonScene[] = [
  { namePt: 'Gruta Azul', nameEn: 'Blue Grotto', accent: '#4f8fd9', bg: `url(${dungeonBg1}) center/cover` },
  { namePt: 'Caverna Verde', nameEn: 'Green Cavern', accent: '#3fae5a', bg: `url(${dungeonBg2}) center/cover` },
  { namePt: 'Salão Dourado', nameEn: 'Golden Hall', accent: '#d9a441', bg: `url(${dungeonBg3}) center/cover` },
  { namePt: 'Abismo Violeta', nameEn: 'Violet Abyss', accent: '#8f7fe8', bg: `url(${dungeonBg4}) center/cover` },
  { namePt: 'Fenda Rósea', nameEn: 'Rose Rift', accent: '#d96a8a', bg: `url(${dungeonBg5}) center/cover` },
  // Segunda leva (kit v1.2): retrato 9:16, mesma paleta petróleo/turquesa/cobre
  // do resto do app. O campo de batalha é `flex: 1` numa página inteira, ou
  // seja, uma caixa ALTA — por isso a arte foi desenhada em pé, e não deitada
  // como os 5 primeiros (960×540, herdados).
  { namePt: 'Ruína Submersa', nameEn: 'Sunken Ruin', accent: '#3fd2d9', bg: `url(${dungeonBg6}) center/cover` },
  { namePt: 'Forja das Almas', nameEn: 'Soul Forge', accent: '#c98a4b', bg: `url(${dungeonBg7}) center/cover` },
  { namePt: 'Necrópole de Ossos', nameEn: 'Bone Necropolis', accent: '#9fb8b4', bg: `url(${dungeonBg8}) center/cover` },
  { namePt: 'Núcleo de Dados', nameEn: 'Data Core', accent: '#4fe3c1', bg: `url(${dungeonBg9}) center/cover` },
  { namePt: 'Céu Partido', nameEn: 'Shattered Sky', accent: '#5ad6ff', bg: `url(${dungeonBg10}) center/cover` },
  // Nasceu como fundo do Dino e acabou aqui: o visor do Dino é largo e baixo
  // (~7:1) e uma cena 9:16 vira nele uma lasca ampliada de parede. A arte é um
  // corredor em ruínas — o campo de batalha da masmorra, que é ALTO, é a caixa
  // para a qual ela sempre serviu.
  { namePt: 'Corredor em Ruínas', nameEn: 'Ruined Hall', accent: '#57d9c4', bg: `url(${ruinedHall}) center/cover` },
  // As duas arenas do Torneio entram AQUI, e não como fundo da página do
  // Torneio: aquela moldura saiu de propósito (ver TournamentPage.tsx) e não
  // volta. Como CENA de um andar, a arena é conteúdo do visor — que é
  // exatamente a fronteira que aquele arquivo traçou.
  { namePt: 'Arena Noturna', nameEn: 'Night Arena', accent: '#6fd3e8', bg: `url(${arenaNight}) center/cover` },
  { namePt: 'Coliseu Ancião', nameEn: 'Elder Colosseum', accent: '#d7a55c', bg: `url(${arenaFinal}) center/cover` },
];

/** A cena do PESADELO (`NightmareBattle`) — a Forja das Almas, como o canvas
 *  Jogos desenhou (`PesadeloIntro`/`PesadeloFim`: `dungeon-7`). Fixa, não
 *  sorteada: o pesadelo é uma luta só, de manhã, e o vidro do diálogo é o
 *  mesmo todas as noites. */
export const NIGHTMARE_SCENE: DungeonScene = SPIRIT_BG_SCENES[6];
/** A cena da ARENA (`ArenaGame`) — o Abismo Violeta (`dungeon-4`, canvas `Arena`). */
export const ARENA_SCENE: DungeonScene = SPIRIT_BG_SCENES[3];
/** A cena do DINO — o corredor em ruínas (`minigame-dino`), atrás do parallax. */
export const DINO_SCENE: DungeonScene = SPIRIT_BG_SCENES[10];

const SHOP_BG_ACCENTS: Record<string, string> = {
  'bg-forest': '#4ade80',
  'bg-ocean': '#38bdf8',
  'bg-gameboy': '#0f380f',
  'bg-snow': '#1d4ed8',
  'bg-lava': '#fb923c',
  'bg-sakura': '#db2777',
  'bg-toytown': '#f59e0b',
  'bg-synthwave': '#ff2bd6',
  'bg-attic': '#c98a4b',
  'bg-arcade': '#3fd2d9',
  'bg-library': '#8fd6c2',
  'bg-shrine': '#5ad6ff',
  'bg-rooftop': '#7fb8d9',
  'bg-cloudsea': '#4fe3c1',
  'bg-observatory': '#d7a55c',
  'bg-swamp': '#4fd6a8',
  // 04/10/2026, terceira leva pintada.
  'bg-lakeside': '#d9a45c',
  'bg-crystal-grove': '#5ad6ff',
  'bg-ember-cavern': '#e08a3c',
  'bg-night-greenhouse': '#4fd6a8',
  'bg-cozy-loft': '#c98a4b',
  'bg-cloud-terrace': '#4fe3c1',
};

const SHOP_BG_SCENES: DungeonScene[] = Object.entries(SHOP_BG_ACCENTS)
  .filter(([id]) => PET_BACKGROUNDS[id])
  .map(([id, accent]) => ({
    namePt: PET_BACKGROUNDS[id].namePt,
    nameEn: PET_BACKGROUNDS[id].nameEn,
    bg: PET_BACKGROUNDS[id].css,
    accent,
  }));

/**
 * Scenes for one run: 5 picks without repeats, drawn at random from the painted
 * scenes (spirit + classic) + the shop backgrounds. Every run looks different.
 */
export function buildRunScenes(count = 5): DungeonScene[] {
  const pool = [...SPIRIT_BG_SCENES, ...DUNGEON_SCENES, ...SHOP_BG_SCENES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

/** Scene for a run floor (1-based). Clamps to the 5 defined scenes. */
export function sceneForFloor(floor: number): DungeonScene {
  const i = Math.min(Math.max(1, floor), DUNGEON_SCENES.length) - 1;
  return DUNGEON_SCENES[i];
}
