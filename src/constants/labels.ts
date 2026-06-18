import type { ActivityCategory } from '../types/attributes';

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
  flamdramon: 'Flamdramon',
  paildramon: 'Paildramon',
  aeroveedramon: 'AeroVeedramon',
  raidramon: 'Raidramon',
  imperialdramon: 'Imperialdramon',
  ulforceveemon: 'UlforceVeedramon',
  magnamon: 'Magnamon',
  // Salamon line
  yukimibotamon: 'Yukimibotamon',
  nyaromon: 'Nyaromon',
  plotmon: 'Plotmon',
  gatomon: 'Gatomon',
  blackgatomon: 'BlackGatomon',
  mikemon: 'Mikemon',
  angewomon: 'Angewomon',
  ladydevimon: 'LadyDevimon',
  nefertimon: 'Nefertimon',
  ophanimon: 'Ophanimon',
  lilithmon: 'Lilithmon',
  holydramon: 'Holydramon',
  // Ultra
  'gaioumon-itto': 'Gaioumon: Itto Mode',
  imperialdramonpaladin: 'Imperialdramon Paladin Mode',
  mastemon: 'Mastemon',
};

export const DEGENERATION_STAGE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(DIGIMON_STAGE_NAMES).map(([k, v]) => [v, k])
);
