// Evolution lines data structure
// Each line starts from an egg type and has its own progression

// Common sprites
import digiEggSprite from 'figma:asset/6479b687e03b8292ee02a4453bff2eb1a76cfecb.png';

// TAPIRMON LINE sprites (White Egg)
import pichimonSprite from 'figma:asset/99ff747d7f7ecc2424e131a43c54669bcba9a301.png';
import pukamonSprite from 'figma:asset/104dc13e2c146bb51e00903d6eaa5f6fae7619c6.png';
import tapirmonSprite from 'figma:asset/8deb0c4ab0625c36e8f7d8484d047391e366e6cd.png';
import tuskmonSprite from 'figma:asset/4545c1113c2742541bfa287e8aaad34d540d5188.png';
import gigadramonSprite from 'figma:asset/61935125c675c3d79b74bdfbb783563de187250a.png';
import gaioumonSprite from 'figma:asset/797dcc096094cec27969dafb7d0d37cddbe6a1d5.png';
import monochromon from 'figma:asset/58d45f952e9e7f056445aa37544fa488bbfda16f.png';
import triceramonSprite from 'figma:asset/439ea88abadb584d8abd075df0fff253301f3fcf.png';
import ultimateBrachiomon from 'figma:asset/66717674e9ddce8b8e301126dbc9422279967bda.png';
import bakemonSprite from 'figma:asset/cc04120f94ce0a4ae081b26d2359ca0dd7488f6d.png';
import digitamamonSprite from 'figma:asset/15b86f9a6a117217f92fc8c35383b8ba7a68d995.png';
import titamonSprite from 'figma:asset/2289f0ba6bd5182e66b3253be305d6860dbe1148.png';
import gaioumonIttoSprite from 'figma:asset/2f5fefb3d68da3d20ef1d5195a8f0ddc506b1149.png';

// VEEMON LINE sprites (Blue Egg)
import chicomonSprite from 'figma:asset/4d2fa6b5f39afed1e868edf4c8faf3c4888ecc84.png';
import chibimonSprite from 'figma:asset/3b47f9d0035dbc50ffa6a78567bf904fc56834d6.png';
import veemonSprite from 'figma:asset/17701dd96050e16b1fac593a32079ae86e5bd531.png';
import exVeemonSprite from 'figma:asset/136cb8d464cc8d648c7de82119ca05f5c5396af5.png';
import paildramonSprite from 'figma:asset/bfde95df2c77e342ddcf05bd6a8480711ea5a740.png';
import imperialdramonSprite from 'figma:asset/701f6bc49c8ab4166c27d7c362af3194b202a330.png';
import veedramonSprite from 'figma:asset/dcf2429f06e823eb567e0018e2d2de9887b5c034.png';
import aeroVeedramonSprite from 'figma:asset/e276464f1870730b1e5cb5dfbed9d586df28d609.png';
import ulforceVeedramonSprite from 'figma:asset/7bdcafe95cc603bba49f20349fe242e981ddf8ec.png';
import flamedramonSprite from 'figma:asset/b75ac337773a9cbda275e4994894104282fe9943.png';
import raidramonSprite from 'figma:asset/4fc596d119266f4125b18733231e3f326f163b28.png';
import magnamonSprite from 'figma:asset/46ea13627a0da430619fa9e993f7d14bb613d5f8.png';
import imperialdramonPaladinSprite from 'figma:asset/8ad9573c77b42ea0708b5b29032a7489c7616571.png';

// SALAMON LINE sprites (Pink Egg)
import yukimibotamonSprite from 'figma:asset/eb90dd429719211430c96bfff0ab33ce4263dc33.png';
import nyaromonSprite from 'figma:asset/21c7ddc9f28cb93fb5e301b2bfb797ade7767403.png';
import plotmonSprite from 'figma:asset/acf058298d9eb6312c16c5f296a808c2f4edc163.png';
import gatomonSprite from 'figma:asset/cd6cdea0aaf4dea528d69cb4812333fe7980f034.png';
import angewomonSprite from 'figma:asset/91def178d3bb589f11cf012e72a30ed12f14ed5a.png';
import ophanimonSprite from 'figma:asset/0523e198a779637515f03904bb4baa992fdf837e.png';
import blackGatomonSprite from 'figma:asset/6597e8c17a1647c444bdc1d375da54f07b1e8d45.png';
import ladyDevimonSprite from 'figma:asset/6e5b9d1d2d1c049b40fcb76d3e31d0ed15713538.png';
import lilithmonSprite from 'figma:asset/4834d54b968cbf6223b91134a426afc867a9138a.png';
import mikemonSprite from 'figma:asset/79da08e63a9021eed7f83f46fafd43e36f1e30dd.png';
import nefertimonSprite from 'figma:asset/750c493568ac7846d39b203e8be583d896133c60.png';
import holyDramonSprite from 'figma:asset/829e91e67710908cd0cecd99b5b12163536d3926.png';
import mastemonSprite from 'figma:asset/a036d6071a61f5a7cde8ca604f58cd0267141481.png';

export type EggType = 'tapirmon' | 'veemon' | 'salamon';

export interface EvolutionStage {
  name: string;
  stage: 'digiegg' | 'in-training-1' | 'in-training-2' | 'rookie' | 'champion' | 'ultimate' | 'mega' | 'ultra';
  sprite: string;
  xpRequired: number;
}

export interface EvolutionBranch {
  name: string;
  type: 'virus' | 'data' | 'vaccine';
  stages: EvolutionStage[]; // From Champion onwards
}

export interface EvolutionLine {
  eggType: EggType;
  digiegg: EvolutionStage;
  inTraining1: EvolutionStage; 
  inTraining2: EvolutionStage;
  rookie: EvolutionStage;
  branches: EvolutionBranch[];
  ultra: EvolutionStage; // Shared ultra form
}

// TAPIRMON LINE (White Egg)
export const TAPIRMON_LINE: EvolutionLine = {
  eggType: 'tapirmon',
  digiegg: {
    name: 'DigiEgg',
    stage: 'digiegg',
    sprite: digiEggSprite,
    xpRequired: 0,
  },
  inTraining1: {
    name: 'Pichimon',
    stage: 'in-training-1',
    sprite: pichimonSprite,
    xpRequired: 50,
  },
  inTraining2: {
    name: 'Pukamon',
    stage: 'in-training-2',
    sprite: pukamonSprite,
    xpRequired: 150,
  },
  rookie: {
    name: 'Tapirmon',
    stage: 'rookie',
    sprite: tapirmonSprite,
    xpRequired: 300,
  },
  branches: [
    {
      name: 'Virus Branch',
      type: 'virus',
      stages: [
        { name: 'Tuskmon', stage: 'champion', sprite: tuskmonSprite, xpRequired: 600 },
        { name: 'Gigadramon', stage: 'ultimate', sprite: gigadramonSprite, xpRequired: 1000 },
        { name: 'Gaioumon', stage: 'mega', sprite: gaioumonSprite, xpRequired: 1500 },
      ],
    },
    {
      name: 'Data Branch',
      type: 'data',
      stages: [
        { name: 'Monochromon', stage: 'champion', sprite: monochromon, xpRequired: 600 },
        { name: 'Triceramon', stage: 'ultimate', sprite: triceramonSprite, xpRequired: 1000 },
        { name: 'UltimateBrachiomon', stage: 'mega', sprite: ultimateBrachiomon, xpRequired: 1500 },
      ],
    },
    {
      name: 'Vaccine Branch',
      type: 'vaccine',
      stages: [
        { name: 'Bakemon', stage: 'champion', sprite: bakemonSprite, xpRequired: 600 },
        { name: 'Digitamamon', stage: 'ultimate', sprite: digitamamonSprite, xpRequired: 1000 },
        { name: 'Titamon', stage: 'mega', sprite: titamonSprite, xpRequired: 1500 },
      ],
    },
  ],
  ultra: {
    name: 'Gaioumon: Itto Mode',
    stage: 'ultra',
    sprite: gaioumonIttoSprite,
    xpRequired: 2300,
  },
};

// VEEMON LINE (Blue Egg)
export const VEEMON_LINE: EvolutionLine = {
  eggType: 'veemon',
  digiegg: {
    name: 'DigiEgg',
    stage: 'digiegg',
    sprite: digiEggSprite,
    xpRequired: 0,
  },
  inTraining1: {
    name: 'Chicomon',
    stage: 'in-training-1',
    sprite: chicomonSprite,
    xpRequired: 50,
  },
  inTraining2: {
    name: 'Chibimon',
    stage: 'in-training-2',
    sprite: chibimonSprite,
    xpRequired: 150,
  },
  rookie: {
    name: 'Veemon',
    stage: 'rookie',
    sprite: veemonSprite,
    xpRequired: 300,
  },
  branches: [
    {
      name: 'Data Branch',
      type: 'data',
      stages: [
        { name: 'ExVeemon', stage: 'champion', sprite: exVeemonSprite, xpRequired: 600 },
        { name: 'Paildramon', stage: 'ultimate', sprite: paildramonSprite, xpRequired: 1000 },
        { name: 'Imperialdramon (Dragon Mode)', stage: 'mega', sprite: imperialdramonSprite, xpRequired: 1500 },
      ],
    },
    {
      name: 'Virus Branch',
      type: 'virus',
      stages: [
        { name: 'Veedramon', stage: 'champion', sprite: veedramonSprite, xpRequired: 600 },
        { name: 'AeroVeedramon', stage: 'ultimate', sprite: aeroVeedramonSprite, xpRequired: 1000 },
        { name: 'UlforceVeedramon', stage: 'mega', sprite: ulforceVeedramonSprite, xpRequired: 1500 },
      ],
    },
    {
      name: 'Vaccine Branch',
      type: 'vaccine',
      stages: [
        { name: 'Flamedramon', stage: 'champion', sprite: flamedramonSprite, xpRequired: 600 },
        { name: 'Raidramon', stage: 'ultimate', sprite: raidramonSprite, xpRequired: 1000 },
        { name: 'Magnamon', stage: 'mega', sprite: magnamonSprite, xpRequired: 1500 },
      ],
    },
  ],
  ultra: {
    name: 'Imperialdramon Paladin Mode',
    stage: 'ultra',
    sprite: imperialdramonPaladinSprite,
    xpRequired: 2300,
  },
};

// SALAMON LINE (Pink Egg)
export const SALAMON_LINE: EvolutionLine = {
  eggType: 'salamon',
  digiegg: {
    name: 'DigiEgg',
    stage: 'digiegg',
    sprite: digiEggSprite,
    xpRequired: 0,
  },
  inTraining1: {
    name: 'YukimiBotamon',
    stage: 'in-training-1',
    sprite: yukimibotamonSprite,
    xpRequired: 50,
  },
  inTraining2: {
    name: 'Nyaromon',
    stage: 'in-training-2',
    sprite: nyaromonSprite,
    xpRequired: 150,
  },
  rookie: {
    name: 'Plotmon',
    stage: 'rookie',
    sprite: plotmonSprite,
    xpRequired: 300,
  },
  branches: [
    {
      name: 'Vaccine Branch',
      type: 'vaccine',
      stages: [
        { name: 'Gatomon', stage: 'champion', sprite: gatomonSprite, xpRequired: 600 },
        { name: 'Angewomon', stage: 'ultimate', sprite: angewomonSprite, xpRequired: 1000 },
        { name: 'Ophanimon', stage: 'mega', sprite: ophanimonSprite, xpRequired: 1500 },
      ],
    },
    {
      name: 'Virus Branch',
      type: 'virus',
      stages: [
        { name: 'Gatomon (Black)', stage: 'champion', sprite: blackGatomonSprite, xpRequired: 600 },
        { name: 'LadyDevimon', stage: 'ultimate', sprite: ladyDevimonSprite, xpRequired: 1000 },
        { name: 'Lilithmon', stage: 'mega', sprite: lilithmonSprite, xpRequired: 1500 },
      ],
    },
    {
      name: 'Data Branch',
      type: 'data',
      stages: [
        { name: 'Mikemon', stage: 'champion', sprite: mikemonSprite, xpRequired: 600 },
        { name: 'Nefertimon', stage: 'ultimate', sprite: nefertimonSprite, xpRequired: 1000 },
        { name: 'HolyDramon', stage: 'mega', sprite: holyDramonSprite, xpRequired: 1500 },
      ],
    },
  ],
  ultra: {
    name: 'Mastemon',
    stage: 'ultra',
    sprite: mastemonSprite,
    xpRequired: 2300,
  },
};

// Export all lines
export const EVOLUTION_LINES: Record<EggType, EvolutionLine> = {
  tapirmon: TAPIRMON_LINE,
  veemon: VEEMON_LINE,
  salamon: SALAMON_LINE,
};

// Helper function to get evolution line for an egg type
export function getEvolutionLine(eggType: EggType): EvolutionLine {
  return EVOLUTION_LINES[eggType];
}

// Helper function to get all stages in order for a specific line and branch
export function getFullEvolutionPath(eggType: EggType, branchType: 'virus' | 'data' | 'vaccine'): EvolutionStage[] {
  const line = getEvolutionLine(eggType);
  const branch = line.branches.find(b => b.type === branchType);
  
  if (!branch) {
    throw new Error(`Branch ${branchType} not found for ${eggType}`);
  }
  
  return [
    line.digiegg,
    line.inTraining1,
    line.inTraining2,
    line.rookie,
    ...branch.stages,
    line.ultra,
  ];
}
