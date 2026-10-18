// @vitest-environment jsdom
/**
 * D-24 — o horário de dormir é obrigatório: a tela só tem "Confirmar" como saída.
 * Quando aparece é de `utils/restSetup.ts` (testado lá); aqui, a tela.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { RestSetupModal } from './RestSetupModal';
import { STORAGE_KEYS } from '../utils/storageKeys';

beforeEach(() => localStorage.clear());

function montar(language: 'en-US' | 'pt-BR' = 'en-US', hour = 8) {
  const onConfirm = vi.fn();
  renderWithCss(
    <RestSetupModal
      language={language}
      now={new Date(2026, 9, 2, hour, 0)}
      window={{ start: '23:00', end: '07:00' }}
      onConfirm={onConfirm}
    />,
  );
  return { onConfirm };
}

describe('RestSetupModal (D-24)', () => {
  it('de manhã diz bom dia; não há interruptor de sono automático (D-25/D-26)', () => {
    montar('en-US', 8);
    expect(screen.getByRole('dialog').getAttribute('aria-label')).toMatch(/^Good morning!/);
    expect(screen.queryByRole('switch')).toBeNull();
    expect(screen.getByLabelText('Sleeps')).toBeTruthy();
    expect(screen.getByLabelText('Wakes')).toBeTruthy();
  });

  it('depois do meio-dia aparece igual, sem o bom dia', () => {
    montar('en-US', 15);
    expect(screen.getByRole('dialog').getAttribute('aria-label')).toBe('When does your Soulmon sleep?');
  });

  it('não tem X nem "depois": a única saída é Confirmar; Esc não fecha', () => {
    const { onConfirm } = montar();
    expect(screen.queryByRole('button', { name: /close|fechar/i })).toBeNull();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('Confirmar entrega as horas que a pessoa VÊ e grava as chaves do sono automático', () => {
    const { onConfirm } = montar();
    fireEvent.change(screen.getByLabelText('Sleeps'), { target: { value: '22:30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledWith({ start: '22:30', end: '07:00' });
    expect(localStorage.getItem(STORAGE_KEYS.AUTO_SLEEP_START)).toBe('22:30');
    expect(localStorage.getItem(STORAGE_KEYS.AUTO_SLEEP_END)).toBe('07:00');
  });

  it('confirmar o padrão sem mexer também vale; nenhuma palavra de nota de sono ou duração ideal', () => {
    const { onConfirm } = montar('pt-BR');
    const txt = document.body.textContent ?? '';
    expect(txt).not.toMatch(/8 horas|8 hours|score|nota do sono|qualidade do sono/i);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(onConfirm).toHaveBeenCalledWith({ start: '23:00', end: '07:00' });
  });
});
