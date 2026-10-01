import { describe, it, expect } from 'vitest';
import { initialNotificationsEnabled } from './notificationDefault';

describe('initialNotificationsEnabled (G6 — ligado por padrão)', () => {
  it('quem já escolheu manda, qualquer que seja a permissão', () => {
    expect(initialNotificationsEnabled('on', 'default')).toBe(true);
    expect(initialNotificationsEnabled('off', 'granted')).toBe(false);
  });

  it('quem nunca escolheu: LIGADO quando o sistema já permitiu', () => {
    expect(initialNotificationsEnabled('absent', 'granted')).toBe(true);
    expect(initialNotificationsEnabled('unknown', 'granted')).toBe(true);
  });

  it('quem nunca escolheu e não tem permissão: desligado — o pedido fica com o convite certo, não com a abertura do app', () => {
    expect(initialNotificationsEnabled('absent', 'default')).toBe(false);
    expect(initialNotificationsEnabled('absent', 'denied')).toBe(false);
    expect(initialNotificationsEnabled('absent', 'unsupported')).toBe(false);
  });
});
