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
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { SoulmonOnboarding } from './SoulmonOnboarding';
import { UnlockAccountModal } from './UnlockAccountModal';
import {
  pendingTelemetry, resetTelemetryForTest, TELEMETRY_FUNNEL, onboardingStepCode,
  track, setTelemetryTier, TELEMETRY_TIER, TELEMETRY_UNLOCK_REASON,
} from '../utils/telemetry';
import { atravessarPerguntasIniciais } from '../test/metasOnboarding';
import { atravessarRevealDemo, esperarRevealDemo } from '../test/ritualDemo';

const only = (event: string) => pendingTelemetry().filter(r => r.e === event);

describe('fiação da telemetria — onboarding', () => {
  beforeEach(() => {
    resetTelemetryForTest();
    // O rascunho do portão (`utils/gateDraft.ts`) guarda o ACEITE dos Termos.
    // Sem limpar, o caso seguinte abre com a caixa já marcada e o clique do
    // teste a DESMARCA — em produção é o comportamento certo, entre casos é
    // vazamento de estado.
    localStorage.clear();
    localStorage.setItem('soulmon-language', 'en-US');
  });

  it('antes da escolha o funil é UNKNOWN; depois dela, DEMO', async () => {
    vi.useFakeTimers();
    // As 26 perguntas andam com o relógio falso, e o flush preguiçoso
    // (`FLUSH_DEBOUNCE_MS`) dispararia no meio e esvaziaria a fila que o teste
    // lê. Sem transporte, a fila fica onde está (`flush` devolve tudo).
    vi.stubGlobal('fetch', undefined);
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    // A PRIMEIRA tela é o portão de identidade (07/09/2026), e ela é anterior
    // à bifurcação: não dá para rotular o caminho ainda. Sem auth configurada
    // (este teste) o portão não tem botão e a efeito de montagem leva direto
    // aos termos (A3, 02/10/2026): portão (-6) e depois termos (-9).
    expect(only('onboarding_step')).toEqual([
      expect.objectContaining({ p: { step: onboardingStepCode(-6), funnel: TELEMETRY_FUNNEL.unknown } }),
      expect.objectContaining({ p: { step: onboardingStepCode(-9), funnel: TELEMETRY_FUNNEL.unknown } }),
    ]);

    fireEvent.click(screen.getByText(
      'I have read and agree to the Terms of Use and the Privacy Policy',
    ));
    fireEvent.click(screen.getByText('I am 18 or older'));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    // NOME + as 6 do ritual + os 20 itens + metas (B1/B4 e o pedido de
    // 01/10/2026: todas as perguntas obrigatórias, antes da escolha)
    await atravessarPerguntasIniciais();

    const antesDaEscolha = only('onboarding_step');
    // A BIFURCAÇÃO acontece DEPOIS do portão e do "porquê", e a telemetria
    // conta isso: `unknown` aqui não é acidente, é o estado verdadeiro.
    // Marcá-los como `demo` seria inventar uma intenção não declarada.
    for (const r of antesDaEscolha) expect(r.p?.funnel).toBe(TELEMETRY_FUNNEL.unknown);
    // Um evento por tela alcançada — sem repetição na mesma tela.
    // A NUMERAÇÃO dos passos não mudou com a ordem nova: as perguntas do
    // ritual seguem 6..11 e o teste 13..32 — só passaram a vir antes da
    // escolha (e por isso com funil `unknown`).
    const ritual = Array.from({ length: 6 }, (_, i) => onboardingStepCode(6 + i));
    const teste = Array.from({ length: 20 }, (_, i) => onboardingStepCode(13 + i));
    expect(antesDaEscolha.map(r => r.p?.step)).toEqual([
      onboardingStepCode(-6), onboardingStepCode(-9), onboardingStepCode(-10), ...ritual, ...teste,
      onboardingStepCode(-2), onboardingStepCode(-3),
      onboardingStepCode(-11), onboardingStepCode(-12), onboardingStepCode(-7),
    ]);

    // E, escolhido o grátis, o funil passa a ser DEMO de fato.
    fireEvent.click(screen.getByText('Start now — it’s free'));
    await esperarRevealDemo();
    const depois = only('onboarding_step');
    expect(depois[depois.length - 1].p?.funnel).toBe(TELEMETRY_FUNNEL.demo);
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('o ritual do caminho pago sai marcado como funil PAID', async () => {
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} mode="upgrade" onRevealed={() => {}} />);
    const passos = only('onboarding_step');
    expect(passos).toHaveLength(1);
    expect(passos[0].p?.funnel).toBe(TELEMETRY_FUNNEL.paid);
    // A trava do levantamento: o MESMO número de passo nos dois funis não pode
    // virar o mesmo registro. São dois usuários opostos.
    expect(passos[0].p?.funnel).not.toBe(TELEMETRY_FUNNEL.demo);
  });

  it('o payload não carrega nada que a pessoa escreveu', async () => {
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    // O "porquê" vem DEPOIS do portão (07/09/2026): é preciso atravessá-lo
    // para chegar ao campo de texto livre.
    fireEvent.click(screen.getByText('I am 18 or older'));
    fireEvent.click(screen.getByText(
      'I have read and agree to the Terms of Use and the Privacy Policy',
    ));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    // 01/10/2026: o "porquê" virou objetivo; o campo livre que sobrou antes
    // da escolha é o NOME (B1) — é ele que não pode vazar.
    const campo = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(campo, { target: { value: 'quero parar de beber' } });
    fireEvent.click(screen.getByRole('button', { name: /Continue/ }));

    const corpo = JSON.stringify(pendingTelemetry());
    expect(corpo).not.toContain('beber');
    // Só `e`, `d` e props NUMÉRICAS existem — nenhum campo de texto livre.
    for (const r of pendingTelemetry()) {
      expect(Object.keys(r).sort()).toEqual(r.p ? ['d', 'e', 'p'] : ['d', 'e']);
      for (const v of Object.values(r.p ?? {})) expect(typeof v).toBe('number');
    }
  });

  it('escolher um personagem pronto emite demo_pick uma vez', async () => {
    vi.useFakeTimers();
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
      fireEvent.click(screen.getByText(
      'I have read and agree to the Terms of Use and the Privacy Policy',
    ));
    fireEvent.click(screen.getByText('I am 18 or older'));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await atravessarPerguntasIniciais();
    fireEvent.click(screen.getByText('Start now — it’s free'));
    // 13.19: o reveal demo vem antes do personagem, e ele emite `unlock_view`
    // com o motivo `revealDemo` (o denominador da 13.1) — nunca `demo_pick`.
    await atravessarRevealDemo();
    expect(only('demo_pick')).toHaveLength(0);
    expect(only('unlock_view').map(r => r.p?.reason)).toEqual([TELEMETRY_UNLOCK_REASON.revealDemo]);

    fireEvent.click(screen.getByText('Pyraka').closest('button')!);
    expect(only('demo_pick')).toHaveLength(1);
    vi.useRealTimers();
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
  it('o modal NÃO emite unlock_view — quem emite é o App, com o motivo', async () => {
    renderWithCss(
      <UnlockAccountModal language="en-US" reason="task-limit" onUnlocked={() => {}} onClose={() => {}} />,
    );
    expect(only('unlock_view')).toHaveLength(0);
  });

  it('os dois convites viram contadores distintos, com o tier junto', async () => {
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
