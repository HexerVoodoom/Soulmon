// @vitest-environment jsdom
/**
 * A FIAÇÃO da telemetria, percorrida pela UI.
 *
 * O módulo `utils/telemetry.ts` estava completo, testado e **nunca chamado**:
 * zero evento saía de um aparelho real (evidencia-comportamento.md §1). Testar
 * o módulo de novo não pegaria isso — o buraco não estava na regra, estava no
 * CAMINHO que não a chamava. Por isso este arquivo clica na tela e olha a fila.
 *
 * O que ele trava:
 *  · cada evento sai UMA vez, no ponto certo;
 *  · `onboarding_step` carrega o funil, e demo × pago NUNCA colidem;
 *  · nenhum campo sensível (nome, objetivo, luta, e-mail) entra no payload.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { SoulmonOnboarding } from './SoulmonOnboarding';
import { UnlockAccountModal } from './UnlockAccountModal';
import {
  pendingTelemetry, resetTelemetryForTest, TELEMETRY_FUNNEL, onboardingStepCode,
} from '../utils/telemetry';

const only = (event: string) => pendingTelemetry().filter(r => r.e === event);

describe('fiação da telemetria — onboarding', () => {
  beforeEach(() => {
    resetTelemetryForTest();

  });

  it('cada passo do caminho grátis sai marcado como funil DEMO', () => {
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    // A intro é ANTERIOR à bifurcação: não dá para rotular o caminho ainda.
    expect(only('onboarding_step')).toEqual([
      expect.objectContaining({ p: { step: 0, funnel: TELEMETRY_FUNNEL.unknown } }),
    ]);

    fireEvent.click(screen.getByText('Start now — it’s free'));
    fireEvent.click(screen.getByText('I’d rather not say right now')); // GOAL
    fireEvent.click(screen.getByText('I’d rather not say right now')); // STRUGGLE

    const passos = only('onboarding_step');
    // Tudo depois da bifurcação é DEMO, e nada é `unknown` por acidente.
    for (const r of passos.slice(1)) expect(r.p?.funnel).toBe(TELEMETRY_FUNNEL.demo);
    // Um evento por tela alcançada — sem repetição na mesma tela.
    expect(passos.map(r => r.p?.step)).toEqual([
      0, onboardingStepCode(-2), onboardingStepCode(-3), onboardingStepCode(-4),
    ]);
  });

  it('o ritual do caminho pago sai marcado como funil PAID', () => {
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} mode="upgrade" onRevealed={() => {}} />);
    const passos = only('onboarding_step');
    expect(passos).toHaveLength(1);
    expect(passos[0].p?.funnel).toBe(TELEMETRY_FUNNEL.paid);
    // A trava do levantamento: o MESMO número de passo nos dois funis não pode
    // virar o mesmo registro. São dois usuários opostos.
    expect(passos[0].p?.funnel).not.toBe(TELEMETRY_FUNNEL.demo);
  });

  it('o payload não carrega nada que a pessoa escreveu', () => {
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    fireEvent.click(screen.getByText('Start now — it’s free'));
    const campo = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(campo, { target: { value: 'quero parar de beber' } });
    fireEvent.click(screen.getByText('Continue').closest('button')!);

    const corpo = JSON.stringify(pendingTelemetry());
    expect(corpo).not.toContain('beber');
    // Só `e`, `d` e props NUMÉRICAS existem — nenhum campo de texto livre.
    for (const r of pendingTelemetry()) {
      expect(Object.keys(r).sort()).toEqual(r.p ? ['d', 'e', 'p'] : ['d', 'e']);
      for (const v of Object.values(r.p ?? {})) expect(typeof v).toBe('number');
    }
  });

  it('escolher um personagem pronto emite demo_pick uma vez', () => {
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    fireEvent.click(screen.getByText('Start now — it’s free'));
    fireEvent.click(screen.getByText('I’d rather not say right now'));
    fireEvent.click(screen.getByText('I’d rather not say right now'));
    fireEvent.click(screen.getByText(
      'I have read and agree to the Terms of Use and the Privacy Policy',
    ));
    fireEvent.change(screen.getByLabelText('What month and year were you born?'), {
      target: { value: '01/1990' },
    });
    fireEvent.click(screen.getByText('Continue').closest('button')!);
    expect(only('demo_pick')).toHaveLength(0);

    fireEvent.click(screen.getByText('Pyrakamon').closest('button')!);
    expect(only('demo_pick')).toHaveLength(1);
  });
});

describe('fiação da telemetria — tela de compra', () => {
  beforeEach(() => {
    resetTelemetryForTest();

  });

  it('abrir o modal de desbloqueio emite unlock_view UMA vez', () => {
    const { rerender } = renderWithCss(
      <UnlockAccountModal language="en-US" reason="task-limit" onUnlocked={() => {}} onClose={() => {}} />,
    );
    expect(only('unlock_view')).toHaveLength(1);
    // Re-render não é uma segunda visualização.
    rerender(
      <UnlockAccountModal language="en-US" reason="task-limit" onUnlocked={() => {}} onClose={() => {}} />,
    );
    expect(only('unlock_view')).toHaveLength(1);
    // E não carrega prop nenhuma — nada do usuário viaja aqui.
    expect(only('unlock_view')[0].p).toBeUndefined();
  });
});
