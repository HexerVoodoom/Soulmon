import { registerPlugin } from '@capacitor/core';

export interface SoulmonAlarmPlugin {
  scheduleAlarm(options: { id: string; title: string; body: string; scheduledTime: string }): Promise<void>;
  cancelAlarm(options: { id: string }): Promise<void>;
  /**
   * Beta12 (item I): alarme no INSTANTE exato (`atMs`, ms do relogio do aparelho), usado so pelo aviso do Foco. `exact: false` =
   * o aparelho nao concedeu "Alarmes e lembretes" e o aviso caiu no inexato (pode atrasar alguns minutos). APK antigo nao tem o
   * metodo: a chamada rejeita e quem chama cai em `scheduleAlarm` ("HH:mm").
   */
  scheduleExactAlarm(options: { id: string; title: string; body: string; atMs: number }): Promise<{ exact: boolean }>;
  /** Se o app pode agendar alarme exato agora. */
  canScheduleExactAlarms(): Promise<{ value: boolean }>;
  /** Abre as notificações do app nas configurações do sistema. Só por gesto. */
  openNotificationSettings(): Promise<void>;
}

export const SoulmonAlarm = registerPlugin<SoulmonAlarmPlugin>('SoulmonAlarm', {
  web: {
    async scheduleAlarm() {},
    async cancelAlarm() {},
    async scheduleExactAlarm() { return { exact: false }; },
    async canScheduleExactAlarms() { return { value: false }; },
    async openNotificationSettings() {},
  },
});
