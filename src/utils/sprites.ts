/**
 * WP1.12 — O FILTRO DE TONALIDADE DO DEMO.
 *
 * Quem entra pelo caminho grátis recebe um dos três personagens pré-prontos —
 * iguais para todo mundo. O tint é a menor coisa possível que transforma um
 * personagem emprestado em algo escolhido, e é o oposto de uma mecânica:
 * nenhuma regra, nenhum atributo, nenhum preço e nenhuma evolução olham para
 * ele. Some inteiro quando a pessoa gera a criatura dela.
 *
 * `hue-rotate` e não sprites novos: são três variações de graça sobre a arte
 * que já existe, sem um byte a mais no bundle.
 */
export const DEMO_TINTS = [0, 40, 200, 300] as const;

export function demoTintFilter(tint: number | undefined): string | undefined {
  const i = Math.max(0, Math.min(DEMO_TINTS.length - 1, Math.floor(tint ?? 0)));
  const graus = DEMO_TINTS[i];
  return graus ? `hue-rotate(${graus}deg)` : undefined;
}

// Stage → sprite map, shared by CompanionHUD and the dungeon minigame.
// Árvore jogável do Soulmon: sprites placeholder gerados
// (scripts/gen-soulmon-placeholders.mjs) até a integração com o Higgsfield.
import soulmonRookie from '../assets/soulmon/rookie.png';
import soulmonChampionPower from '../assets/soulmon/champion-power.png';
import soulmonChampionHarmony from '../assets/soulmon/champion-harmony.png';
import soulmonChampionBenevolence from '../assets/soulmon/champion-benevolence.png';
import soulmonUltimatePower from '../assets/soulmon/ultimate-power.png';
import soulmonUltimateHarmony from '../assets/soulmon/ultimate-harmony.png';
import soulmonUltimateBenevolence from '../assets/soulmon/ultimate-benevolence.png';
import soulmonMegaPower from '../assets/soulmon/mega-power.png';
import soulmonMegaHarmony from '../assets/soulmon/mega-harmony.png';
import soulmonMegaBenevolence from '../assets/soulmon/mega-benevolence.png';
import soulmonUltra from '../assets/soulmon/ultra.png';
export { default as DUNGEON_SPIRIT_SPRITE } from '../assets/soulmon/dungeon-spirit.png';

// 3 linhas completas de Soulmon (placeholder, até o Higgsfield gerar as do
// usuário) — usadas como inimigos "de verdade" na masmorra, uma por tier.
import ignarRookie from '../assets/soulmon/lines/ignar-rookie.png';
import ignarChampion from '../assets/soulmon/lines/ignar-champion.png';
import ignarUltimate from '../assets/soulmon/lines/ignar-ultimate.png';
import ignarMega from '../assets/soulmon/lines/ignar-mega.png';
import lumelRookie from '../assets/soulmon/lines/lumel-rookie.png';
import lumelChampion from '../assets/soulmon/lines/lumel-champion.png';
import lumelUltimate from '../assets/soulmon/lines/lumel-ultimate.png';
import lumelMega from '../assets/soulmon/lines/lumel-mega.png';
import serahRookie from '../assets/soulmon/lines/serah-rookie.png';
import serahChampion from '../assets/soulmon/lines/serah-champion.png';
import serahUltimate from '../assets/soulmon/lines/serah-ultimate.png';
import serahMega from '../assets/soulmon/lines/serah-mega.png';
import kaelenRookie from '../assets/soulmon/lines/kaelen-rookie.png';
import kaelenChampion from '../assets/soulmon/lines/kaelen-champion-power.png';
import kaelenUltimate from '../assets/soulmon/lines/kaelen-ultimate-power.png';
import kaelenMega from '../assets/soulmon/lines/kaelen-mega-power.png';
import orrinRookie from '../assets/soulmon/lines/orrin-rookie.png';
import orrinChampion from '../assets/soulmon/lines/orrin-champion.png';
import orrinUltimate from '../assets/soulmon/lines/orrin-ultimate.png';
import orrinMega from '../assets/soulmon/lines/orrin-mega.png';
import thalindraRookie from '../assets/soulmon/lines/thalindra-rookie.png';
import thalindraChampion from '../assets/soulmon/lines/thalindra-champion.png';
import thalindraUltimate from '../assets/soulmon/lines/thalindra-ultimate.png';
import thalindraMega from '../assets/soulmon/lines/thalindra-mega.png';
// As 3 linhas do oráculo com seed fixo (runs 1–3 de 18/08/2026, recortadas em
// 15/09/2026 — D1: entram na pré-seleção do jogador free).
import igniRookie from '../assets/soulmon/lines/igni-rookie.png';
import igniChampion from '../assets/soulmon/lines/igni-champion.png';
import igniUltimate from '../assets/soulmon/lines/igni-ultimate.png';
import igniMega from '../assets/soulmon/lines/igni-mega.png';
import nautiluRookie from '../assets/soulmon/lines/nautilu-rookie.png';
import nautiluChampion from '../assets/soulmon/lines/nautilu-champion.png';
import nautiluUltimate from '../assets/soulmon/lines/nautilu-ultimate.png';
import nautiluMega from '../assets/soulmon/lines/nautilu-mega.png';
import astraseRookie from '../assets/soulmon/lines/astrase-rookie.png';
import astraseChampion from '../assets/soulmon/lines/astrase-champion.png';
import astraseUltimate from '../assets/soulmon/lines/astrase-ultimate.png';
import astraseMega from '../assets/soulmon/lines/astrase-mega.png';

export const DUNGEON_LINE_SPRITES: Record<string, Record<'rookie' | 'champion' | 'ultimate' | 'mega', string>> = {
  ignar: { rookie: ignarRookie, champion: ignarChampion, ultimate: ignarUltimate, mega: ignarMega },
  lumel: { rookie: lumelRookie, champion: lumelChampion, ultimate: lumelUltimate, mega: lumelMega },
  serah: { rookie: serahRookie, champion: serahChampion, ultimate: serahUltimate, mega: serahMega },
  kaelen: { rookie: kaelenRookie, champion: kaelenChampion, ultimate: kaelenUltimate, mega: kaelenMega },
  orrin: { rookie: orrinRookie, champion: orrinChampion, ultimate: orrinUltimate, mega: orrinMega },
  thalindra: { rookie: thalindraRookie, champion: thalindraChampion, ultimate: thalindraUltimate, mega: thalindraMega },
  igni: { rookie: igniRookie, champion: igniChampion, ultimate: igniUltimate, mega: igniMega },
  nautilu: { rookie: nautiluRookie, champion: nautiluChampion, ultimate: nautiluUltimate, mega: nautiluMega },
  astrase: { rookie: astraseRookie, champion: astraseChampion, ultimate: astraseUltimate, mega: astraseMega },
};
/**
 * O NOME DE EXIBIÇÃO DE CADA LINHA — dono único.
 *
 * ⚠️ Estes três nomes estavam escritos à mão em TRÊS arquivos: aqui, no
 * `PREMADE_CHARACTERS` (`monetization.ts`) e no `petName` dos NPCs da
 * Biblioteca (`libraryNpcs.ts`). É o footgun 9 em forma de string — renomear
 * num lugar deixaria o inimigo da masmorra e o NPC da Biblioteca chamando a
 * MESMA criatura por outro nome, sem nada ficar vermelho. Descoberto ao
 * renomeá-los em 08/09/2026; os outros dois arquivos agora LEEM daqui.
 *
 * Este arquivo é o dono porque é o mais baixo da pilha: `monetization.ts` e
 * `libraryNpcs.ts` já importam dele, e o contrário criaria ciclo.
 *
 * ⚠️ **Nada de sufixo `-mon`** (`CLAUDE.md`, seção de arte): eles eram
 * Pyrakamon / Akashaoimon / Nimbratamon, e prefixo somado a sufixo fixo é o que
 * soletra nome de franquia alheia. O `id` da linha (`kaelen`, `orrin`,
 * `thalindra`) não muda — é ele que resolve o sprite, vai para o save e nomeia
 * os arquivos de arte.
 */
export const DUNGEON_LINE_NAMES: Record<string, string> = {
  ignar: 'Ignar', lumel: 'Lumel', serah: 'Serah',
  kaelen: 'Pyraka', orrin: 'Akashaoi', thalindra: 'Nimbrata',
  igni: 'Igni', nautilu: 'Nautilu', astrase: 'Astrase',
};

/** Sprite de inimigo de masmorra: sorteia uma das nossas linhas pelo tier
 *  (baby-i/ii caem no rookie da linha; mega cobre ultimate também).
 *  `excludeLine` tira do sorteio a linha que o próprio jogador está usando
 *  (modo demo), pra ninguém encarar um espelho de si mesmo. */
export function getDungeonEnemySprite(tier: string, excludeLine?: string): { sprite: string; name: string; line: string } {
  const all = Object.keys(DUNGEON_LINE_SPRITES);
  const lines = all.filter(l => l !== excludeLine);
  const pool = lines.length > 0 ? lines : all;
  const line = pool[Math.floor(Math.random() * pool.length)];
  const stage = tier === 'baby-i' || tier === 'baby-ii' ? 'rookie'
    : tier === 'rookie' ? 'rookie'
    : tier === 'champion' ? 'champion'
    : tier === 'ultimate' ? 'ultimate'
    : 'mega';
  return { sprite: DUNGEON_LINE_SPRITES[line][stage], name: DUNGEON_LINE_NAMES[line], line };
}

const SOULMON_SPRITES: Record<string, string> = {
  'rookie': soulmonRookie,
  'champion-power': soulmonChampionPower,
  'champion-harmony': soulmonChampionHarmony,
  'champion-benevolence': soulmonChampionBenevolence,
  'ultimate-power': soulmonUltimatePower,
  'ultimate-harmony': soulmonUltimateHarmony,
  'ultimate-benevolence': soulmonUltimateBenevolence,
  'mega-power': soulmonMegaPower,
  'mega-harmony': soulmonMegaHarmony,
  'mega-benevolence': soulmonMegaBenevolence,
  'ultra': soulmonUltra,
};
import { getStageLevel, getStageBranch } from '../types/progression';
import { CORVO_LINE, corvoSpriteFor } from './corvoPet';

/**
 * Legacy stage ids (saves made before the Soulmon tree existed) still carry
 * per-species names. They no longer have art of their own: the Bandai-derived
 * sprites that used to back them were removed from the bundle. Resolution now
 * goes through OUR art — the id picks a line deterministically, so the same
 * old save always renders the same creature instead of shuffling every load.
 */
const LEGACY_LINES = Object.keys(DUNGEON_LINE_SPRITES);

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function legacySpriteForStage(stageId: string): string {
  const level = getStageLevel(stageId);
  const branch = getStageBranch(stageId);
  // Branch-shaped ids ('champion-power') are the current tree — answer with the
  // matching Soulmon form. Anything else is a legacy species name.
  if (branch) {
    const own = SOULMON_SPRITES[`${level}-${branch}`];
    if (own) return own;
  }
  const line = DUNGEON_LINE_SPRITES[LEGACY_LINES[hashId(stageId) % LEGACY_LINES.length]];
  const key = level === 'ultra' ? 'mega' : level;
  return line[key as 'rookie' | 'champion' | 'ultimate' | 'mega'] ?? line.rookie;
}

/** Tiers com arte própria nas linhas (`lines/<linha>-<tier>.png`). */
export type LineTier = 'rookie' | 'champion' | 'ultimate' | 'mega';

/**
 * A LINHA e o TIER por trás de um estágio — a mesma resolução de
 * `getSpriteForStage`, sem o sprite: demo → a linha escolhida; id legado →
 * a linha sorteada por hash; estágio com ramo (`champion-power`, a árvore
 * do jogador) → `null`, porque aí a arte é a do próprio Soulmon, não de
 * linha. Consumido por `lineIcons.ts` (rodada 2: ícones-ficha 64²/32²).
 */
export function resolveLineForStage(stage: string, demoCharacterId?: string): { line: string; tier: LineTier } | null {
  const key = stage.toLowerCase();
  const level = getStageLevel(key);
  const tier = (level === 'ultra' ? 'mega' : level) as LineTier;
  if (demoCharacterId === CORVO_LINE) return null; // arte própria por forma (`corvoPet.ts`)
  if (demoCharacterId && DUNGEON_LINE_SPRITES[demoCharacterId]) return { line: demoCharacterId, tier };
  if (SOULMON_SPRITES[key]) return null;
  const branch = getStageBranch(key);
  if (branch && SOULMON_SPRITES[`${level}-${branch}`]) return null;
  return { line: LEGACY_LINES[hashId(key) % LEGACY_LINES.length], tier };
}

export function getSpriteForStage(stage: string, demoCharacterId?: string, size?: 256): string {
  const key = stage.toLowerCase();
  // O corvinho do administrador (`utils/corvoPet.ts`, dono único): uma arte
  // por forma. O 2º parâmetro é a LINHA de arte do save — `spriteLineOf`.
  if (demoCharacterId === CORVO_LINE) return corvoSpriteFor(key, size);
  // Modo demo (utils/monetization.ts): personagem pré-pronto, sem branch —
  // um sprite só por nível (rookie/champion/ultimate/mega; ultra reusa mega).
  if (demoCharacterId && DUNGEON_LINE_SPRITES[demoCharacterId]) {
    const levelRaw = key === 'rookie' || key === 'ultra' ? key : key.split('-')[0];
    const level = (levelRaw === 'ultra' ? 'mega' : levelRaw) as 'rookie' | 'champion' | 'ultimate' | 'mega';
    const line = DUNGEON_LINE_SPRITES[demoCharacterId];
    return line[level] ?? line.rookie;
  }
  return SOULMON_SPRITES[key] ?? legacySpriteForStage(key);
}

