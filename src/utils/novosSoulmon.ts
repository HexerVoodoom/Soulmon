/**
 * OS 17 NOVOS SOULMON — dados + ARTE (15/10/2026; contrato e formas futuras em `novosSoulmonData.ts`).
 *
 * Rookie e Champion: encontros COMUNS da masmorra (`buildDungeonWave`) e inimigos da Arena (`buildArenaRound`).
 * Ultimate/Mega/Ultra: encaixe pronto, vazio até haver arte (`FORMAS_ALTAS_ART`). NÃO substituem `DUNGEON_LINE_SPRITES`
 * (personagens prontos, sombras do Pesadelo, NPCs da Biblioteca, Combina 3, bosque seguem nas 9 linhas antigas).
 * Arte: 256² RGBA (Lanczos a partir de 1024², alfa >=250 vira 255), orientada à direita/de frente.
 */
import {
  NOVOS_DATA, FORMAS_ALTAS, novoDataOfStage, novoFormName, novoHasForm, pickNovo,
  type NovoData, type NovoStage, type NovoHighStage, type NovoAnyStage, type NovoAttack, type NovoLine,
} from './novosSoulmonData';
export type { NovoData, NovoStage, NovoHighStage, NovoAnyStage, NovoAttack, NovoLine };
export { FORMAS_ALTAS, novoDataOfStage, novoHasForm };
import embritRookie from '../assets/soulmon/novos/fogo-rookie.png';
import embritChampion from '../assets/soulmon/novos/fogo-champion.png';
import spinvexRookie from '../assets/soulmon/novos/vileza-rookie.png';
import spinvexChampion from '../assets/soulmon/novos/vileza-champion.png';
import ossumiRookie from '../assets/soulmon/novos/morte-rookie.png';
import ossumiChampion from '../assets/soulmon/novos/morte-champion.png';
import umbraeRookie from '../assets/soulmon/novos/sombra-rookie.png';
import umbraeChampion from '../assets/soulmon/novos/sombra-champion.png';
import brawnuRookie from '../assets/soulmon/novos/vigor-rookie.png';
import brawnuChampion from '../assets/soulmon/novos/vigor-champion.png';
import kenjoRookie from '../assets/soulmon/novos/marcial-rookie.png';
import kenjoChampion from '../assets/soulmon/novos/marcial-champion.png';
import runixRookie from '../assets/soulmon/novos/arcano-rookie.png';
import runixChampion from '../assets/soulmon/novos/arcano-champion.png';
import chronibRookie from '../assets/soulmon/novos/tempo-rookie.png';
import chronibChampion from '../assets/soulmon/novos/tempo-champion.png';
import voidletRookie from '../assets/soulmon/novos/espaco-rookie.png';
import voidletChampion from '../assets/soulmon/novos/espaco-champion.png';
import gravulRookie from '../assets/soulmon/novos/gravidade-rookie.png';
import gravulChampion from '../assets/soulmon/novos/gravidade-champion.png';
import vibriRookie from '../assets/soulmon/novos/som-rookie.png';
import vibriChampion from '../assets/soulmon/novos/som-champion.png';
import voltrixRookie from '../assets/soulmon/novos/eletricidade-rookie.png';
import voltrixChampion from '../assets/soulmon/novos/eletricidade-champion.png';
import sproutiRookie from '../assets/soulmon/novos/vida-rookie.png';
import sproutiChampion from '../assets/soulmon/novos/vida-champion.png';
import solionRookie from '../assets/soulmon/novos/luz-rookie.png';
import solionChampion from '../assets/soulmon/novos/luz-champion.png';
import bubboRookie from '../assets/soulmon/novos/agua-rookie.png';
import bubboChampion from '../assets/soulmon/novos/agua-champion.png';
import pebbloRookie from '../assets/soulmon/novos/terra-rookie.png';
import pebbloChampion from '../assets/soulmon/novos/terra-champion.png';
import zephirRookie from '../assets/soulmon/novos/ar-rookie.png';
import zephirChampion from '../assets/soulmon/novos/ar-champion.png';

const ART: Record<string, { rookie: string; champion: string }> = {
  embrit: { rookie: embritRookie, champion: embritChampion },
  spinvex: { rookie: spinvexRookie, champion: spinvexChampion },
  ossumi: { rookie: ossumiRookie, champion: ossumiChampion },
  umbrae: { rookie: umbraeRookie, champion: umbraeChampion },
  brawnu: { rookie: brawnuRookie, champion: brawnuChampion },
  kenjo: { rookie: kenjoRookie, champion: kenjoChampion },
  runix: { rookie: runixRookie, champion: runixChampion },
  chronib: { rookie: chronibRookie, champion: chronibChampion },
  voidlet: { rookie: voidletRookie, champion: voidletChampion },
  gravul: { rookie: gravulRookie, champion: gravulChampion },
  vibri: { rookie: vibriRookie, champion: vibriChampion },
  voltrix: { rookie: voltrixRookie, champion: voltrixChampion },
  sprouti: { rookie: sproutiRookie, champion: sproutiChampion },
  solion: { rookie: solionRookie, champion: solionChampion },
  bubbo: { rookie: bubboRookie, champion: bubboChampion },
  pebblo: { rookie: pebbloRookie, champion: pebbloChampion },
  zephir: { rookie: zephirRookie, champion: zephirChampion },
};

/** Sprites das formas altas, por criatura (mesmas chaves de `FORMAS_ALTAS`). Vazio até a arte ser aprovada e instalada. */
export const FORMAS_ALTAS_ART: Readonly<Record<string, Partial<Record<NovoHighStage, string>>>> = {};

export interface NovoSoulmon extends NovoData {
  sprite(stage: NovoAnyStage): string;
  name(stage: NovoAnyStage): string;
}

function spriteOf(id: string, stage: NovoAnyStage): string {
  if (stage === 'rookie' || stage === 'champion') return ART[id][stage];
  return FORMAS_ALTAS_ART[id]?.[stage] ?? ART[id].champion;
}

export const NOVOS_SOULMON: readonly NovoSoulmon[] = NOVOS_DATA.map(d => ({
  ...d, sprite: (st: NovoAnyStage) => spriteOf(d.id, st), name: (st: NovoAnyStage) => novoFormName(d, st),
}));
const BY_ID: Readonly<Record<string, NovoSoulmon>> = Object.fromEntries(NOVOS_SOULMON.map(n => [n.id, n]));
export const novoSoulmonById = (id: string | undefined | null): NovoSoulmon | undefined => (id ? BY_ID[id] : undefined);
export const novoSoulmonOfStage = (stage: string | undefined | null): NovoSoulmon | undefined => novoSoulmonById(novoDataOfStage(stage)?.id);

export interface DungeonEncounter {
  sprite: string;
  name: string;
  /** Id da linha antiga OU da criatura nova (compõe o `stage`). */
  line: string;
  element?: string;
  basico?: NovoAttack;
  especial?: NovoAttack;
}

/** Slot da escada -> formas desejadas, em ordem de preferência. ultimate/mega: só se a criatura tiver arte dessa forma. */
export function novoPreferenceOfTier(tier: string): readonly NovoAnyStage[] {
  if (tier === 'champion') return ['champion'];
  if (tier === 'baby-i' || tier === 'baby-ii' || tier === 'rookie') return ['rookie'];
  if (tier === 'ultimate') return ['ultimate'];
  return ['mega']; // mega (e ultra, que a escada não tem: reusa o mega)
}

/**
 * O encontro de um slot da escada, SEM repetir criatura dentro da onda (`used`, preenchido aqui). rookie/champion sorteiam
 * entre as 17; ultimate/mega só entre as que já têm arte da forma — enquanto nenhuma tiver, caem no sorteio antigo (`legacy`).
 */
export function getDungeonEncounter(
  tier: string, used: Set<string>, rng: () => number,
  legacy: (tier: string, excludeLine: string | undefined, rng: () => number) => { sprite: string; name: string; line: string },
): DungeonEncounter {
  const p = pickNovo(novoPreferenceOfTier(tier), used, rng);
  if (!p) return legacy(tier, undefined, rng);
  used.add(p.data.id);
  const n = BY_ID[p.data.id];
  return { sprite: n.sprite(p.stage), name: n.name(p.stage), line: n.id, element: n.element, basico: n.basico, especial: n.especial };
}
