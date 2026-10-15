/**
 * OS 17 NOVOS SOULMON DA MASMORRA (15/10/2026, aprovados pelo dono: "Eu adorei todos").
 *
 * Um por elemento BASE (`VISUAL_ELEMENTS`), nas três linhas de alinhamento (Poder 6, Harmonia 6, Benevolencia 5).
 * Só existem Rookie e Champion: são os encontros COMUNS da masmorra nos slots rookie/champion da escada
 * (`getDungeonEncounter`). Ultimate e Mega seguem com as linhas antigas (`DUNGEON_LINE_SPRITES`) ate haver arte nova.
 *
 * ⚠️ NAO substituem `DUNGEON_LINE_SPRITES`: aquelas 9 linhas continuam donas dos personagens prontos/legados, das
 * sombras do Pesadelo (`nightmareShadows`), dos NPCs da Biblioteca, do Combina 3 e do bosque. As linhas de evolucao do
 * JOGADOR usam outras artes e nao passam por aqui.
 *
 * Elemento do encontro = elemento da criatura; o golpe basico/especial tem nome proprio PT/EN (fonte:
 * `E:/soulmon-novos-soulmon/tabela.md`). Valores de dano/HP NAO mudam: o tier do slot so escolhe rookie ou champion.
 * Arte: 256² RGBA (Lanczos a partir de 1024², alfa preservado, >=250 vira 255), todas olham para a DIREITA ou de frente
 * (nada entra em `LEFT_FACING_LINES`). Nomes sem sufixo `-mon` (`sprites.dungeonRoster.test.ts`).
 */
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

export type NovoLine = 'poder' | 'harmonia' | 'benevolencia';
export type NovoStage = 'rookie' | 'champion';
export interface NovoAttack { pt: string; en: string }
export interface NovoSoulmon {
  /** Id da criatura = nome Rookie em minusculas; vai no `stage` do inimigo (`<id>-<tier>`) e no bestiario do save. */
  id: string;
  line: NovoLine;
  /** Um dos 17 elementos base: dono do cenario/FX/forma do golpe do encontro. */
  element: string;
  rookie: { name: string; sprite: string };
  champion: { name: string; sprite: string };
  basico: NovoAttack;
  especial: NovoAttack;
}

export const NOVOS_SOULMON: readonly NovoSoulmon[] = [
  { id: 'embrit', line: 'poder', element: 'fogo', rookie: { name: 'Embrit', sprite: embritRookie }, champion: { name: 'Pyrolisk', sprite: embritChampion },
    basico: { pt: "Cuspe de Brasa", en: "Ember Spit" }, especial: { pt: "Erupção de Magma", en: "Magma Eruption" } },
  { id: 'spinvex', line: 'poder', element: 'vileza', rookie: { name: 'Spinvex', sprite: spinvexRookie }, champion: { name: 'Spinvorax', sprite: spinvexChampion },
    basico: { pt: "Farpa Ácida", en: "Acid Barb" }, especial: { pt: "Veneno Voraz", en: "Ravenous Venom" } },
  { id: 'ossumi', line: 'poder', element: 'morte', rookie: { name: 'Ossumi', sprite: ossumiRookie }, champion: { name: 'Ceifoss', sprite: ossumiChampion },
    basico: { pt: "Toque Fúnebre", en: "Grave Touch" }, especial: { pt: "Ceifa Final", en: "Final Reap" } },
  { id: 'umbrae', line: 'poder', element: 'sombra', rookie: { name: 'Umbrae', sprite: umbraeRookie }, champion: { name: 'Noctherix', sprite: umbraeChampion },
    basico: { pt: "Garra Sombria", en: "Shade Claw" }, especial: { pt: "Eclipse Umbral", en: "Umbral Eclipse" } },
  { id: 'brawnu', line: 'poder', element: 'vigor', rookie: { name: 'Brawnu', sprite: brawnuRookie }, champion: { name: 'Brawnor', sprite: brawnuChampion },
    basico: { pt: "Cabeçada Firme", en: "Steady Bash" }, especial: { pt: "Investida Incansável", en: "Relentless Charge" } },
  { id: 'kenjo', line: 'poder', element: 'marcial', rookie: { name: 'Kenjo', sprite: kenjoRookie }, champion: { name: 'Shihanor', sprite: kenjoChampion },
    basico: { pt: "Soco Duplo", en: "Twin Strike" }, especial: { pt: "Mil Palmas", en: "Thousand Palms" } },
  { id: 'runix', line: 'harmonia', element: 'arcano', rookie: { name: 'Runix', sprite: runixRookie }, champion: { name: 'Arcanowl', sprite: runixChampion },
    basico: { pt: "Dardo Rúnico", en: "Rune Bolt" }, especial: { pt: "Selo Arcano", en: "Arcane Seal" } },
  { id: 'chronib', line: 'harmonia', element: 'tempo', rookie: { name: 'Chronib', sprite: chronibRookie }, champion: { name: 'Tempora', sprite: chronibChampion },
    basico: { pt: "Pulso Temporal", en: "Time Pulse" }, especial: { pt: "Reversão", en: "Rewind Burst" } },
  { id: 'voidlet', line: 'harmonia', element: 'espaco', rookie: { name: 'Voidlet', sprite: voidletRookie }, champion: { name: 'Rifthound', sprite: voidletChampion },
    basico: { pt: "Estocada Dobrada", en: "Warp Jab" }, especial: { pt: "Fenda Espacial", en: "Rift Tear" } },
  { id: 'gravul', line: 'harmonia', element: 'gravidade', rookie: { name: 'Gravul', sprite: gravulRookie }, champion: { name: 'Gravodon', sprite: gravulChampion },
    basico: { pt: "Peso Morto", en: "Heavy Slam" }, especial: { pt: "Poço Gravitacional", en: "Gravity Well" } },
  { id: 'vibri', line: 'harmonia', element: 'som', rookie: { name: 'Vibri', sprite: vibriRookie }, champion: { name: 'Sonorana', sprite: vibriChampion },
    basico: { pt: "Estalo Sônico", en: "Sonic Snap" }, especial: { pt: "Rugido Ressonante", en: "Resonant Roar" } },
  { id: 'voltrix', line: 'harmonia', element: 'eletricidade', rookie: { name: 'Voltrix', sprite: voltrixRookie }, champion: { name: 'Fulgurion', sprite: voltrixChampion },
    basico: { pt: "Faísca", en: "Spark Zap" }, especial: { pt: "Raio em Cadeia", en: "Chain Lightning" } },
  { id: 'sprouti', line: 'benevolencia', element: 'vida', rookie: { name: 'Sprouti', sprite: sproutiRookie }, champion: { name: 'Florestag', sprite: sproutiChampion },
    basico: { pt: "Chicote de Cipó", en: "Vine Lash" }, especial: { pt: "Florescer", en: "Bloom Burst" } },
  { id: 'solion', line: 'benevolencia', element: 'luz', rookie: { name: 'Solion', sprite: solionRookie }, champion: { name: 'Aurolion', sprite: solionChampion },
    basico: { pt: "Raio de Luz", en: "Light Beam" }, especial: { pt: "Nova Radiante", en: "Radiant Nova" } },
  { id: 'bubbo', line: 'benevolencia', element: 'agua', rookie: { name: 'Bubbo', sprite: bubboRookie }, champion: { name: 'Tidotter', sprite: bubboChampion },
    basico: { pt: "Jato d'Água", en: "Water Jet" }, especial: { pt: "Maremoto", en: "Tidal Surge" } },
  { id: 'pebblo', line: 'benevolencia', element: 'terra', rookie: { name: 'Pebblo', sprite: pebbloRookie }, champion: { name: 'Terrarhino', sprite: pebbloChampion },
    basico: { pt: "Pedrada", en: "Rock Toss" }, especial: { pt: "Tremor", en: "Quake Stomp" } },
  { id: 'zephir', line: 'benevolencia', element: 'ar', rookie: { name: 'Zephir', sprite: zephirRookie }, champion: { name: 'Cirruwing', sprite: zephirChampion },
    basico: { pt: "Bicada de Vento", en: "Gust Peck" }, especial: { pt: "Ciclone", en: "Cyclone Dive" } },
];

const BY_ID: Readonly<Record<string, NovoSoulmon>> = Object.fromEntries(NOVOS_SOULMON.map(n => [n.id, n]));

export function novoSoulmonById(id: string | undefined | null): NovoSoulmon | undefined {
  return id ? BY_ID[id] : undefined;
}

/** O `stage` de um inimigo da masmorra (`<id>-<tier>`) -> a criatura nova, ou `undefined` (linha antiga). */
export function novoSoulmonOfStage(stage: string | undefined | null): NovoSoulmon | undefined {
  if (!stage) return undefined;
  const i = stage.indexOf('-'); // o id nao tem hifen; o tier pode (`baby-i`)
  return i > 0 ? BY_ID[stage.slice(0, i)] : undefined;
}

export interface DungeonEncounter {
  sprite: string;
  name: string;
  /** Id da linha antiga OU da criatura nova (compoe o `stage`). */
  line: string;
  /** Elemento do encontro (so nas criaturas novas; as linhas antigas seguem com o elemento sorteado pelo stage). */
  element?: string;
  basico?: NovoAttack;
  especial?: NovoAttack;
}

/** Slot da escada -> forma da criatura nova; `null` = ultimate/mega, ainda sem arte nova. */
export function novoStageOfTier(tier: string): NovoStage | null {
  if (tier === 'champion') return 'champion';
  if (tier === 'baby-i' || tier === 'baby-ii' || tier === 'rookie') return 'rookie';
  return null;
}

/**
 * O encontro de um slot da escada: rookie/champion sorteiam UMA das 17 criaturas novas (1 chamada de `rng`, como antes);
 * ultimate/mega caem no sorteio antigo (`getDungeonEnemySprite`).
 */
export function getDungeonEncounter(
  tier: string, excludeLine: string | undefined, rng: () => number,
  legacy: (tier: string, excludeLine: string | undefined, rng: () => number) => { sprite: string; name: string; line: string },
): DungeonEncounter {
  const stage = novoStageOfTier(tier);
  if (!stage) return legacy(tier, excludeLine, rng);
  const pool = NOVOS_SOULMON.filter(n => n.id !== excludeLine);
  const n = pool[Math.floor(rng() * pool.length)];
  return { sprite: n[stage].sprite, name: n[stage].name, line: n.id, element: n.element, basico: n.basico, especial: n.especial };
}
