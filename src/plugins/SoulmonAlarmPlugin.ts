import { registerPlugin } from '@capacitor/core';

export interface SoulmonAlarmPlugin {
  scheduleAlarm(options: { id: string; title: string; body: string; scheduledTime: string }): Promise<void>;
  cancelAlarm(options: { id: string }): Promise<void>;
  /** Abre as notificações do app nas configurações do sistema. Só por gesto. */
  openNotificationSettings(): Promise<void>;
}

export const SoulmonAlarm = registerPlugin<SoulmonAlarmPlugin>('SoulmonAlarm', {
  web: {
    async scheduleAlarm() {},
    async cancelAlarm() {},
    async openNotificationSettings() {},
  },
});
