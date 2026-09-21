// 🎞️ Dungeon floor backgrounds — one retro scene per floor (1..5). Pure CSS so
// they stay tiny and theme-safe. Kept dark enough that the pixel sprites stay
// readable. (The VHS scanline overlay that DungeonGame used to layer on top is
// gone since the canvas Jogos, DECISÕES §25: the scene is the `cover` of a
// visor now — `games/GameKit.tsx` — and continuous motion without purpose was
// the thing `prefers-reduced-motion` never reached.)
export interface DungeonScene {
  namePt: string;
  nameEn: string;
  /** CSS `background` value for the battlefield. */
  bg: string;
  /** Accent color for the floor label / borders. */
  accent: string;
}

export const DUNGEON_SCENES: DungeonScene[] = [
  {
    namePt: 'Tamagotchi', nameEn: 'Tamagotchi',
    accent: '#9bbc0f',
    bg: 'repeating-linear-gradient(0deg, rgba(15,56,15,0.55) 0 3px, transparent 3px 6px), repeating-linear-gradient(90deg, rgba(15,56,15,0.55) 0 3px, transparent 3px 6px), linear-gradient(160deg, #24401a, #0f2410)',
  },
  {
    namePt: 'Fita VHS', nameEn: 'VHS Tape',
    accent: '#38e1ff',
    bg: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0 2px, transparent 2px 4px), radial-gradient(120% 90% at 50% 0%, rgba(56,225,255,0.15), transparent 55%), linear-gradient(180deg, #06122b, #0b0620)',
  },
  {
    namePt: 'Sol Neon', nameEn: 'Neon Sunset',
    accent: '#ff2bd6',
    bg: 'radial-gradient(120% 80% at 50% 100%, rgba(255,43,214,0.35), transparent 60%), repeating-linear-gradient(0deg, rgba(255,43,214,0.10) 0 1px, transparent 1px 34px), linear-gradient(180deg, #180a30, #2a0a3e)',
  },
  {
    namePt: 'Terminal CRT', nameEn: 'CRT Terminal',
    accent: '#ffb000',
    bg: 'repeating-linear-gradient(0deg, rgba(255,176,0,0.06) 0 2px, transparent 2px 4px), radial-gradient(120% 100% at 50% 0%, rgba(255,140,0,0.2), transparent 55%), linear-gradient(180deg, #1a1206, #0a0800)',
  },
  {
    namePt: 'Vazio Glitch', nameEn: 'Glitch Void',
    accent: '#ff2b4d',
    bg: 'repeating-linear-gradient(0deg, rgba(255,0,51,0.10) 0 2px, transparent 2px 5px), radial-gradient(100% 80% at 50% 50%, rgba(120,0,20,0.4), #0a0203)',
  },
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
 * Scenes for one run: 5 picks without repeats, drawn at random from the classic
 * retro scenes + the shop backgrounds. Every run looks different.
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
