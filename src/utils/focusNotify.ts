/**
 * AVISOS DO FOCO (§301): «hora do descanso» quando os 25 min acabam e «descanso acabou» quando os 5 min acabam, mesmo com o app
 * fechado. No APK (beta12, item I) usa `SoulmonAlarm.scheduleExactAlarm` (timestamp em ms, exato quando o aparelho concede
 * "Alarmes e lembretes", senão inexato); num APK ANTERIOR (sem o método) cai no alarme "HH:mm" de sempre (`scheduleAlarm`, um disparo,
 * inexato, refeito após o boot); na web usa um timer + `showNotification` só se a permissão já foi dada (nunca pede sozinho). Web/PWA com o
 * app FECHADO depende de push do servidor (não existe para o foco): `docs/BACKLOG-BETA12.md`.
 */
import { Capacitor } from '@capacitor/core';
import { SoulmonAlarm } from '../plugins/SoulmonAlarmPlugin';
import { alarmClock } from './focusRest';
import { checkNotificationPermission, showNotification } from './notifications';
import type { Language } from './i18n';

export type FocusAlarmKind = 'focus-end' | 'rest-end';
const ID: Record<FocusAlarmKind, string> = { 'focus-end': 'foco-fim', 'rest-end': 'foco-descanso-fim' };

export function focusAlarmCopy(kind: FocusAlarmKind, language: Language): { title: string; body: string } {
  const pt = language === 'pt-BR';
  return kind === 'focus-end'
    ? { title: pt ? 'Hora do descanso' : 'Time to rest', body: pt ? 'O foco acabou. O Soulmon chegou ao oásis.' : 'The focus is over. Your Soulmon reached the oasis.' }
    : { title: pt ? 'O descanso acabou' : 'Break is over', body: pt ? 'Pronto para outra rodada?' : 'Ready for another round?' };
}

const timers = new Map<FocusAlarmKind, ReturnType<typeof setTimeout>>();
const MAX_TIMER = 2 ** 31 - 1;

export function cancelFocusAlarm(kind: FocusAlarmKind): void {
  const t = timers.get(kind); if (t) { clearTimeout(t); timers.delete(kind); }
  if (Capacitor.isNativePlatform()) SoulmonAlarm.cancelAlarm({ id: ID[kind] }).catch(() => {});
}

/** Agenda (ou reagenda) o aviso para `at` (ms, relógio do aparelho). Instante já passado não agenda nada. */
export function scheduleFocusAlarm(kind: FocusAlarmKind, at: number, language: Language, now = Date.now()): void {
  cancelFocusAlarm(kind);
  if (at <= now) return;
  const { title, body } = focusAlarmCopy(kind, language);
  if (Capacitor.isNativePlatform()) {
    const legacy = () => SoulmonAlarm.scheduleAlarm({ id: ID[kind], title, body, scheduledTime: alarmClock(at) }).catch(() => {});
    if (typeof SoulmonAlarm.scheduleExactAlarm === 'function') {
      try { SoulmonAlarm.scheduleExactAlarm({ id: ID[kind], title, body, atMs: at }).catch(legacy); } catch { void legacy(); }
    } else void legacy();
    return;
  }
  if (at - now > MAX_TIMER) return;
  timers.set(kind, setTimeout(() => {
    timers.delete(kind);
    // Com o app à vista o relógio da tela já mostra: o aviso é para quem saiu.
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') return;
    if (checkNotificationPermission().granted) showNotification(title, { body, tag: ID[kind] });
  }, at - now));
}
