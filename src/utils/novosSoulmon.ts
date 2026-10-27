/**
 * OS 17 NOVOS SOULMON — dados + ARTE (15/10/2026; contrato e formas futuras em `novosSoulmonData.ts`).
 *
 * Rookie e Champion: encontros COMUNS da masmorra (`buildDungeonWave`) e inimigos da Arena (`buildArenaRound`).
 * Ultimate/Mega: slots 4/5 da escada; Ultra: só o chefe da Arena (`FORMAS_ALTAS_ART`). NÃO substituem `DUNGEON_LINE_SPRITES`
 * (personagens prontos, sombras do Pesadelo, NPCs da Biblioteca, Elemental Fusion, bosque seguem nas 9 linhas antigas).
 * Arte: 256² RGBA (Rookie/Champion: Lanczos a partir de 1024², alfa >=250 vira 255; formas altas pixelizadas: vizinho mais próximo 1024²->256², alfa binário), orientada à direita/de frente.
 */
import {
  NOVOS_DATA, FORMAS_ALTAS, novoDataOfStage, novoFormName, novoHasForm, pickNovo,
  type NovoData, type NovoStage, type NovoHighStage, type NovoAnyStage, type NovoAttack, type NovoLine,
} from './novosSoulmonData';
import { pickEnemy, type EnemyStage, type RosterEntry } from './enemyRoster';
import { COMBINADOS_ART, INIMIGOS_API_ART } from './enemyRosterArt';
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

import embritUltimate from '../assets/soulmon/novos/fogo-ultimate.png';
import embritMega from '../assets/soulmon/novos/fogo-mega.png';
import embritUltra from '../assets/soulmon/novos/fogo-ultra.png';
import spinvexUltimate from '../assets/soulmon/novos/vileza-ultimate.png';
import spinvexMega from '../assets/soulmon/novos/vileza-mega.png';
import spinvexUltra from '../assets/soulmon/novos/vileza-ultra.png';
import ossumiUltimate from '../assets/soulmon/novos/morte-ultimate.png';
import ossumiMega from '../assets/soulmon/novos/morte-mega.png';
import ossumiUltra from '../assets/soulmon/novos/morte-ultra.png';
import umbraeUltimate from '../assets/soulmon/novos/sombra-ultimate.png';
import umbraeMega from '../assets/soulmon/novos/sombra-mega.png';
import umbraeUltra from '../assets/soulmon/novos/sombra-ultra.png';
import brawnuUltimate from '../assets/soulmon/novos/vigor-ultimate.png';
import brawnuMega from '../assets/soulmon/novos/vigor-mega.png';
import brawnuUltra from '../assets/soulmon/novos/vigor-ultra.png';
import kenjoUltimate from '../assets/soulmon/novos/marcial-ultimate.png';
import kenjoMega from '../assets/soulmon/novos/marcial-mega.png';
import kenjoUltra from '../assets/soulmon/novos/marcial-ultra.png';
import runixUltimate from '../assets/soulmon/novos/arcano-ultimate.png';
import runixMega from '../assets/soulmon/novos/arcano-mega.png';
import runixUltra from '../assets/soulmon/novos/arcano-ultra.png';
import chronibUltimate from '../assets/soulmon/novos/tempo-ultimate.png';
import chronibMega from '../assets/soulmon/novos/tempo-mega.png';
import chronibUltra from '../assets/soulmon/novos/tempo-ultra.png';
import voidletUltimate from '../assets/soulmon/novos/espaco-ultimate.png';
import voidletMega from '../assets/soulmon/novos/espaco-mega.png';
import voidletUltra from '../assets/soulmon/novos/espaco-ultra.png';
import gravulUltimate from '../assets/soulmon/novos/gravidade-ultimate.png';
import gravulMega from '../assets/soulmon/novos/gravidade-mega.png';
import gravulUltra from '../assets/soulmon/novos/gravidade-ultra.png';
import vibriUltimate from '../assets/soulmon/novos/som-ultimate.png';
import vibriMega from '../assets/soulmon/novos/som-mega.png';
import vibriUltra from '../assets/soulmon/novos/som-ultra.png';
import voltrixUltimate from '../assets/soulmon/novos/eletricidade-ultimate.png';
import voltrixMega from '../assets/soulmon/novos/eletricidade-mega.png';
import voltrixUltra from '../assets/soulmon/novos/eletricidade-ultra.png';
import sproutiUltimate from '../assets/soulmon/novos/vida-ultimate.png';
import sproutiMega from '../assets/soulmon/novos/vida-mega.png';
import sproutiUltra from '../assets/soulmon/novos/vida-ultra.png';
import solionUltimate from '../assets/soulmon/novos/luz-ultimate.png';
import solionMega from '../assets/soulmon/novos/luz-mega.png';
import solionUltra from '../assets/soulmon/novos/luz-ultra.png';
import bubboUltimate from '../assets/soulmon/novos/agua-ultimate.png';
import bubboMega from '../assets/soulmon/novos/agua-mega.png';
import bubboUltra from '../assets/soulmon/novos/agua-ultra.png';
import pebbloUltimate from '../assets/soulmon/novos/terra-ultimate.png';
import pebbloMega from '../assets/soulmon/novos/terra-mega.png';
import pebbloUltra from '../assets/soulmon/novos/terra-ultra.png';
import zephirUltimate from '../assets/soulmon/novos/ar-ultimate.png';
import zephirMega from '../assets/soulmon/novos/ar-mega.png';
import zephirUltra from '../assets/soulmon/novos/ar-ultra.png';

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

/** Sprites das formas altas, por criatura (mesmas chaves de `FORMAS_ALTAS`). 256² RGBA, pixelizadas (§78). */
export const FORMAS_ALTAS_ART: Readonly<Record<string, Partial<Record<NovoHighStage, string>>>> = {
  embrit: { ultimate: embritUltimate, mega: embritMega, ultra: embritUltra },
  spinvex: { ultimate: spinvexUltimate, mega: spinvexMega, ultra: spinvexUltra },
  ossumi: { ultimate: ossumiUltimate, mega: ossumiMega, ultra: ossumiUltra },
  umbrae: { ultimate: umbraeUltimate, mega: umbraeMega, ultra: umbraeUltra },
  brawnu: { ultimate: brawnuUltimate, mega: brawnuMega, ultra: brawnuUltra },
  kenjo: { ultimate: kenjoUltimate, mega: kenjoMega, ultra: kenjoUltra },
  runix: { ultimate: runixUltimate, mega: runixMega, ultra: runixUltra },
  chronib: { ultimate: chronibUltimate, mega: chronibMega, ultra: chronibUltra },
  voidlet: { ultimate: voidletUltimate, mega: voidletMega, ultra: voidletUltra },
  gravul: { ultimate: gravulUltimate, mega: gravulMega, ultra: gravulUltra },
  vibri: { ultimate: vibriUltimate, mega: vibriMega, ultra: vibriUltra },
  voltrix: { ultimate: voltrixUltimate, mega: voltrixMega, ultra: voltrixUltra },
  sprouti: { ultimate: sproutiUltimate, mega: sproutiMega, ultra: sproutiUltra },
  solion: { ultimate: solionUltimate, mega: solionMega, ultra: solionUltra },
  bubbo: { ultimate: bubboUltimate, mega: bubboMega, ultra: bubboUltra },
  pebblo: { ultimate: pebbloUltimate, mega: pebbloMega, ultra: pebbloUltra },
  zephir: { ultimate: zephirUltimate, mega: zephirMega, ultra: zephirUltra },
};

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

/** Sprite de uma entrada do roster (base ou combinado), ou `undefined` se a arte não existir. */
export function rosterSpriteOf(e: RosterEntry): string | undefined {
  return e.kind === 'base' ? BY_ID[e.id]?.sprite(e.stage) : e.kind === 'api' ? INIMIGOS_API_ART[e.artFile ?? ''] : COMBINADOS_ART[e.artFile ?? ''];
}

export interface DungeonEncounter {
  sprite: string;
  name: string;
  /** Id da linha antiga OU da criatura nova (compõe o `stage`). */
  line: string;
  /** Chave do bestiário (`<id>-<estágio de ARTE>`, `enemyRoster.ts`); ausente no sorteio antigo (linhas próprias). */
  key?: string;
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
  /** Level do jogador: o teto de estágio de ARTE do inimigo (`enemyRoster.ts`). Sem ele, tudo liberado (comportamento antigo). */
  level: number = Number.POSITIVE_INFINITY,
): DungeonEncounter {
  const pref = novoPreferenceOfTier(tier)[0] as EnemyStage;
  const e = pickEnemy(level, rng, { stage: pref, used });
  const n = e.kind === 'base' ? BY_ID[e.id] : undefined;
  const sprite = n ? n.sprite(e.stage) : rosterSpriteOf(e);
  if (!sprite) return legacy(tier, undefined, rng);
  used.add(e.id);
  return { sprite, name: n ? n.name(e.stage) : e.name, line: e.id, key: e.key, element: e.element, basico: e.basico, especial: e.especial };
}
