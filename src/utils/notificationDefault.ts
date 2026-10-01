/**
 * NOTIFICAÇÕES LIGADAS POR PADRÃO (G6, navegação do dono 01/10/2026).
 *
 * O padrão da PREFERÊNCIA passa a ser ligado — mas o app não ganha poder de
 * mandar nada que o sistema não deixou. A regra tem duas metades, e é a
 * segunda que impede o padrão de virar pedido de permissão fora de hora:
 *
 *  · quem já DECIDIU (a chave existe: 'on'/'off') manda — o padrão nunca
 *    passa por cima de uma escolha feita;
 *  · quem nunca decidiu fica ligado SÓ se a permissão do sistema já estiver
 *    concedida. Sem ela, fica desligado, e quem pede a permissão continua
 *    sendo o convite que já existe, no momento certo (priming depois da
 *    primeira conclusão real, `utils/pushPriming.ts`; a Janela de Descanso).
 *    Pedir permissão na abertura do app é o que este produto recusa (WP1.5).
 *
 * Função PURA: a leitura do localStorage e da `Notification.permission` é de
 * quem chama (`App.tsx`).
 */
import type { FlagState } from './safeStorage';

export type SystemNotificationPermission = 'granted' | 'denied' | 'default' | 'unsupported';

export function initialNotificationsEnabled(
  stored: FlagState,
  permission: SystemNotificationPermission,
): boolean {
  if (stored === 'on') return true;
  if (stored === 'off') return false;
  // Nunca decidiu ('absent') ou ilegível ('unknown'): o padrão é LIGADO,
  // condicionado ao que o sistema já permitiu.
  return permission === 'granted';
}

/** Lê a permissão do sistema sem lançar (SSR, WebView sem a API, teste). */
export function readSystemNotificationPermission(): SystemNotificationPermission {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    const p = window.Notification.permission;
    return p === 'granted' || p === 'denied' ? p : 'default';
  } catch {
    return 'unsupported';
  }
}
