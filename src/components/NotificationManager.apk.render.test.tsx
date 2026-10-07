// @vitest-environment jsdom
/**
 * Regressão (bug do dono, 07/10/2026): no APK o WebView não tem `Notification`.
 * A primeira abertura passou a ligar `notificationsEnabled` depois da permissão
 * nativa, e o efeito do NotificationManager chamava `checkAndShowNotifications`,
 * que lia `Notification.permission` sem guarda: ReferenceError síncrono em
 * efeito => ErrorBoundary ("Something went wrong"). Aqui o manager é montado
 * `enabled` sem `Notification` (APK e web sem suporte) e não pode lançar.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import React from 'react';

vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => 'android', isNativePlatform: () => true },
  registerPlugin: () => ({}),
}));
vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: {
    checkPermissions: async () => ({ receive: 'granted' }),
    requestPermissions: async () => ({ receive: 'granted' }),
    addListener: () => {},
    register: async () => {},
  },
}));
vi.mock('../plugins/SoulmonAlarmPlugin', () => ({
  SoulmonAlarm: { scheduleAlarm: async () => {}, cancelAlarm: async () => {} },
}));

import { NotificationManager } from './NotificationManager';
import { checkAndShowNotifications, showNotification, subscribeToPush } from '../utils/notifications';

afterEach(() => cleanup());

describe('sem a API Notification (WebView do APK)', () => {
  it('window.Notification realmente ausente', () => {
    expect('Notification' in window).toBe(false);
  });

  it('os leitores de permissão não lançam', async () => {
    expect(() => checkAndShowNotifications('x', 'en-US')).not.toThrow();
    expect(() => showNotification('t')).not.toThrow();
    await expect(subscribeToPush('p', 'en-US')).resolves.toBe(false);
  });

  it('NotificationManager enabled monta sem lançar', () => {
    expect(() => render(
      <NotificationManager
        activities={[]} tasks={[]} userName="u" petName="p" language="en-US"
        enabled healthPoints={3} maxHealthPoints={3} completedSteps={0} totalRequired={3}
      />,
    )).not.toThrow();
  });
});
