import { registerPlugin } from '@capacitor/core';

/** Resposta do plugin nativo de passos pelo Health Connect (`SoulmonStepsPlugin.kt`, REGISTRO §158). */
export interface SoulmonStepsStatus {
  /** O Health Connect existe e está pronto neste aparelho. */
  available: boolean;
  /** `READ_STEPS` concedida. */
  granted: boolean;
  /** Só em `readToday`, e só quando de fato leu: ausente NUNCA significa zero. */
  steps?: number;
}

export interface SoulmonStepsPlugin {
  status(): Promise<SoulmonStepsStatus>;
  /** Abre o diálogo do Health Connect. SÓ depois da tela de consentimento do app. */
  requestPermission(): Promise<SoulmonStepsStatus>;
  /** Total de passos de HOJE (00:00 até agora). Sem série, sem horário. */
  readToday(): Promise<SoulmonStepsStatus>;
}

/**
 * FEATURE DETECT: o APK antigo não tem este plugin nativo. Quem chama confere `Capacitor.isPluginAvailable('SoulmonSteps')`
 * antes de qualquer método (ver `utils/steps.ts`); na PWA/desktop o `web` abaixo responde "sem Health Connect".
 */
export const SoulmonSteps = registerPlugin<SoulmonStepsPlugin>('SoulmonSteps', {
  web: {
    async status() { return { available: false, granted: false }; },
    async requestPermission() { return { available: false, granted: false }; },
    async readToday() { return { available: false, granted: false }; },
  },
});
