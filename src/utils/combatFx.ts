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
import { nomeEspecialInimigo } from './soulProfile/ficha/nomeEspecial';
import { baseElementLabel } from './soulProfile/essenceLabels';
import { AREA_FAMILIES, SPECIAL_BUDGET_HITS, type SpecialFamily } from './combate/specials';

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

import { SCHOOL_STRIKE_FORM, type StrikeForm, type SkillRole } from './soulProfile/ficha/strikeForm';
export { SCHOOL_STRIKE_FORM };
export type { StrikeForm, SkillRole };

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
 * PR9: o selo do especial de um INIMIGO (Arena, Masmorra, Pesadelo, Duelo) — nome por regra a partir do
 * elemento e da identidade dele. A família vem do servidor no PvP (`opp.fx.familia`, lista fechada); nos
 * inimigos do PvE o especial é sempre dano direto. Fica no lazy `nomeEspecial`: sem
 * rede, sem IA.
 */
export function foeSpecialLabel(isPt: boolean, element: string | undefined | null, seed: string, familia?: string | null): string {
  const id = fxElementId(element) === FX_FALLBACK_ELEMENT ? 'vigor' : fxElementId(element);
  const nome = nomeEspecialInimigo({ pt: baseElementLabel(id, true), en: baseElementLabel(id, false) }, seed, familia);
  return isPt ? nome.pt : nome.en;
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

/* ───────────────────────────────────────────────────────────────────────────────────────────────
 * FX DE STATUS (PR11, run `combate-v3-01`, contexto §2.12 / §2.22).
 *
 * DONO ÚNICO da tabela `família do especial → efeito visível → arte`. Função pura: não desenha, não sorteia,
 * não toca em som (R-NOVA, `docs/SOM.md`). A arte é a que JÁ está na `main` (`assets/soulmon/combate-v3`,
 * decisão do dono: sem arte nova); quem carrega a imagem é `utils/combatV3Art.ts` (sob demanda). O que
 * falta de arte tem fallback em CSS (a forma do selo, `mark`) — a leitura nunca depende só da imagem nem só da cor.
 * ─────────────────────────────────────────────────────────────────────────────────────────────── */

/** Os efeitos visíveis num lutador. `maldicao` e `hot` ficam prontos, mas nenhuma família chega neles (Q-FX1, §2.13). */
export type StatusFxKind = 'buff' | 'debuff' | 'maldicao' | 'dot' | 'cura' | 'hot' | 'escudo';
export const STATUS_FX_KINDS: readonly StatusFxKind[] = ['buff', 'debuff', 'maldicao', 'dot', 'cura', 'hot', 'escudo'];
/** Qual atributo o buff/debuff mexe (escolhe o glifo e o texto). */
export type StatusVariant = 'atk' | 'spd' | 'def';

interface Bilingual { readonly en: string; readonly pt: string }

export interface StatusFxDef {
  /** Id do glifo do HUD (`combate-v3/status/<id>.png`), por variante; `_` é o padrão. */
  readonly glyph: Readonly<Record<string, string>>;
  /** Folha 3×2 de 128 px do FX em loop sobre o corpo (`combate-v3/fx/<id>.png`); `null` = sem loop. */
  readonly loop: string | null;
  /** Peça ESTÁTICA existente sobre o corpo (`fx/fx-heal`, `fx/fx-shield`); `null` = nenhuma. */
  readonly still: string | null;
  /** A FORMA do selo em texto (seta/sinal): distingue o efeito sem cor e é o fallback quando a arte não carregou. */
  readonly mark: string;
  /** Nome completo (aria-label, legenda) e curto (dentro do selo), EN + PT; `_` é o padrão. */
  readonly label: Readonly<Record<string, Bilingual>>;
  readonly short: Readonly<Record<string, Bilingual>>;
}

const L = (en: string, pt: string): Bilingual => ({ en, pt });

export const STATUS_FX: Readonly<Record<StatusFxKind, StatusFxDef>> = {
  buff: {
    glyph: { _: 'st-buff-atk', atk: 'st-buff-atk', spd: 'st-buff-spd' },
    loop: 'fx-buff-loop-sheet', still: null, mark: '▲',
    label: { _: L('Boost', 'Reforço'), atk: L('Attack up', 'Ataque em alta'), spd: L('Speed up', 'Velocidade em alta') },
    short: { _: L('UP', 'UP'), atk: L('ATK', 'ATQ'), spd: L('SPD', 'VEL') },
  },
  debuff: {
    glyph: { _: 'st-debuff-def', def: 'st-debuff-def' },
    loop: 'fx-debuff-loop-sheet', still: null, mark: '▼',
    label: { _: L('Weakened', 'Enfraquecido'), def: L('Defense down', 'Defesa em baixa') },
    short: { _: L('DOWN', 'BAIXA'), def: L('DEF', 'DEF') },
  },
  maldicao: {
    glyph: { _: 'st-maldicao' },
    loop: 'fx-maldicao-loop-sheet', still: null, mark: '×',
    label: { _: L('Cursed', 'Maldição') },
    short: { _: L('CURSE', 'MALD.') },
  },
  dot: {
    glyph: { _: 'st-dot' },
    loop: 'fx-dot-loop-sheet', still: null, mark: '◆',
    label: { _: L('Damage over time', 'Dano contínuo') },
    short: { _: L('DoT', 'DoT') },
  },
  cura: {
    glyph: { _: 'st-cura' },
    loop: null, still: 'fx-heal', mark: '+',
    label: { _: L('Healing', 'Cura') },
    short: { _: L('HEAL', 'CURA') },
  },
  hot: {
    glyph: { _: 'st-hot' },
    loop: null, still: 'fx-heal', mark: '+↑',
    label: { _: L('Healing over time', 'Cura contínua') },
    short: { _: L('HoT', 'HoT') },
  },
  escudo: {
    glyph: { _: 'st-escudo' },
    loop: null, still: 'fx-shield', mark: '▣',
    label: { _: L('Shield', 'Escudo') },
    short: { _: L('SHLD', 'ESCU') },
  },
};

/** Id do glifo do efeito (com a variante, se houver; sem ela, o padrão). */
export function statusGlyphId(kind: StatusFxKind, variant?: StatusVariant): string {
  const g = STATUS_FX[kind].glyph;
  return (variant && g[variant]) || g._;
}
/** Nome completo / curto do efeito na língua pedida. */
export function statusLabel(kind: StatusFxKind, isPt: boolean, variant?: StatusVariant): string {
  const l = STATUS_FX[kind].label;
  return (variant && l[variant] ? l[variant] : l._)[isPt ? 'pt' : 'en'];
}
export function statusShort(kind: StatusFxKind, isPt: boolean, variant?: StatusVariant): string {
  const l = STATUS_FX[kind].short;
  return (variant && l[variant] ? l[variant] : l._)[isPt ? 'pt' : 'en'];
}
/** O texto acessível do selo: efeito + turnos restantes ("Attack up, 2 turns left"). */
export function statusAriaLabel(kind: StatusFxKind, turns: number, isPt: boolean, variant?: StatusVariant): string {
  const n = Math.max(0, Math.round(turns));
  const t = isPt ? `${n} ${n === 1 ? 'turno' : 'turnos'}` : `${n} ${n === 1 ? 'turn' : 'turns'} left`;
  return `${statusLabel(kind, isPt, variant)}, ${t}`;
}

/** Que efeito uma família deixa e em quem: `self` fica no conjurador; `foe` cai no alvo (em todos, se a família responde à área). */
export interface FamilyStatus {
  readonly kind: StatusFxKind;
  readonly variant?: StatusVariant;
  readonly target: 'self' | 'foe';
}
/**
 * Família do núcleo (`combate/specials.ts`, PR1) → efeito persistente no lutador. `direct` é `null`: dano
 * direto não deixa estado (só o cast e o golpe, que já existem). Tipada em `Record<SpecialFamily, …>`: família
 * nova sem linha aqui NÃO compila, e `combatFx.test.ts` reprova por execução.
 */
export const FAMILY_STATUS: Readonly<Record<SpecialFamily, FamilyStatus | null>> = {
  direct: null,
  dot: { kind: 'dot', target: 'foe' },
  heal: { kind: 'cura', target: 'self' },
  shield: { kind: 'escudo', target: 'self' },
  atkBuff: { kind: 'buff', variant: 'atk', target: 'self' },
  defDebuff: { kind: 'debuff', variant: 'def', target: 'foe' },
  spdBuff: { kind: 'buff', variant: 'spd', target: 'self' },
};
/** Os efeitos que NENHUMA família alcança hoje (Q-FX1, decisão §2.13: prontos, inalcançáveis até a mecânica existir). */
export const UNREACHABLE_STATUS_FX: readonly StatusFxKind[] = STATUS_FX_KINDS.filter(
  (k) => !Object.values(FAMILY_STATUS).some((f) => f?.kind === k),
);

/** O efeito que uma família deixa (ou `null`). */
export function statusFxOfFamily(family: SpecialFamily | null | undefined): FamilyStatus | null {
  return family ? FAMILY_STATUS[family] ?? null : null;
}

/** Quantos efeitos cabem como selo por lutador; o resto vira "+k". */
export const MAX_STATUS_CHIPS = 3;

/** Um efeito no lutador, como a cena o desenha. `turns` = o que falta (a contagem do selo). */
export interface StageStatus {
  kind: StatusFxKind;
  variant?: StatusVariant;
  turns: number;
}

/** Duração em "turnos" (golpes do dono do efeito) derivada do orçamento do especial: o que o núcleo cobra de verdade. */
export function statusTurnsFor(family: SpecialFamily, power: number): number {
  if (family === 'dot') return 3; // o núcleo agenda 3 ticks
  if (family === 'heal') return 1; // instantânea: dura até o golpe seguinte de quem curou
  return Math.max(1, Math.round(SPECIAL_BUDGET_HITS * power));
}

/** Uma entrada do quadro: o efeito, de quem veio (`source`); quem o carrega é o índice do quadro. */
export interface BoardEntry extends StageStatus { source: number }
/** O quadro de efeitos de uma luta: índice 0 = o pet, 1+i = inimigo i. */
export type StatusBoard = readonly (readonly BoardEntry[])[];

export function emptyStatusBoard(nFoes: number): StatusBoard {
  return Array.from({ length: nFoes + 1 }, () => []);
}

/** Conjurou o especial: põe o efeito em quem carrega (o próprio conjurador, o alvo único ou todos os alvos da área). */
export function castStatus(
  board: StatusBoard,
  c: { caster: number; family: SpecialFamily; power: number; area: boolean; targets: readonly number[] },
): StatusBoard {
  const fam = FAMILY_STATUS[c.family];
  if (!fam) return board;
  const turns = statusTurnsFor(c.family, c.power);
  const holders = fam.target === 'self' ? [c.caster] : (c.area && AREA_FAMILIES.includes(c.family) ? c.targets : c.targets.slice(0, 1));
  const next = board.map((l) => l.slice());
  for (const h of holders) {
    if (!next[h]) continue;
    // o mesmo efeito do mesmo conjurador renova (não empilha igual)
    const rest = next[h].filter((e) => !(e.kind === fam.kind && e.variant === fam.variant && e.source === c.caster));
    next[h] = [...rest, { kind: fam.kind, variant: fam.variant, turns, source: c.caster }];
  }
  return next;
}

/**
 * Um golpe (`attack`) ou tick de DoT de `who`: gasta o efeito que `who` DEVE gastar. Buff, debuff e cura contam os
 * golpes de quem os conjurou; o DoT conta os ticks; o escudo conta os golpes do lado de fora (o que ele absorve).
 */
export function tickStatus(board: StatusBoard, ev: { kind: 'attack' | 'tick'; who: number }): StatusBoard {
  return board.map((list, holder) => list
    .map((e) => {
      const spends =
        e.kind === 'escudo' ? ev.kind === 'attack' && (ev.who === 0) !== (holder === 0)
        : e.kind === 'dot' ? ev.kind === 'tick' && ev.who === e.source
        : ev.kind === 'attack' && ev.who === e.source;
      return spends ? { ...e, turns: e.turns - 1 } : e;
    })
    .filter((e) => e.turns > 0));
}

/** Quem caiu leva os efeitos embora (e o que veio dele e dependia dos golpes dele acaba junto, menos o escudo). */
export function clearHolders(board: StatusBoard, down: readonly number[]): StatusBoard {
  return board.map((l, h) => (down.includes(h) ? [] : l.filter((e) => !down.includes(e.source) || e.kind === 'escudo')));
}

/** O que a cena recebe por lutador: sem `source`, na ordem do quadro. */
export function stageStatusOf(entries: readonly BoardEntry[] | undefined): StageStatus[] {
  return (entries ?? []).map(({ kind, variant, turns }) => ({ kind, variant, turns }));
}
