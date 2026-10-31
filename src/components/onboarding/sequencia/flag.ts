import { readLocal } from '../../../utils/safeStorage';

/**
 * Interruptor do onboarding do Velado (plano docs/PLANO-ONBOARDING-VELADO.md §7).
 * DESLIGADO por padrão: com ele desligado nada do fluxo atual muda.
 * Liga com `VITE_ONBOARDING_VELADO=true` no build (ou a chave `soulmon-onboarding-velado=1` no armazenamento local em dev).
 */
export function onboardingVeladoLigado(): boolean {
  try {
    if (import.meta.env?.VITE_ONBOARDING_VELADO === 'true') return true;
    if (import.meta.env?.DEV) {
      return readLocal('soulmon-onboarding-velado') === '1';
    }
  } catch { /* storage bloqueado: fica desligado */ }
  return false;
}

export const ONBOARDING_VELADO = onboardingVeladoLigado();
