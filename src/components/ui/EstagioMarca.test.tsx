// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EstagioMarca, nomeDoEstagio } from './EstagioMarca';

describe('EstagioMarca', () => {
  it('mostra o ícone, não o texto, com aria-label = nome do estágio', () => {
    const { container } = render(<EstagioMarca forma="ultimate-power" isPt />);
    expect(screen.getByRole('img', { name: 'Transcendente' })).toBeTruthy();
    // §369: forma com caminho = ícone tingido (span mascarado) na cor do caminho; rookie segue no <img> neutro.
    expect(container.querySelector('[data-estagio-icone="ultimate-power"][data-estagio-caminho="power"]')).toBeTruthy();
    expect(container.textContent).toBe('');
  });
  it('nomes do jogo em PT/EN; desconhecido não renderiza', () => {
    expect(nomeDoEstagio('mega-harmony', true)).toBe('Apoteose');
    expect(nomeDoEstagio('champion', false)).toBe('Ascendant');
    const { container } = render(<EstagioMarca forma="bb" isPt />);
    expect(container.firstChild).toBeNull();
  });
});
