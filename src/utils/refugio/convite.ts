/**
 * O CONVITE AO REFÚGIO (decisão do dono, 30/09/2026; regras do parecer do
 * `soulmon-behavioral-psychologist` do mesmo dia).
 *
 * Quando o humor registrado HOJE for 1 (Difícil) ou 2 (Meio pra baixo), a
 * Home oferece UMA vez um cartão para respirar com o Soulmon no Refúgio. É uma
 * placa de caminho, não uma porta: o Refúgio fica aberto no Mapa para qualquer
 * pessoa em qualquer humor, e é isso que deixa esta cadência não custar nada.
 *
 * As travas, e por quê:
 *  · no máximo 1× por dia do jogador; dispensar some até amanhã;
 *  · depois de EXIBIDO, só volta a partir de `REFUGE_INVITE_GAP_DAYS` (3) dias
 *    — aparecer todo dia numa semana difícil é o que cria o rótulo "você está
 *    mal";
 *  · duas dispensas seguidas → silêncio de `REFUGE_INVITE_SILENCE_DAYS` (7):
 *    recusar tem de ser respeitado;
 *  · só conta como EXIBIDO se foi desenhado como o cartão principal da fila
 *    (quem chama `markShown` é o próprio cartão, ao montar);
 *  · corrigir o humor para 3+ faz o cartão sumir (a condição é lida de novo).
 *
 * O que NUNCA: pagar ou contar qualquer coisa (Bits, missão, "minutos
 * respirados"), citar o humor no texto, virar push, escalar para crise por
 * padrão de humor. O save guarda só datas e a contagem de dispensas — nunca
 * o motivo (humor é dado sensível de saúde).
 *
 * Funções PURAS; o dia é o ISO do jogador (`playerDayIso`), sempre por parâmetro.
 */
import { addDays, isDayKey } from '../mente/revisao';

export interface RefugeInviteState {
  /** Último dia em que o cartão foi DESENHADO como principal. */
  lastShownDay?: string;
  /** Dia em que foi dispensado (some até a virada). */
  dismissedDay?: string;
  /** Dia em que foi aceito (some até a virada). */
  acceptedDay?: string;
  /** Dispensas seguidas (zera ao aceitar). */
  dismissStreak: number;
  /** Silêncio até este dia (exclusivo), depois de duas dispensas seguidas. */
  silencedUntil?: string;
}

export const REFUGE_INVITE_EMPTY: RefugeInviteState = Object.freeze({ dismissStreak: 0 }) as RefugeInviteState;
export const REFUGE_INVITE_MOODS: readonly number[] = Object.freeze([1, 2]);
export const REFUGE_INVITE_GAP_DAYS = 3;
export const REFUGE_INVITE_SILENCE_DAYS = 7;
export const REFUGE_INVITE_DISMISSALS_TO_SILENCE = 2;

/** O cartão aparece hoje? */
export function shouldInviteRefuge(s: RefugeInviteState | undefined, moodToday: number | null | undefined, todayIso: string): boolean {
  const st = s ?? REFUGE_INVITE_EMPTY;
  if (moodToday == null || !REFUGE_INVITE_MOODS.includes(moodToday)) return false;
  if (st.dismissedDay === todayIso || st.acceptedDay === todayIso) return false;
  if (st.silencedUntil && todayIso < st.silencedUntil) return false;
  if (st.lastShownDay === todayIso) return true; // já é o convite de hoje: segue de pé
  if (st.lastShownDay && todayIso < addDays(st.lastShownDay, REFUGE_INVITE_GAP_DAYS)) return false;
  return true;
}

/** O cartão foi desenhado como principal hoje. Idempotente. */
export function markRefugeShown(s: RefugeInviteState | undefined, todayIso: string): RefugeInviteState {
  const st = s ?? REFUGE_INVITE_EMPTY;
  return st.lastShownDay === todayIso ? st : { ...st, lastShownDay: todayIso };
}

export function dismissRefugeInvite(s: RefugeInviteState | undefined, todayIso: string): RefugeInviteState {
  const st = markRefugeShown(s, todayIso);
  if (st.dismissedDay === todayIso) return st;
  const streak = st.dismissStreak + 1;
  return {
    ...st,
    dismissedDay: todayIso,
    dismissStreak: streak >= REFUGE_INVITE_DISMISSALS_TO_SILENCE ? 0 : streak,
    silencedUntil: streak >= REFUGE_INVITE_DISMISSALS_TO_SILENCE
      ? addDays(todayIso, REFUGE_INVITE_SILENCE_DAYS) : st.silencedUntil,
  };
}

export function acceptRefugeInvite(s: RefugeInviteState | undefined, todayIso: string): RefugeInviteState {
  const st = markRefugeShown(s, todayIso);
  return st.acceptedDay === todayIso ? st : { ...st, acceptedDay: todayIso, dismissStreak: 0 };
}

/** Save é dado não confiável: campo estranho cai, nunca derruba o load. */
export function sanitizeRefugeInvite(raw: unknown): RefugeInviteState | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const day = (v: unknown) => (isDayKey(v) ? v : undefined);
  const n = typeof r.dismissStreak === 'number' && Number.isFinite(r.dismissStreak)
    ? Math.min(REFUGE_INVITE_DISMISSALS_TO_SILENCE, Math.max(0, Math.floor(r.dismissStreak))) : 0;
  return {
    lastShownDay: day(r.lastShownDay), dismissedDay: day(r.dismissedDay), acceptedDay: day(r.acceptedDay),
    dismissStreak: n, silencedUntil: day(r.silencedUntil),
  };
}
