// @vitest-environment jsdom
/**
 * O convite curto dos passos (REGISTRO §283): sim/não com o MESMO peso, meta escolhível, sem X. A regra de QUANDO aparece é de
 * `utils/stepsInvite.ts` (testada lá); aqui, a tela.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { StepsInviteModal } from './StepsInviteModal';
import { DEFAULT_STEP_GOAL } from '../utils/steps';

function montar(language: 'en-US' | 'pt-BR' = 'en-US') {
  const onAccept = vi.fn();
  const onDecline = vi.fn();
  renderWithCss(<StepsInviteModal language={language} onAccept={onAccept} onDecline={onDecline} />);
  return { onAccept, onDecline };
}

describe('StepsInviteModal', () => {
  it('é curto: pergunta, uma frase do que é lido, meta e dois botões', () => {
    montar('pt-BR');
    expect(screen.getByRole('dialog').getAttribute('aria-label')).toBe('Quer usar a contagem de passos?');
    expect(document.querySelector('[data-steps-invite-what]')?.textContent).toContain('missão bônus');
    expect(document.querySelectorAll('[data-step-goal]').length).toBe(4);
    expect(document.querySelectorAll('[data-steps-invite]').length).toBe(2);
  });

  it('aceitar devolve a meta escolhida (padrão antes de mexer; depois, a que a pessoa tocou)', () => {
    const { onAccept } = montar();
    expect(document.querySelector(`[data-step-goal="${DEFAULT_STEP_GOAL}"]`)?.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(document.querySelector('[data-step-goal="10000"]')!);
    fireEvent.click(document.querySelector('[data-steps-invite="accept"]')!);
    expect(onAccept).toHaveBeenCalledWith(10000);
  });

  it('recusar não pede nada e não aceita', () => {
    const { onAccept, onDecline } = montar();
    fireEvent.click(document.querySelector('[data-steps-invite="decline"]')!);
    expect(onDecline).toHaveBeenCalledTimes(1);
    expect(onAccept).not.toHaveBeenCalled();
  });

  it('aceitar e recusar têm o MESMO tamanho (recusa escondida é padrão escuro) e não há X de fechar', () => {
    montar();
    const a = (document.querySelector('[data-steps-invite="accept"]') as HTMLElement).style;
    const d = (document.querySelector('[data-steps-invite="decline"]') as HTMLElement).style;
    expect(a.minHeight).toBe(d.minHeight);
    expect(a.padding).toBe(d.padding);
    expect(screen.queryByLabelText(/close|fechar/i)).toBeNull();
  });

  it('sem cobrança, sem placar, sem streak: o texto não promete nem ameaça', () => {
    montar('en-US');
    const t = (document.body.textContent ?? '').toLowerCase();
    for (const proibido of ['streak', 'penalt', 'you must', 'leaderboard', 'ranking']) expect(t).not.toContain(proibido);
  });

  for (const w of [360, 375, 412]) {
    it(`${w}px: monta com os dois botões e Ativar chama onAccept uma vez`, () => {
      (window as any).innerWidth = w;
      const { onAccept, onDecline } = montar('pt-BR');
      fireEvent.click(document.querySelector('[data-steps-invite="accept"]')!);
      expect(onAccept).toHaveBeenCalledTimes(1);
      expect(onDecline).not.toHaveBeenCalled();
    });
  }
});
