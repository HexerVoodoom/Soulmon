// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { UiSkinRow } from './UiSkinRow';
import { UiSkinProvider } from '../contexts/UiSkinContext';
import { STORAGE_KEYS } from '../utils/storageKeys';

beforeEach(() => { localStorage.clear(); });
afterEach(cleanup);

describe('UiSkinRow (opção "Interface")', () => {
  it('flag desligada: não renderiza nada (e nem precisa do provider)', () => {
    const { container } = render(<UiSkinRow language="en-US" enabled={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('o padrão de fábrica é desligado (UI_SKIN_OPTION_ENABLED=false)', () => {
    const { container } = render(<UiSkinRow language="en-US" />);
    expect(container.innerHTML).toBe('');
  });

  it('flag ligada (EN): Interface / Standard (with art) / Minimal, e troca a pele', () => {
    render(<UiSkinProvider><UiSkinRow language="en-US" enabled /></UiSkinProvider>);
    expect(screen.getByText('Interface')).toBeTruthy();
    expect(screen.getByText('Standard (with art)')).toBeTruthy();
    fireEvent.click(screen.getByText('Minimal'));
    expect(document.documentElement.dataset.ui).toBe('minimal');
    expect(localStorage.getItem(STORAGE_KEYS.UI_SKIN)).toBe('minimal');
  });

  it('flag ligada (PT-BR): Padrão (com arte) / Minimalista', () => {
    render(<UiSkinProvider><UiSkinRow language="pt-BR" enabled /></UiSkinProvider>);
    expect(screen.getByText('Padrão (com arte)')).toBeTruthy();
    expect(screen.getByText('Minimalista')).toBeTruthy();
  });
});
