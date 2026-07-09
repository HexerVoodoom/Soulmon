import type { ActivityCategory } from '../types/attributes';

export interface FoodItem {
  name: string;
  emoji: string;
  category: ActivityCategory;
}

export const FOOD_BY_CATEGORY: Record<ActivityCategory, FoodItem> = {
  Fitness:    { name: 'Protein',  emoji: '🥩', category: 'Fitness' },
  Health:     { name: 'Salad',    emoji: '🥗', category: 'Health' },
  Study:      { name: 'Apple',    emoji: '🍎', category: 'Study' },
  Work:       { name: 'Coffee',   emoji: '☕', category: 'Work' },
  Wellness:   { name: 'Juice',    emoji: '🧃', category: 'Wellness' },
  Discipline: { name: 'Rice',     emoji: '🍚', category: 'Discipline' },
  Social:     { name: 'Pizza',    emoji: '🍕', category: 'Social' },
  Creativity: { name: 'Candy',    emoji: '🍭', category: 'Creativity' },
};

export const CATEGORY_EMOJIS: Record<ActivityCategory, string> = {
  Health: '💪',
  Study: '📚',
  Social: '👥',
  Creativity: '🎨',
  Discipline: '🎯',
  Work: '💼',
  Wellness: '🧘',
  Fitness: '🏋️',
};

export const AI_CATEGORY_MAP: Record<string, ActivityCategory> = {
  Physical: 'Health',
  Mental: 'Study',
  Social: 'Social',
  Creative: 'Creativity',
};

export const DIGIMON_STAGE_NAMES: Record<string, string> = {
  // Armor digivolution (Digimental of Friendship). Listed FIRST on purpose:
  // DEGENERATION_STAGE_MAP inverts this object and keeps the LAST entry per
  // display name, so 'Raidramon' keeps resolving to the veemon-line form.
  'raidramon-armor': 'Raidramon',
  // Rookie item digivolutions (minigame drops)
  agumon: 'Agumon',
  gabumon: 'Gabumon',
  piyomon: 'Piyomon',
  tentomon: 'Tentomon',
  patamon: 'Patamon',
  palmon: 'Palmon',
  // Item digivolutions (shop)
  greymon: 'Greymon',
  garurumon: 'Garurumon',
  meramon: 'Meramon',
  devimon: 'Devimon',
  angemon: 'Angemon',
  birdramon: 'Birdramon',
  kabuterimon: 'Kabuterimon',
  seadramon: 'Seadramon',
  airdramon: 'Airdramon',
  ogremon: 'Ogremon',
  kuwagamon: 'Kuwagamon',
  numemon: 'Numemon',
  monzaemon: 'Monzaemon',
  etemon: 'Etemon',
  andromon: 'Andromon',
  megadramon: 'Megadramon',
  vademon: 'Vademon',
  nanimon: 'Nanimon',
  digiegg: 'DigiEgg',
  pichimon: 'Pichimon',
  pukamon: 'Pukamon',
  tapirmon: 'Tapirmon',
  tuskmon: 'Tuskmon',
  monochromon: 'Monochromon',
  bakemon: 'Bakemon',
  gigadramon: 'Gigadramon',
  triceramon: 'Triceramon',
  digitamamon: 'Digitamamon',
  gaioumon: 'Gaioumon',
  ultimatebrachiomon: 'UltimateBrachiomon',
  titamon: 'Titamon',
  // Veemon line
  chicomon: 'Chicomon',
  chibimon: 'Chibimon',
  veemon: 'Veemon',
  exveemon: 'ExVeemon',
  veedramon: 'Veedramon',
  flamedramon: 'Flamedramon',
  paildramon: 'Paildramon',
  aeroveedramon: 'AeroVeedramon',
  raidramon: 'Raidramon',
  imperialdramon: 'Imperialdramon',
  ulforceveedramon: 'UlforceVeedramon',
  magnamon: 'Magnamon',
  // Salamon line
  yukimibotamon: 'Yukimibotamon',
  nyaromon: 'Nyaromon',
  plotmon: 'Plotmon',
  gatomon: 'Gatomon',
  'gatomon-black': 'BlackGatomon',
  mikemon: 'Mikemon',
  angewomon: 'Angewomon',
  ladydevimon: 'LadyDevimon',
  nefertimon: 'Nefertimon',
  ophanimon: 'Ophanimon',
  lilithmon: 'Lilithmon',
  holydramon: 'Holydramon',
  // Ultra
  'gaioumon-itto': 'Gaioumon: Itto Mode',
  'imperialdramon-paladin': 'Imperialdramon Paladin Mode',
  mastemon: 'Mastemon',
};

export const DEGENERATION_STAGE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(DIGIMON_STAGE_NAMES).map(([k, v]) => [v, k])
);
