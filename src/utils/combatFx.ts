/**
 * COMBATE — a arte e o ritmo das três ações visuais da cena de combate
 * (`components/games/BattleStage.tsx`, rodada 5 / I10, 02/10/2026).
 *
 * Cada lutador faz três coisas na cena, todas com a arte de SKILL do ELEMENTO
 * dele (`fx-<elemento>-<estado>.png`, `utils/attackFxArt.ts`):
 *  · **ataque físico (`melee`)** — investida corpo a corpo: o lutador corre até
 *    o alvo; no alvo aparecem o corte (`slash`) e o impacto (`impact`);
 *  · **ataque à distância (`ranged`)** — o projétil (`orb`) do elemento
 *    atravessa a cena; no alvo, o impacto; o conjurador solta o `cast`;
 *  · **escudo (`shield`)** — a defesa automática mostra a barreira do elemento
 *    do DEFENSOR (`defended`) no lugar do impacto.
 * O golpe ESPECIAL (`special`) tem a forma da SKILL dele (`strike`: física ou à
 * distância) em dobro e é o ÚNICO com o círculo de cast + aura no lutador (e o
 * selo `SPECIAL!`). A forma de cada skill vem das tabelas `SCHOOL_STRIKE_FORM` /
 * `ELEMENT_STRIKE_FORM` — nunca de índice nem de sorteio.
 *
 * Este arquivo só decide QUAL arte e QUANTO tempo; não desenha nada.
 * Nenhuma regra de jogo mora aqui (dano, gauge, golpe: `arena.ts`/`_duel.js`).
 */
import { attackFx, type AttackFxState } from './attackFxArt';
import type { EscolaId } from './soulProfile/ficha/types';

export type StageActionKind = 'melee' | 'ranged' | 'special';

/** Elemento sem arte própria cai neste (neutro tem os 6 estados). */
export const FX_FALLBACK_ELEMENT = 'neutro';

/** Os 17 elementos base (a mesma lista do anel de `arena.ts`), para dar um elemento visual ao oponente. */
export const VISUAL_ELEMENTS = [
  'fogo', 'vida', 'terra', 'gravidade', 'ar', 'som', 'eletricidade', 'agua',
  'marcial', 'arcano', 'tempo', 'espaco', 'luz', 'sombra', 'morte', 'vileza', 'vigor',
] as const;

/** Ids do oráculo que não existem como arte: o mais próximo (`attackFxArt` faz o mesmo para a aura). */
const ORACLE_TO_FX: Record<string, string> = { planta: 'vida', industrial: 'aco' };

/** Id de elemento (do oráculo, da ficha ou do bestiário) → id que tem arte; sem arte, `neutro`. */
export function fxElementId(id: string | undefined | null): string {
  if (!id) return FX_FALLBACK_ELEMENT;
  const mapped = ORACLE_TO_FX[id] ?? id;
  return attackFx(mapped, 'orb') ? mapped : FX_FALLBACK_ELEMENT;
}

/** A URL do estado para o elemento, caindo no `neutro`. Nunca `undefined` se o neutro estiver instalado. */
export function fxFrame(elementId: string | undefined | null, estado: AttackFxState): string | undefined {
  const id = fxElementId(elementId);
  return attackFx(id, estado) ?? attackFx(FX_FALLBACK_ELEMENT, estado);
}

/** O elemento do oponente do duelo (o servidor não publica elemento): determinístico pelo id dele. */
export function visualElementFor(seedText: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < seedText.length; i++) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return VISUAL_ELEMENTS[h % VISUAL_ELEMENTS.length];
}

/** A FORMA de um golpe: investida corpo a corpo (só o corte) ou projétil (com impacto/splash). */
export type StrikeForm = 'melee' | 'ranged';
/** O papel da skill no par da ficha: básica (golpe normal) ou especial (carregada). */
export type SkillRole = 'basica' | 'especial';

/**
 * TABELA DA ESCOLA (dono único do `kind` das skills do JOGADOR, 04/10/2026): a escola da skill da ficha
 * (`StageSkill.escolaId`) × o papel dela (básica/especial) → físico ou à distância. O golpe NUNCA sai de índice
 * nem de sorteio: é sempre a skill que decide. Física = só o corte; à distância = projétil + impacto.
 * `combate_fisico` é corpo a corpo nas duas; as demais escolas atiram, menos a mordida/marca da maldição
 * (a básica ataca de perto) e a convocação da evocação (a especial vem de perto).
 * Teste que varre: `combatFx.test.ts` ("nenhuma skill sem kind").
 */
export const SCHOOL_STRIKE_FORM: Record<EscolaId, Record<SkillRole, StrikeForm>> = {
  combate_fisico: { basica: 'melee', especial: 'melee' },
  longo_alcance: { basica: 'ranged', especial: 'ranged' },
  conjuracao: { basica: 'ranged', especial: 'ranged' },
  benca: { basica: 'ranged', especial: 'ranged' },
  maldicao: { basica: 'melee', especial: 'ranged' },
  evocacao: { basica: 'ranged', especial: 'melee' },
};

/**
 * TABELA DO ELEMENTO (dono único do `kind` das skills de quem NÃO tem ficha: os inimigos do Pesadelo, da
 * Masmorra e da Arena, o oponente fantasma do duelo — e o pet de quem ainda não abriu a ficha). Cada elemento
 * tem o arquétipo de golpe dele: a básica e a especial dele, físicas ou à distância. Cobre os 17 base (+ `aco`
 * e o neutro); o resto cai em `ELEMENT_STRIKE_FALLBACK`.
 */
export const ELEMENT_STRIKE_FORM: Record<string, Record<SkillRole, StrikeForm>> = {
  fogo: { basica: 'ranged', especial: 'melee' },
  agua: { basica: 'ranged', especial: 'ranged' },
  terra: { basica: 'melee', especial: 'ranged' },
  ar: { basica: 'ranged', especial: 'ranged' },
  eletricidade: { basica: 'ranged', especial: 'melee' },
  arcano: { basica: 'ranged', especial: 'ranged' },
  sombra: { basica: 'melee', especial: 'ranged' },
  luz: { basica: 'ranged', especial: 'ranged' },
  vileza: { basica: 'melee', especial: 'melee' },
  morte: { basica: 'melee', especial: 'ranged' },
  vida: { basica: 'ranged', especial: 'ranged' },
  vigor: { basica: 'melee', especial: 'melee' },
  marcial: { basica: 'melee', especial: 'melee' },
  tempo: { basica: 'ranged', especial: 'ranged' },
  som: { basica: 'ranged', especial: 'ranged' },
  gravidade: { basica: 'melee', especial: 'ranged' },
  espaco: { basica: 'ranged', especial: 'ranged' },
  aco: { basica: 'melee', especial: 'melee' },
  [FX_FALLBACK_ELEMENT]: { basica: 'melee', especial: 'ranged' },
};
export const ELEMENT_STRIKE_FALLBACK: Record<SkillRole, StrikeForm> = { basica: 'ranged', especial: 'ranged' };

/** Elemento (inimigo, fantasma, pet sem ficha) → forma do golpe da skill básica/especial dele. */
export function elementStrikeForm(element: string | undefined | null, role: SkillRole): StrikeForm {
  const id = element ? (ORACLE_TO_FX[element] ?? element) : undefined;
  return (id ? ELEMENT_STRIKE_FORM[id] : undefined)?.[role] ?? ELEMENT_STRIKE_FALLBACK[role];
}

/** Skill do jogador (a da ficha) → forma do golpe. Sem escola (ficha ausente), cai no elemento; sem nada, à distância. */
export function skillStrikeForm(skill: { escolaId?: EscolaId; elementoId?: string } | undefined | null, role: SkillRole): StrikeForm {
  if (skill?.escolaId) return SCHOOL_STRIKE_FORM[skill.escolaId][role];
  return elementStrikeForm(skill?.elementoId, role);
}

/** Um lutador para `fighterStrikeForm`: a skill da ficha do papel (se houver) e o elemento dele. */
export interface StrikeFighter {
  skill?: { escolaId?: EscolaId } | null;
  element?: string | null;
}
/**
 * DONO ÚNICO da forma do golpe de um lutador (PR1b/B2). Precedência num lugar só: com ficha, a ESCOLA
 * da `StageSkill` decide (igual na Arena, Masmorra, Pesadelo e Duelo); sem ficha, o ELEMENTO.
 */
export function fighterStrikeForm(fighter: StrikeFighter, role: SkillRole): StrikeForm {
  if (fighter.skill?.escolaId) return SCHOOL_STRIKE_FORM[fighter.skill.escolaId][role];
  return elementStrikeForm(fighter.element, role);
}

/** Compat: a skill BÁSICA da escola. */
export function strikeKindForSchool(escola: EscolaId | undefined): StrikeForm {
  return escola ? SCHOOL_STRIKE_FORM[escola].basica : ELEMENT_STRIKE_FALLBACK.basica;
}

/**
 * Rótulo do efeito do ESPECIAL na cena (um lugar só, para trocar fácil). Alternativas propostas (arcano,
 * sem franquia): "Arcano!"/"Arcane!", "Despertar!"/"Awaken!", "Ápice!"/"Zenith!".
 */
export const SPECIAL_LABEL = { en: 'SPECIAL!', pt: 'ESPECIAL!' } as const;
/** N1 (PR1b): o selo do cast mostra o nome próprio da `StageSkill` especial; sem ficha, `SPECIAL_LABEL`. */
export function specialLabel(isPt: boolean, skill?: { nome: { pt: string; en: string } } | null): string {
  const nome = skill?.nome?.[isPt ? 'pt' : 'en']?.trim();
  return nome || (isPt ? SPECIAL_LABEL.pt : SPECIAL_LABEL.en);
}

/**
 * Tempos da cena, em ms, no relógio do `BattleStage` (do início da ação até o
 * IMPACTO, e a duração total do efeito). O jogo aplica o dano (barra de HP,
 * número flutuante) no IMPACTO — a barra não cai antes de o golpe chegar.
 */
export const STAGE_TIMING = {
  melee: { impact: 460, total: 1000 },
  ranged: { impact: 760, total: 1250 },
  special: { impact: 980, total: 1500 },
  /** Movimento reduzido: sem trajeto, só a troca de pose/flash no alvo. */
  reduced: { impact: 120, total: 700 },
} as const;

export function impactMs(kind: StageActionKind, reduced: boolean): number {
  return (reduced ? STAGE_TIMING.reduced : STAGE_TIMING[kind]).impact;
}
export function totalMs(kind: StageActionKind, reduced: boolean): number {
  return (reduced ? STAGE_TIMING.reduced : STAGE_TIMING[kind]).total;
}

/** `prefers-reduced-motion` (lido uma vez por cena): sem investida nem projétil, só o flash. */
export function prefersReducedMotion(): boolean {
  try {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}
