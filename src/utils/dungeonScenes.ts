// 🎞️ Dungeon floor backgrounds — one retro scene per floor (1..5). Pure CSS so
// they stay tiny and theme-safe. A shared VHS scanline overlay is layered on top
// in DungeonGame for the "filtro de VHS" feel. Kept dark enough that the pixel
// sprites stay readable.
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

/** Scene for a run floor (1-based). Clamps to the 5 defined scenes. */
export function sceneForFloor(floor: number): DungeonScene {
  const i = Math.min(Math.max(1, floor), DUNGEON_SCENES.length) - 1;
  return DUNGEON_SCENES[i];
}
