// @vitest-environment jsdom
/**
 * "Hoje não, obrigado" (07/10/2026) — o dono relatou que, ao pular o check-in
 * da manhã, "bugou a lista de tarefas".
 *
 * Investigação (Playwright, save semeado, 07/10/2026): pular NÃO deixa nada
 * para trás — `<html>`/`<body>` voltam a `overflow: ''`, nenhum `data-sm2-inert`
 * sobra, a lista rola e responde a toque. O que o dono viu é o PRÓXIMO ritual da
 * fila (`catalogOnboarding`, "Definir metas", que desde C10/C11 não é pulável)
 * subindo na hora por cima da lista: enquanto ele está aberto o fundo é inerte
 * POR DESENHO (`aria-modal`). Os testes abaixo travam as duas metades:
 * (1) pular libera tudo; (2) o fundo só fica preso enquanto HOUVER um diálogo.
 */
import { describe, it, expect } from 'vitest';
import { useState } from 'react';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { MorningCheckIn, type CheckInPlanShape } from './MorningCheckIn';
import { RitualDialog } from './ritual/RitualKit';

const plan: CheckInPlanShape = {
  habitsToday: [],
  suggestedFocus: [{ id: 't1', name: 'Pay the bill', effort: 1 }],
  carryOver: [],
  plannedEffort: 1,
  overcommitted: false,
};

function Host({ next = false }: { next?: boolean }) {
  const [step, setStep] = useState<'checkIn' | 'next' | 'none'>('checkIn');
  const [clicked, setClicked] = useState(0);
  return (
    <div>
      <main data-testid="lista">
        <ul>
          <li><button type="button" onClick={() => setClicked(c => c + 1)}>Pay the bill row</button></li>
        </ul>
        <output data-testid="cliques">{clicked}</output>
      </main>
      {step === 'checkIn' && (
        <MorningCheckIn open plan={plan} language="en-US" onConfirm={() => {}} onSkip={() => setStep(next ? 'next' : 'none')} />
      )}
      {step === 'next' && (
        <RitualDialog label="Set goals" onClose={() => {}}>
          <button type="button" onClick={() => setStep('none')}>Continue</button>
        </RitualDialog>
      )}
    </div>
  );
}

const inertCount = () => document.querySelectorAll('[data-sm2-inert]').length;

describe('MorningCheckIn — "Not today, thanks" não prende a lista', () => {
  it('pular libera scroll, inert e foco: a lista segue viva', () => {
    renderWithCss(<Host />);
    expect(document.body.style.overflow).toBe('hidden');
    expect(inertCount()).toBeGreaterThan(0);

    fireEvent.click(screen.getByText('Not today, thanks'));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.style.overflow).toBe('');
    expect(document.documentElement.style.overflow).toBe('');
    expect(inertCount()).toBe(0);
    expect(screen.getByTestId('lista').hasAttribute('inert')).toBe(false);
    expect(screen.getByTestId('lista').getAttribute('aria-hidden')).toBeNull();
    fireEvent.click(screen.getByText('Pay the bill row'));
    expect(screen.getByTestId('cliques').textContent).toBe('1');
  });

  it('o Esc também pula, e libera do mesmo jeito', () => {
    renderWithCss(<Host />);
    act(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(inertCount()).toBe(0);
    expect(document.body.style.overflow).toBe('');
  });

  it('com outro ritual na fila, o fundo fica preso SÓ até ele fechar — e é solto por inteiro', () => {
    renderWithCss(<Host next />);
    fireEvent.click(screen.getByText('Not today, thanks'));
    // O próximo diálogo assumiu: fundo inerte é o contrato do `aria-modal`.
    expect(screen.getByRole('dialog', { name: 'Set goals' })).toBeTruthy();
    expect(inertCount()).toBeGreaterThan(0);
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.click(screen.getByText('Continue'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(inertCount()).toBe(0);
    expect(document.body.style.overflow).toBe('');
    fireEvent.click(screen.getByText('Pay the bill row'));
    expect(screen.getByTestId('cliques').textContent).toBe('1');
  });
});
