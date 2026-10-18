// @vitest-environment jsdom
/** A folha da Guerra de Clãs (Arena): texto nas duas línguas, sem a palavra "guilda/guild", botão leva ao Salão do Clã. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { GuerraClaSheet } from './GuerraClaSheet';

afterEach(() => cleanup());

describe('GuerraClaSheet', () => {
  it('PT: parágrafo e botão, sem guilda', () => {
    const { container } = render(<GuerraClaSheet language="pt-BR" onGoToClan={() => {}} />);
    expect(screen.getByText(/A Guerra de Clãs se luta junto do seu clã\. Reúna o esquadrão no Salão do Clã, no Hall, e entrem na roda\./)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ir ao Salão do Clã' })).toBeTruthy();
    expect(container.textContent).not.toMatch(/guild|guilda/i);
  });

  it('EN: parágrafo e botão, sem guild', () => {
    const { container } = render(<GuerraClaSheet language="en-US" onGoToClan={() => {}} />);
    expect(screen.getByText('The Clan War is fought with your clan. Gather your squad at the Clan Hall and join the round.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Go to the Clan Hall' })).toBeTruthy();
    expect(container.textContent).not.toMatch(/guild|guilda/i);
  });

  it('o botão chama onGoToClan; sem o callback não há botão', () => {
    const go = vi.fn();
    const { rerender } = render(<GuerraClaSheet language="en-US" onGoToClan={go} />);
    fireEvent.click(screen.getByRole('button'));
    expect(go).toHaveBeenCalledTimes(1);
    rerender(<GuerraClaSheet language="en-US" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
