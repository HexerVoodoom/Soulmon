import { describe, expect, it } from 'vitest';
import { shouldShowStepsInvite, shouldShowStepsSettingsEntry } from './stepsInvite';

describe('shouldShowStepsInvite — o convite curto dos passos (REGISTRO §283)', () => {
  const ok = { available: true as boolean | null, consent: undefined as 'granted' | 'declined' | undefined, onboarded: true };

  it('aparece só com contador no aparelho, sem resposta anterior e depois do onboarding', () => {
    expect(shouldShowStepsInvite(ok)).toBe(true);
  });

  it('PWA / sem sensor / sondagem pendente: nunca aparece (sem aviso, sem culpa)', () => {
    expect(shouldShowStepsInvite({ ...ok, available: false })).toBe(false);
    expect(shouldShowStepsInvite({ ...ok, available: null })).toBe(false);
  });

  it('quem já respondeu, aceitando ou recusando, não vê de novo (insistir depois do "não" é assédio)', () => {
    expect(shouldShowStepsInvite({ ...ok, consent: 'granted' })).toBe(false);
    expect(shouldShowStepsInvite({ ...ok, consent: 'declined' })).toBe(false);
  });

  it('durante o onboarding não aparece', () => {
    expect(shouldShowStepsInvite({ ...ok, onboarded: false })).toBe(false);
  });
});

describe('shouldShowStepsSettingsEntry — a porta do menu depois do "Agora não"', () => {
  it('com contador no aparelho a entrada existe, mesmo para quem recusou o convite (convite não volta; cartão espera ser aberto)', () => {
    expect(shouldShowStepsSettingsEntry(true)).toBe(true);
    expect(shouldShowStepsInvite({ available: true, consent: 'declined', onboarded: true })).toBe(false);
  });
  it('web/PWA, sem sensor ou sondagem pendente: nenhuma entrada', () => {
    expect(shouldShowStepsSettingsEntry(false)).toBe(false);
    expect(shouldShowStepsSettingsEntry(null)).toBe(false);
  });
});
