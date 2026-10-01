/**
 * A PERSONALIDADE DO SOULMON, DERIVADA (G7, navegação do dono 01/10/2026).
 *
 * Decisão do dono: a personalidade deixa de ser escolha nas Configurações —
 * "automática, sem troca". Ela sai das FORÇAS e DIFICULDADES que a pessoa
 * declarou no onboarding, e escolhe a voz que CONTRABALANÇA a dificuldade e
 * melhor ENCORAJA. O racional, com fontes, está em `docs/PERSONALIDADE-DERIVADA.md`
 * (método do `soulmon-behavioral-psychologist`); este arquivo só aplica.
 *
 * Função PURA, sem React, sem save, sem relógio: o mesmo perfil devolve sempre
 * a mesma personalidade. O resultado tem a MESMA forma que o chat já consome
 * (`AISettings` de `AISettingsModal.tsx` → `functions/api/chat.js`), então o
 * servidor não muda: só deixa de receber o que a pessoa escolheu e passa a
 * receber o que foi derivado.
 *
 * Três travas que não podem cair (há teste em cada uma):
 *  1. **Veto de vulnerabilidade.** Quem declarou ansiedade, perfeccionismo ou
 *     cansaço NUNCA recebe a motivação `challenging` — pressão sobre essas
 *     três é o caminho documentado para culpa/vergonha e abandono.
 *  2. **`challenging` só com lastro**: exige disciplina ou persistência
 *     declaradas como força. Desafio sem autoeficácia é cobrança.
 *  3. **Fallback seguro**: perfil vazio, incompleto ou com ids desconhecidos
 *     cai em `casual` + `supportive` — a voz que não machuca ninguém.
 */
import type { StrengthId, StruggleId } from '../types/activityCatalog';

export type PersonalityTone = 'casual' | 'energetic' | 'calm' | 'playful';
export type PersonalityMotivation = 'encouraging' | 'challenging' | 'supportive' | 'balanced';
export type PersonalityEmoji = 'low' | 'medium';

/** O que o onboarding guarda. Mesma forma do `RecommendProfile`
 *  (`utils/recommend.ts`), sem as áreas — elas não mudam a voz. */
export interface PersonalityProfile {
  strengths?: readonly StrengthId[] | null;
  struggles?: readonly StruggleId[] | null;
}

export interface DerivedPersonality {
  tone: PersonalityTone;
  motivationStyle: PersonalityMotivation;
  emojiIntensity: PersonalityEmoji;
  /** `fallback` = o perfil não tinha sinal suficiente. */
  source: 'derived' | 'fallback';
}

export const FALLBACK_PERSONALITY: DerivedPersonality = {
  tone: 'casual',
  motivationStyle: 'supportive',
  emojiIntensity: 'medium',
  source: 'fallback',
};

const STRUGGLES: readonly StruggleId[] = ['comecar', 'constancia', 'esquecer', 'energia', 'ansiedade', 'distracao', 'tempo', 'perfeccionismo'];
const STRENGTHS: readonly StrengthId[] = ['disciplina', 'curiosidade', 'criatividade', 'sociabilidade', 'organizacao', 'energiaFisica', 'calma', 'persistencia'];

/** Dificuldades em que pressão é contraindicada (trava 1). */
export const VULNERABLE_STRUGGLES: readonly StruggleId[] = ['ansiedade', 'perfeccionismo', 'energia'];
/** Forças que dão lastro ao desafio (trava 2). */
export const CHALLENGE_ANCHORS: readonly StrengthId[] = ['disciplina', 'persistencia'];

type Votes<K extends string> = Partial<Record<K, number>>;

/**
 * DIFICULDADE → a voz que a CONTRABALANÇA (os votos valem `STRUGGLE_WEIGHT`×).
 */
const STRUGGLE_TONE: Record<StruggleId, Votes<PersonalityTone>> = {
  comecar: { energetic: 2, playful: 1 },
  constancia: { casual: 2, calm: 1 },
  esquecer: { casual: 1, playful: 1 },
  energia: { calm: 2, casual: 1 },
  ansiedade: { calm: 3 },
  distracao: { playful: 2, energetic: 1 },
  tempo: { casual: 2, calm: 1 },
  perfeccionismo: { calm: 2, playful: 1 },
};
const STRUGGLE_MOTIVATION: Record<StruggleId, Votes<PersonalityMotivation>> = {
  comecar: { encouraging: 2 },
  constancia: { supportive: 2 },
  esquecer: { balanced: 1 },
  energia: { supportive: 2 },
  ansiedade: { supportive: 3 },
  distracao: { encouraging: 2 },
  tempo: { balanced: 2 },
  perfeccionismo: { supportive: 3 },
};

/** FORÇA → o que ela permite (alavancar) ou pede para equilibrar. Peso 1–2. */
const STRENGTH_TONE: Record<StrengthId, Votes<PersonalityTone>> = {
  disciplina: { playful: 1 },
  persistencia: { playful: 1 },
  organizacao: { playful: 1 },
  calma: { energetic: 1 },
  energiaFisica: { calm: 1 },
  curiosidade: { playful: 1 },
  criatividade: { playful: 1 },
  sociabilidade: { casual: 1 },
};
const STRENGTH_MOTIVATION: Record<StrengthId, Votes<PersonalityMotivation>> = {
  disciplina: { challenging: 2 },
  persistencia: { challenging: 2 },
  organizacao: { balanced: 1, challenging: 1 },
  calma: { balanced: 1 },
  energiaFisica: { encouraging: 1 },
  curiosidade: { encouraging: 1 },
  criatividade: { encouraging: 1 },
  sociabilidade: { encouraging: 1 },
};

/** Desempate: da voz mais segura para a mais intensa. */
const TONE_ORDER: readonly PersonalityTone[] = ['casual', 'calm', 'playful', 'energetic'];
const MOTIVATION_ORDER: readonly PersonalityMotivation[] = ['supportive', 'balanced', 'encouraging', 'challenging'];

function clean<T extends string>(list: unknown, known: readonly T[]): T[] {
  if (!Array.isArray(list)) return [];
  const out: T[] = [];
  for (const v of list) {
    if (typeof v === 'string' && (known as readonly string[]).includes(v) && !out.includes(v as T)) out.push(v as T);
  }
  return out;
}

/** A dificuldade pesa o DOBRO da força: é ela que a voz existe para amparar,
 *  e uma força não pode empatar com a dificuldade que a pessoa declarou. */
export const STRUGGLE_WEIGHT = 2;

function tally<K extends string>(
  order: readonly K[], struggleTables: Array<Votes<K>>, strengthTables: Array<Votes<K>>, banned: readonly K[] = [],
): K | null {
  const score = new Map<K, number>();
  const add = (tables: Array<Votes<K>>, w: number) => {
    for (const t of tables) {
      for (const [k, v] of Object.entries(t) as Array<[K, number]>) score.set(k, (score.get(k) ?? 0) + v * w);
    }
  };
  add(struggleTables, STRUGGLE_WEIGHT);
  add(strengthTables, 1);
  let best: K | null = null;
  let bestScore = 0;
  for (const k of order) {
    if (banned.includes(k)) continue;
    const s = score.get(k) ?? 0;
    if (s > bestScore) { best = k; bestScore = s; }
  }
  return best;
}

/**
 * Deriva a personalidade. Com pelo menos UMA força ou dificuldade válida, o
 * resultado é `derived`; sem nenhuma, `FALLBACK_PERSONALITY`.
 */
export function derivePersonality(profile: PersonalityProfile | null | undefined): DerivedPersonality {
  const struggles = clean(profile?.struggles, STRUGGLES);
  const strengths = clean(profile?.strengths, STRENGTHS);
  if (struggles.length === 0 && strengths.length === 0) return FALLBACK_PERSONALITY;

  const vulnerable = struggles.some(s => VULNERABLE_STRUGGLES.includes(s));
  const anchored = strengths.some(s => CHALLENGE_ANCHORS.includes(s));
  const bannedMotivation: PersonalityMotivation[] = vulnerable || !anchored ? ['challenging'] : [];

  const tone = tally(
    TONE_ORDER,
    struggles.map(s => STRUGGLE_TONE[s]),
    strengths.map(s => STRENGTH_TONE[s]),
  ) ?? FALLBACK_PERSONALITY.tone;
  const motivationStyle = tally(
    MOTIVATION_ORDER,
    struggles.map(s => STRUGGLE_MOTIVATION[s]),
    strengths.map(s => STRENGTH_MOTIVATION[s]),
    bannedMotivation,
  ) ?? FALLBACK_PERSONALITY.motivationStyle;

  // Emoji: menos ruído para quem já carrega ansiedade/perfeccionismo, e
  // quando a voz escolhida é a calma. Nunca `high`, nunca `none`.
  const quiet = tone === 'calm' || struggles.includes('ansiedade') || struggles.includes('perfeccionismo');
  return { tone, motivationStyle, emojiIntensity: quiet ? 'low' : 'medium', source: 'derived' };
}

/**
 * Lê o perfil do SAVE, sem confiar na forma (save antigo, nuvem, outro
 * aparelho). O contrato com a frente de onboarding é o campo
 * `onboardingProfile: { strengths: StrengthId[]; struggles: StruggleId[] }`
 * no GameState; ausente = fallback.
 */
export function personalityProfileFromSave(state: unknown): PersonalityProfile {
  const raw = (state as { onboardingProfile?: unknown } | null | undefined)?.onboardingProfile;
  if (!raw || typeof raw !== 'object') return {};
  const p = raw as { strengths?: unknown; struggles?: unknown };
  return { strengths: clean(p.strengths, STRENGTHS), struggles: clean(p.struggles, STRUGGLES) };
}

/** As configurações que o chat recebe: a personalidade derivada + o que a
 *  pessoa já tinha guardado e não é personalidade (instruções livres e
 *  criatividade, que continuam valendo para quem as escreveu antes). */
export interface ChatPersonalitySettings {
  tone: PersonalityTone;
  emojiIntensity: 'none' | 'low' | 'medium' | 'high';
  motivationStyle: PersonalityMotivation;
  customKeywords: string;
  temperature: number;
}

export function chatSettingsFor(
  profile: PersonalityProfile | null | undefined,
  stored?: { customKeywords?: unknown; temperature?: unknown } | null,
): ChatPersonalitySettings {
  const p = derivePersonality(profile);
  const t = typeof stored?.temperature === 'number' && Number.isFinite(stored.temperature) ? stored.temperature : 0.85;
  return {
    tone: p.tone,
    emojiIntensity: p.emojiIntensity,
    motivationStyle: p.motivationStyle,
    customKeywords: typeof stored?.customKeywords === 'string' ? stored.customKeywords : '',
    temperature: t,
  };
}
