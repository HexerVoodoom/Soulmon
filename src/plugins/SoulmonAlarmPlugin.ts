import { registerPlugin } from '@capacitor/core';

export interface SoulmonAlarmPlugin {
  scheduleAlarm(options: { id: string; title: string; body: string; scheduledTime: string }): Promise<void>;
  cancelAlarm(options: { id: string }): Promise<void>;
  /**
   * `{ exact: false }` = Android 12+ sem SCHEDULE_EXACT_ALARM (o Kotlin já cai
   * em alarme inexato sozinho). Existe para a UI poder OFERECER o convite
   * "Alarmes e lembretes" — opcional e por gesto, nunca automático.
   */
  canScheduleExact(): Promise<{ exact: boolean }>;
  /** Abre a tela do sistema. Só chamar em resposta a um gesto do usuário. */
  openExactAlarmSettings(): Promise<void>;
  /** Abre as notificações do app nas configurações do sistema. Só por gesto. */
  openNotificationSettings(): Promise<void>;
}

export const SoulmonAlarm = registerPlugin<SoulmonAlarmPlugin>('SoulmonAlarm', {
  web: {
    async scheduleAlarm() {},
    async cancelAlarm() {},
    async canScheduleExact() { return { exact: true }; },
    async openExactAlarmSettings() {},
    async openNotificationSettings() {},
  },
});
