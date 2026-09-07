import { registerPlugin } from '@capacitor/core';

export interface SoulmonAlarmPlugin {
  scheduleAlarm(options: { id: string; title: string; body: string; scheduledTime: string }): Promise<void>;
  cancelAlarm(options: { id: string }): Promise<void>;
}

export const SoulmonAlarm = registerPlugin<SoulmonAlarmPlugin>('SoulmonAlarm', {
  web: {
    async scheduleAlarm() {},
    async cancelAlarm() {},
  },
});
