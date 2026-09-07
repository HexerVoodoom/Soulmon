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
  track, setTelemetryTier, TELEMETRY_TIER, TELEMETRY_UNLOCK_REASON,
} from '../utils/telemetry';

const only = (event: string) => pendingTelemetry().filter(r => r.e === event);

describe('fiação da telemetria — onboarding', () => {
  beforeEach(() => {
    resetTelemetryForTest();
    // O rascunho do portão (`utils/gateDraft.ts`) guarda o ACEITE dos Termos.
    // Sem limpar, o caso seguinte abre com a caixa já marcada e o clique do
    // teste a DESMARCA — em produção é o comportamento certo, entre casos é
    // vazamento de estado.
    localStorage.clear();
  });

  it('antes da escolha o funil é UNKNOWN; depois dela, DEMO', () => {
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    // A intro é ANTERIOR à bifurcação: não dá para rotular o caminho ainda.
    expect(only('onboarding_step')).toEqual([
      expect.objectContaining({ p: { step: 0, funnel: TELEMETRY_FUNNEL.unknown } }),
    ]);

    fireEvent.click(screen.getByText('Get started'));
    fireEvent.click(screen.getByText('I’d rather not say right now')); // GOAL
    fireEvent.click(screen.getByText('I’d rather not say right now')); // STRUGGLE

    const antesDaEscolha = only('onboarding_step');
    // 07/09/2026 — A BIFURCAÇÃO MUDOU DE LUGAR e a telemetria conta isso.
    // A escolha grátis/completo desceu para depois do consentimento e do
    // portão de e-mail, então objetivo, dificuldade e consentimento acontecem
    // com o caminho AINDA DESCONHECIDO. `unknown` aqui não é acidente: é o
    // estado verdadeiro, e marcá-los como `demo` seria inventar uma intenção
    // que a pessoa ainda não declarou.
    for (const r of antesDaEscolha) expect(r.p?.funnel).toBe(TELEMETRY_FUNNEL.unknown);
    // Um evento por tela alcançada — sem repetição na mesma tela.
    expect(antesDaEscolha.map(r => r.p?.step)).toEqual([
      0, onboardingStepCode(-2), onboardingStepCode(-3), onboardingStepCode(-4),
    ]);

    // E, escolhido o grátis, o funil passa a ser DEMO de fato.
    fireEvent.click(screen.getByText(
      'I have read and agree to the Terms of Use and the Privacy Policy',
    ));
    fireEvent.change(screen.getByLabelText('What month and year were you born?'), {
      target: { value: '011990' },
    });
    fireEvent.click(screen.getByText('Continue').closest('button')!);
    fireEvent.click(screen.getByText('Start now — it’s free'));
    const depois = only('onboarding_step');
    expect(depois[depois.length - 1].p?.funnel).toBe(TELEMETRY_FUNNEL.demo);
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
    fireEvent.click(screen.getByText('Get started'));
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
    fireEvent.click(screen.getByText('Get started'));
    fireEvent.click(screen.getByText('I’d rather not say right now'));
    fireEvent.click(screen.getByText('I’d rather not say right now'));
    fireEvent.click(screen.getByText(
      'I have read and agree to the Terms of Use and the Privacy Policy',
    ));
    fireEvent.change(screen.getByLabelText('What month and year were you born?'), {
      target: { value: '01/1990' },
    });
    fireEvent.click(screen.getByText('Continue').closest('button')!);
    fireEvent.click(screen.getByText('Start now — it’s free'));
    expect(only('demo_pick')).toHaveLength(0);

    fireEvent.click(screen.getByText('Pyrakamon').closest('button')!);
    expect(only('demo_pick')).toHaveLength(1);
  });
});

describe('fiação da telemetria — tela de compra', () => {
  beforeEach(() => {
    resetTelemetryForTest();

  });

  /**
   * O `unlock_view` MUDOU DE LUGAR: ele agora carrega `reason` (qual dos dois
   * convites) e `tier`, e quem conhece os dois é o `App.tsx`, dono de
   * `unlockReason` e de `accountTier`. O modal ficou mudo DE PROPÓSITO.
   *
   * Este teste trava o silêncio, e não é preciosismo: enquanto os dois lados
   * emitissem, cada visualização contaria DUAS vezes — e um denominador
   * inflado mente para baixo em todas as taxas de conversão, sem dar erro
   * nenhum. É exatamente o tipo de defeito que só um teste pega.
   */
  it('o modal NÃO emite unlock_view — quem emite é o App, com o motivo', () => {
    renderWithCss(
      <UnlockAccountModal language="en-US" reason="task-limit" onUnlocked={() => {}} onClose={() => {}} />,
    );
    expect(only('unlock_view')).toHaveLength(0);
  });

  it('os dois convites viram contadores distintos, com o tier junto', () => {
    setTelemetryTier('demo');
    // O mapeamento que o efeito de `unlockReason` do App.tsx faz.
    track('unlock_view', { reason: TELEMETRY_UNLOCK_REASON.taskLimit });
    track('unlock_view', { reason: TELEMETRY_UNLOCK_REASON.evolution });
    expect(only('unlock_view').map(r => r.p)).toEqual([
      { reason: TELEMETRY_UNLOCK_REASON.taskLimit, tier: TELEMETRY_TIER.demo },
      { reason: TELEMETRY_UNLOCK_REASON.evolution, tier: TELEMETRY_TIER.demo },
    ]);
  });
});
