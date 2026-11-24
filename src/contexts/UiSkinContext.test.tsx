// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { UiSkinProvider, useUiSkin } from './UiSkinContext';
import { STORAGE_KEYS } from '../utils/storageKeys';

function Probe() {
  const { skin, setSkin } = useUiSkin();
  return (
    <div>
      <span data-testid="skin">{skin}</span>
      <button onClick={() => setSkin('minimal')}>min</button>
      <button onClick={() => setSkin('arte')}>arte</button>
    </div>
  );
}

beforeEach(() => { localStorage.clear(); delete document.documentElement.dataset.ui; });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('UiSkinProvider', () => {
  it('sem valor salvo: arte, e o atributo vai para o <html>', () => {
    render(<UiSkinProvider><Probe /></UiSkinProvider>);
    expect(screen.getByTestId('skin').textContent).toBe('arte');
    expect(document.documentElement.dataset.ui).toBe('arte');
  });

  it('lê o valor salvo', () => {
    localStorage.setItem(STORAGE_KEYS.UI_SKIN, 'minimal');
    render(<UiSkinProvider><Probe /></UiSkinProvider>);
    expect(screen.getByTestId('skin').textContent).toBe('minimal');
    expect(document.documentElement.dataset.ui).toBe('minimal');
  });

  it('valor inválido salvo vira arte', () => {
    localStorage.setItem(STORAGE_KEYS.UI_SKIN, 'win98');
    render(<UiSkinProvider><Probe /></UiSkinProvider>);
    expect(document.documentElement.dataset.ui).toBe('arte');
  });

  it('setSkin grava e troca o atributo', () => {
    render(<UiSkinProvider><Probe /></UiSkinProvider>);
    fireEvent.click(screen.getByText('min'));
    expect(localStorage.getItem(STORAGE_KEYS.UI_SKIN)).toBe('minimal');
    expect(document.documentElement.dataset.ui).toBe('minimal');
    fireEvent.click(screen.getByText('arte'));
    expect(document.documentElement.dataset.ui).toBe('arte');
  });

  it('tolera storage indisponível (leitura e escrita lançam)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('negado'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('negado'); });
    render(<UiSkinProvider><Probe /></UiSkinProvider>);
    expect(screen.getByTestId('skin').textContent).toBe('arte');
    fireEvent.click(screen.getByText('min'));
    expect(document.documentElement.dataset.ui).toBe('minimal');
  });

  it('useUiSkin fora do provider lança', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/UiSkinProvider/);
  });
});
