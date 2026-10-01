// @vitest-environment jsdom
/**
 * G8 — o convite do sono: explica e deixa configurar a Janela de Descanso e o
 * sono automático ali mesmo. Quando aparece é de `utils/restSetup.ts`
 * (testado lá); aqui, a tela.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { RestSetupModal } from './RestSetupModal';
import { STORAGE_KEYS } from '../utils/storageKeys';

beforeEach(() => localStorage.clear());

function montar(language: 'en-US' | 'pt-BR' = 'en-US', hour = 8) {
  const onChangeWindow = vi.fn();
  const onClose = vi.fn();
  renderWithCss(
    <RestSetupModal
      language={language}
      now={new Date(2026, 9, 2, hour, 0)}
      window={{ start: '23:00', end: '07:00' }}
      onChangeWindow={onChangeWindow}
      onClose={onClose}
    />,
  );
  return { onChangeWindow, onClose };
}

describe('RestSetupModal (G8)', () => {
  it('de manhã diz bom dia; as duas preferências estão na tela', () => {
    montar('en-US', 8);
    expect(screen.getByRole('dialog').getAttribute('aria-label')).toMatch(/^Good morning!/);
    expect(screen.getByText('Rest window')).toBeTruthy();
    expect(screen.getByRole('switch', { name: /Auto sleep/ })).toBeTruthy();
  });

  it('depois do meio-dia aparece igual, sem o bom dia', () => {
    montar('en-US', 15);
    expect(screen.getByRole('dialog').getAttribute('aria-label')).toBe('A word about nights');
  });

  it('mudar a janela vai para o App (o save é dele)', () => {
    const { onChangeWindow } = montar();
    fireEvent.change(screen.getByLabelText('Starts'), { target: { value: '22:30' } });
    expect(onChangeWindow).toHaveBeenCalledWith({ start: '22:30', end: '07:00' });
  });

  it('ligar o sono automático grava a chave e as horas que a pessoa VÊ', () => {
    montar();
    fireEvent.click(screen.getByRole('switch', { name: /Auto sleep/ }));
    expect(localStorage.getItem(STORAGE_KEYS.AUTO_SLEEP_ENABLED)).toBe('true');
    expect(localStorage.getItem(STORAGE_KEYS.AUTO_SLEEP_START)).toBe('23:00');
    expect(localStorage.getItem(STORAGE_KEYS.AUTO_SLEEP_END)).toBe('07:00');
    expect(screen.getByLabelText('Sleeps')).toBeTruthy();
  });

  it('"Pronto"/"Done" fecha; nenhuma palavra de nota de sono ou duração ideal', () => {
    const { onClose } = montar('pt-BR');
    const txt = document.body.textContent ?? '';
    expect(txt).not.toMatch(/8 horas|8 hours|score|nota do sono|qualidade do sono/i);
    fireEvent.click(screen.getByRole('button', { name: 'Pronto' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
