import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * QA L06-04: o pedido nativo de notificação da PRIMEIRA ABERTURA aparecia sobre "Antes de começar" (Termos + 18+),
 * antes do consentimento. Agora só depois do ritual concluído (que contém o aceite).
 */
describe('pedido de notificação da primeira abertura', () => {
  const src = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');
  const i = src.indexOf('// PRIMEIRA ABERTURA (pedido do dono, 07/10/2026)');
  const bloco = src.slice(i, i + 2600);

  it('espera o onboarding concluído antes de pedir', () => {
    expect(i).toBeGreaterThan(0);
    expect(bloco).toContain('if (!hasCompletedOnboarding) return;');
  });
  it('o efeito reage à conclusão do onboarding', () => {
    expect(bloco).toContain('}, [showIntro, hasCompletedOnboarding]);');
  });
});
