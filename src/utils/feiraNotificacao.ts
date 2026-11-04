/**
 * O AVISO DA VOLTA DA INVESTIGAÇÃO (dono, 04/11/2026): quando o Soulmon volta da Missão da Feira, uma notificação local
 * chama o jogador para derrotar o inimigo NO MESMO DIA.
 *
 * Segue o padrão dos pushes de evento do `NotificationManager`: APK = alarme local (`SoulmonAlarm`, hora do dia, funciona
 * com o app fechado); web/PWA = timer enquanto a aba vive, SÓ com a permissão já concedida. Só sai com o interruptor de
 * notificações LIGADO (nunca pede permissão aqui). Ao voltar (o app registrou a volta) o alarme é cancelado — o alarme
 * nativo é por hora do dia, então cancelar evita que ele se repita no dia seguinte.
 */
import { Capacitor } from '@capacitor/core';
import { SoulmonAlarm } from '../plugins/SoulmonAlarmPlugin';
import { showNotification } from './notifications';
import type { Language } from './i18n';

export const FEIRA_VOLTA_TAG = 'feira-missao-volta';

export function feiraVoltaCopy(language: Language): { title: string; body: string } {
  return language === 'pt-BR'
    ? { title: 'Seu Soulmon voltou da investigação na feira', body: 'Seu Soulmon voltou da investigação na feira. Derrote o inimigo hoje, antes que ele escape!' }
    : { title: 'Your Soulmon is back from the fair', body: 'Your Soulmon is back from investigating the fair. Defeat the enemy today, before it escapes!' };
}

/** `HH:mm` local de um instante (o formato do `SoulmonAlarm`). */
export const hhmmOf = (at: number): string => {
  const d = new Date(at);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export interface FeiraVoltaDeps {
  native: () => boolean;
  schedule: (o: { id: string; title: string; body: string; scheduledTime: string }) => Promise<void>;
  cancel: (o: { id: string }) => Promise<void>;
  permitted: () => boolean;
  show: (title: string, body: string) => void;
  setTimer: (fn: () => void, ms: number) => unknown;
  clearTimer: (h: unknown) => void;
}

const DEFAULT_DEPS: FeiraVoltaDeps = {
  native: () => Capacitor.isNativePlatform(),
  schedule: o => SoulmonAlarm.scheduleAlarm(o),
  cancel: o => SoulmonAlarm.cancelAlarm(o),
  permitted: () => { try { return typeof Notification !== 'undefined' && Notification.permission === 'granted'; } catch { return false; } },
  show: (title, body) => showNotification(title, { body, tag: FEIRA_VOLTA_TAG }),
  setTimer: (fn, ms) => setTimeout(fn, ms),
  clearTimer: h => clearTimeout(h as ReturnType<typeof setTimeout>),
};

let webTimer: unknown = null;

/** Agenda o aviso para `returnAt`. Desligado, no passado ou sem permissão (web): nada. */
export function scheduleFeiraVolta(returnAt: number, now: number, language: Language, enabled: boolean, deps: Partial<FeiraVoltaDeps> = {}): boolean {
  const d = { ...DEFAULT_DEPS, ...deps };
  cancelFeiraVolta(deps);
  if (!enabled || returnAt <= now) return false;
  const { title, body } = feiraVoltaCopy(language);
  if (d.native()) {
    d.schedule({ id: FEIRA_VOLTA_TAG, title, body, scheduledTime: hhmmOf(returnAt) }).catch(() => {});
    return true;
  }
  if (!d.permitted()) return false;
  webTimer = d.setTimer(() => { webTimer = null; d.show(title, body); }, returnAt - now);
  return true;
}

export function cancelFeiraVolta(deps: Partial<FeiraVoltaDeps> = {}): void {
  const d = { ...DEFAULT_DEPS, ...deps };
  if (webTimer !== null) { d.clearTimer(webTimer); webTimer = null; }
  if (d.native()) d.cancel({ id: FEIRA_VOLTA_TAG }).catch(() => {});
}
