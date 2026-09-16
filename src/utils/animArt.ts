// Spritesheets de FX quadro a quadro (entrega 4 + F6, instalados em 15/09/2026):
// N células quadradas de 64 px coladas na HORIZONTAL, sem vão. Consumo por
// `background-position` em `steps(N)` — `components/pixel/SpriteAnim.tsx`.
// São efeitos AO REDOR do pet: o sprite da criatura continua único e se
// expressa por deformação (D5 do dono).
import eatCrumbs from '../assets/soulmon/fx/anim-eat-crumbs.png';
import heartBurst from '../assets/soulmon/fx/anim-heart-burst.png';
import showerSplash from '../assets/soulmon/fx/anim-shower-splash.png';
import sleepZ from '../assets/soulmon/fx/anim-sleep-z.png';
import poopPlop from '../assets/soulmon/fx/anim-poop-plop.png';
import sparklePop from '../assets/soulmon/fx/anim-sparkle-pop.png';
import dustStep from '../assets/soulmon/fx/anim-dust-step.png';
import hungerDrop from '../assets/soulmon/fx/anim-hunger-drop.png';

export interface AnimSheet { src: string; frames: number; cell: number }
const sheet = (src: string, frames: number): AnimSheet => ({ src, frames, cell: 64 });

export const ANIM_ART = {
  eatCrumbs: sheet(eatCrumbs, 4),
  heartBurst: sheet(heartBurst, 4),
  showerSplash: sheet(showerSplash, 4),
  sleepZ: sheet(sleepZ, 3),
  poopPlop: sheet(poopPlop, 3),
  sparklePop: sheet(sparklePop, 4),
  dustStep: sheet(dustStep, 3),
  hungerDrop: sheet(hungerDrop, 3),
} as const;
export type AnimId = keyof typeof ANIM_ART;
