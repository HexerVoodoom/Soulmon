import { registerPlugin } from '@capacitor/core';

export interface DigiAlarmPlugin {
  scheduleAlarm(options: { id: string; title: string; body: string; scheduledTime: string }): Promise<void>;
  cancelAlarm(options: { id: string }): Promise<void>;
}

export const DigiAlarm = registerPlugin<DigiAlarmPlugin>('DigiAlarm', {
  web: {
    async scheduleAlarm() {},
    async cancelAlarm() {},
  },
});
