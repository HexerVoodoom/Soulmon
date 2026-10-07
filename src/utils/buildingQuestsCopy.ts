// Textos e ícones da missão por prédio — SÓ a folha lazy (`BuildingQuestList`) importa daqui, para não pesar a entrada.
// A regra, o estado e a tabela prédio→material moram em `buildingQuests.ts`.

import { hashString } from './oracle/base';

import { MATERIAL_BUILDING, type MaterialId } from './buildingQuests';
import type { BuildingId } from './gates';

export interface MaterialDef {
  id: MaterialId;
  /** O prédio dono: o único que paga este material. */
  building: BuildingId;
  nameEn: string;
  namePt: string;
  /** Emoji pelado (ícone nunca dentro de box). Nenhum coincide com 🪙/🎖️/💎. */
  icon: string;
}

const NOMES: Record<MaterialId, [string, string, string]> = {
  spark: ['Spark', 'Faísca', '✨'], moss: ['Moss', 'Musgo', '🌿'], prism: ['Prism', 'Prisma', '🔷'],
  pebble: ['Pebble', 'Seixo', '🗿'], ore: ['Ore', 'Minério', '⛏️'], ink: ['Ink', 'Tinta', '🖋️'], gear: ['Gear', 'Engrenagem', '⚙️'],
  fang: ['Fang', 'Presa', '🦷'], laurel: ['Laurel', 'Louro', '🍃'], ribbon: ['Ribbon', 'Fita', '🎀'],
  essence: ['Essence', 'Essência', '🧬'], down: ['Down', 'Penugem', '☁️'], cipher: ['Cipher', 'Cifra', '🔣'],
  page: ['Page', 'Página', '📜'], keepsake: ['Keepsake', 'Lembrança', '🎁'], crest: ['Crest', 'Brasão', '🛡️'],
};

/** 1 material por prédio fora do Mercado. A ordem é a do Mapa. */
export const MATERIALS: readonly MaterialDef[] = (Object.keys(MATERIAL_BUILDING) as MaterialId[]).map(id => ({
  id, building: MATERIAL_BUILDING[id], nameEn: NOMES[id][0], namePt: NOMES[id][1], icon: NOMES[id][2],
}));

/** Três redações por prédio: só TEXTO, o gatilho é o mesmo (entrar). EN primeiro. */
const FLAVOR: Record<string, readonly [string, string][]> = {
  default: [
    ['Step inside and look around', 'Entre e dê uma olhada'],
    ['Drop by for a moment', 'Passe por aqui um instante'],
    ['Visit and take a breath', 'Visite e respire um pouco'],
  ],
};

/** O texto do dia deste prédio — determinístico por `day` + id (nunca muda a cada abertura). */
export function questText(day: string, id: BuildingId, isPt: boolean): string {
  const pool = FLAVOR[id] ?? FLAVOR.default;
  const pair = pool[hashString(`building-quest:${day}:${id}`) % pool.length];
  return isPt ? pair[1] : pair[0];
}

