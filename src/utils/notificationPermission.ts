/**
 * PERMISSÃO DE NOTIFICAÇÃO — o decisor puro e a ponte para a plataforma
 * (pedido do dono, 07/10/2026: pedir na PRIMEIRA abertura e, ao ligar o toggle
 * das Configurações, forçar o modal NATIVO).
 *
 * ⚠️ Isto SUBSTITUI a regra de G6/WP1.5 ("pedir permissão na abertura do app é
 * o que este produto recusa"). Foi decisão do dono; o priming de D2–D3
 * (`pushPriming.ts`) e o `WelcomePromptModal` continuam existindo como segunda
 * chance para quem ainda não decidiu.
 *
 * Dois fatos de plataforma que moldam tudo:
 *  · APK (Capacitor): o WebView NÃO tem `Notification`; a permissão é a do
 *    Android 13+ (`POST_NOTIFICATIONS`) via `@capacitor/push-notifications`.
 *    Pode ser pedida sem gesto. Depois de duas recusas o SO para de mostrar o
 *    diálogo — aí só as configurações do sistema resolvem.
 *  · Web/PWA: `Notification.requestPermission()` EXIGE gesto do usuário em
 *    Chrome/Safari/iOS (fora de gesto é ignorado ou bloqueado). Por isso a
 *    primeira abertura pede no PRIMEIRO TOQUE, nunca em timer/efeito. Safari
 *    em aba comum (iOS) nem expõe push: lá o estado é 'unsupported'.
 *
 * Sem cobrança: negado uma vez, a primeira abertura NUNCA insiste (a flag é
 * gravada ao pedir, não ao conceder). Só o toggle — gesto da própria pessoa —
 * reabre o assunto.
 */
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { SoulmonAlarm } from '../plugins/SoulmonAlarmPlugin';
import type { SystemNotificationPermission } from './notificationDefault';

export type PermissionPlatform = 'native' | 'web';
export type PermissionTrigger = 'first-open' | 'toggle';

export type PermissionAction =
  /** Mostrar o modal NATIVO do sistema/navegador. */
  | 'request'
  /** Já concedida: só registrar a subscription/token. */
  | 'register'
  /** Negada e o SO não pergunta mais: orientar às configurações. */
  | 'guide-settings'
  /** Nada a fazer (já perguntado na abertura, ou sem suporte). */
  | 'none';

export interface PermissionDecisionInput {
  platform: PermissionPlatform;
  state: SystemNotificationPermission;
  trigger: PermissionTrigger;
  /** A primeira abertura já pediu (flag persistida)? */
  firstOpenAsked: boolean;
}

export function decidePermissionAction(i: PermissionDecisionInput): PermissionAction {
  if (i.state === 'unsupported') return i.trigger === 'toggle' ? 'guide-settings' : 'none';
  if (i.trigger === 'first-open') {
    if (i.firstOpenAsked) return 'none';
    // Primeira abertura: pede só quem ainda não decidiu. Quem já concedeu
    // (reinstalação, outro caminho) apenas registra; quem negou não é cobrado.
    if (i.state === 'default') return 'request';
    if (i.state === 'granted') return 'register';
    return 'none';
  }
  // toggle — sempre o pedido nativo quando o SO ainda deixa; senão o caminho.
  if (i.state === 'granted') return 'register';
  if (i.state === 'default') return 'request';
  return 'guide-settings';
}

export const platformForPermission = (): PermissionPlatform =>
  Capacitor.getPlatform() === 'android' ? 'native' : 'web';

/** Lê a permissão REAL da plataforma, sem lançar. */
export async function readPlatformPermission(): Promise<SystemNotificationPermission> {
  try {
    if (platformForPermission() === 'native') {
      const r = (await PushNotifications.checkPermissions()).receive;
      if (r === 'granted' || r === 'denied') return r;
      return 'default'; // 'prompt' | 'prompt-with-rationale' — o SO ainda pergunta
    }
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    const p = window.Notification.permission;
    return p === 'granted' || p === 'denied' ? p : 'default';
  } catch {
    return 'unsupported';
  }
}

/** Dispara o modal nativo e devolve a permissão resultante. No web, chamar
 *  SOMENTE dentro de um gesto — e sem `await` antes: a ativação do usuário
 *  expira. */
export async function requestPlatformPermission(): Promise<SystemNotificationPermission> {
  try {
    if (platformForPermission() === 'native') {
      const r = (await PushNotifications.requestPermissions()).receive;
      return r === 'granted' ? 'granted' : r === 'denied' ? 'denied' : 'default';
    }
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    const p = await window.Notification.requestPermission();
    return p === 'granted' || p === 'denied' ? p : 'default';
  } catch {
    return 'unsupported';
  }
}

/** Abre as notificações do app nas configurações (só APK; no web não existe
 *  API — a orientação em texto é o caminho). Só por gesto. */
export async function openSystemNotificationSettings(): Promise<void> {
  try {
    if (platformForPermission() === 'native') await SoulmonAlarm.openNotificationSettings();
  } catch { /* o texto já orienta */ }
}

/** Texto curto de orientação (EN primeiro, PT par). */
export function settingsGuidance(platform: PermissionPlatform, isPt: boolean): { title: string; description: string } {
  if (platform === 'native') {
    return isPt
      ? { title: 'Notificações desligadas no sistema', description: 'Abra Configurações do Android → Apps → Soulmon → Notificações e permita.' }
      : { title: 'Notifications are off in system settings', description: 'Open Android Settings → Apps → Soulmon → Notifications and allow them.' };
  }
  return isPt
    ? { title: 'Notificações bloqueadas', description: 'Toque no cadeado 🔒 na barra de endereço → Notificações → Permitir, e recarregue.' }
    : { title: 'Notifications are blocked', description: 'Click the lock 🔒 in the address bar → Notifications → Allow, then reload the page.' };
}
