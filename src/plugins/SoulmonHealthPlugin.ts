import { registerPlugin } from '@capacitor/core';

/**
 * Passos pelo Health Connect (Android). Só leitura, só o TOTAL do dia. O plugin nativo é
 * `android/.../plugins/SoulmonHealthPlugin.kt`. Na web e no APK antigo (sem o plugin) não há implementação:
 * o app trata como "sem Health Connect" e cai no contador do aparelho, ou no nada (ver `utils/steps.ts`).
 */
export interface SoulmonHealthPlugin {
  /** O Health Connect existe e está pronto neste aparelho? `needsUpdate`: o provedor precisa de atualização. */
  isAvailable(): Promise<{ available: boolean; needsUpdate?: boolean }>;
  hasPermission(): Promise<{ granted: boolean }>;
  /** Abre o diálogo do Health Connect. Só chame depois do cartão de consentimento do app. */
  requestPermission(): Promise<{ granted: boolean }>;
  /** Total de passos de hoje (meia-noite local até agora). Rejeita sem permissão ou em erro: nunca devolve 0 por falha. */
  readStepsToday(): Promise<{ steps: number }>;
}

export const SoulmonHealth = registerPlugin<SoulmonHealthPlugin>('SoulmonHealth', {
  web: {
    async isAvailable() { return { available: false }; },
    async hasPermission() { return { granted: false }; },
    async requestPermission() { return { granted: false }; },
    async readStepsToday(): Promise<{ steps: number }> { throw new Error('unavailable'); },
  },
});
