// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SeletorIdiomaAbertura } from './SeletorIdiomaAbertura';

afterEach(cleanup);
describe('seletor de idioma antes do opening', () => {
  it('mostra English e Português e devolve a escolha', () => {
    const onEscolher = vi.fn();
    render(<SeletorIdiomaAbertura onEscolher={onEscolher} />);
    fireEvent.click(screen.getByText('Português'));
    expect(onEscolher).toHaveBeenCalledWith('pt-BR');
    fireEvent.click(screen.getByText('English'));
    expect(onEscolher).toHaveBeenCalledWith('en-US');
  });
});
