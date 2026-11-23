/**
 * O CARÁTER DO SOULMON (beta12, frente B1/B2).
 *
 * O teste de personalidade do onboarding (`soulProfile/personality`) mede o
 * Big Five do jogador. Aqui ele vira o CARÁTER do Soulmon: o jeito de falar.
 * O jogador NUNCA vê o tipo dele (não é teste de personalidade para ele) — o
 * resultado só se manifesta na fala (regra do Oráculo: "nenhum cálculo novo
 * sem manifestação"). O mapa documentado está em
 * `docs/design/PERSONALIDADE-BIG-FIVE.md`.
 *
 * Regras (decisões do dono 11/11/2026, `docs/BACKLOG-BETA12.md` §F):
 *  1. Big Five, e o complemento é calculado POR DIMENSÃO.
 *  2. Sem teste (save antigo, teste incompleto) = Soulmon NEUTRO.
 *  3. COMPLEMENTAR é o padrão; SIMILAR (mesma personalidade do jogador) é
 *     opção nas Configurações. Em SIMILAR o veto de vulnerabilidade prevalece.
 *  4. Convive com `personality.ts`: o TESTE decide o caráter; as FORÇAS e
 *     DIFICULDADES do onboarding decidem o VETO (quem declarou ansiedade,
 *     perfeccionismo ou cansaço só recebe vozes que acolhem).
 *
 * Função PURA, sem React, sem save, sem relógio. NÃO importa o banco de
 * perguntas (chunk de entrada: `entradaEnxuta.contract.test.ts`) — recebe os
 * pontos 0–100 já calculados; `loadBigFive` faz o `import()` do `scoreProfile`
 * só quando há resposta para ler.
 */
import { VULNERABLE_STRUGGLES } from './personality';
import type { StruggleId } from '../types/activityCatalog';

/** As 5 dimensões do Big Five (a 6ª do teste, Honestidade-Humildade, não entra no complemento). */
export type BigFiveDim = 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism';
export const BIG_FIVE_DIMS: readonly BigFiveDim[] = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];

export type TraitPole = 'low' | 'mid' | 'high';

/** Os 3 modos: `complementar` (padrão), `similar`. Ausente no save = complementar. */
export type SoulmonVoiceMode = 'complementar' | 'similar';
export const DEFAULT_VOICE_MODE: SoulmonVoiceMode = 'complementar';

export function sanitizeVoiceMode(v: unknown): SoulmonVoiceMode | undefined {
  return v === 'complementar' || v === 'similar' ? v : undefined;
}

/**
 * Arquétipos de personalidade. Os 7 primeiros (+ `neutro`) são as vozes que um
 * Soulmon pode ter; os 3 últimos existem só para NPCs (variedade de elenco).
 * Um id estável por arquétipo — a ficha dos NPCs (`data/npcFichas.ts`) usa os mesmos.
 */
export const SOULMON_ARCHETYPES = ['acolhedor', 'brincalhao', 'calmo', 'animado', 'direto', 'curioso', 'mentor'] as const;
export type SoulmonArchetype = (typeof SOULMON_ARCHETYPES)[number];
export const NPC_ONLY_ARCHETYPES = ['protetor', 'ironico', 'enigmatico'] as const;
export type Archetype = SoulmonArchetype | (typeof NPC_ONLY_ARCHETYPES)[number];
export const ALL_ARCHETYPES: readonly Archetype[] = [...SOULMON_ARCHETYPES, ...NPC_ONLY_ARCHETYPES];
/** `neutro` = sem teste (ou sem sinal): fala padrão. */
export type VoiceArchetype = SoulmonArchetype | 'neutro';

/**
 * Votos: (dimensão, polo do SOULMON) → arquétipo. O peso do voto é o quanto o
 * valor se afasta do meio. A tabela é o mapa documentado em
 * `PERSONALIDADE-BIG-FIVE.md` (seção "Do traço à voz").
 */
const POLE_VOTES: Record<BigFiveDim, { high: Partial<Record<SoulmonArchetype, number>>; low: Partial<Record<SoulmonArchetype, number>> }> = {
  openness:          { high: { curioso: 2 },                  low: { direto: 1, calmo: 1 } },
  conscientiousness: { high: { mentor: 2, direto: 1 },        low: { brincalhao: 2 } },
  extraversion:      { high: { animado: 2, brincalhao: 1 },   low: { calmo: 2 } },
  agreeableness:     { high: { acolhedor: 2 },                low: { direto: 2 } },
  neuroticism:       { high: { acolhedor: 2 },                low: { calmo: 2 } },
};

/** Desempate: da voz mais segura para a mais intensa. */
const TIE_ORDER: readonly SoulmonArchetype[] = ['acolhedor', 'calmo', 'curioso', 'brincalhao', 'direto', 'mentor', 'animado'];

/** O que o veto de vulnerabilidade deixa passar: só vozes que acolhem, sem
 *  pressa de ritmo, sem comando e sem ironia. `direto`, `animado` e `mentor`
 *  ficam de fora (empurram); `brincalhao` e `curioso` ficam (convidam). */
export const SAFE_ARCHETYPES: readonly SoulmonArchetype[] = ['acolhedor', 'calmo', 'curioso', 'brincalhao'];

/** Abaixo/acima da zona morta, o valor conta como polo; entre elas é meio. */
const DEAD_ZONE = 10;

function poleOf(score: number): TraitPole {
  if (score >= 50 + DEAD_ZONE) return 'high';
  if (score <= 50 - DEAD_ZONE) return 'low';
  return 'mid';
}

export type TraitPoints = Partial<Record<string, number>>;

/** Quantas respostas o teste precisa ter para o caráter valer (o onboarding grava 20). */
export const MIN_ANSWERS_FOR_CHARACTER = 10;

export interface SoulmonCharacter {
  archetype: VoiceArchetype;
  /** O polo de cada dimensão NO SOULMON (não no jogador). Vai ao chat; nunca à tela. */
  traits: Record<BigFiveDim, TraitPole>;
  mode: SoulmonVoiceMode;
  /** `neutral` = sem teste válido. */
  source: 'test' | 'neutral';
  /** O veto de vulnerabilidade trocou a voz que o teste daria. */
  vetoed: boolean;
}

const NEUTRAL_TRAITS: Record<BigFiveDim, TraitPole> = {
  openness: 'mid', conscientiousness: 'mid', extraversion: 'mid', agreeableness: 'mid', neuroticism: 'mid',
};

export const NEUTRAL_CHARACTER: SoulmonCharacter = {
  archetype: 'neutro', traits: NEUTRAL_TRAITS, mode: DEFAULT_VOICE_MODE, source: 'neutral', vetoed: false,
};

/** Veto: quem declarou ansiedade, perfeccionismo ou cansaço (as mesmas de `personality.ts`). */
export function isVulnerable(struggles: readonly StruggleId[] | null | undefined): boolean {
  return !!struggles?.some(s => VULNERABLE_STRUGGLES.includes(s));
}

/**
 * O valor de UMA dimensão no Soulmon, dado o valor do jogador.
 * - SIMILAR: o mesmo valor.
 * - COMPLEMENTAR: o espelho (100 − valor) — o que falta ao jogador.
 * Neuroticismo é a exceção, nos dois modos: o Soulmon nunca é MAIS neurótico
 * que o neutro. Complemento de jogador estável = neutro (não fabricamos um
 * bichinho ansioso); complemento de jogador sensível = firme; similar de
 * jogador sensível = no máximo neutro (e o veto cuida do resto).
 */
export function soulmonValue(dim: BigFiveDim, playerScore: number, mode: SoulmonVoiceMode): number {
  const p = Math.min(100, Math.max(0, playerScore));
  if (dim === 'neuroticism') {
    return mode === 'similar' ? Math.min(p, 50) : (p >= 50 ? 100 - p : 50);
  }
  return mode === 'similar' ? p : 100 - p;
}

function pickArchetype(values: Record<BigFiveDim, number>, allowed: readonly SoulmonArchetype[]): SoulmonArchetype | null {
  const score = new Map<SoulmonArchetype, number>();
  for (const dim of BIG_FIVE_DIMS) {
    const v = values[dim];
    const pole = poleOf(v);
    if (pole === 'mid') continue;
    const weight = Math.abs(v - 50) / 50;
    for (const [a, w] of Object.entries(POLE_VOTES[dim][pole]) as Array<[SoulmonArchetype, number]>) {
      score.set(a, (score.get(a) ?? 0) + w * weight);
    }
  }
  let best: SoulmonArchetype | null = null;
  let bestScore = 0;
  for (const a of TIE_ORDER) {
    if (!allowed.includes(a)) continue;
    const s = score.get(a) ?? 0;
    if (s > bestScore) { best = a; bestScore = s; }
  }
  return best;
}

export interface CharacterInput {
  /** `traitPoints` de `scoreProfile` (0–100). Ausente = sem teste. */
  traitPoints?: TraitPoints | null;
  /** Quantas respostas do teste existem. Menos que o mínimo = neutro. */
  answered?: number;
  mode?: SoulmonVoiceMode;
  /** Dificuldades declaradas no onboarding (decidem o veto). */
  struggles?: readonly StruggleId[] | null;
}

export function soulmonCharacterFor(input: CharacterInput): SoulmonCharacter {
  const mode = input.mode ?? DEFAULT_VOICE_MODE;
  const pts = input.traitPoints;
  if (!pts || (input.answered ?? 0) < MIN_ANSWERS_FOR_CHARACTER) return { ...NEUTRAL_CHARACTER, mode };

  const values = {} as Record<BigFiveDim, number>;
  for (const dim of BIG_FIVE_DIMS) {
    const raw = pts[dim];
    values[dim] = soulmonValue(dim, typeof raw === 'number' && Number.isFinite(raw) ? raw : 50, mode);
  }
  const traits = {} as Record<BigFiveDim, TraitPole>;
  for (const dim of BIG_FIVE_DIMS) traits[dim] = poleOf(values[dim]);

  const vulnerable = isVulnerable(input.struggles);
  const free = pickArchetype(values, SOULMON_ARCHETYPES);
  const picked = vulnerable ? pickArchetype(values, SAFE_ARCHETYPES) : free;
  // O veto também suaviza o que vai ao chat: nenhuma dimensão que empurre.
  const vetoed = vulnerable && free !== picked;
  if (vulnerable) {
    traits.conscientiousness = traits.conscientiousness === 'high' ? 'mid' : traits.conscientiousness;
    traits.extraversion = traits.extraversion === 'high' ? 'mid' : traits.extraversion;
    traits.agreeableness = traits.agreeableness === 'low' ? 'mid' : traits.agreeableness;
  }
  // Veto sem voz segura com voto: a mais acolhedora (o mesmo espírito do fallback
  // `casual` + `supportive` de `personality.ts`). Sem voto nenhum, segue neutro.
  const archetype: VoiceArchetype = picked ?? (vulnerable && free ? 'acolhedor' : 'neutro');
  return { archetype, traits, mode, source: 'test', vetoed };
}

/**
 * Lê o teste do save e devolve os pontos. `import()` DINÂMICO: o banco de
 * perguntas não entra no chunk de entrada. Resposta ausente/ilegível → `null`.
 */
export async function loadBigFive(answers: unknown): Promise<{ traitPoints: TraitPoints; answered: number } | null> {
  if (!answers || typeof answers !== 'object') return null;
  try {
    const { scoreProfile } = await import('./soulProfile/personality/scoring');
    const p = scoreProfile(answers as Parameters<typeof scoreProfile>[0]);
    return { traitPoints: p.traitPoints, answered: p.answeredCount };
  } catch {
    return null;
  }
}
