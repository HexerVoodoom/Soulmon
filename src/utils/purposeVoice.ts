import type { MotiveKey, Purpose } from './purpose';

/**
 * AS FALAS DO PORQUÊ (E11, docs/PLANO-OBJETIVO-ANUAL.md §5)
 * =========================================================
 *
 * O Soulmon lembra o "porquê" da pessoa, com três travas que são o produto:
 *  1. RARO: no máximo 1 por semana (7 dias locais desde a última).
 *  2. SÓ EM MOMENTO POSITIVO (`PurposeTrigger`) e NUNCA depois de um dia ruim
 *     (o dia que acabou abaixo da meta, ou o humor de hoje baixo). Motivação
 *     depois de falha vira cobrança.
 *  3. Desligável (`prefs.voiceReminder`) e usa só a CATEGORIA do motivo (a
 *     chave), jamais o texto livre da pessoa.
 *
 * A régua de tom é a de `petVoice` (`purposeVoice.test.ts` varre as frases):
 * nada de cobrança, nada de "no seu tempo / se quiser", nada de histórico.
 */

export type PurposeTrigger = 'milestone' | 'reviewDone' | 'goalHit';

export const WEEK_GAP_DAYS = 7;

export const PURPOSE_VOICE_LINES: Record<MotiveKey, { pt: string[]; en: string[] }> = {
  health: { pt: ['Seu corpo agradece. Eu também.', 'Cuidar da saúde era o seu porquê. Está aqui.'], en: ['Your body is thanking you. So am I.', 'Looking after your health was your why. It is right here.'] },
  family: { pt: ['Quem você ama está nesse caminho. Eu também.', 'Estar presente era o seu porquê. Está aqui.'], en: ['The people you love are on this path. So am I.', 'Being there for them was your why. It is right here.'] },
  freedom: { pt: ['Cada passo abre um pouco mais de espaço.', 'Liberdade era o seu porquê. Está aqui.'], en: ['Each step opens a little more room.', 'Freedom was your why. It is right here.'] },
  growth: { pt: ['Você está crescendo, e eu estou vendo.', 'Crescer era o seu porquê. Está aqui.'], en: ['You are growing, and I can see it.', 'Growing was your why. It is right here.'] },
  calm: { pt: ['Mais calma, um passo de cada vez.', 'Viver mais leve era o seu porquê. Está aqui.'], en: ['More calm, one step at a time.', 'Living with calm was your why. It is right here.'] },
  meaning: { pt: ['Isso faz sentido, e dá para sentir.', 'Fazer algo que importa era o seu porquê. Está aqui.'], en: ['This makes sense, and you can feel it.', 'Doing something that matters was your why. It is right here.'] },
  curiosity: { pt: ['Mais uma descoberta no caminho.', 'Aprender era o seu porquê. Está aqui.'], en: ['One more discovery on the way.', 'Learning was your why. It is right here.'] },
  pride: { pt: ['Olha o caminho que você fez.', 'Sentir orgulho era o seu porquê. Está aqui.'], en: ['Look at the path you made.', 'Feeling proud was your why. It is right here.'] },
  contribution: { pt: ['O que você faz chega a outras pessoas.', 'Contribuir era o seu porquê. Está aqui.'], en: ['What you do reaches other people.', 'Contributing was your why. It is right here.'] },
  joy: { pt: ['Um pouco mais de alegria, hoje.', 'Alegria era o seu porquê. Está aqui.'], en: ['A little more joy, today.', 'Joy was your why. It is right here.'] },
  security: { pt: ['Mais firme a cada passo.', 'Segurança era o seu porquê. Está aqui.'], en: ['Steadier with each step.', 'Feeling secure was your why. It is right here.'] },
  other: { pt: ['O seu porquê continua de pé. Eu também.', 'Lembra do seu porquê? Está aqui.'], en: ['Your why is still standing. So am I.', 'Remember your why? It is right here.'] },
};

export function purposeVoiceLine(key: MotiveKey, isPt: boolean, pick: number): string {
  const lines = (PURPOSE_VOICE_LINES[key] ?? PURPOSE_VOICE_LINES.other)[isPt ? 'pt' : 'en'];
  return lines[Math.min(lines.length - 1, Math.max(0, Math.floor(pick * lines.length)))];
}

function daysBetweenKeys(a: string, b: string): number {
  const pa = /^(\d{4})-(\d{2})-(\d{2})$/.exec(a); const pb = /^(\d{4})-(\d{2})-(\d{2})$/.exec(b);
  if (!pa || !pb) return Infinity;
  return Math.round((new Date(+pb[1], +pb[2] - 1, +pb[3]).getTime() - new Date(+pa[1], +pa[2] - 1, +pa[3]).getTime()) / 86_400_000);
}

export interface SpeakInput {
  purpose: Purpose | undefined;
  /** dia local `YYYY-MM-DD` */
  today: string;
  trigger: PurposeTrigger;
  /** O dia que acabou ficou abaixo da meta, ou o humor de hoje está baixo. Qualquer sinal ruim = não fala. */
  badDay: boolean;
}

/** A fala pode acontecer agora? Devolve a chave do motivo (e nada mais) ou `null`. */
export function purposeVoiceKey(i: SpeakInput): MotiveKey | null {
  const p = i.purpose;
  if (!p?.goal || !p.motive) return null;
  if (p.prefs.voiceReminder === false) return null;
  if (i.badDay) return null;
  if (!['milestone', 'reviewDone', 'goalHit'].includes(i.trigger)) return null;
  if (p.lastVoiceAt && daysBetweenKeys(p.lastVoiceAt, i.today) < WEEK_GAP_DAYS) return null;
  return p.motive.key;
}

/** Marca a fala como dita (a semana começa a contar). */
export function markSpoken(p: Purpose | undefined, today: string): Purpose | undefined {
  return p ? { ...p, lastVoiceAt: today } : p;
}

/** Humor 1 e 2 = dia ruim; o dia anterior abaixo da meta também. */
export function isBadDay(input: { mood: number | null; lastDay?: { done: number; required: number } | null }): boolean {
  if (input.mood !== null && input.mood <= 2) return true;
  const d = input.lastDay;
  return !!d && d.required > 0 && d.done < d.required;
}
